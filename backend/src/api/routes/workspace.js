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

// GET /api/orgs/me/sdk-status — SDK installation status for post-signup polling
const sdkStatusCache = new Map();
router.get('/api/orgs/me/sdk-status', async (req, res) => {
  try {
    // Extract orgId from JWT (set by global auth middleware)
    let orgId = req.orgId;
    if (!orgId) {
      try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const { verifyJWT } = await import('../../auth/jwt.js');
          const decoded = verifyJWT(authHeader.replace('Bearer ', ''));
          orgId = decoded?.orgId;
        }
      } catch {}
    }
    if (!orgId) return res.status(401).json({ error: 'Auth required' });

    // 5-second cache per org
    const cached = sdkStatusCache.get(orgId);
    if (cached && Date.now() - cached.ts < 5000) {
      return res.json(cached.data);
    }

    const { data, error } = await supabase.rpc('get_sdk_status_raw', { p_org_id: orgId }).maybeSingle();

    // Fallback if RPC doesn't exist
    let result;
    if (error || !data) {
      const { data: rows } = await supabase
        .from('api_logs')
        .select('created_at')
        .eq('org_id', orgId)
        .not('sdk_record_id', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1);

      const { count } = await supabase
        .from('api_logs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .not('sdk_record_id', 'is', null);

      const { data: last } = await supabase
        .from('api_logs')
        .select('created_at')
        .eq('org_id', orgId)
        .not('sdk_record_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      result = {
        sdkInstalled: (rows && rows.length > 0),
        firstCallAt: rows?.[0]?.created_at || null,
        totalCalls: count || 0,
        lastCallAt: last?.[0]?.created_at || null,
      };
    } else {
      result = data;
    }

    sdkStatusCache.set(orgId, { data: result, ts: Date.now() });
    res.json(result);
  } catch (err) {
    logger.error('SDK status error', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
