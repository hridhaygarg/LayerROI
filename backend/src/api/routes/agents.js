import express from 'express';
import { listAllAgents } from '../controllers/index.js';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

router.get('/api/agents', listAllAgents);

// POST /api/agents — create a new agent
router.post('/api/agents', async (req, res) => {
  try {
    const { name, provider, orgId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Agent name is required' });
    }

    // Get orgId from body, JWT, or query
    let org = orgId;
    if (!org) {
      try {
        const { verifyJWT } = await import('../../auth/jwt.js');
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (token) {
          const decoded = verifyJWT(token);
          org = decoded?.orgId;
        }
      } catch (e) {}
    }

    if (!org) {
      return res.status(400).json({ success: false, error: 'Organization ID required' });
    }

    const { data, error } = await supabase
      .from('agents')
      .insert({ name: name.trim(), provider: provider || 'openai', org_id: org })
      .select()
      .single();

    if (error) {
      logger.error('Agent creation failed', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    logger.info('Agent created', { agentId: data.id, orgId: org, name: name.trim() });
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Agent creation error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/budget — org budget and spend
router.get('/api/budget', async (req, res) => {
  try {
    const orgId = req.query.orgId;
    if (!orgId) return res.status(400).json({ success: false, error: 'orgId required' });

    const { data: org } = await supabase
      .from('organisations')
      .select('plan, plan_agent_limit')
      .eq('id', orgId)
      .single();

    const { data: agents } = await supabase
      .from('agents')
      .select('id')
      .eq('org_id', orgId);

    const budget = org?.plan === 'enterprise' ? 50000 : org?.plan === 'business' ? 5000 : org?.plan === 'starter' ? 500 : 0;

    res.json({
      success: true,
      data: {
        budget_monthly: budget,
        spend_this_month: 0,
        spend_percentage: 0,
        agents_used: agents?.length || 0,
        agents_limit: org?.plan_agent_limit || 2,
        plan: org?.plan || 'free',
      },
    });
  } catch (err) {
    logger.error('Budget fetch error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/overview — team, keys, webhooks
router.get('/api/admin/overview', async (req, res) => {
  try {
    const orgId = req.query.orgId;
    if (!orgId) return res.status(400).json({ success: false, error: 'orgId required' });

    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('org_id', orgId);

    res.json({
      success: true,
      data: {
        members: (users || []).map(u => ({ ...u, role: 'owner' })),
        api_keys: [],
        webhooks: [],
      },
    });
  } catch (err) {
    logger.error('Admin overview error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
