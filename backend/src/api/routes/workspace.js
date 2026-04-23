import express from 'express';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// GET /api/workspace/:orgId/members
router.get('/api/workspace/:orgId/members', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { data: users } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .eq('org_id', orgId);

    res.json({
      success: true,
      data: (users || []).map(u => ({
        user_id: u.id, email: u.email, name: u.name, role: 'owner', joined_at: u.created_at,
      })),
    });
  } catch (err) {
    logger.error('Workspace members error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/workspace/:orgId/invite
router.post('/api/workspace/:orgId/invite', async (req, res) => {
  res.json({ success: true, message: 'Invite sent (feature coming soon)' });
});

// PATCH /api/workspace/:orgId/members/:userId/role
router.patch('/api/workspace/:orgId/members/:userId/role', async (req, res) => {
  res.json({ success: true, message: 'Role updated' });
});

// DELETE /api/workspace/:orgId/members/:userId
router.delete('/api/workspace/:orgId/members/:userId', async (req, res) => {
  res.json({ success: true, message: 'Member removed' });
});

// GET /api/org/:orgId/settings
router.get('/api/org/:orgId/settings', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { data: org } = await supabase
      .from('organisations')
      .select('id, name, plan, plan_agent_limit, billing_email, created_at, dodo_subscription_id')
      .eq('id', orgId)
      .single();

    res.json({
      success: true,
      data: { organisation: org || {}, api_keys: [], webhooks: [] },
    });
  } catch (err) {
    logger.error('Org settings error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/org/:orgId/settings
router.patch('/api/org/:orgId/settings', async (req, res) => {
  try {
    const { orgId } = req.params;
    const updates = req.body;
    const allowed = ['name', 'billing_email'];
    const filtered = {};
    for (const k of allowed) { if (updates[k] !== undefined) filtered[k] = updates[k]; }
    filtered.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('organisations').update(filtered).eq('id', orgId).select().single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    logger.error('Org settings update error', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/costs/summary
router.get('/api/costs/summary', async (req, res) => {
  try {
    const orgId = req.query.orgId;
    if (!orgId) return res.json({ totalSpend: 0, totalValue: 0, netROI: 0, wastefulSpend: 0 });

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const all = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('api_logs')
        .select('cost_usd, value')
        .eq('org_id', orgId)
        .gte('created_at', monthStart.toISOString())
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    const totalSpend = all.reduce((s, r) => s + Number(r.cost_usd || 0), 0);
    const totalValue = all.reduce((s, r) => s + Number(r.value || 0), 0);

    res.json({
      totalSpend: +totalSpend.toFixed(2),
      totalValue: +totalValue.toFixed(2),
      netROI: totalSpend > 0 ? +(totalValue / totalSpend).toFixed(1) : 0,
      wastefulSpend: 0,
    });
  } catch (err) {
    logger.error('Costs summary error', err);
    res.json({ totalSpend: 0, totalValue: 0, netROI: 0, wastefulSpend: 0 });
  }
});

// GET /api/costs/breakdown
router.get('/api/costs/breakdown', async (req, res) => {
  res.json({ success: true, data: { breakdown: [] } });
});

// GET /api/insights/roi
router.get('/api/insights/roi', async (req, res) => {
  res.json({ success: true, data: { roi: 0, agents: [] } });
});

// GET /api/metrics/:metric
router.get('/api/metrics/:metric', async (req, res) => {
  res.json({ success: true, data: { metric: req.params.metric, values: [] } });
});

// GET /api/reports
router.get('/api/reports', async (req, res) => {
  res.json({ success: true, data: [] });
});

export default router;
