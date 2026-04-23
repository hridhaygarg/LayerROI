import { getAllAgents } from '../../database/queries/index.js';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export async function listAllAgents(req, res) {
  try {
    const orgId = req.query.orgId;

    // Get agents from agents table
    let registeredAgents = [];
    if (orgId) {
      const { data } = await supabase
        .from('agents')
        .select('id, name, provider, org_id, seed, created_at, updated_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      registeredAgents = data || [];
    }

    // Get agents from api_logs (auto-discovered from traffic)
    const logAgents = await getAllAgents();

    // Merge: registered agents first, then any log-only agents not already in registered
    const registeredNames = new Set(registeredAgents.map(a => a.name));
    const logOnlyAgents = logAgents
      .filter(name => !registeredNames.has(name))
      .map(name => ({ name, provider: 'unknown', source: 'auto-discovered' }));

    const allAgents = [...registeredAgents, ...logOnlyAgents];

    // If orgId provided, enrich with cost/value/tasks from api_logs
    if (orgId && allAgents.length > 0) {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const all = [];
      const pageSize = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('api_logs')
          .select('agent_id, agent_name, cost_usd, value')
          .eq('org_id', orgId)
          .gte('created_at', monthStart.toISOString())
          .range(from, from + pageSize - 1);
        if (error) break;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      // Aggregate per agent (by id or name)
      const perAgent = {};
      all.forEach(l => {
        const key = l.agent_id || l.agent_name;
        if (!perAgent[key]) perAgent[key] = { cost: 0, value: 0, tasks: 0 };
        perAgent[key].cost += Number(l.cost_usd || 0);
        perAgent[key].value += Number(l.value || 0);
        perAgent[key].tasks += 1;
      });

      // Enrich each agent
      allAgents.forEach(agent => {
        const stats = perAgent[agent.id] || perAgent[agent.name] || { cost: 0, value: 0, tasks: 0 };
        agent.cost = +stats.cost.toFixed(2);
        agent.value = +stats.value.toFixed(2);
        agent.tasks = stats.tasks;
        agent.roi = stats.cost > 0 && stats.value > 0 ? +(stats.value / stats.cost).toFixed(1) : 0;
      });
    }

    res.json({ agents: allAgents });
  } catch (err) {
    logger.error('Get agents failed', err);
    res.status(500).json({ error: err.message });
  }
}
