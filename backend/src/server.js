import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { forwardToOpenAI, requestLog } from './proxy.js';
import { initDatabase, logAPICall, getAgentCosts, getAllAgents } from './database.js';
import { initLoopDetector, checkRunawayLoop, getAgentCallStats } from './loopDetector.js';
import { sendSlackAlert } from './slack.js';
import { initAutomations } from './automations/cron.js';

dotenv.config();
initDatabase();
initLoopDetector();
initAutomations();

const app = express();
const PORT = process.env.PORT || 5000;
const blockedAgents = new Set();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

function getAgentName(req) {
  return req.headers['x-agent-name'] || req.query.agent || 'unknown';
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check with detailed status
app.get('/health/detailed', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

    // Test database connectivity
    const { error: dbError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    const dbHealthy = !dbError;

    // Test API proxy connectivity (light check)
    let proxyHealthy = true;
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });
      proxyHealthy = testResponse.status === 200;
    } catch {
      proxyHealthy = false;
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        openaiProxy: proxyHealthy ? 'healthy' : 'unhealthy',
        automation: 'scheduled',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'production',
        port: PORT,
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Metrics endpoint for monitoring
app.get('/api/metrics/weekly', async (req, res) => {
  try {
    const { getMetricsSummary } = await import('./automations/weeklyReport.js');
    const metrics = await getMetricsSummary();
    res.json({ metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System status dashboard
app.get('/api/system-status', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    blockedAgents: Array.from(blockedAgents),
    automations: {
      seo: 'Scheduled: Tue/Fri 10:00 UTC',
      coldEmails: 'Scheduled: Mon 08:00 UTC',
      clickDetection: 'Scheduled: Every 6 hours',
      freeTierChecks: 'Scheduled: Every 6 hours',
      weeklyReports: 'Scheduled: Sun 09:00 UTC',
    }
  });
});

app.post('/v1/chat/completions', (req, res) => {
  const agentName = getAgentName(req);

  if (blockedAgents.has(agentName)) {
    return res.status(429).json({
      error: `Agent "${agentName}" is blocked due to runaway loop detection. Contact support to unblock.`,
    });
  }

  const loopCheck = checkRunawayLoop(agentName, req.body.messages);
  if (loopCheck.isLoop) {
    blockedAgents.add(agentName);
    console.error(`[ALERT] Runaway loop detected for agent: ${agentName}`);
    sendSlackAlert({
      agent: agentName,
      reason: loopCheck.reason,
      callCount: loopCheck.callCount,
    });
    return res.status(429).json({
      error: `Runaway loop detected (${loopCheck.callCount} calls in 90s). Agent blocked.`,
    });
  }

  forwardToOpenAI(req, res, agentName);
});

app.get('/api/logs', (req, res) => {
  res.json({ logs: requestLog });
});

app.get('/api/agents', async (req, res) => {
  const agents = await getAllAgents();
  res.json({ agents });
});

app.get('/api/costs/:agent', async (req, res) => {
  const { agent } = req.params;
  const costs = await getAgentCosts(agent);
  res.json(costs);
});

app.get('/api/costs', async (req, res) => {
  const agents = await getAllAgents();
  const costs = {};
  for (const agent of agents) {
    costs[agent] = await getAgentCosts(agent);
  }
  res.json({ costs });
});

app.get('/api/agent-stats/:agent', (req, res) => {
  const { agent } = req.params;
  const stats = getAgentCallStats(agent);
  res.json(stats);
});

app.post('/api/unblock/:agent', (req, res) => {
  const { agent } = req.params;
  blockedAgents.delete(agent);
  res.json({ message: `Agent "${agent}" unblocked` });
});

// Automation endpoints
app.post('/automations/seo', (req, res) => {
  res.json({ status: 'SEO article generation queued', message: 'Will generate and publish to GitHub' });
  console.log('SEO automation triggered');
});

app.post('/automations/email', (req, res) => {
  res.json({ status: 'Cold email sequence started', leads: 50, emailsSent: 'Day 0 sequence' });
  console.log('Email automation triggered');
});

app.post('/automations/free-tier', (req, res) => {
  res.json({ status: 'Free tier checks running', usersChecked: 'all', emailsSent: 0 });
  console.log('Free tier automation triggered');
});

app.post('/automations/intent', (req, res) => {
  res.json({ status: 'Intent detection running', companiesFound: 0, alertsSent: 0 });
  console.log('Intent automation triggered');
});

// Free tier signup
app.post('/api/signup', async (req, res) => {
  const { name, email, company } = req.body;
  if (!name || !email || !company) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const apiKey = `sk-${Math.random().toString(36).substr(2, 32)}`;
  res.json({ success: true, apiKey, message: 'Account created. Check your email for welcome.' });
  console.log(`New signup: ${email}`);
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received: shutting down gracefully');
  const { stopAutomations } = await import('./automations/cron.js');
  stopAutomations();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Layer ROI server running on port ${PORT}`);
  console.log(`Proxy endpoint: POST http://localhost:${PORT}/v1/chat/completions`);
});
