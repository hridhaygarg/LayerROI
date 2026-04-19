import { logger } from '../../utils/logger.js';
import { verifyJWT } from '../../auth/jwt.js';
import { validateApiKey } from '../../auth/apiKeys.js';

export const authMiddleware = (req, res, next) => {
  // Skip auth for public endpoints
  const publicEndpoints = ['/health', '/health/detailed', '/health/llm', '/health/payments', '/api/signup', '/api/metrics/weekly', '/payments/plans', '/payments/webhook', '/auth/login', '/auth/signup', '/auth/verify', '/auth/forgot-password', '/auth/reset-password'];
  if (publicEndpoints.includes(req.path)) {
    return next();
  }

  // Allow automation triggers (called by cron jobs)
  if (req.path.startsWith('/automations/trigger/') || req.path.startsWith('/api/automations/trigger/')) {
    return next();
  }

  // Try JWT first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    if (decoded) {
      req.userId = decoded.userId;
      req.orgId = decoded.orgId;
      return next();
    }
  }

  // Try API key
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey && validateApiKey(apiKey)) {
    req.apiKeyAuth = true;
    return next();
  }

  logger.warn('Unauthorized request', { path: req.path, method: req.method });
  return res.status(401).json({ error: 'Unauthorized' });
};

export const optionalAuth = (req, res, next) => {
  // Try JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyJWT(token);
    if (decoded) {
      req.userId = decoded.userId;
      req.orgId = decoded.orgId;
    }
  }

  // Try API key
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  if (apiKey && validateApiKey(apiKey)) {
    req.apiKeyAuth = true;
  }

  next();
};
