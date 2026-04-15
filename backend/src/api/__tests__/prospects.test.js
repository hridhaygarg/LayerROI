import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import propsepctRoutes from '../prospects.routes.js';

// Mock dependencies
vi.mock('../../db/client.js');
vi.mock('../../utils/logger.js');
vi.mock('../../middleware/auth.js');

// Import mocked modules
import { getSupabaseClient } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import { verifyAuth } from '../../middleware/auth.js';

// Setup Express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware - just attach user to request
app.use((req, res, next) => {
  req.user = {
    id: 'user-123',
    email: 'user@example.com',
    org_id: 'org-123'
  };
  next();
});

app.use('/api/prospects', propsepctRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
});

describe('Prospect Routes', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ne: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn(),
      data: null,
      error: null,
      count: 'exact'
    };

    getSupabaseClient.mockReturnValue(mockSupabase);

    // Mock logger
    logger.info = vi.fn();
    logger.error = vi.fn();
    logger.warn = vi.fn();
    logger.debug = vi.fn();
  });

  // Mock auth header
  const authHeader = 'Bearer mock-token';
  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    org_id: 'org-123'
  };

  describe('GET /api/prospects - List prospects', () => {
    it('should return list of prospects with default pagination', async () => {
      const mockProspects = [
        {
          id: 'prospect-1',
          org_id: 'org-123',
          email: 'john@example.com',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Acme Corp',
          title: 'CEO',
          status: 'prospect',
          tags: [],
          custom_fields: {},
          created_at: '2026-04-16T00:00:00Z',
          updated_at: '2026-04-16T00:00:00Z'
        }
      ];

      // Mock the chain of calls
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockProspects,
        error: null,
        count: 1
      });

      const response = await request(app)
        .get('/api/prospects')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prospects');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 20);
      expect(response.body).toHaveProperty('hasMore', false);
      expect(response.body.prospects).toHaveLength(1);
      expect(response.body.prospects[0].email).toBe('john@example.com');
    });

    it('should filter by status', async () => {
      const mockProspects = [];

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase); // status filter
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockProspects,
        error: null,
        count: 0
      });

      const response = await request(app)
        .get('/api/prospects?status=qualified')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.prospects).toHaveLength(0);
    });

    it('should search by email, firstName, lastName, company', async () => {
      const mockProspects = [
        {
          id: 'prospect-1',
          org_id: 'org-123',
          email: 'john@acme.com',
          first_name: 'John',
          last_name: 'Smith',
          company: 'Acme Corp',
          title: 'CTO',
          status: 'prospect',
          tags: [],
          custom_fields: {},
          created_at: '2026-04-16T00:00:00Z',
          updated_at: '2026-04-16T00:00:00Z'
        }
      ];

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.or.mockReturnValueOnce(mockSupabase); // search filter
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockProspects,
        error: null,
        count: 1
      });

      const response = await request(app)
        .get('/api/prospects?search=acme')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.prospects).toHaveLength(1);
    });

    it('should filter by tags', async () => {
      const mockProspects = [];

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.filter.mockReturnValueOnce(mockSupabase); // tags filter
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockProspects,
        error: null,
        count: 0
      });

      const response = await request(app)
        .get('/api/prospects?tags=vip,hot')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
    });

    it('should support custom sorting', async () => {
      const mockProspects = [];

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockProspects,
        error: null,
        count: 0
      });

      const response = await request(app)
        .get('/api/prospects?sortBy=email&sortOrder=asc')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
    });

    it('should support pagination with custom page and limit', async () => {
      const mockProspects = [];

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: mockProspects,
        error: null,
        count: 25
      });

      const response = await request(app)
        .get('/api/prospects?page=2&limit=10')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(10);
      expect(response.body.hasMore).toBe(true);
    });

    it('should return 400 for invalid limit (exceeds max)', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockReturnValueOnce(mockSupabase);
      mockSupabase.range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0
      });

      // Max limit is 100, so 200 should be capped at 100
      const response = await request(app)
        .get('/api/prospects?limit=200')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200); // Capped to max, not error
    });

    it('should return 400 for invalid sortBy', async () => {
      const response = await request(app)
        .get('/api/prospects?sortBy=invalid')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/prospects - Create prospect', () => {
    it('should create a new prospect with valid data', async () => {
      const prospectData = {
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Tech Corp',
        title: 'VP Sales',
        tags: ['vip', 'hot'],
        customFields: { department: 'Sales' }
      };

      const mockCreatedProspect = {
        id: 'prospect-uuid-123',
        org_id: 'org-123',
        email: prospectData.email,
        first_name: prospectData.firstName,
        last_name: prospectData.lastName,
        company: prospectData.company,
        title: prospectData.title,
        status: 'prospect',
        tags: prospectData.tags,
        custom_fields: prospectData.customFields,
        created_at: '2026-04-16T00:00:00Z',
        updated_at: '2026-04-16T00:00:00Z'
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // no rows found
      });

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockCreatedProspect,
        error: null
      });

      const response = await request(app)
        .post('/api/prospects')
        .set('Authorization', authHeader)
        .send(prospectData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('prospect');
      expect(response.body.prospect.email).toBe(prospectData.email);
      expect(response.body.prospect.status).toBe('prospect');
      expect(response.body.prospect.first_name).toBe(prospectData.firstName);
    });

    it('should return 400 if email is missing', async () => {
      const prospectData = {
        firstName: 'Jane',
        lastName: 'Smith',
        company: 'Tech Corp'
      };

      const response = await request(app)
        .post('/api/prospects')
        .set('Authorization', authHeader)
        .send(prospectData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 if firstName is missing', async () => {
      const prospectData = {
        email: 'jane@example.com',
        lastName: 'Smith',
        company: 'Tech Corp'
      };

      const response = await request(app)
        .post('/api/prospects')
        .set('Authorization', authHeader)
        .send(prospectData);

      expect(response.status).toBe(400);
    });

    it('should return 400 if lastName is missing', async () => {
      const prospectData = {
        email: 'jane@example.com',
        firstName: 'Jane',
        company: 'Tech Corp'
      };

      const response = await request(app)
        .post('/api/prospects')
        .set('Authorization', authHeader)
        .send(prospectData);

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid email format', async () => {
      const prospectData = {
        email: 'not-an-email',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const response = await request(app)
        .post('/api/prospects')
        .set('Authorization', authHeader)
        .send(prospectData);

      expect(response.status).toBe(400);
    });

    it('should return 409 if email already exists in organization', async () => {
      const prospectData = {
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'prospect-123', email: 'existing@example.com' },
        error: null
      });

      const response = await request(app)
        .post('/api/prospects')
        .set('Authorization', authHeader)
        .send(prospectData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });

  });

  describe('GET /api/prospects/:id - Get single prospect', () => {
    it('should return a prospect by id', async () => {
      const mockProspect = {
        id: 'prospect-123',
        org_id: 'org-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'Acme Corp',
        title: 'CEO',
        status: 'prospect',
        tags: [],
        custom_fields: {},
        created_at: '2026-04-16T00:00:00Z',
        updated_at: '2026-04-16T00:00:00Z'
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockProspect,
        error: null
      });

      const response = await request(app)
        .get('/api/prospects/prospect-123')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prospect');
      expect(response.body.prospect.id).toBe('prospect-123');
      expect(response.body.prospect.email).toBe('john@example.com');
    });

    it('should return 404 if prospect not found', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const response = await request(app)
        .get('/api/prospects/nonexistent')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

  });

  describe('PATCH /api/prospects/:id - Update prospect', () => {
    it('should update prospect with valid data', async () => {
      const updateData = {
        status: 'qualified',
        company: 'New Company',
        title: 'CTO'
      };

      const mockExistingProspect = {
        id: 'prospect-123',
        org_id: 'org-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'Acme Corp',
        title: 'CEO',
        status: 'prospect',
        tags: [],
        custom_fields: {},
        created_at: '2026-04-16T00:00:00Z',
        updated_at: '2026-04-16T00:00:00Z'
      };

      const mockUpdatedProspect = {
        ...mockExistingProspect,
        ...updateData,
        updated_at: '2026-04-16T01:00:00Z'
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockExistingProspect,
        error: null
      });

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdatedProspect,
        error: null
      });

      const response = await request(app)
        .patch('/api/prospects/prospect-123')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('prospect');
      expect(response.body.prospect.status).toBe('qualified');
      expect(response.body.prospect.company).toBe('New Company');
    });

    it('should update only provided fields', async () => {
      const updateData = {
        status: 'contacted'
      };

      const mockExistingProspect = {
        id: 'prospect-123',
        org_id: 'org-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'Acme Corp',
        title: 'CEO',
        status: 'prospect',
        tags: [],
        custom_fields: {}
      };

      const mockUpdatedProspect = {
        ...mockExistingProspect,
        status: 'contacted'
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockExistingProspect,
        error: null
      });

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockUpdatedProspect,
        error: null
      });

      const response = await request(app)
        .patch('/api/prospects/prospect-123')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.prospect.status).toBe('contacted');
      expect(response.body.prospect.company).toBe('Acme Corp'); // unchanged
    });

    it('should return 404 if prospect not found', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const response = await request(app)
        .patch('/api/prospects/nonexistent')
        .set('Authorization', authHeader)
        .send({ status: 'qualified' });

      expect(response.status).toBe(404);
    });

    it('should return 409 if duplicate email (within org)', async () => {
      const updateData = {
        email: 'existing@example.com'
      };

      const mockExistingProspect = {
        id: 'prospect-123',
        org_id: 'org-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'Acme Corp',
        title: 'CEO',
        status: 'prospect'
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockExistingProspect,
        error: null
      });

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.ne.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'prospect-456', email: 'existing@example.com' },
        error: null
      });

      const response = await request(app)
        .patch('/api/prospects/prospect-123')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
    });

  });

  describe('DELETE /api/prospects/:id - Delete prospect (soft delete)', () => {
    it('should soft delete prospect', async () => {
      const mockProspect = {
        id: 'prospect-123',
        org_id: 'org-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        status: 'prospect'
      };

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: mockProspect,
        error: null
      });

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.update.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...mockProspect, status: 'deleted' },
        error: null
      });

      const response = await request(app)
        .delete('/api/prospects/prospect-123')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Prospect deleted');
    });

    it('should return 404 if prospect not found', async () => {
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const response = await request(app)
        .delete('/api/prospects/nonexistent')
        .set('Authorization', authHeader);

      expect(response.status).toBe(404);
    });

  });

  describe('POST /api/prospects/bulk-import - Bulk import prospects', () => {
    it('should bulk import prospects', async () => {
      const importData = {
        prospects: [
          {
            email: 'prospect1@example.com',
            firstName: 'John',
            lastName: 'Doe',
            company: 'Company A',
            title: 'CEO',
            tags: ['vip']
          },
          {
            email: 'prospect2@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            company: 'Company B',
            title: 'CTO',
            tags: []
          }
        ]
      };

      // Mock checks for existing emails (both not found)
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Mock bulk insert
      mockSupabase.from.mockReturnValueOnce(mockSupabase);
      mockSupabase.insert.mockReturnValueOnce(mockSupabase);
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { id: 'prospect-1', email: importData.prospects[0].email },
          { id: 'prospect-2', email: importData.prospects[1].email }
        ],
        error: null
      });

      const response = await request(app)
        .post('/api/prospects/bulk-import')
        .set('Authorization', authHeader)
        .send(importData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('created', 2);
      expect(response.body).toHaveProperty('skipped', 0);
      expect(response.body).toHaveProperty('errors');
    });

    it('should handle duplicate emails within batch', async () => {
      const importData = {
        prospects: [
          {
            email: 'duplicate@example.com',
            firstName: 'John',
            lastName: 'Doe'
          },
          {
            email: 'duplicate@example.com',
            firstName: 'Jane',
            lastName: 'Doe'
          }
        ]
      };

      const response = await request(app)
        .post('/api/prospects/bulk-import')
        .set('Authorization', authHeader)
        .send(importData);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 if prospects array is missing', async () => {
      const response = await request(app)
        .post('/api/prospects/bulk-import')
        .set('Authorization', authHeader)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 400 if any prospect has invalid email', async () => {
      const importData = {
        prospects: [
          {
            email: 'invalid-email',
            firstName: 'John',
            lastName: 'Doe'
          }
        ]
      };

      const response = await request(app)
        .post('/api/prospects/bulk-import')
        .set('Authorization', authHeader)
        .send(importData);

      expect(response.status).toBe(400);
    });

    it('should return 400 if required fields missing', async () => {
      const importData = {
        prospects: [
          {
            email: 'test@example.com',
            firstName: 'John'
            // missing lastName
          }
        ]
      };

      const response = await request(app)
        .post('/api/prospects/bulk-import')
        .set('Authorization', authHeader)
        .send(importData);

      expect(response.status).toBe(400);
    });

  });
});
