import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { logAPICall } from '../database/queries/index.js';
import { calculateCost } from './costCalculator.js';
import { estimateTokens } from '../utils/tokenEstimator.js';

export async function forwardToAnthropic(req, res, agentName = 'unknown') {
  const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || '').replace(/\s+/g, '');

  if (!ANTHROPIC_API_KEY) {
    logger.error('Anthropic API key not configured', new Error('Missing ANTHROPIC_API_KEY'));
    return res.status(500).json({
      error: 'Anthropic API key not configured. Please set ANTHROPIC_API_KEY environment variable.'
    });
  }

  const timestamp = new Date().toISOString();
  const requestBody = req.body;

  const logEntry = {
    id: Math.random().toString(36).substr(2, 9),
    agentName,
    timestamp,
    path: '/v1/messages',
    model: requestBody.model || 'unknown',
    tokensEstimate: estimateTokens(requestBody.messages),
  };

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: requestBody.model,
      max_tokens: requestBody.max_tokens || 1024,
      messages: requestBody.messages,
      temperature: requestBody.temperature,
    });

    const usage = response.usage || { input_tokens: 0, output_tokens: 0 };

    logEntry.promptTokens = usage.input_tokens;
    logEntry.completionTokens = usage.output_tokens;
    logEntry.totalTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    logEntry.responseTime = Date.now() - new Date(timestamp).getTime();

    const cost = calculateCost(
      logEntry.model,
      usage.input_tokens,
      usage.output_tokens
    );
    logEntry.cost = cost;

    logger.info('Anthropic API call completed', {
      agent: agentName,
      model: requestBody.model,
      tokens: logEntry.totalTokens,
      cost: cost.totalCost
    });

    logAPICall(logEntry).catch(err => logger.error('Database log error', err));

    res.json({
      id: response.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: response.content[0]?.text || ''
          },
          finish_reason: response.stop_reason
        }
      ],
      usage: {
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        total_tokens: logEntry.totalTokens
      }
    });

  } catch (error) {
    logger.error('Anthropic proxy error', error, { agent: agentName });
    res.status(500).json({ error: error.message });
  }
}
