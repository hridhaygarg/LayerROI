import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

// Validate JWT_SECRET is provided and sufficiently long
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set as environment variable and be at least 32 characters');
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export function signJWT(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (err) {
    logger.error('JWT sign error', err);
    return null;
  }
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.error('JWT verify error', err);
    return null;
  }
}
