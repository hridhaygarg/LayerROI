import { describe, it, expect } from 'vitest';
import { hasPermission } from '../rbac.js';

describe('RBAC', () => {
  it('should allow owner full access', () => {
    const user = { role: 'owner' };
    expect(hasPermission(user, 'write:*')).toBe(true);
    expect(hasPermission(user, 'delete:prospects')).toBe(true);
    expect(hasPermission(user, 'manage:team')).toBe(true);
    expect(hasPermission(user, 'read:analytics')).toBe(true);
  });

  it('should enforce admin permissions', () => {
    const user = { role: 'admin' };
    expect(hasPermission(user, 'read:prospects')).toBe(true);
    expect(hasPermission(user, 'write:prospects')).toBe(true);
    expect(hasPermission(user, 'delete:prospects')).toBe(true);
    expect(hasPermission(user, 'manage:team')).toBe(true);
    expect(hasPermission(user, 'manage:billing')).toBe(false);
  });

  it('should enforce member restrictions', () => {
    const user = { role: 'member' };
    expect(hasPermission(user, 'read:prospects')).toBe(true);
    expect(hasPermission(user, 'write:outreach')).toBe(true);
    expect(hasPermission(user, 'read:own_analytics')).toBe(true);
    expect(hasPermission(user, 'manage:team')).toBe(false);
    expect(hasPermission(user, 'delete:prospects')).toBe(false);
  });

  it('should allow viewer read-only access', () => {
    const user = { role: 'viewer' };
    expect(hasPermission(user, 'read:dashboards')).toBe(true);
    expect(hasPermission(user, 'read:analytics')).toBe(true);
    expect(hasPermission(user, 'write:outreach')).toBe(false);
    expect(hasPermission(user, 'delete:prospects')).toBe(false);
  });

  it('should enforce lead permissions', () => {
    const user = { role: 'lead' };
    expect(hasPermission(user, 'read:prospects')).toBe(true);
    expect(hasPermission(user, 'write:outreach')).toBe(true);
    expect(hasPermission(user, 'read:analytics')).toBe(true);
    expect(hasPermission(user, 'manage:team_limited')).toBe(true);
    expect(hasPermission(user, 'manage:team')).toBe(false);
  });

  it('should handle wildcard permissions', () => {
    const user = { role: 'admin' };
    expect(hasPermission(user, 'read:anything')).toBe(true);
    expect(hasPermission(user, 'write:anything')).toBe(true);
  });

  it('should return false for missing user', () => {
    expect(hasPermission(null, 'read:prospects')).toBe(false);
    expect(hasPermission(undefined, 'read:prospects')).toBe(false);
  });

  it('should return false for missing role', () => {
    const user = {};
    expect(hasPermission(user, 'read:prospects')).toBe(false);
  });

  it('should return false for invalid role', () => {
    const user = { role: 'invalid_role' };
    expect(hasPermission(user, 'read:prospects')).toBe(false);
  });

  it('should match exact permissions', () => {
    const user = { role: 'member' };
    expect(hasPermission(user, 'read:prospects')).toBe(true);
  });

  it('should match wildcard patterns', () => {
    const user = { role: 'admin' };
    // read:* permission should match read:prospects
    expect(hasPermission(user, 'read:prospects')).toBe(true);
    expect(hasPermission(user, 'read:anything')).toBe(true);
    // But not write:*
    expect(hasPermission(user, 'write:prospects')).toBe(true);
  });
});
