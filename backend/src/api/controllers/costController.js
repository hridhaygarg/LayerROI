import { getAgentCosts, getAllAgents } from '../../database/queries/index.js';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export async function getAgentCostsSummary(req, res) {
  try {
    const { agent } = req.params;
    const costs = await getAgentCosts(agent);
    res.json(costs);
  } catch (err) {
    logger.error('Get costs failed', err);
    res.status(500).json({ error: err.message });
  }
}

export async function getAllCosts(req, res) {
  try {
    const orgId = req.query.orgId;
    if (!orgId) {
      // Fallback to legacy behavior
      const agents = await getAllAgents();
      const costs = {};
      for (const agent of agents) {
        costs[agent] = await getAgentCosts(agent);
      }
      return res.json({ costs });
    }

    // Aggregate from api_logs for this org (same approach as Reports)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const all = [];
    const pageSize = 1000;
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('api_logs')
        .select('agent_name, cost_usd, value')
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
    const valueGenerated = all.reduce((s, r) => s + Number(r.value || 0), 0);
    const roiMultiple = totalSpend > 0 ? +(valueGenerated / totalSpend).toFixed(1) : 0;
    const wastefulSpend = 0; // Simplified — would need per-agent calc

    res.json({
      totalSpend: +totalSpend.toFixed(2),
      valueGenerated: +valueGenerated.toFixed(2),
      roiMultiple,
      wastefulSpend,
    });
  } catch (err) {
    logger.error('Get all costs failed', err);
    res.status(500).json({ error: err.message });
  }
}
