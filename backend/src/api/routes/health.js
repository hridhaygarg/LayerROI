import express from 'express';
import { checkDatabaseHealth } from '../../config/database.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Layer ROI API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

router.get('/health/detailed', async (req, res) => {
  try {
    const dbHealthy = await checkDatabaseHealth();

    let proxyHealthy = true;
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(5000)
      });
      proxyHealthy = testResponse.status === 200;
    } catch {
      proxyHealthy = false;
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      checks: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        openaiProxy: proxyHealthy ? 'healthy' : 'unhealthy',
        automations: 'scheduled',
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT,
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

export default router;
