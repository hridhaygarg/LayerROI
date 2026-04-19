import express from 'express';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import {
  createCheckoutSession,
  verifyWebhookSignature,
  upgradeOrgPlan,
  downgradeOrg,
  markCancelAtPeriodEnd,
  PLANS,
} from '../../services/paymentService.js';

const router = express.Router();

// GET /payments/plans — public
router.get('/plans', (req, res) => {
  const plans = Object.entries(PLANS).map(([key, plan]) => ({
    id: key,
    name: plan.name,
    price_usd: plan.price_usd,
    price_display: plan.price_display,
    agent_limit: plan.agent_limit,
    highlighted: plan.highlighted || false,
    badge: plan.badge || null,
    features: plan.features,
  }));
  res.json({ success: true, data: plans });
});

// POST /payments/checkout — needs auth token
router.post('/checkout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: { message: 'Auth required' } });

    const { plan } = req.body;
    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_PLAN', message: 'Plan must be starter, business, or enterprise' } });
    }

    // Decode JWT to get user info (basic decode, auth middleware handles verification)
    const { verifyJWT } = await import('../../auth/jwt.js');
    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyJWT(token);
    if (!decoded) return res.status(401).json({ success: false, error: { message: 'Invalid token' } });

    const { data: user } = await supabase.from('users').select('email, name, org_id').eq('id', decoded.userId).single();
    if (!user?.email) return res.status(400).json({ success: false, error: { message: 'User email required' } });

    const { data: org } = await supabase.from('organisations').select('id, name').eq('id', user.org_id || decoded.orgId).single();
    if (!org) return res.status(400).json({ success: false, error: { message: 'Organization not found' } });

    const session = await createCheckoutSession({
      orgId: org.id,
      planName: plan,
      customerEmail: user.email,
      orgName: org.name || user.name || 'layeroi customer',
    });

    res.json({ success: true, data: { subscription_id: session.subscription_id, checkout_url: session.checkout_url } });
  } catch (error) {
    logger.error('Checkout failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: { code: 'CHECKOUT_FAILED', message: error.message } });
  }
});

// GET /payments/status — needs auth
router.get('/status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: { message: 'Auth required' } });

    const { verifyJWT } = await import('../../auth/jwt.js');
    const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
    if (!decoded) return res.status(401).json({ success: false, error: { message: 'Invalid token' } });

    const { data: user } = await supabase.from('users').select('org_id').eq('id', decoded.userId).single();
    const orgId = user?.org_id || decoded.orgId;

    const { data: org } = await supabase
      .from('organisations')
      .select('plan, plan_agent_limit, plan_history_days, subscription_status, current_period_end, cancel_at_period_end, dodo_subscription_id')
      .eq('id', orgId)
      .single();

    res.json({ success: true, data: org });
  } catch (error) {
    logger.error('Status fetch failed', error);
    res.status(500).json({ success: false, error: { message: 'Could not fetch status' } });
  }
});

// POST /payments/webhook — NO auth, raw body
router.post('/webhook', async (req, res) => {
  const signature = req.headers['webhook-signature'] || req.headers['x-webhook-signature'] || req.headers['x-dodo-signature'];
  const rawBodyString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  if (!signature) {
    logger.warn('Webhook without signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  if (!verifyWebhookSignature(rawBodyString, signature)) {
    logger.warn('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(rawBodyString); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const eventId = event.id || event.event_id || `${event.type}_${Date.now()}`;
  const eventType = event.type || event.event_type;

  // Idempotency check
  const { data: existing } = await supabase.from('webhook_events').select('id, processed').eq('event_id', eventId).maybeSingle();
  if (existing?.processed) {
    logger.info('Webhook already processed', { eventId });
    return res.json({ received: true, duplicate: true });
  }

  if (!existing) {
    await supabase.from('webhook_events').insert({ event_id: eventId, event_type: eventType, payload: event });
  }

  logger.info('Processing webhook', { eventId, eventType });

  try {
    await processWebhookEvent(event);
    await supabase.from('webhook_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('event_id', eventId);
    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { eventId, eventType, error: error.message });
    await supabase.from('webhook_events').update({ error_message: error.message }).eq('event_id', eventId);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// POST /payments/cancel — needs auth
router.post('/cancel', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ success: false, error: { message: 'Auth required' } });

    const { verifyJWT } = await import('../../auth/jwt.js');
    const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
    if (!decoded) return res.status(401).json({ success: false });

    const { data: user } = await supabase.from('users').select('org_id').eq('id', decoded.userId).single();
    const { data: org } = await supabase.from('organisations').select('id, dodo_subscription_id').eq('id', user?.org_id || decoded.orgId).single();

    if (!org?.dodo_subscription_id) {
      return res.status(400).json({ success: false, error: { message: 'No active subscription' } });
    }

    const response = await fetch(`https://live.dodopayments.com/subscriptions/${org.dodo_subscription_id}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${process.env.DODO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancel_at_next_billing_date: true }),
    });

    if (!response.ok) throw new Error('Dodo cancellation failed');

    await markCancelAtPeriodEnd(supabase, org.id);
    res.json({ success: true, data: { cancel_at_period_end: true } });
  } catch (error) {
    logger.error('Cancel failed', error);
    res.status(500).json({ success: false, error: { message: 'Could not cancel' } });
  }
});

async function processWebhookEvent(event) {
  const type = event.type || event.event_type;
  const data = event.data || event;
  const metadata = data.metadata || data.subscription?.metadata || {};
  const orgId = metadata.org_id;
  const planName = metadata.plan;
  const subscriptionId = data.subscription_id || data.subscription?.subscription_id;
  const customerId = data.customer_id || data.customer?.customer_id;
  const periodEnd = data.current_period_end || data.next_billing_date;

  switch (type) {
    case 'subscription.active':
    case 'subscription.created':
    case 'subscription.renewed':
    case 'subscription.updated':
    case 'payment.succeeded': {
      if (!orgId || !planName) { logger.warn('Subscription event missing metadata', { type }); return; }
      await upgradeOrgPlan(supabase, orgId, planName, {
        subscriptionId, customerId,
        periodEnd: periodEnd ? new Date(periodEnd).toISOString() : null,
      });

      // Update billing email
      if (data.customer?.email) {
        await supabase.from('organisations').update({ billing_email: data.customer.email }).eq('id', orgId);
      }

      // Send confirmation email for activations
      if (['subscription.active', 'subscription.created', 'payment.succeeded'].includes(type)) {
        await sendUpgradeEmail(orgId, planName, subscriptionId);
      }
      break;
    }

    case 'subscription.on_hold':
    case 'subscription.paused': {
      if (orgId) {
        await supabase.from('organisations').update({ subscription_status: 'on_hold', updated_at: new Date().toISOString() }).eq('id', orgId);
      }
      break;
    }

    case 'subscription.cancelled':
    case 'subscription.expired':
    case 'subscription.failed': {
      if (orgId) await downgradeOrg(supabase, orgId, type.replace('subscription.', ''));
      break;
    }

    case 'payment.failed': {
      if (orgId) logger.warn('Payment failed', { orgId, reason: data.failure_reason });
      break;
    }

    case 'refund.succeeded':
    case 'payment.refunded': {
      if (orgId) logger.info('Refund processed', { orgId, amount: data.amount });
      break;
    }

    default:
      logger.info('Unhandled webhook type', { type });
  }
}

async function sendUpgradeEmail(orgId, planName, subscriptionId) {
  try {
    const { data: org } = await supabase.from('organisations').select('billing_email, name').eq('id', orgId).single();
    if (!org?.billing_email) return;

    const plan = PLANS[planName];
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!process.env.RESEND_API_KEY) return;

    await resend.emails.send({
      from: 'layeroi <hello@layeroi.com>',
      to: [org.billing_email],
      subject: `You are on the ${plan.name} plan — layeroi`,
      html: `<div style="font-family:Inter,sans-serif;max-width:560px;margin:32px auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:#050505;padding:32px 40px;">
          <span style="font-weight:700;font-size:22px;color:white;">layer</span><span style="color:#22c55e;font-weight:700;font-size:22px;">oi</span>
        </div>
        <div style="padding:40px;">
          <h1 style="font-size:24px;color:#111;margin:0 0 8px;">You are on the ${plan.name} plan</h1>
          <p style="color:#6b7280;font-size:13px;font-family:monospace;margin:0 0 24px;">Subscription · ${subscriptionId || 'pending'}</p>
          <p style="color:#111;font-size:15px;line-height:1.6;margin:0 0 24px;">${org.name || 'Your organisation'} is now on the <strong>${plan.name} plan</strong> at <strong>${plan.price_display}</strong>.</p>
          <div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:10px;padding:20px;margin:0 0 24px;">
            <div style="font-weight:700;color:#14532d;font-size:11px;margin-bottom:12px;letter-spacing:0.08em;">UNLOCKED</div>
            ${plan.features.map(f => `<div style="color:#166534;font-size:13px;padding:3px 0;">→ ${f}</div>`).join('')}
          </div>
          <a href="https://layeroi.com/dashboard" style="display:inline-block;background:#22c55e;color:#050505;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">Go to dashboard →</a>
        </div>
      </div>`,
    });
    logger.info('Upgrade email sent', { orgId, planName });
  } catch (err) {
    logger.error('Upgrade email failed', err);
  }
}

export default router;
