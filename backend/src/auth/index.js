// JWT Token Management
export { signJWT, verifyJWT, signToken, verifyToken, generateTokens } from './jwt.js';

// Password Hashing
export { hashPassword, verifyPassword } from './password.js';

// OAuth
export { handleOAuthCallback } from './oauth.js';

// MFA
export { generateMFASecret, verifyMFAToken, generateBackupCodes } from './mfa.js';

// RBAC
export { hasPermission, requirePermission } from './rbac.js';

// API Keys (existing)
export { validateApiKey, addApiKey, removeApiKey } from './apiKeys.js';
