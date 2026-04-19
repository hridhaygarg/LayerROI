import express from 'express';
import { logger } from '../../utils/logger.js';
import { signJWT } from '../../auth/jwt.js';
import { getGoogleAuthUrl, validateGoogleOAuthConfig } from '../middleware/oauthMiddleware.js';
import { createUser, getUserByEmail } from '../../database/queries/users.js';
import crypto from 'crypto';

const router = express.Router();

// Login endpoint - generate JWT for API users
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // SECURITY NOTE: Password validation is not implemented.
    // This endpoint currently accepts any email/password combination.
    // To fix:
    // 1. Add auth_hash column to users table
    // 2. Hash passwords with bcrypt on signup
    // 3. Compare hash on login: const match = await bcrypt.compare(password, user.auth_hash);

    logger.warn('Login endpoint called - password validation not implemented', { email });
    return res.status(501).json({
      error: 'Password authentication not yet implemented',
      message: 'Use OAuth or API key authentication instead'
    });

    const token = signJWT({
      userId: user.id,
      orgId: user.org_id,
      email: user.email,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });

    logger.info('User logged in', { email });
  } catch (err) {
    logger.error('Login failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Signup endpoint - create new user and return JWT
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, name, company } = req.body;

    if (!email || !name || !company) {
      return res.status(400).json({ error: 'Email, name, and company required' });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user in database - must persist or fail
    let user;
    try {
      user = await createUser({
        email,
        name,
        company,
      });
    } catch (err) {
      logger.error('User creation failed - database error', { email, error: err.message });
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    const apiKey = `sk-${crypto.randomBytes(16).toString('hex')}`;
    const token = signJWT({
      userId: user.id,
      orgId: user.org_id,
      email: user.email,
    });

    res.json({
      success: true,
      token,
      apiKey,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organisation: {
        id: user.org_id,
        name: company,
      },
      message: 'Account created successfully'
    });

    logger.info('New user signed up', { email, company, userId: user.id, orgId: user.org_id });
  } catch (err) {
    logger.error('Signup failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Google OAuth - start flow
router.get('/auth/google', (req, res) => {
  if (!validateGoogleOAuthConfig()) {
    return res.status(503).json({ error: 'Google OAuth not configured' });
  }

  const state = crypto.randomBytes(32).toString('hex');
  const url = getGoogleAuthUrl(state);

  res.json({
    authUrl: url,
    state,
  });

  logger.info('Google OAuth flow initiated');
});

// Google OAuth - callback (frontend handles, backend validates)
router.post('/auth/google/token', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    // SECURITY NOTE: Google OAuth is not fully implemented.
    // To enable, implement verifyGoogleToken() using google-auth-library:
    // npm install google-auth-library
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    // const payload = ticket.getPayload();

    logger.warn('Google OAuth endpoint called but verification not implemented', { idToken: idToken.substring(0, 20) + '...' });

    return res.status(501).json({
      error: 'Google OAuth verification not yet implemented',
      message: 'This endpoint requires google-auth-library integration'
    });
  } catch (err) {
    logger.error('Google OAuth failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Refresh token endpoint
router.post('/auth/refresh', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const token = signJWT({ userId });

    res.json({
      success: true,
      token,
    });

    logger.info('Token refreshed', { userId });
  } catch (err) {
    logger.error('Token refresh failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Revoke API key endpoint
router.post('/auth/revoke-key', (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key required' });
    }

    // SECURITY NOTE: API key revocation is not implemented.
    // Currently revoked keys can still be used.
    // To fix:
    // 1. Add revoked_at timestamp column to api_keys table
    // 2. Update: UPDATE api_keys SET revoked_at = NOW() WHERE key = $1
    // 3. Check in auth middleware: if (apiKey.revoked_at) return 401

    logger.warn('API key revocation not implemented - key remains active', { apiKey: apiKey.substring(0, 10) + '...' });
    res.json({
      success: false,
      message: 'API key revocation not yet implemented',
      error: 'Please delete the API key from your account settings instead'
    });
  } catch (err) {
    logger.error('Revoke key failed', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
