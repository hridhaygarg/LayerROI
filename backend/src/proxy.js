import OpenAI from 'openai';
import { calculateCost } from './costCalculator.js';
import { logAPICall } from './database.js';

export const requestLog = [];

export async function forwardToOpenAI(req, res, agentName = 'unknown') {
  // Remove all whitespace including newlines
  const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || '').replace(/\s+/g, '');

  if (!OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable is not set');
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

  requestLog.push(logEntry);
  console.log(`[${timestamp}] Agent: ${agentName}, Model: ${requestBody.model}`);

  try {
    console.log(`API Key length: ${OPENAI_API_KEY.length}`);
    console.log(`API Key starts with: ${OPENAI_API_KEY.substring(0, 20)}`);
    console.log(`Initializing OpenAI client...`);

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    console.log(`Forwarding request to OpenAI for model: ${requestBody.model}`);

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

    console.log(`[Response] Tokens: ${usage.total_tokens}, Cost: $${cost.totalCost}`);

    // Log to database asynchronously
    logAPICall(logEntry).catch(err => console.error('DB log error:', err));

    // Return OpenAI response format
    res.json({
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      choices: response.choices,
      usage: response.usage,
    });

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
