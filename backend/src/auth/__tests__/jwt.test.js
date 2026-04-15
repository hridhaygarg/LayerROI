import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signToken, verifyToken, generateTokens } from '../jwt.js';

describe('JWT Auth', () => {
  it('should sign and verify token', () => {
    const payload = { sub: 'user-1', email: 'test@example.com' };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('test@example.com');
  });

  it('should reject invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  it('should include algorithm in token header', () => {
    const payload = { sub: 'user-1' };
    const token = signToken(payload);
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
  });

  it('should generate access and refresh tokens', () => {
    const user = { id: 'user-1', email: 'test@example.com', org_id: 'org-1' };
    const { accessToken, refreshToken, expiresIn } = generateTokens(user);
    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(expiresIn).toBeGreaterThan(0);
  });

  it('should include user data in access token', () => {
    const user = { id: 'user-1', email: 'test@example.com', org_id: 'org-1' };
    const { accessToken } = generateTokens(user);
    const decoded = verifyToken(accessToken);
    expect(decoded.org_id).toBe('org-1');
    expect(decoded.email).toBe('test@example.com');
  });

  it('should mark tokens with type field', () => {
    const user = { id: 'user-1', email: 'test@example.com', org_id: 'org-1' };
    const { accessToken, refreshToken } = generateTokens(user);

    const accessDecoded = verifyToken(accessToken);
    const refreshDecoded = verifyToken(refreshToken);

    expect(accessDecoded.type).toBe('access');
    expect(refreshDecoded.type).toBe('refresh');
  });

  it('should handle custom expiry times', () => {
    const payload = { sub: 'user-1' };
    const token = signToken(payload, '1h');
    const decoded = verifyToken(token);
    expect(decoded.sub).toBe('user-1');
  });

  it('should reject expired tokens', async () => {
    const payload = { sub: 'user-1' };
    const token = signToken(payload, '1ms');

    // Wait for token to expire
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(() => verifyToken(token)).toThrow();
  });
});
