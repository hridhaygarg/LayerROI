import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { logger } from './utils/logger.js';
import { CONFIG } from './config/constants.js';
import { initLoopDetector } from './loopDetector.js';
import { initAutomations } from './automations/cron.js';
import { initializeDatabase } from './db/initDb.js';

// Import middleware
import { corsMiddleware, corsOptions, errorHandler, requestLogger, extractAgentName } from './api/middleware/index.js';

// Import routes
import {
  healthRoutes,
  proxyRoutes,
  costsRoutes,
  agentsRoutes,
  statsRoutes,
  managementRoutes,
  automationsRoutes,
  authRoutes,
  outreachRoutes,
  xopsRoutes
} from './api/routes/index.js';
import v2Routes from './api/routes/v2.js';
import docsRoutes from './api/routes/docs.js';
import insightsRoutes from './api/routes/insights.js';
import forecastRoutes from './api/routes/forecasts.js';
import webhookRoutes from './api/routes/webhooks.js';
import paymentsRoutes from './api/routes/payments.js';
import workspaceRoutes from './api/routes/workspace.js';
import reportsRoutes from './api/routes/reports.js';
import sourcesRoutes from './api/routes/sources.js';

dotenv.config();

// Initialize core systems
initLoopDetector();
initAutomations();
initializeDatabase();

const app = express();
const PORT = process.env.PORT;

logger.info('Server initializing', { port: PORT, environment: process.env.NODE_ENV || 'development' });

// ─── 1. CORS FIRST — before everything ───────────────────
app.use(corsMiddleware);
app.options('*', corsOptions);

// ─── 2. Health check (after CORS so it gets headers) ──────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'layeroi API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── 3. Webhook raw body BEFORE json parser ───────────────
app.use('/payments/webhook', express.raw({ type: 'application/json' }));

// ─── 4. Body parsers ─────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);
app.use(extractAgentName);

// ─── 5. Routes ────────────────────────────────────────────
app.use(healthRoutes);
app.use(docsRoutes);
app.use(authRoutes);
app.use(proxyRoutes);
app.use(costsRoutes);
app.use(agentsRoutes);
app.use(statsRoutes);
app.use(managementRoutes);
app.use(automationsRoutes);
app.use(outreachRoutes);
app.use(xopsRoutes);
app.use(v2Routes);
app.use(insightsRoutes);
app.use(forecastRoutes);
app.use(webhookRoutes);
app.use('/payments', paymentsRoutes);
app.use(workspaceRoutes);
app.use(reportsRoutes);
app.use(sourcesRoutes);

// Metrics endpoint
app.get('/api/metrics/weekly', async (req, res) => {
  try {
    const { getMetricsSummary } = await import('./automations/weeklyReport.js');
    const metrics = await getMetricsSummary();
    res.json({ metrics });
  } catch (err) {
    logger.error('Weekly metrics failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Legacy signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, company } = req.body;
    if (!name || !email || !company) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const apiKey = `sk-${Math.random().toString(36).substr(2, 32)}`;
    res.json({ success: true, apiKey, message: 'Account created.' });
    logger.info('New signup (legacy)', { email });
  } catch (err) {
    logger.error('Signup failed', err);
    res.status(500).json({ error: err.message });
  }
});

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received: shutting down gracefully');
  const { stopAutomations } = await import('./automations/cron.js');
  stopAutomations();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info('layeroi backend started', { port: PORT, env: process.env.NODE_ENV });
});

export default app;
