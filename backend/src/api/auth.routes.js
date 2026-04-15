import express from 'express';
import { getSupabaseClient } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { generateTokens, verifyToken, generateMFAToken } from '../auth/jwt.js';
import { verifyMFAToken } from '../auth/mfa.js';
import { handleOAuthCallback } from '../auth/oauth.js';
import { isValidEmail } from '../utils/validators.js';
import { createSession, invalidateAllUserSessions } from '../db/session.js';

const router = express.Router();

// Helper function to safely get client IP address
function getClientIp(req) {
  // Trust proxy if configured
  if (req.app.get('trust proxy')) {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'unknown';
  }
  return req.ip || 'unknown';
}

// Password strength validation
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  if (!/[0-9]/.test(password)) {
    return false;
  }
  if (!/[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?\~`]/.test(password)) {
    return false;
  }
  return true;
}

// POST /register - User registration
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;

    // Input validation
    if (!email || !password || !firstName || !lastName) {
      throw new AppError('Email, password, first name, and last name are required', 400, 'INVALID_INPUT');
    }

    if (!isValidEmail(email)) {
      throw new AppError('Invalid email format', 400, 'INVALID_INPUT');
    }

    if (!validatePasswordStrength(password)) {
      throw new AppError(
        'Password must be at least 8 characters and include uppercase, number, and special character',
        400,
        'INVALID_INPUT'
      );
    }

    const supabase = getSupabaseClient();

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected)
      throw new AppError('Failed to check user existence', 500);
    }

    if (existingUser) {
      throw new AppError('Email already exists', 409, 'DUPLICATE_EMAIL');
    }

    try {
      // Step 1: Create user
      const passwordHash = await hashPassword(password);
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          email: email.toLowerCase(),
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          status: 'active'
        }])
        .select()
        .single();

      if (userError) {
        logger.error('User creation failed', { email, error: userError });
        throw new AppError('Failed to create user', 500, 'DB_ERROR', { original: userError });
      }

      // Step 2: Create organization
      const orgName = `${firstName} ${lastName}'s Workspace`.trim();
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: orgName,
          owner_id: newUser.id,
          status: 'active'
        }])
        .select()
        .single();

      if (orgError || !org) {
        logger.error('Organization creation failed after user created', { userId: newUser.id, error: orgError });
        // Cleanup: delete user and verify success
        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', newUser.id);

        if (deleteError) {
          logger.error('Failed to cleanup user after org creation failed', {
            userId: newUser.id,
            error: deleteError.message
          });
        }
        throw new AppError('Failed to create organization', 500, 'DB_ERROR', { original: orgError });
      }

      // Step 3: Add user as organization owner
      const { error: tmError } = await supabase
        .from('team_members')
        .insert([{
          user_id: newUser.id,
          organization_id: org.id,
          role: 'owner'
        }])
        .select()
        .single();

      if (tmError) {
        logger.error('Team member creation failed after org created', { userId: newUser.id, orgId: org.id, error: tmError });
        // Cleanup: delete org and user
        await supabase.from('organizations').delete().eq('id', org.id);
        await supabase.from('users').delete().eq('id', newUser.id);
        throw new AppError('Failed to set up organization access', 500, 'DB_ERROR', { original: tmError });
      }

      // All steps succeeded, generate tokens
      const tokens = generateTokens({
        id: newUser.id,
        email: newUser.email,
        org_id: org.id
      });

      // Create session for new user (non-blocking, but log failures)
      createSession(newUser.id, {
        userAgent: req.headers['user-agent'] || 'unknown',
        ipAddress: getClientIp(req),
        device: 'web',
        location: 'unknown'
      }).catch(err => {
        logger.warn('Failed to create session after registration', {
          userId: newUser.id,
          error: err.message
        });
      });

      logger.info('User registered successfully', {
        userId: newUser.id,
        email: newUser.email,
        orgId: org.id
      });

      res.status(201).json({
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          organization: {
            id: org.id,
            name: org.name
          }
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Unexpected error during registration', { error: err });
      throw new AppError('Registration failed', 500, 'INTERNAL_ERROR');
    }
  })
);

// POST /login - User login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      throw new AppError('Email and password are required', 400, 'INVALID_INPUT');
    }

    const supabase = getSupabaseClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      logger.info('Login attempt for non-existent user', { email });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      logger.info('Login attempt with invalid password', { email });
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Check if MFA is enabled
    if (user.mfa_enabled) {
      const mfaToken = generateMFAToken(user);
      logger.info('MFA required for login', { email });
      return res.status(200).json({
        mfaRequired: true,
        mfaToken
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Create session for logged-in user (non-blocking, but log failures)
    createSession(user.id, {
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: getClientIp(req),
      device: 'web',
      location: 'unknown'
    }).catch(err => {
      logger.warn('Failed to create session after login', {
        userId: user.id,
        error: err.message
      });
    });

    logger.info('User logged in successfully', {
      email,
      userId: user.id
    });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  })
);

// POST /verify-mfa - Verify MFA token and get access token
router.post(
  '/verify-mfa',
  asyncHandler(async (req, res) => {
    const { mfaToken, totp } = req.body;

    // Input validation
    if (!mfaToken || !totp) {
      throw new AppError('MFA token and TOTP are required', 400, 'INVALID_INPUT');
    }

    // Verify MFA token
    let decoded;
    try {
      decoded = verifyToken(mfaToken);
    } catch (err) {
      logger.info('Invalid MFA token', { error: err.message });
      throw new AppError('Invalid or expired MFA token', 401, 'INVALID_TOKEN');
    }

    // Ensure token is an MFA token
    if (decoded.type !== 'mfa') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN');
    }

    const supabase = getSupabaseClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 401, 'INVALID_TOKEN');
    }

    // Verify TOTP
    const totpValid = verifyMFAToken(totp, user.mfa_secret);

    if (!totpValid) {
      logger.info('Invalid TOTP provided', { userId: user.id });
      throw new AppError('Invalid TOTP', 401, 'INVALID_MFA');
    }

    // Update user with MFA verification timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({
        mfa_verified_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to update MFA verification', {
        userId: user.id,
        error: updateError.message
      });
      throw new AppError('Failed to verify MFA', 500);
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Create session for logged-in user (non-blocking, but log failures)
    createSession(user.id, {
      userAgent: req.headers['user-agent'] || 'unknown',
      ipAddress: getClientIp(req),
      device: 'web',
      location: 'unknown'
    }).catch(err => {
      logger.warn('Failed to create session after MFA verification', {
        userId: user.id,
        error: err.message
      });
    });

    logger.info('MFA verified successfully', { userId: user.id });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  })
);

// POST /logout - User logout
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw new AppError('Invalid token', 401, 'UNAUTHORIZED');
    }

    const supabase = getSupabaseClient();

    // Invalidate refresh token by updating user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        refresh_token_revoked_at: new Date().toISOString()
      })
      .eq('id', decoded.sub);

    if (updateError) {
      logger.error('Failed to revoke refresh token', {
        userId: decoded.sub,
        error: updateError?.message
      });
      throw new AppError('Logout failed', 500);
    }

    // Invalidate all sessions for user
    try {
      await invalidateAllUserSessions(decoded.sub);
    } catch (sessionErr) {
      logger.error('Failed to invalidate user sessions on logout', {
        userId: decoded.sub,
        error: sessionErr.message
      });
      // Don't fail logout due to session invalidation error
    }

    // NOTE: Access tokens persist until expiry (15m default) since they are self-contained JWTs.
    // To immediately invalidate access tokens on logout, implement a token blacklist (Redis/Memcached)
    // that checks if a token has been blacklisted before accepting it in protected endpoints.

    logger.info('User logged out successfully', {
      userId: decoded.sub
    });

    res.status(200).json({
      message: 'Logged out successfully'
    });
  })
);

// POST /refresh - Refresh access token
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400, 'INVALID_INPUT');
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }

    // Check that token is a refresh token
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN');
    }

    const supabase = getSupabaseClient();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (userError || !user) {
      throw new AppError('User not found', 401, 'INVALID_TOKEN');
    }

    // Check if refresh token was revoked
    if (user.refresh_token_revoked_at) {
      throw new AppError('Refresh token has been revoked', 401, 'INVALID_TOKEN');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    logger.info('Tokens refreshed successfully', {
      userId: user.id
    });

    res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn
    });
  })
);

// POST /oauth/:provider - OAuth callback handler
router.post(
  '/oauth/:provider',
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const { code } = req.body;

    // Validate input
    if (!code || typeof code !== 'string') {
      throw new AppError('Authorization code is required', 400, 'INVALID_INPUT');
    }

    const validProviders = ['google', 'github', 'microsoft'];
    if (!validProviders.includes(provider)) {
      throw new AppError(`Invalid provider: ${provider}`, 400, 'INVALID_INPUT');
    }

    try {
      // TODO: Implement real OAuth token exchange for each provider:
      //
      // For Google:
      //   1. Exchange code for access token via Google token endpoint
      //   2. Fetch user profile from Google API
      //   3. Extract email, name, profile picture
      //
      // For GitHub:
      //   1. Exchange code for access token via GitHub token endpoint
      //   2. Fetch user profile from GitHub API (/user)
      //   3. Extract email, name, avatar_url
      //
      // For Microsoft:
      //   1. Exchange code for access token via Azure token endpoint
      //   2. Fetch user profile from Microsoft Graph API (/me)
      //   3. Extract email, displayName, mailNickname
      //
      // Then call handleOAuthCallback(provider, profile) with normalized profile:
      // {
      //   id: provider_user_id,
      //   email: user_email,
      //   name: full_name,
      //   picture: profile_picture_url,
      //   provider: provider_name
      // }

      logger.warn('OAuth provider integration not yet implemented', { provider });
      throw new AppError(
        `OAuth integration for ${provider} is not yet implemented`,
        501,
        'NOT_IMPLEMENTED'
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('OAuth callback failed', { provider, error: err });
      throw new AppError('OAuth authentication failed', 401, 'OAUTH_ERROR');
    }
  })
);

export const authRoutes = router;
export default router;
