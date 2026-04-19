import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/logger.js';
import { signJWT } from '../../auth/jwt.js';
import { supabase } from '../../config/database.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' } },
  standardHeaders: true,
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown',
});

// ─── SIGNUP ────────────────────────────────────────────
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, name, company, password } = req.body;

    if (!email || !name || !company) {
      return res.status(400).json({ success: false, error: { message: 'Email, name, and company required' } });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    const { data: existing } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) {
      return res.status(409).json({ success: false, error: { message: 'An account with this email already exists. Please sign in.' } });
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters' } });
      }
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create org
    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({ name: company, plan: 'free', plan_agent_limit: 2, plan_history_days: 14 })
      .select()
      .single();

    if (orgError) {
      logger.error('Org creation failed', orgError);
      return res.status(500).json({ success: false, error: { message: 'Could not create organisation' } });
    }

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ email: cleanEmail, name, org_id: org.id, password_hash: passwordHash })
      .select()
      .single();

    if (userError) {
      logger.error('User creation failed', userError);
      // Clean up org
      await supabase.from('organisations').delete().eq('id', org.id);
      return res.status(500).json({ success: false, error: { message: 'Could not create user account' } });
    }

    // Create org membership
    await supabase.from('organisation_members').insert({
      user_id: user.id,
      org_id: org.id,
      role: 'owner',
    }).catch(() => {}); // table may not exist yet

    const apiKey = `sk-${crypto.randomBytes(16).toString('hex')}`;
    const token = signJWT({ userId: user.id, orgId: org.id, email: cleanEmail });

    logger.info('New user signed up', { email: cleanEmail, orgId: org.id });

    res.json({
      success: true,
      token,
      apiKey,
      user: { id: user.id, email: user.email, name: user.name },
      organisation: { id: org.id, name: company },
      message: 'Account created successfully',
    });
  } catch (err) {
    logger.error('Signup failed', err);
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ─── LOGIN ─────────────────────────────────────────────
router.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Email and password required' } });
    }

    const cleanEmail = email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash, org_id')
      .eq('email', cleanEmail)
      .single();

    if (error || !user || !user.password_hash) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    // Get org info
    const { data: org } = await supabase
      .from('organisations')
      .select('id, name, plan')
      .eq('id', user.org_id)
      .single();

    const token = signJWT({ userId: user.id, orgId: user.org_id, email: user.email });

    logger.info('User logged in', { email: cleanEmail });

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name },
        org: org || { id: user.org_id },
      },
    });
  } catch (err) {
    logger.error('Login failed', err);
    res.status(500).json({ success: false, error: { code: 'LOGIN_FAILED', message: 'Login failed. Please try again.' } });
  }
});

// ─── FORGOT PASSWORD ───────────────────────────────────
router.post('/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: { message: 'Email required' } });

    const cleanEmail = email.toLowerCase().trim();

    // Always return success — do not reveal whether email exists
    const { data: user } = await supabase.from('users').select('id, email, name').eq('email', cleanEmail).single();

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(resetToken, 10);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await supabase.from('password_resets').insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

      const resetUrl = `https://layeroi.com/reset-password?token=${resetToken}&email=${encodeURIComponent(cleanEmail)}`;

      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: 'layeroi <hello@layeroi.com>',
          to: [cleanEmail],
          subject: 'Reset your layeroi password',
          html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:32px auto;padding:40px;background:white;border-radius:12px;">
            <div style="margin-bottom:24px;"><span style="font-weight:700;font-size:20px;color:#111;">layer</span><span style="font-weight:700;font-size:20px;color:#22c55e;">oi</span></div>
            <h1 style="font-size:22px;color:#111;margin:0 0 12px;">Reset your password</h1>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">Click the button below to set a new password. This link expires in 1 hour.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#22c55e;color:#050505;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;text-decoration:none;">Reset password →</a>
            <p style="color:#9ca3af;font-size:12px;margin-top:32px;">If you didn't request this, ignore this email.</p>
          </div>`,
        });
      } catch (emailErr) {
        logger.error('Reset email failed', emailErr);
      }
    }

    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    logger.error('Forgot password failed', err);
    res.status(500).json({ success: false, error: { message: 'Could not send reset email' } });
  }
});

// ─── RESET PASSWORD ────────────────────────────────────
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ success: false, error: { message: 'Token, email, and new password required' } });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters' } });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data: user } = await supabase.from('users').select('id').eq('email', cleanEmail).single();
    if (!user) return res.status(400).json({ success: false, error: { message: 'Invalid reset link' } });

    const { data: resets } = await supabase
      .from('password_resets')
      .select('id, token_hash, expires_at, used_at')
      .eq('user_id', user.id)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString());

    if (!resets || resets.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'Reset link expired or invalid' } });
    }

    let matchedReset = null;
    for (const r of resets) {
      if (await bcrypt.compare(token, r.token_hash)) {
        matchedReset = r;
        break;
      }
    }

    if (!matchedReset) {
      return res.status(400).json({ success: false, error: { message: 'Invalid reset token' } });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id);
    await supabase.from('password_resets').update({ used_at: new Date().toISOString() }).eq('id', matchedReset.id);

    logger.info('Password reset', { email: cleanEmail });
    res.json({ success: true, message: 'Password reset. Please log in.' });
  } catch (err) {
    logger.error('Reset password failed', err);
    res.status(500).json({ success: false, error: { message: 'Could not reset password' } });
  }
});

// ─── TOKEN REFRESH ─────────────────────────────────────
router.post('/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token required' });

    const { verifyJWT } = await import('../../auth/jwt.js');
    const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const token = signJWT({ userId: decoded.userId, orgId: decoded.orgId, email: decoded.email });
    res.json({ success: true, token });
  } catch (err) {
    logger.error('Token refresh failed', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
