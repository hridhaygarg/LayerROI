import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { webhooksRoutes } from '../webhooks.routes.js';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../../db/client.js');
vi.mock('../../utils/logger.js');
vi.mock('../../auth/jwt.js');

import { getSupabaseClient } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import * as jwtModule from '../../auth/jwt.js';

// Setup Express app for testing
const app = express();
app.use(express.json());

app.use('/api/webhooks', webhooksRoutes);

// Error handler middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(err.details && { details: err.details })
    }
  });
});

describe('Webhooks Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    logger.info = vi.fn();
    logger.error = vi.fn();
    logger.warn = vi.fn();

    // Mock JWT token verification
    jwtModule.verifyToken = vi.fn().mockReturnValue({
      sub: 'user-123',
      org_id: 'org-123',
      email: 'user@example.com'
    });
  });

  describe('GET /api/webhooks - List webhooks', () => {
    it('should list webhooks with default pagination', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          url: 'https://example.com/webhook',
          events: ['prospect.created', 'prospect.updated'],
          status: 'active',
          created_at: '2026-04-16T10:00:00Z'
        }
      ];

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: mockWebhooks,
                      error: null
                    })
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: null,
                  count: 1,
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get('/api/webhooks')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('webhooks');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 20);
      expect(response.body).toHaveProperty('hasMore', false);
      expect(response.body.webhooks).toHaveLength(1);
    });

    it('should respect custom pagination parameters', async () => {
      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: null,
                  count: 5,
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get('/api/webhooks?page=2&limit=1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(1);
      expect(response.body.hasMore).toBe(true);
    });

    it('should cap limit to 100', async () => {
      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockResolvedValue({
                  data: null,
                  count: 0,
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get('/api/webhooks?limit=500')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(100);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/webhooks');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/webhooks - Create webhook', () => {
    it('should create a webhook with valid input', async () => {
      const payload = {
        url: 'https://example.com/webhook',
        events: ['prospect.created', 'prospect.updated']
      };

      const selectMock = vi.fn()
        .mockReturnValue({
          eq: vi.fn()
            .mockReturnValueOnce({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
        });

      const insertMock = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'webhook-1',
                org_id: 'org-123',
                url: payload.url,
                events: payload.events,
                status: 'active',
                created_at: '2026-04-16T10:00:00Z'
              },
              error: null
            })
          })
        });

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: selectMock
          })
          .mockReturnValueOnce({
            insert: insertMock
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer valid-token')
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('webhook');
      expect(response.body).toHaveProperty('secret');
      expect(response.body.webhook.url).toBe(payload.url);
      expect(response.body.webhook.events).toEqual(payload.events);
      expect(response.body.secret).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should validate URL format', async () => {
      getSupabaseClient.mockReturnValue({});

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          url: 'invalid-url',
          events: ['prospect.created']
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should require at least one event', async () => {
      getSupabaseClient.mockReturnValue({});

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          url: 'https://example.com/webhook',
          events: []
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should reject duplicate URL per organization', async () => {
      const eqMock = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'existing-webhook' },
                error: null
              })
            })
          })
        });

      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: eqMock
          })
        })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          url: 'https://example.com/webhook',
          events: ['prospect.created']
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('DUPLICATE_WEBHOOK');
    });

    it('should generate signing secret with correct format', async () => {
      const selectMock = vi.fn()
        .mockReturnValue({
          eq: vi.fn()
            .mockReturnValueOnce({
              eq: vi.fn().mockReturnValue({
                is: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
        });

      const insertMock = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'webhook-1',
                url: 'https://example.com/webhook',
                events: ['prospect.created'],
                status: 'active',
                created_at: '2026-04-16T10:00:00Z'
              },
              error: null
            })
          })
        });

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: selectMock
          })
          .mockReturnValueOnce({
            insert: insertMock
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          url: 'https://example.com/webhook',
          events: ['prospect.created']
        });

      expect(response.status).toBe(201);
      expect(response.body.secret).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should require authentication', async () => {
      jwtModule.verifyToken.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          url: 'https://example.com/webhook',
          events: ['prospect.created']
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate required fields', async () => {
      getSupabaseClient.mockReturnValue({});

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer valid-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('POST /api/webhooks/:id/test - Test webhook delivery', () => {
    it('should test webhook delivery successfully', async () => {
      const webhookId = 'webhook-1';

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: webhookId,
                      org_id: 'org-123',
                      url: 'https://example.com/webhook',
                      events: ['prospect.created'],
                      signing_secret: 'test-secret',
                      status: 'active'
                    },
                    error: null
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'log-1' },
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true
      });

      const response = await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 404 when webhook not found', async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          })
        })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .post('/api/webhooks/webhook-not-found/test')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should handle delivery failures gracefully', async () => {
      const webhookId = 'webhook-1';

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: webhookId,
                      url: 'https://example.com/webhook',
                      signing_secret: 'test-secret',
                      status: 'active'
                    },
                    error: null
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'log-1' },
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      global.fetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false
      });

      const response = await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(500);
    });

    it('should require authentication', async () => {
      jwtModule.verifyToken.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .post('/api/webhooks/webhook-1/test')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/webhooks/:id/logs - Get webhook delivery logs', () => {
    it('should retrieve webhook logs with pagination', async () => {
      const webhookId = 'webhook-1';

      const mockLogs = [
        {
          id: 'log-1',
          webhook_id: webhookId,
          event: 'prospect.created',
          status: 'success',
          http_status: 200,
          response_time: 145,
          error: null,
          created_at: '2026-04-16T10:00:00Z'
        }
      ];

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: mockLogs,
                      error: null
                    })
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  count: 1,
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get(`/api/webhooks/${webhookId}/logs`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('logs');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body.logs).toHaveLength(1);
      expect(response.body.logs[0]).toHaveProperty('event');
      expect(response.body.logs[0]).toHaveProperty('status');
      expect(response.body.logs[0]).toHaveProperty('http_status');
      expect(response.body.logs[0]).toHaveProperty('response_time');
    });

    it('should respect custom pagination', async () => {
      const webhookId = 'webhook-1';

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  count: 10,
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get(`/api/webhooks/${webhookId}/logs?page=2&limit=1`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(1);
    });

    it('should cap limit to 100', async () => {
      const webhookId = 'webhook-1';

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  count: 0,
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get(`/api/webhooks/${webhookId}/logs?limit=500`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(100);
    });

    it('should require authentication', async () => {
      jwtModule.verifyToken.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/webhooks/webhook-1/logs')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return empty logs for webhook with no deliveries', async () => {
      const webhookId = 'webhook-1';

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    range: vi.fn().mockResolvedValue({
                      data: [],
                      error: null
                    })
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  count: 0,
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get(`/api/webhooks/${webhookId}/logs`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.logs).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('HMAC Signing', () => {
    it('should include X-Signature header in test webhook', async () => {
      const webhookId = 'webhook-1';
      const testSecret = 'test-secret-key';

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: webhookId,
                      url: 'https://example.com/webhook',
                      signing_secret: testSecret,
                      status: 'active'
                    },
                    error: null
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'log-1' },
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      let capturedHeaders;
      global.fetch = vi.fn().mockImplementationOnce((url, options) => {
        capturedHeaders = options.headers;
        return Promise.resolve({
          status: 200,
          ok: true
        });
      });

      await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .set('Authorization', 'Bearer valid-token');

      expect(capturedHeaders).toHaveProperty('X-Signature');
      expect(capturedHeaders['X-Signature']).toMatch(/^sha256=/);
    });

    it('should generate valid HMAC-SHA256 signature', async () => {
      const webhookId = 'webhook-1';
      const testSecret = 'test-secret-key';

      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: webhookId,
                      url: 'https://example.com/webhook',
                      signing_secret: testSecret,
                      status: 'active'
                    },
                    error: null
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'log-1' },
                  error: null
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      let capturedPayload;
      let capturedHeaders;
      global.fetch = vi.fn().mockImplementationOnce((url, options) => {
        capturedPayload = options.body;
        capturedHeaders = options.headers;
        return Promise.resolve({
          status: 200,
          ok: true
        });
      });

      await request(app)
        .post(`/api/webhooks/${webhookId}/test`)
        .set('Authorization', 'Bearer valid-token');

      expect(capturedHeaders['X-Signature']).toMatch(/^sha256=[a-f0-9]{64}$/);

      const expectedSignature = crypto
        .createHmac('sha256', testSecret)
        .update(capturedPayload)
        .digest('hex');
      const actualSignature = capturedHeaders['X-Signature'].replace('sha256=', '');
      expect(actualSignature).toBe(expectedSignature);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors on list', async () => {
      const supabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              is: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  range: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database error' }
                  })
                })
              })
            })
          })
        })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .get('/api/webhooks')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
    });

    it('should handle database errors on create', async () => {
      const supabase = {
        from: vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            })
          })
          .mockReturnValueOnce({
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Insert failed' }
                })
              })
            })
          })
      };

      getSupabaseClient.mockReturnValue(supabase);

      const response = await request(app)
        .post('/api/webhooks')
        .set('Authorization', 'Bearer valid-token')
        .send({
          url: 'https://example.com/webhook',
          events: ['prospect.created']
        });

      expect(response.status).toBe(500);
    });
  });
});
