import express from 'express';
import { checkDatabaseHealth } from '../../config/database.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'layeroi API',
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

router.get('/health/llm', async (req, res) => {
  try {
    const { healthCheck: llmHealthCheck } = await import('../../services/llmService.js');
    const status = await llmHealthCheck();
    res.json({
      success: true,
      providers: status,
      ready: status.groq || status.gemini,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/health/payments', (req, res) => {
  res.json({
    success: true,
    config: {
      dodo_api_key_set: !!process.env.DODO_API_KEY,
      dodo_webhook_secret_set: !!process.env.DODO_WEBHOOK_SECRET,
      starter_product_id_set: !!process.env.DODO_PRODUCT_STARTER,
      business_product_id_set: !!process.env.DODO_PRODUCT_BUSINESS,
      enterprise_product_id_set: !!process.env.DODO_PRODUCT_ENTERPRISE,
      starter_product_id_prefix: process.env.DODO_PRODUCT_STARTER?.substring(0, 8) || null,
      business_product_id_prefix: process.env.DODO_PRODUCT_BUSINESS?.substring(0, 8) || null,
      enterprise_product_id_prefix: process.env.DODO_PRODUCT_ENTERPRISE?.substring(0, 8) || null,
      resend_key_set: !!process.env.RESEND_API_KEY,
      frontend_url: process.env.FRONTEND_URL || 'https://layeroi.com',
    },
  });
});

export default router;
