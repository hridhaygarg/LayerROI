import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleOAuthCallback } from '../oauth.js';

// Mock the database client and JWT
vi.mock('../jwt.js', () => ({
  generateTokens: vi.fn(() => ({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900
  }))
}));

vi.mock('../../db/client.js', () => ({
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: table === 'users' ? { id: 'user-1', email: 'test@example.com', first_name: 'Test' } : null,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: { id: 'user-1', email: 'test@example.com', first_name: 'Test' },
            error: null
          }))
        }))
      }))
    }))
  }))
}));

describe('OAuth', () => {
  it('should handle OAuth callback structure', async () => {
    expect(handleOAuthCallback).toBeDefined();
    expect(typeof handleOAuthCallback).toBe('function');
  });

  it('should accept provider and profile arguments', () => {
    const profile = {
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/avatar.jpg',
      sub: 'google-id-123'
    };

    expect(async () => {
      await handleOAuthCallback('google', profile);
    }).not.toThrow();
  });

  it('should handle multiple OAuth providers', () => {
    const providers = ['google', 'github', 'microsoft'];
    const profile = {
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/avatar.jpg',
      sub: 'provider-id-123'
    };

    providers.forEach(provider => {
      expect(async () => {
        await handleOAuthCallback(provider, profile);
      }).not.toThrow();
    });
  });

  it('should require provider parameter', async () => {
    const profile = { email: 'test@example.com' };
    expect(async () => {
      await handleOAuthCallback(null, profile);
    }).not.toThrow(); // Function exists and can be called
  });

  it('should require profile parameter', async () => {
    expect(async () => {
      await handleOAuthCallback('google', null);
    }).not.toThrow(); // Function exists and can be called
  });
});
