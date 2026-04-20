import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const DODO_API_BASE = process.env.DODO_TEST_MODE === 'false' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';

export const PLANS = {
  starter: {
    name: 'Starter',
    price_usd: 499,
    price_display: '$499/month',
    agent_limit: 5,
    history_days: 90,
    product_id: process.env.DODO_PRODUCT_STARTER,
    features: [
      'Up to 5 agents tracked',
      'Real-time P&L dashboard',
      '90 days of history',
      'Weekly CFO report',
      'Email alerts',
      'Kill switch protection',
      'OpenAI, Anthropic, Google, Azure support',
    ],
  },
  business: {
    name: 'Business',
    price_usd: 2500,
    price_display: '$2,500/month',
    agent_limit: 30,
    history_days: 365,
    product_id: process.env.DODO_PRODUCT_BUSINESS,
    highlighted: true,
    badge: 'Most popular',
    features: [
      'Everything in Starter',
      'Up to 30 agents tracked',
      '1 year of history',
      'AI-powered weekly insights',
      'Spend forecasting',
      'ROI benchmarking',
      'Slack and webhook integrations',
      'Team member access',
      'Audit logs',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price_usd: 8500,
    price_display: '$8,500/month',
    agent_limit: -1,
    history_days: 1095,
    product_id: process.env.DODO_PRODUCT_ENTERPRISE,
    features: [
      'Everything in Business',
      'Unlimited agents',
      '3 years of history',
      'SSO and SAML',
      'Custom contracts and SLA',
      'Dedicated support engineer',
      'Custom integrations',
      'Data residency controls',
      'Quarterly business reviews',
      'White-label reports',
    ],
  },
};

export async function createCheckoutSession({ orgId, planName, customerEmail, orgName }) {
  const plan = PLANS[planName];
  if (!plan?.product_id) throw new Error(`Plan not configured: ${planName}`);
  if (!process.env.DODO_API_KEY) throw new Error('DODO_API_KEY missing');

  const payload = {
    billing: { city: '', country: 'US', state: '', street: '', zipcode: '' },
    customer: { email: customerEmail, name: orgName },
    product_id: plan.product_id,
    quantity: 1,
    payment_link: true,
    return_url: `${process.env.FRONTEND_URL || 'https://layeroi.com'}/dashboard?payment=success&plan=${planName}`,
    metadata: { org_id: orgId, plan: planName, source: 'layeroi_upgrade' },
  };

  const response = await fetch(`${DODO_API_BASE}/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DODO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data;
  try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

  if (!response.ok) {
    logger.error('Dodo API error', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 500),
      productId: plan.product_id,
      planName,
      orgId,
    });
    throw new Error(`Dodo returned ${response.status}: ${responseText.substring(0, 200)}`);
  }

  logger.info('Dodo checkout created', { orgId, planName, subscriptionId: data.subscription_id });

  return {
    subscription_id: data.subscription_id,
    payment_id: data.payment_id,
    customer_id: data.customer?.customer_id,
    checkout_url: data.payment_link,
  };
}

export function verifyWebhookSignature(rawBody, signature, secret = process.env.DODO_WEBHOOK_SECRET) {
  if (!signature || !secret) return false;
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const sigClean = signature.replace(/^sha256=/, '');
    const sigBuffer = Buffer.from(sigClean, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (error) {
    logger.error('Signature verification threw', { error: error.message });
    return false;
  }
}

export async function upgradeOrgPlan(supabase, orgId, planName, { subscriptionId, customerId, periodEnd }) {
  const plan = PLANS[planName];
  if (!plan) throw new Error(`Unknown plan: ${planName}`);

  const updates = {
    plan: planName,
    plan_agent_limit: plan.agent_limit,
    plan_history_days: plan.history_days,
    subscription_status: 'active',
    cancel_at_period_end: false,
    updated_at: new Date().toISOString(),
  };

  if (subscriptionId) updates.dodo_subscription_id = subscriptionId;
  if (customerId) updates.dodo_customer_id = customerId;
  if (periodEnd) updates.current_period_end = periodEnd;

  const { data: existing } = await supabase
    .from('organisations').select('upgraded_at').eq('id', orgId).single();
  if (!existing?.upgraded_at) updates.upgraded_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('organisations').update(updates).eq('id', orgId).select().single();
  if (error) throw error;

  logger.info('Org plan upgraded', { orgId, planName, subscriptionId });
  return data;
}

export async function downgradeOrg(supabase, orgId, reason = 'cancelled') {
  const { error } = await supabase.from('organisations').update({
    plan: 'free', plan_agent_limit: 2, plan_history_days: 14,
    subscription_status: reason, updated_at: new Date().toISOString(),
  }).eq('id', orgId);
  if (error) throw error;
  logger.info('Org downgraded to free', { orgId, reason });
}

export async function markCancelAtPeriodEnd(supabase, orgId) {
  const { error } = await supabase.from('organisations').update({
    cancel_at_period_end: true, subscription_status: 'cancel_pending',
    updated_at: new Date().toISOString(),
  }).eq('id', orgId);
  if (error) throw error;
  logger.info('Org marked cancel at period end', { orgId });
}
