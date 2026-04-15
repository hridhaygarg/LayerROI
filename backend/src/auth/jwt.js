import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';
import { logger } from '../utils/logger.js';

const config = getConfig();

/**
 * Sign JWT token with user data
 * @param {Object} payload - User data to encode
 * @param {string} expiresIn - Expiration time (e.g., '15m')
 * @returns {string} Signed JWT token
 */
export function signToken(payload, expiresIn = '15m') {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256'
  });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}

/**
 * Generate access and refresh tokens
 * @param {Object} user - User object with id, email, org_id
 * @returns {Object} { accessToken, refreshToken, expiresIn }
 */
export function generateTokens(user) {
  const accessToken = signToken(
    {
      sub: user.id,
      email: user.email,
      org_id: user.org_id,
      type: 'access'
    },
    config.JWT_EXPIRY || '15m'
  );

  const refreshToken = signToken(
    {
      sub: user.id,
      type: 'refresh'
    },
    config.REFRESH_TOKEN_EXPIRY || '7d'
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: parseInt(config.JWT_EXPIRY || '900') // seconds
  };
}

// Legacy exports for backward compatibility
export const signJWT = signToken;
export const verifyJWT = verifyToken;

export default { signToken, verifyToken, generateTokens, signJWT, verifyJWT };
