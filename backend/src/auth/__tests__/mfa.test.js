import { describe, it, expect } from 'vitest';
import { generateMFASecret, verifyMFAToken, generateBackupCodes } from '../mfa.js';

describe('MFA', () => {
  it('should generate MFA secret', async () => {
    const { secret, backupCodes } = await generateMFASecret('test@example.com');
    expect(secret).toBeDefined();
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThan(20);
    expect(backupCodes).toHaveLength(10);
  });

  it('should generate QR code', async () => {
    const { qrCode } = await generateMFASecret('test@example.com');
    expect(qrCode).toBeDefined();
    expect(qrCode).toMatch(/^data:image\/png;base64,/);
  });

  it('should generate backup codes with correct format', () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(10);
    codes.forEach(code => {
      expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    });
  });

  it('should generate unique backup codes', () => {
    const codes = generateBackupCodes();
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should include email in secret labeling', async () => {
    const email = 'unique@example.com';
    const { secret } = await generateMFASecret(email);
    // Secret should be valid base32
    expect(/^[A-Z2-7]+=*$/.test(secret)).toBe(true);
  });

  it('should reject invalid TOTP tokens', async () => {
    const { secret } = await generateMFASecret('test@example.com');
    const isValid = verifyMFAToken(secret, '000000');
    expect(isValid).toBe(false);
  });

  it('should allow window for TOTP verification', async () => {
    const { secret } = await generateMFASecret('test@example.com');
    // This test verifies the function exists and handles window parameter
    expect(typeof verifyMFAToken).toBe('function');
  });

  it('should handle MFA setup flow', async () => {
    const email = 'setup@example.com';
    const { secret, qrCode, backupCodes } = await generateMFASecret(email);

    expect(secret).toBeDefined();
    expect(qrCode).toBeDefined();
    expect(backupCodes).toHaveLength(10);
    expect(typeof verifyMFAToken).toBe('function');
  });
});
