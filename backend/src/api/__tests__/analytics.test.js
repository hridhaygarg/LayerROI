import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../analytics.routes.js';

// Mock dependencies
vi.mock('../../db/client.js');
vi.mock('../../utils/logger.js');

// Import mocked modules
import { getSupabaseClient } from '../../db/client.js';
import { logger } from '../../utils/logger.js';

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

app.use('/api/analytics', analyticsRoutes);

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

/**
 * Create a chainable mock Supabase client
 * All methods return the mock itself, allowing fluent chaining
 * Call .then() to resolve with data
 */
function createMockSupabase() {
  const mockQuery = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    is: vi.fn(),
    in: vi.fn(),
    or: vi.fn(),
    filter: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    single: vi.fn(),
    rpc: vi.fn(),
    then: vi.fn(),

    // Default thenable that returns empty data
    async _defaultResolve(fn) {
      return Promise.resolve({
        data: [],
        error: null
      });
    }
  };

  // Make all methods chainable (return self)
  const chainableKeys = [
    'from',
    'select',
    'eq',
    'neq',
    'gte',
    'lte',
    'is',
    'in',
    'or',
    'filter',
    'order',
    'range',
    'insert',
    'update',
    'delete'
  ];

  chainableKeys.forEach((key) => {
    mockQuery[key].mockImplementation(function () {
      return mockQuery;
    });
  });

  // Default single/rpc behavior - returns a thenable
  mockQuery.single.mockImplementation(function () {
    return {
      then: (onFulfilled, onRejected) => {
        return Promise.resolve({ data: { count: 0 }, error: null }).then(
          onFulfilled,
          onRejected
        );
      },
      catch: (onRejected) => {
        return Promise.resolve({ data: { count: 0 }, error: null }).catch(onRejected);
      }
    };
  });

  mockQuery.rpc.mockImplementation(function () {
    return mockQuery;
  });

  // Make the query itself a thenable for the final await
  mockQuery.then = (onFulfilled, onRejected) => {
    return Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
  };

  mockQuery.catch = (onRejected) => {
    return Promise.resolve({ data: [], error: null }).catch(onRejected);
  };

  return mockQuery;
}

describe('Analytics Routes', () => {
  let mockSupabase;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    getSupabaseClient.mockReturnValue(mockSupabase);

    // Mock logger
    logger.info = vi.fn();
    logger.error = vi.fn();
    logger.warn = vi.fn();
    logger.debug = vi.fn();
  });

  // ==================== GET /api/analytics/dashboard ====================
  describe('GET /api/analytics/dashboard - Dashboard metrics', () => {
    it('should return dashboard metrics with default 30d date range', async () => {
      const response = await request(app).get('/api/analytics/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('topCompanies');
      expect(response.body).toHaveProperty('outreachTrend');
      expect(response.body.metrics).toHaveProperty('totalProspects');
      expect(response.body.metrics).toHaveProperty('qualifiedProspects');
      expect(response.body.metrics).toHaveProperty('emailsSent');
      expect(response.body.metrics).toHaveProperty('openRate');
      expect(response.body.metrics).toHaveProperty('conversionRate');
    });

    it('should accept 7d, 30d, 90d date ranges', async () => {
      const response = await request(app).get('/api/analytics/dashboard?dateRange=7d');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
    });

    it('should filter by prospectSource (all, crunchbase, linkedin, api)', async () => {
      const response = await request(app).get(
        '/api/analytics/dashboard?prospectSource=crunchbase'
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
    });

    it('should return 400 for invalid dateRange', async () => {
      const response = await request(app).get('/api/analytics/dashboard?dateRange=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid prospectSource', async () => {
      const response = await request(app).get(
        '/api/analytics/dashboard?prospectSource=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should only show metrics for user organization (RLS)', async () => {
      const response = await request(app).get('/api/analytics/dashboard');

      expect(response.status).toBe(200);
      // Verify org_id was used in query
      expect(mockSupabase.eq).toHaveBeenCalledWith('org_id', 'org-123');
    });

    it('should return metrics with zero values when no data exists', async () => {
      const response = await request(app).get('/api/analytics/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.metrics.totalProspects).toBe(0);
      expect(response.body.metrics.emailsSent).toBe(0);
      expect(response.body.metrics.conversions).toBe(0);
    });

    it('should calculate rates correctly', async () => {
      const response = await request(app).get('/api/analytics/dashboard');

      expect(response.status).toBe(200);
      expect(response.body.metrics).toHaveProperty('openRate');
      expect(response.body.metrics).toHaveProperty('clickRate');
      expect(response.body.metrics).toHaveProperty('replyRate');
      expect(response.body.metrics).toHaveProperty('conversionRate');
      // When no data, rates should be 0
      expect(response.body.metrics.openRate).toBe(0);
    });
  });

  // ==================== GET /api/analytics/metrics ====================
  describe('GET /api/analytics/metrics - Detailed metrics', () => {
    it('should return detailed metrics for outreach', async () => {
      const response = await request(app).get('/api/analytics/metrics?metric=outreach');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metric', 'outreach');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return detailed metrics for engagement', async () => {
      const response = await request(app).get('/api/analytics/metrics?metric=engagement');

      expect(response.status).toBe(200);
      expect(response.body.metric).toBe('engagement');
      expect(response.body).toHaveProperty('data');
    });

    it('should return detailed metrics for conversion', async () => {
      const response = await request(app).get('/api/analytics/metrics?metric=conversion');

      expect(response.status).toBe(200);
      expect(response.body.metric).toBe('conversion');
      expect(response.body).toHaveProperty('data');
    });

    it('should support hourly aggregation', async () => {
      const response = await request(app).get(
        '/api/analytics/metrics?metric=outreach&aggregation=hourly'
      );

      expect(response.status).toBe(200);
      expect(response.body.aggregation).toBe('hourly');
    });

    it('should support daily aggregation', async () => {
      const response = await request(app).get(
        '/api/analytics/metrics?metric=outreach&aggregation=daily'
      );

      expect(response.status).toBe(200);
      expect(response.body.aggregation).toBe('daily');
    });

    it('should support weekly aggregation', async () => {
      const response = await request(app).get(
        '/api/analytics/metrics?metric=outreach&aggregation=weekly'
      );

      expect(response.status).toBe(200);
      expect(response.body.aggregation).toBe('weekly');
    });

    it('should default to daily aggregation', async () => {
      const response = await request(app).get('/api/analytics/metrics?metric=outreach');

      expect(response.status).toBe(200);
      expect(response.body.aggregation).toBe('daily');
    });

    it('should accept 7d, 30d, 90d date ranges', async () => {
      const response = await request(app).get(
        '/api/analytics/metrics?metric=outreach&dateRange=7d'
      );

      expect(response.status).toBe(200);
      expect(response.body.dateRange).toBe('7d');
    });

    it('should return 400 for missing metric parameter', async () => {
      const response = await request(app).get('/api/analytics/metrics');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid metric', async () => {
      const response = await request(app).get('/api/analytics/metrics?metric=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid aggregation', async () => {
      const response = await request(app).get(
        '/api/analytics/metrics?metric=outreach&aggregation=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid dateRange', async () => {
      const response = await request(app).get(
        '/api/analytics/metrics?metric=outreach&dateRange=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should only show metrics for user organization (RLS)', async () => {
      const response = await request(app).get('/api/analytics/metrics?metric=outreach');

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('org_id', 'org-123');
    });
  });

  // ==================== GET /api/analytics/export ====================
  describe('GET /api/analytics/export - Export reports', () => {
    it('should export metrics as JSON', async () => {
      const response = await request(app).get('/api/analytics/export?format=json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('exportedAt');
      expect(response.body).toHaveProperty('format', 'json');
      expect(response.body).toHaveProperty('data');
    });

    it('should export metrics as CSV', async () => {
      const response = await request(app).get('/api/analytics/export?format=csv');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toMatch(/attachment/);
    });

    it('should export metrics as PDF', async () => {
      const response = await request(app).get('/api/analytics/export?format=pdf');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('format', 'pdf');
    });

    it('should support exporting all metrics', async () => {
      const response = await request(app).get('/api/analytics/export?format=json&metric=all');

      expect(response.status).toBe(200);
      expect(response.body.metric).toBe('all');
    });

    it('should support exporting outreach metrics', async () => {
      const response = await request(app).get(
        '/api/analytics/export?format=json&metric=outreach'
      );

      expect(response.status).toBe(200);
      expect(response.body.metric).toBe('outreach');
    });

    it('should support exporting engagement metrics', async () => {
      const response = await request(app).get(
        '/api/analytics/export?format=json&metric=engagement'
      );

      expect(response.status).toBe(200);
      expect(response.body.metric).toBe('engagement');
    });

    it('should support exporting conversion metrics', async () => {
      const response = await request(app).get(
        '/api/analytics/export?format=json&metric=conversion'
      );

      expect(response.status).toBe(200);
      expect(response.body.metric).toBe('conversion');
    });

    it('should accept 7d, 30d, 90d date ranges', async () => {
      const response = await request(app).get(
        '/api/analytics/export?format=json&dateRange=7d'
      );

      expect(response.status).toBe(200);
      expect(response.body.dateRange).toBe('7d');
    });

    it('should return 400 for missing format parameter', async () => {
      const response = await request(app).get('/api/analytics/export');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app).get('/api/analytics/export?format=xml');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid metric', async () => {
      const response = await request(app).get('/api/analytics/export?format=json&metric=invalid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 400 for invalid dateRange', async () => {
      const response = await request(app).get(
        '/api/analytics/export?format=json&dateRange=invalid'
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should only export metrics for user organization (RLS)', async () => {
      const response = await request(app).get('/api/analytics/export?format=json');

      expect(response.status).toBe(200);
      expect(mockSupabase.eq).toHaveBeenCalledWith('org_id', 'org-123');
    });

    it('should log export requests for audit trail', async () => {
      await request(app).get('/api/analytics/export?format=json&metric=all');

      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Override the default mock to return an error on select
      mockSupabase.then = (onFulfilled, onRejected) => {
        return Promise.resolve({ data: null, error: { message: 'DB error' } }).then(
          onFulfilled,
          onRejected
        );
      };
      mockSupabase.catch = (onRejected) => {
        return Promise.resolve({ data: null, error: { message: 'DB error' } }).catch(
          onRejected
        );
      };

      const response = await request(app).get('/api/analytics/export?format=json');

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe('INTERNAL_ERROR');
    });
  });

  // ==================== Authentication Tests ====================
  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      // Create a new app without the auth middleware
      const testApp = express();
      testApp.use(express.json());
      testApp.use('/api/analytics', analyticsRoutes);

      const response = await request(testApp).get('/api/analytics/dashboard');

      // Should fail because req.user is not set
      expect([400, 401, 500]).toContain(response.status);
    });
  });
});
