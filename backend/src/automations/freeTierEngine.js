import { Resend } from 'resend';
import { logUser, getUserAgentCount, getUserSpend, getTopAgent } from './database.js';

const RESEND_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

export async function createFreeUser(name, email, company) {
  const apiKey = `sk-${Math.random().toString(36).substr(2, 32)}`;

  const user = await logUser({
    name,
    email,
    company,
    apiKey,
    plan: 'free',
    agentLimit: 2,
    historyDays: 14,
    createdAt: new Date(),
  });

  // Send welcome email
  await resend.emails.send({
    from: 'layeroi <hello@layeroi.com>',
    to: email,
    subject: 'Welcome to layeroi – Your API Key Inside',
    html: `
      <h1>Welcome to layeroi, ${name}!</h1>
      <p>Your API key is ready. Update one line of code in your agent:</p>
      <pre>baseURL: 'https://api.layeroi.com'</pre>
      <p>Your API key: <code>${apiKey}</code></p>
      <p>You have 2 agents and 14 days of history on the free plan. <a href="https://layeroi.com">See your dashboard</a></p>
    `,
  });

  return user;
}

export async function checkFreeTierUpgradeTriggers() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  // Get all free tier users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('plan', 'free');

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  for (const user of users) {
    const daysSinceSignup = Math.floor(
      (new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)
    );

    // Day 3: Show first costs (they've had time to connect agents)
    if (daysSinceSignup === 3) {
      await sendDay3Email(user);
    }

    // Day 7: Show value with real data
    if (daysSinceSignup === 7) {
      await sendDay7Email(user);
    }

    // Day 14: Soft upgrade pitch (trial is halfway done)
    if (daysSinceSignup === 14) {
      await sendDay14Email(user);
    }

    // Day 30: Trial ending - final push
    if (daysSinceSignup === 30) {
      await sendDay30Email(user);
    }
  }
}

// Day 3: Onboarding complete, show them their first data
export async function sendDay3Email(user) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data: costs } = await supabase
    .from('api_calls')
    .select('cost_usd')
    .eq('user_id', user.id);

  const totalSpend = costs?.reduce((sum, call) => sum + call.cost_usd, 0) || 0;

  await resend.emails.send({
    from: 'layeroi <hello@layeroi.com>',
    to: user.email,
    subject: `Your AI agents are costing $${totalSpend.toFixed(2)} already`,
    html: `
      <p>Hi ${user.name},</p>
      <p>We've been tracking your AI agent spending for 3 days. Here's what we've found:</p>
      <p><strong>Total spend: $${totalSpend.toFixed(2)}</strong></p>
      <p>The good news? You now have full visibility into every agent's cost and ROI. Log in to your <a href="https://app.layeroi.com">dashboard</a> to see the breakdown.</p>
      <p>Most teams are surprised when they see agent-level profitability data for the first time.</p>
    `,
  });
}

// Day 7: They've seen the value, show upgrade benefits
export async function sendDay7Email(user) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data: agents } = await supabase
    .from('api_calls')
    .select('agent_name', { count: 'exact' })
    .eq('user_id', user.id)
    .distinct();

  const agentCount = agents?.length || 0;

  await resend.emails.send({
    from: 'layeroi <hello@layeroi.com>',
    to: user.email,
    subject: `You're tracking ${agentCount} agents – free tier only supports 2`,
    html: `
      <p>Hi ${user.name},</p>
      <p>You've connected ${agentCount} agents to layeroi this week. That's great engagement!</p>
      <p>Here's the thing: the free plan is limited to 2 agents and 14 days of history. If you want full monitoring of all your agents and historical data:</p>
      <ul>
        <li><strong>Unlimited agents</strong> — track as many as you run</li>
        <li><strong>Full history</strong> — 90+ days of spending data</li>
        <li><strong>Smart alerts</strong> — get notified when agents drift from ROI targets</li>
      </ul>
      <p><a href="https://app.layeroi.com/upgrade">Try Premium for free</a> (no credit card needed) and see the full power of agent ROI tracking.</p>
    `,
  });
}

// Day 14: Halfway through trial, final pitch before days run out
export async function sendDay14Email(user) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data: costs } = await supabase
    .from('api_calls')
    .select('cost_usd')
    .eq('user_id', user.id);

  const totalSpend = costs?.reduce((sum, call) => sum + call.cost_usd, 0) || 0;

  await resend.emails.send({
    from: 'layeroi <hello@layeroi.com>',
    to: user.email,
    subject: `Your 14-day free trial is halfway done — $${totalSpend.toFixed(2)} in AI spend tracked`,
    html: `
      <p>Hi ${user.name},</p>
      <p>You've been using layeroi for 2 weeks now. You've tracked <strong>$${totalSpend.toFixed(2)}</strong> in AI agent costs.</p>
      <p>Without this visibility, how would you even know which agents are profitable?</p>
      <p>Your free trial ends in 2 weeks. After that, you'll lose access to your 14 days of history. Upgrade now to keep it:</p>
      <ul>
        <li>Keep all your historical data</li>
        <li>Track unlimited agents</li>
        <li>Get access to forecasting and insights</li>
      </ul>
      <p><a href="https://app.layeroi.com/upgrade">Upgrade to Premium</a> — designed for teams serious about AI ROI.</p>
    `,
  });
}

// Day 30: Trial ending - final offer
export async function sendDay30Email(user) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { data: costs } = await supabase
    .from('api_calls')
    .select('cost_usd')
    .eq('user_id', user.id);

  const totalSpend = costs?.reduce((sum, call) => sum + call.cost_usd, 0) || 0;

  await resend.emails.send({
    from: 'layeroi <hello@layeroi.com>',
    to: user.email,
    subject: `Your free trial ends today — last chance to upgrade`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Your 30-day free trial ends today. After today, you'll lose access to:</p>
      <ul>
        <li>All 30 days of your spending history ($${totalSpend.toFixed(2)} in data)</li>
        <li>Agent-level ROI tracking</li>
        <li>Dashboard access</li>
      </ul>
      <p><strong>Don't lose this data.</strong> Upgrade now to keep your full history and unlock:</p>
      <ul>
        <li>Unlimited historical data (90+ days)</li>
        <li>Unlimited agents</li>
        <li>ROI forecasting</li>
        <li>Team access</li>
      </ul>
      <p><a href="https://app.layeroi.com/upgrade?utm_source=trial&utm_campaign=expiring">Upgrade now</a> (your data will be preserved)</p>
      <p>Questions? <a href="https://layeroi.com/contact">Chat with us</a> — we can help find the right plan for your team.</p>
    `,
  });
}
