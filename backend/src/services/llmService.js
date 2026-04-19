import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger.js';

let groqClient = null;
let geminiClient = null;

function getGroq() {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function getGemini() {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return geminiClient;
}

const rateLimits = {
  groq: { requests: 0, resetAt: Date.now() + 60000 },
  gemini: { requests: 0, resetAt: Date.now() + 60000 },
};

function checkRateLimit(provider, limit) {
  const rl = rateLimits[provider];
  if (Date.now() > rl.resetAt) {
    rl.requests = 0;
    rl.resetAt = Date.now() + 60000;
  }
  if (rl.requests >= limit) return false;
  rl.requests++;
  return true;
}

export async function generateText({
  prompt,
  systemPrompt = '',
  maxTokens = 1000,
  temperature = 0.7,
  preferredProvider = 'groq',
}) {
  const providers = preferredProvider === 'groq'
    ? ['groq', 'gemini']
    : ['gemini', 'groq'];

  let lastError = null;

  for (const provider of providers) {
    try {
      if (provider === 'groq') {
        if (!checkRateLimit('groq', 25)) {
          logger.warn('Groq rate limit reached, trying next');
          continue;
        }
        return await callGroq({ prompt, systemPrompt, maxTokens, temperature });
      }
      if (provider === 'gemini') {
        if (!checkRateLimit('gemini', 12)) {
          logger.warn('Gemini rate limit reached');
          continue;
        }
        return await callGemini({ prompt, systemPrompt, maxTokens, temperature });
      }
    } catch (error) {
      lastError = error;
      logger.warn(`${provider} failed, trying next`, { error: error.message });
    }
  }

  throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
}

async function callGroq({ prompt, systemPrompt, maxTokens, temperature }) {
  const groq = getGroq();
  if (!groq) throw new Error('GROQ_API_KEY not configured');

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: maxTokens,
    temperature,
  });

  return {
    text: completion.choices[0].message.content,
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    tokens: completion.usage?.total_tokens || 0,
  };
}

async function callGemini({ prompt, systemPrompt, maxTokens, temperature }) {
  const gemini = getGemini();
  if (!gemini) throw new Error('GEMINI_API_KEY not configured');

  const model = gemini.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction: systemPrompt || undefined,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return {
    text,
    provider: 'gemini',
    model: 'gemini-2.0-flash-lite',
    tokens: result.response.usageMetadata?.totalTokenCount || 0,
  };
}

export async function generateJSON({ prompt, systemPrompt = '', schema = null }) {
  const result = await generateText({
    prompt: schema
      ? `${prompt}\n\nReturn ONLY valid JSON matching this shape (no markdown, no explanation):\n${JSON.stringify(schema, null, 2)}`
      : `${prompt}\n\nReturn ONLY valid JSON. No markdown. No explanation.`,
    systemPrompt: (systemPrompt || '') + '\nBe concise. No preamble. No meta-commentary. Just the output.',
    maxTokens: 2000,
    temperature: 0.4,
  });

  try {
    const cleaned = result.text.replace(/```json\n?|```\n?/g, '').trim();
    return { ...result, data: JSON.parse(cleaned) };
  } catch (error) {
    logger.error('JSON parse failed', { text: result.text.substring(0, 200) });
    throw new Error('Failed to parse JSON from LLM response');
  }
}

export async function generateShortContent({ prompt, systemPrompt = '', maxLength = 280 }) {
  const result = await generateText({
    prompt,
    systemPrompt: (systemPrompt || '') + `\n\nMUST be under ${maxLength} characters. Count carefully. Be concise. No preamble. No meta-commentary. Just the output.`,
    maxTokens: 300,
    temperature: 0.85,
  });

  if (result.text.length > maxLength) {
    return { ...result, text: result.text.substring(0, maxLength - 3) + '...' };
  }
  return result;
}

export async function generateLongContent({ prompt, systemPrompt = '', targetWords = 1500 }) {
  return generateText({
    prompt: `${prompt}\n\nTarget length: approximately ${targetWords} words.`,
    systemPrompt: (systemPrompt || '') + '\nBe concise. No preamble. No meta-commentary. Just the output.',
    maxTokens: 4000,
    temperature: 0.7,
  });
}

export async function healthCheck() {
  const status = { groq: false, gemini: false };

  if (process.env.GROQ_API_KEY) {
    try {
      const groq = getGroq();
      const test = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      });
      status.groq = !!test.choices[0];
    } catch (e) {
      status.groq = false;
    }
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const gemini = getGemini();
      const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent('ping');
      status.gemini = !!result.response.text();
    } catch (e) {
      status.gemini = false;
    }
  }

  return status;
}
