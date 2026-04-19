import { generateJSON } from './llmService.js';
import { logger } from '../utils/logger.js';
import { getAgentCosts } from '../database/queries/index.js';
import { supabase } from '../config/database.js';

export async function generateInsights(orgId) {
  try {
    // Get organization's cost data
    const { data: logs, error } = await supabase
      .from('api_logs')
      .select('*')
      .eq('org_id', orgId)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    if (!logs || logs.length === 0) {
      logger.info('No API logs found for insights', { orgId });
      return [];
    }

    // Calculate metrics
    const totalCost = logs.reduce((sum, log) => sum + (log.cost_usd || 0), 0);
    const totalTokens = logs.reduce((sum, log) => sum + (log.total_tokens || 0), 0);
    const averageCostPerCall = totalCost / logs.length;
    const modelBreakdown = {};

    logs.forEach(log => {
      if (!modelBreakdown[log.model]) {
        modelBreakdown[log.model] = { count: 0, cost: 0, tokens: 0 };
      }
      modelBreakdown[log.model].count++;
      modelBreakdown[log.model].cost += log.cost_usd || 0;
      modelBreakdown[log.model].tokens += log.total_tokens || 0;
    });

    // Use Claude to generate insights
    const prompt = `Analyze the following LLM API usage data and provide 3-5 actionable insights and recommendations:

Total API Calls: ${logs.length}
Total Cost: $${totalCost.toFixed(2)}
Total Tokens: ${totalTokens.toLocaleString()}
Average Cost Per Call: $${averageCostPerCall.toFixed(4)}

Model Breakdown:
${Object.entries(modelBreakdown)
  .map(
    ([model, data]) =>
      `- ${model}: ${data.count} calls, $${data.cost.toFixed(2)}, ${data.tokens.toLocaleString()} tokens`
  )
  .join('\n')}

Provide insights in JSON format with this structure:
{
  "insights": [
    {
      "title": "Insight Title",
      "description": "Detailed description",
      "severity": "info|warning|critical",
      "recommendation": "Actionable recommendation"
    }
  ]
}`;

    const result = await generateJSON({
      prompt,
      systemPrompt: 'You are an AI cost analyst. Analyze the data and return structured JSON insights. Be concise. No preamble.',
      schema: { insights: [{ type: 'string', severity: 'string', message: 'string', recommendation: 'string' }] },
    });

    const insightData = result.data || { insights: [] };

    // Store insights in database
    const insights = [];
    for (const insight of insightData.insights) {
      const { data: stored, error: storeError } = await supabase
        .from('ai_insights')
        .insert([
          {
            organisation_id: orgId,
            insight_type: 'usage_analysis',
            title: insight.title,
            description: insight.description,
            severity: insight.severity || 'info',
            recommendation: insight.recommendation,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (!storeError && stored) {
        insights.push(stored[0]);
      }
    }

    logger.info('Insights generated', { orgId, count: insights.length });
    return insights;
  } catch (error) {
    logger.error('Insight generation failed', error, { orgId });
    return [];
  }
}

export async function getOrganizationInsights(orgId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('organisation_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Get insights failed', error);
    return [];
  }
}
