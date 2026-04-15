import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Redis client before importing session module
const mockRedisClient = {
  setEx: vi.fn(),
  sAdd: vi.fn(),
  expire: vi.fn(),
  get: vi.fn(),
  getDel: vi.fn(),
  del: vi.fn(),
  sRem: vi.fn(),
  sMembers: vi.fn(),
  on: vi.fn().mockReturnThis(),
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined)
};

vi.mock('redis', () => ({
  default: {
    createClient: vi.fn(() => mockRedisClient)
  }
}));

vi.mock('../../config/env.js', () => ({
  getConfig: vi.fn(() => ({
    REDIS_URL: 'redis://localhost:6379',
    NODE_ENV: 'test',
    SESSION_TTL_MS: 86400000
  }))
}));

vi.mock('../../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

import {
  createSession,
  getSession,
  updateSession,
  invalidateSession,
  invalidateAllUserSessions
} from '../session.js';

describe('Session Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisClient.setEx.mockResolvedValue(true);
    mockRedisClient.sAdd.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(1);
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.del.mockResolvedValue(1);
    mockRedisClient.sRem.mockResolvedValue(1);
    mockRedisClient.sMembers.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Creation', () => {
    it('should create a session with valid user ID', async () => {
      mockRedisClient.setEx.mockResolvedValueOnce(true);
      mockRedisClient.sAdd.mockResolvedValueOnce(1);
      mockRedisClient.expire.mockResolvedValueOnce(1);

      const session = await createSession('user-123', {
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      });

      expect(session).toHaveProperty('sessionId');
      expect(session).toHaveProperty('expiresAt');
      expect(session.sessionId).toMatch(/^[a-f0-9]{36}$/);
    });

    it('should generate 36-character hexadecimal session IDs', async () => {
      mockRedisClient.setEx.mockResolvedValue(true);
      mockRedisClient.sAdd.mockResolvedValue(1);
      mockRedisClient.expire.mockResolvedValue(1);

      const session1 = await createSession('user-123', {});
      const session2 = await createSession('user-124', {});

      expect(session1.sessionId).toHaveLength(36);
      expect(session2.sessionId).toHaveLength(36);
      expect(session1.sessionId).toMatch(/^[a-f0-9]{36}$/);
      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should set expiration time to 24 hours from now', async () => {
      mockRedisClient.setEx.mockResolvedValueOnce(true);
      mockRedisClient.sAdd.mockResolvedValueOnce(1);
      mockRedisClient.expire.mockResolvedValueOnce(1);

      const beforeCreate = new Date(Date.now() + 86400000);
      const session = await createSession('user-123', {});
      const afterCreate = new Date(Date.now() + 86400000 + 1000);

      const expiresAt = new Date(session.expiresAt);
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('Session Retrieval', () => {
    it('should retrieve a valid session', async () => {
      const sessionData = {
        sessionId: 'abc123xyz789abc123xyz789',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: { userAgent: 'test-agent' }
      };

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(sessionData));

      const retrieved = await getSession('abc123xyz789abc123xyz789');

      expect(retrieved).toBeDefined();
      expect(retrieved.userId).toBe('user-123');
      expect(retrieved.data.userAgent).toBe('test-agent');
    });

    it('should return null for non-existent session', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const retrieved = await getSession('non-existent-session-id');
      expect(retrieved).toBeNull();
    });

    it('should return null for expired session', async () => {
      const expiredSessionData = {
        sessionId: 'abc123xyz789abc123xyz789',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
        data: {}
      };

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(expiredSessionData));
      mockRedisClient.del.mockResolvedValueOnce(1);

      const retrieved = await getSession('abc123xyz789abc123xyz789');
      expect(retrieved).toBeNull();
    });
  });

  describe('Session Update', () => {
    it('should update session data', async () => {
      const sessionData = {
        sessionId: 'abc123xyz789abc123xyz789',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: { device: 'mobile' }
      };

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(sessionData));
      mockRedisClient.setEx.mockResolvedValueOnce(true);

      const updated = await updateSession('abc123xyz789abc123xyz789', {
        data: { device: 'desktop' }
      });

      expect(updated.data.device).toBe('desktop');
    });

    it('should merge data without overwriting', async () => {
      const sessionData = {
        sessionId: 'abc123xyz789abc123xyz789',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: { device: 'mobile', location: 'USA' }
      };

      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(sessionData));
      mockRedisClient.setEx.mockResolvedValueOnce(true);

      const updated = await updateSession('abc123xyz789abc123xyz789', {
        data: { device: 'desktop' }
      });

      expect(updated.data.device).toBe('desktop');
      expect(updated.data.location).toBe('USA');
    });

    it('should throw error for non-existent session', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      await expect(updateSession('non-existent', {})).rejects.toThrow();
    });
  });

  describe('Session Invalidation', () => {
    it('should invalidate a session', async () => {
      const sessionData = {
        sessionId: 'abc123xyz789abc123xyz789abc123xyz789',
        userId: 'user-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        data: {}
      };

      mockRedisClient.getDel.mockResolvedValueOnce(JSON.stringify(sessionData));
      mockRedisClient.sRem.mockResolvedValueOnce(1);

      const result = await invalidateSession('abc123xyz789abc123xyz789abc123xyz789');

      expect(result).toBe(true);
      expect(mockRedisClient.getDel).toHaveBeenCalled();
      expect(mockRedisClient.sRem).toHaveBeenCalled();
    });

    it('should return false when session does not exist', async () => {
      mockRedisClient.getDel.mockResolvedValueOnce(null);

      const result = await invalidateSession('non-existent-session');
      expect(result).toBe(false);
    });
  });

  describe('Invalidate All User Sessions', () => {
    it('should invalidate all sessions for a user', async () => {
      const sessionIds = ['session1', 'session2'];

      mockRedisClient.sMembers.mockResolvedValueOnce(sessionIds);
      mockRedisClient.del.mockResolvedValue(1);

      const count = await invalidateAllUserSessions('user-123');

      expect(count).toBe(2);
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('user:user-123:sessions');
      expect(mockRedisClient.del).toHaveBeenCalledTimes(3); // 2 sessions + 1 sessions set
    });

    it('should return 0 when user has no sessions', async () => {
      mockRedisClient.sMembers.mockResolvedValueOnce([]);

      const count = await invalidateAllUserSessions('user-with-no-sessions');
      expect(count).toBe(0);
    });
  });
});
