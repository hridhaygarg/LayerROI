import express from 'express';
import crypto from 'crypto';
import { getSupabaseClient } from '../db/client.js';
import { logger } from '../utils/logger.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { verifyToken } from '../auth/jwt.js';

const router = express.Router();

/**
 * Middleware to verify JWT authentication
 * Extracts org_id and user info from token
 */
const verifyAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.substring(7);

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }

  // Add user info to request object
  req.user = {
    id: decoded.sub,
    org_id: decoded.org_id,
    email: decoded.email
  };

  next();
});

// Apply auth middleware to all webhook routes
router.use(verifyAuth);

// Valid webhook events
const VALID_EVENTS = [
  'prospect.created',
  'prospect.updated',
  'prospect.deleted',
  'outreach.sent',
  'outreach.opened',
  'outreach.clicked',
  'outreach.replied',
  'campaign.started',
  'campaign.completed'
];

/**
 * Validate URL format
 */
function isValidUrl(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a random 32-byte hex string for webhook signing secret
 */
function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create HMAC-SHA256 signature for webhook payload
 */
function createSignature(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * GET /api/webhooks - List webhooks
 * Requires auth
 * Query: page (default 1), limit (default 20, max 100)
 * Returns: { webhooks, total, page, limit, hasMore }
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orgId = req.user.org_id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();

    // Fetch webhooks with pagination
    const { data: webhooks, error: fetchError } = await supabase
      .from('webhooks')
      .select('id, url, events, status, created_at')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      logger.error('Failed to fetch webhooks', { orgId, error: fetchError });
      throw new AppError('Failed to fetch webhooks', 500, 'DB_ERROR');
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('webhooks')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .is('deleted_at', null);

    if (countError) {
      logger.error('Failed to count webhooks', { orgId, error: countError });
      throw new AppError('Failed to count webhooks', 500, 'DB_ERROR');
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    logger.info('Webhooks retrieved', { orgId, page, limit, total });

    res.status(200).json({
      webhooks: webhooks || [],
      total,
      page,
      limit,
      hasMore
    });
  })
);

/**
 * POST /api/webhooks - Create webhook
 * Requires auth
 * Input: { url, events: [...] }
 * Returns: { webhook, secret }
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { url, events } = req.body;
    const orgId = req.user.org_id;

    // Validate input
    if (!url || !events) {
      throw new AppError('URL and events are required', 400, 'INVALID_INPUT');
    }

    if (!isValidUrl(url)) {
      throw new AppError('Invalid URL format', 400, 'INVALID_INPUT');
    }

    if (!Array.isArray(events) || events.length === 0) {
      throw new AppError('Events must be a non-empty array', 400, 'INVALID_INPUT');
    }

    // Validate all events
    const invalidEvents = events.filter(e => !VALID_EVENTS.includes(e));
    if (invalidEvents.length > 0) {
      throw new AppError(
        `Invalid events: ${invalidEvents.join(', ')}`,
        400,
        'INVALID_INPUT',
        { invalidEvents }
      );
    }

    const supabase = getSupabaseClient();

    // Check for existing webhook with same URL in same organization
    const checkChain = supabase
      .from('webhooks')
      .select('id')
      .eq('org_id', orgId)
      .eq('url', url)
      .is('deleted_at', null);

    const checkResult = await checkChain.single();
    const { data: existingWebhook, error: checkError } = checkResult;

    if (checkError && checkError.code !== 'PGRST116') {
      logger.error('Failed to check for existing webhook', { orgId, url, error: checkError });
      throw new AppError('Failed to create webhook', 500, 'DB_ERROR');
    }

    if (existingWebhook) {
      throw new AppError('Webhook with this URL already exists', 409, 'DUPLICATE_WEBHOOK');
    }

    // Generate signing secret
    const plainSecret = generateSecret();
    const hashedSecret = crypto.createHash('sha256').update(plainSecret).digest('hex');

    // Create webhook
    const { data: webhook, error: createError } = await supabase
      .from('webhooks')
      .insert([
        {
          org_id: orgId,
          url,
          events,
          signing_secret: hashedSecret,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ])
      .select('id, url, events, status, created_at')
      .single();

    if (createError) {
      logger.error('Failed to create webhook', { orgId, url, error: createError });
      throw new AppError('Failed to create webhook', 500, 'DB_ERROR');
    }

    logger.info('Webhook created successfully', {
      webhookId: webhook.id,
      orgId,
      url
    });

    res.status(201).json({
      webhook,
      secret: plainSecret // Only return plain secret on creation
    });
  })
);

/**
 * POST /api/webhooks/:id/test - Test webhook delivery
 * Requires auth
 * Sends test payload with HMAC signature
 * Returns: { statusCode, responseTime, success }
 */
router.post(
  '/:id/test',
  asyncHandler(async (req, res) => {
    const { id: webhookId } = req.params;
    const orgId = req.user.org_id;

    const supabase = getSupabaseClient();

    // Fetch webhook
    const { data: webhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('id, url, signing_secret, status')
      .eq('id', webhookId)
      .eq('org_id', orgId)
      .single();

    if (fetchError || !webhook) {
      throw new AppError('Webhook not found', 404, 'NOT_FOUND');
    }

    // Prepare test payload
    const testPayload = {
      event: 'test.delivery',
      timestamp: Date.now(),
      data: {}
    };

    const payloadString = JSON.stringify(testPayload);
    const signature = createSignature(payloadString, webhook.signing_secret);

    // Send test webhook
    const startTime = Date.now();
    let statusCode = 500;
    let responseTime = 0;
    let success = false;
    let errorMessage = null;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': `sha256=${signature}`,
          'User-Agent': 'LayerROI-Webhook/1.0'
        },
        body: payloadString,
        timeout: 5000
      });

      responseTime = Date.now() - startTime;
      statusCode = response.status;
      success = response.ok;
    } catch (err) {
      responseTime = Date.now() - startTime;
      errorMessage = err.message;
      logger.warn('Failed to deliver test webhook', {
        webhookId,
        orgId,
        error: err.message
      });
    }

    // Log delivery attempt
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert([
        {
          webhook_id: webhookId,
          event: 'test.delivery',
          payload: testPayload,
          status: success ? 'success' : 'failed',
          http_status: statusCode,
          response_time: responseTime,
          error: errorMessage,
          created_at: new Date().toISOString()
        }
      ]);

    if (logError) {
      logger.warn('Failed to log webhook test delivery', {
        webhookId,
        orgId,
        error: logError
      });
    }

    logger.info('Test webhook delivery completed', {
      webhookId,
      orgId,
      statusCode,
      responseTime,
      success
    });

    res.status(200).json({
      statusCode,
      responseTime,
      success
    });
  })
);

/**
 * GET /api/webhooks/:id/logs - Get webhook delivery logs
 * Requires auth
 * Query: page (default 1), limit (default 20, max 100)
 * Returns: { logs, total, page }
 */
router.get(
  '/:id/logs',
  asyncHandler(async (req, res) => {
    const { id: webhookId } = req.params;
    const orgId = req.user.org_id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();

    // Fetch logs with pagination
    const { data: logs, error: fetchError } = await supabase
      .from('webhook_logs')
      .select('id, event, status, http_status, response_time, error, created_at')
      .eq('webhook_id', webhookId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      logger.error('Failed to fetch webhook logs', { webhookId, orgId, error: fetchError });
      throw new AppError('Failed to fetch webhook logs', 500, 'DB_ERROR');
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('webhook_logs')
      .select('id', { count: 'exact', head: true })
      .eq('webhook_id', webhookId)
      .eq('org_id', orgId);

    if (countError) {
      logger.error('Failed to count webhook logs', { webhookId, orgId, error: countError });
      throw new AppError('Failed to count webhook logs', 500, 'DB_ERROR');
    }

    const total = count || 0;

    logger.info('Webhook logs retrieved', { webhookId, orgId, page, limit, total });

    res.status(200).json({
      logs: logs || [],
      total,
      page,
      limit
    });
  })
);

export const webhooksRoutes = router;
export default router;
