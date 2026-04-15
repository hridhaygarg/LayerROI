import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate TOTP secret for MFA
 * @param {string} email - User email for secret labeling
 * @returns {Promise<Object>} { secret, qrCode, backupCodes }
 */
export async function generateMFASecret(email) {
  const secret = speakeasy.generateSecret({
    name: `Layer ROI (${email})`,
    issuer: 'Layer ROI',
    length: 32
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
    backupCodes: generateBackupCodes()
  };
}

/**
 * Verify TOTP token
 * @param {string} secret - User's secret
 * @param {string} token - 6-digit token from authenticator
 * @returns {boolean} True if token is valid
 */
export function verifyMFAToken(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
}

/**
 * Generate backup codes for account recovery
 * @returns {Array<string>} Array of 10 backup codes
 */
export function generateBackupCodes() {
  return Array(10).fill(0).map(() =>
    `${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}`.toUpperCase()
  );
}

export default { generateMFASecret, verifyMFAToken, generateBackupCodes };
