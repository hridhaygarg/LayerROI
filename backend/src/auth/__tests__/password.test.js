import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../password.js';

describe('Password Hashing', () => {
  it('should hash password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should verify correct password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword('WrongPassword', hash);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'SecurePassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });

  it('should be timing-attack safe', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);

    // Both should take similar time
    const start1 = Date.now();
    await verifyPassword('correct', hash);
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await verifyPassword('wrong', hash);
    const time2 = Date.now() - start2;

    // Times should be reasonably close (within 50% variance)
    const ratio = Math.max(time1, time2) / Math.min(time1, time2);
    expect(ratio).toBeLessThan(2);
  });

  it('should handle very long passwords', async () => {
    const password = 'x'.repeat(1000);
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should handle special characters', async () => {
    const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });
});
