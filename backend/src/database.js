import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase = null;

export function initDatabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase credentials not set. Running in mock mode.');
    return;
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('Database initialized with Supabase');
}

export async function logAPICall(callData) {
  if (!supabase) {
    console.log('[Mock DB] Logging call:', callData.agentName, callData.cost?.totalCost);
    return { success: true, id: callData.id };
  }

  try {
    const { data, error } = await supabase
      .from('api_calls')
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
          response_time_ms: callData.responseTime || 0,
          status: 'success',
        }
      ]);

    if (error) {
      console.error('Database insert error:', error);
      return { success: false, error };
    }

    return { success: true, data };

  } catch (error) {
    console.error('Database error:', error);
    return { success: false, error };
  }
}

export async function getAgentCosts(agentName, days = 30) {
  if (!supabase) {
    return { agent: agentName, totalCost: 0, calls: 0, avgCostPerCall: 0 };
  }

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('api_calls')
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
    console.error('Query error:', error);
    return { agent: agentName, totalCost: 0, calls: 0, avgCostPerCall: 0 };
  }
}

export async function getAllAgents() {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('api_calls')
      .select('agent_name')
      .distinct()
      .order('agent_name');

    if (error) throw error;
    return data.map(row => row.agent_name);

  } catch (error) {
    console.error('Query error:', error);
    return [];
  }
}
