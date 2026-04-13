import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { CONFIG } from './config/constants.js';
import { initLoopDetector } from './loopDetector.js';
import { initAutomations } from './automations/cron.js';

// Import middleware
import { corsMiddleware, errorHandler, requestLogger, extractAgentName } from './api/middleware/index.js';

// Import routes
import {
  healthRoutes,
  proxyRoutes,
  costsRoutes,
  agentsRoutes,
  statsRoutes,
  managementRoutes,
  automationsRoutes,
  authRoutes
} from './api/routes/index.js';
import v2Routes from './api/routes/v2.js';
import docsRoutes from './api/routes/docs.js';
import insightsRoutes from './api/routes/insights.js';
import forecastRoutes from './api/routes/forecasts.js';
import webhookRoutes from './api/routes/webhooks.js';

dotenv.config();

// Initialize core systems
initLoopDetector();
initAutomations();

const app = express();
const PORT = CONFIG.PORT;

logger.info('Server initializing', { port: PORT, environment: CONFIG.NODE_ENV });

// Middleware
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestLogger);
app.use(extractAgentName);

// Routes
app.use(healthRoutes);
app.use(docsRoutes);
app.use(authRoutes);
app.use(proxyRoutes);
app.use(costsRoutes);
app.use(agentsRoutes);
app.use(statsRoutes);
app.use(managementRoutes);
app.use(automationsRoutes);
app.use(v2Routes);
app.use(insightsRoutes);
app.use(forecastRoutes);
app.use(webhookRoutes);

// Metrics endpoint for monitoring
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

// Signup endpoint (temporary - to be replaced in Section 5)
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, company } = req.body;
    if (!name || !email || !company) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const apiKey = `sk-${Math.random().toString(36).substr(2, 32)}`;
    res.json({ success: true, apiKey, message: 'Account created. Check your email for welcome.' });
    logger.info('New signup', { email });
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
  logger.info('Layer ROI backend is LIVE', { port: PORT, environment: CONFIG.NODE_ENV });
});

export default app;
