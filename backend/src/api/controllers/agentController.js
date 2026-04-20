import { getAllAgents } from '../../database/queries/index.js';
import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export async function listAllAgents(req, res) {
  try {
    const orgId = req.query.orgId;

    // Get agents from agents table (created manually)
    let registeredAgents = [];
    if (orgId) {
      const { data } = await supabase
        .from('agents')
        .select('id, name, provider, org_id, created_at, updated_at')
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

    res.json({ agents: allAgents });
  } catch (err) {
    logger.error('Get agents failed', err);
    res.status(500).json({ error: err.message });
  }
}
