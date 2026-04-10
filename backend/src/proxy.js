import fetch from 'node-fetch';
import { calculateCost } from './costCalculator.js';
import { logAPICall } from './database.js';

const OPENAI_API_BASE = 'https://api.openai.com';

export const requestLog = [];

export async function forwardToOpenAI(req, res, agentName = 'unknown') {
  const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').trim();

  if (!OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable is not set');
    return res.status(500).json({
      error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.'
    });
  }

  if (!OPENAI_API_KEY.startsWith('sk-')) {
    console.error('ERROR: OPENAI_API_KEY does not look valid (should start with sk-)');
    console.error('Key starts with:', OPENAI_API_KEY.substring(0, 10));
    return res.status(500).json({
      error: 'OpenAI API key is invalid. Please check your credentials.'
    });
  }

  const path = '/v1/chat/completions';
  const url = `${OPENAI_API_BASE}${path}`;

  const requestBody = req.body;
  const timestamp = new Date().toISOString();

  const logEntry = {
    id: Math.random().toString(36).substr(2, 9),
    agentName,
    timestamp,
    path,
    model: requestBody.model || 'unknown',
    tokensEstimate: estimateTokens(requestBody.messages),
  };

  requestLog.push(logEntry);
  console.log(`[${timestamp}] Agent: ${agentName}, Model: ${requestBody.model}`);

  try {
    console.log(`Forwarding request to OpenAI for model: ${requestBody.model}`);
    const openaiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      console.error('OpenAI error:', error);
      return res.status(openaiRes.status).json({ error });
    }

    const responseBody = await openaiRes.json();
    const usage = responseBody.usage || { prompt_tokens: 0, completion_tokens: 0 };

    logEntry.promptTokens = usage.prompt_tokens;
    logEntry.completionTokens = usage.completion_tokens;
    logEntry.totalTokens = usage.total_tokens;
    logEntry.responseTime = new Date() - new Date(timestamp);

    const cost = calculateCost(
      logEntry.model,
      usage.prompt_tokens,
      usage.completion_tokens
    );
    logEntry.cost = cost;

    console.log(`[Response] Tokens: ${usage.total_tokens}, Cost: $${cost.totalCost}`);

    logAPICall(logEntry).catch(err => console.error('DB log error:', err));

    res.json(responseBody);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}

export function estimateTokens(messages) {
  if (!Array.isArray(messages)) return 0;
  let total = 0;
  for (const msg of messages) {
    const text = msg.content || '';
    total += Math.ceil(text.length / 4);
  }
  return total;
}
