import { supabase } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export async function logAPICall(callData) {
  try {
    const { data, error } = await supabase
      .from('api_logs')
      .insert([
        {
          request_id: callData.id,
          agent_name: callData.agentName,
          timestamp: callData.timestamp,
          model: callData.model,
          prompt_tokens: callData.promptTokens,
          completion_tokens: callData.completionTokens,
          total_tokens: callData.totalTokens,
          cost_usd: callData.cost?.totalCost || 0,
          latency_ms: callData.responseTime || 0,
          status: 'success',
        }
      ]);

    if (error) {
      logger.error('Database insert error', error, { agent: callData.agentName });
      return { success: false, error };
    }

    return { success: true, data };

  } catch (error) {
    logger.error('Database log error', error, { agent: callData.agentName });
    return { success: false, error };
  }
}

export async function getAgentCosts(agentName, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('api_logs')
      .select('cost_usd')
      .eq('agent_name', agentName)
      .gte('timestamp', startDate.toISOString());

    if (error) throw error;

    const totalCost = data.reduce((sum, row) => sum + (row.cost_usd || 0), 0);
    const calls = data.length;

    return {
      agent: agentName,
      totalCost: parseFloat(totalCost.toFixed(2)),
      calls,
      avgCostPerCall: calls > 0 ? parseFloat((totalCost / calls).toFixed(6)) : 0,
    };

  } catch (error) {
    logger.error('Query agents costs failed', error, { agent: agentName });
    return { agent: agentName, totalCost: 0, calls: 0, avgCostPerCall: 0 };
  }
}

export async function getAllAgents() {
  try {
    const { data, error } = await supabase
      .from('api_logs')
      .select('agent_name')
      .distinct()
      .order('agent_name');

    if (error) throw error;
    return data.map(row => row.agent_name);

  } catch (error) {
    logger.error('Query all agents failed', error);
    return [];
  }
}
