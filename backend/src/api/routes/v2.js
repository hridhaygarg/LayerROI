import express from 'express';
import { logger } from '../../utils/logger.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getAllAgents, getAgentCosts } from '../../database/queries/index.js';

const router = express.Router();
router.use(authMiddleware);

// API v2 - RESTful endpoints with standardized responses
const apiResponse = (success, data = null, error = null, status = 200) => ({
  status: success ? 'success' : 'error',
  data,
  error,
  timestamp: new Date().toISOString(),
});

// Agents endpoints
router.get('/v2/agents', async (req, res) => {
  try {
    const agents = await getAllAgents();
    res.json(apiResponse(true, { agents, count: agents.length }));
  } catch (err) {
    logger.error('Get agents failed', err);
    res.status(500).json(apiResponse(false, null, err.message, 500));
  }
});

// Costs endpoints
router.get('/v2/costs', async (req, res) => {
  try {
    const agents = await getAllAgents();
    const costs = {};
    for (const agent of agents) {
      costs[agent] = await getAgentCosts(agent);
    }
    res.json(apiResponse(true, { costs }));
  } catch (err) {
    logger.error('Get costs failed', err);
    res.status(500).json(apiResponse(false, null, err.message, 500));
  }
});

router.get('/v2/costs/:agent', async (req, res) => {
  try {
    const costs = await getAgentCosts(req.params.agent);
    res.json(apiResponse(true, costs));
  } catch (err) {
    logger.error('Get agent costs failed', err);
    res.status(500).json(apiResponse(false, null, err.message, 500));
  }
});

// Usage statistics
router.get('/v2/usage', async (req, res) => {
  try {
    const agents = await getAllAgents();
    const usage = {
      totalAgents: agents.length,
      agentsList: agents,
      period: 'last-30-days',
    };
    res.json(apiResponse(true, usage));
  } catch (err) {
    logger.error('Get usage failed', err);
    res.status(500).json(apiResponse(false, null, err.message, 500));
  }
});

// OpenAPI spec endpoint
router.get('/v2/openapi.json', (req, res) => {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'Layer ROI API v2',
      description: 'Enterprise LLM cost management and insights',
      version: '2.0.0',
      contact: { email: 'support@layeroi.com' },
    },
    servers: [{ url: `${process.env.API_BASE_URL}/v2`, description: 'Production' }],
    paths: {
      '/agents': {
        get: {
          summary: 'List all agents',
          security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
          responses: {
            200: { description: 'List of agents' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/costs': {
        get: {
          summary: 'Get costs for all agents',
          security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
          responses: {
            200: { description: 'Cost breakdown' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/costs/{agent}': {
        get: {
          summary: 'Get costs for specific agent',
          parameters: [{ name: 'agent', in: 'path', required: true, schema: { type: 'string' } }],
          security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
          responses: {
            200: { description: 'Agent costs' },
            401: { description: 'Unauthorized' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
      },
    },
  };
  res.json(spec);
});

export default router;
