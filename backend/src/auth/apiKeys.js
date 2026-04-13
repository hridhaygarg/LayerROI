import { logger } from '../utils/logger.js';

const validApiKeys = new Set(
  (process.env.VALID_API_KEYS || '').split(',').filter(Boolean)
);

export function validateApiKey(key) {
  if (!key) return false;
  return validApiKeys.has(key);
}

export function addApiKey(key) {
  validApiKeys.add(key);
  logger.info('API key added');
}

export function removeApiKey(key) {
  validApiKeys.delete(key);
  logger.info('API key removed');
}
