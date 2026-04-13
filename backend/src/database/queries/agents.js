import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export async function getAgentById(agentId) {
  try {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Get agent by ID failed', error, { agentId });
    return null;
  }
}

export async function listAgents(orgId = null) {
  try {
    let query = supabase.from('agents').select('*');

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('List agents failed', error, { orgId });
    return [];
  }
}

export async function createAgent(agentData) {
  try {
    const { data, error } = await supabase
      .from('agents')
      .insert([agentData])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    logger.error('Create agent failed', error);
    return null;
  }
}
