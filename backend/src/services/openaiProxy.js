import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { logAPICall } from '../database/queries/index.js';
import { calculateCost } from './costCalculator.js';
import { estimateTokens } from '../utils/tokenEstimator.js';

export async function forwardToOpenAIAPI(req, res, agentName = 'unknown') {
  const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').replace(/\s+/g, '');

  if (!OPENAI_API_KEY) {
    logger.error('OpenAI API key not configured', new Error('Missing OPENAI_API_KEY'));
    return res.status(500).json({
      error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
    });
  }

  const timestamp = new Date().toISOString();
  const requestBody = req.body;

  const logEntry = {
    id: Math.random().toString(36).substr(2, 9),
    agentName,
    timestamp,
    path: '/v1/chat/completions',
    model: requestBody.model || 'unknown',
    tokensEstimate: estimateTokens(requestBody.messages),
  };

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: requestBody.model,
      messages: requestBody.messages,
      max_tokens: requestBody.max_tokens,
      temperature: requestBody.temperature,
    });

    const usage = response.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    logEntry.promptTokens = usage.prompt_tokens;
    logEntry.completionTokens = usage.completion_tokens;
    logEntry.totalTokens = usage.total_tokens;
    logEntry.responseTime = Date.now() - new Date(timestamp).getTime();

    const cost = calculateCost(
      logEntry.model,
      usage.prompt_tokens,
      usage.completion_tokens
    );
    logEntry.cost = cost;

    logger.info('OpenAI API call completed', {
      agent: agentName,
      model: requestBody.model,
      tokens: usage.total_tokens,
      cost: cost.totalCost
    });

    logAPICall(logEntry).catch(err => logger.error('Database log error', err));

    res.json({
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      choices: response.choices,
      usage: response.usage,
    });

  } catch (error) {
    logger.error('OpenAI proxy error', error, { agent: agentName });
    res.status(500).json({ error: error.message });
  }
}
