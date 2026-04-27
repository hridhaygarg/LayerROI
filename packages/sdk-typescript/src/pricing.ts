// Model pricing in USD per 1M tokens
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o':            { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':       { input: 0.15,  output: 0.60 },
  'gpt-4-turbo':       { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo':     { input: 0.50,  output: 1.50 },
  // Anthropic — current generation
  'claude-opus-4-5':          { input: 15.00, output: 75.00 },
  'claude-sonnet-4-5':        { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5':         { input: 1.00,  output: 5.00 },
  // Anthropic — legacy (dated variants matched via normalizeModel prefix)
  'claude-3-5-sonnet':        { input: 3.00,  output: 15.00 },
  'claude-3-5-haiku':         { input: 0.80,  output: 4.00 },
  'claude-3-opus':            { input: 15.00, output: 75.00 },
  'claude-3-haiku':           { input: 0.25,  output: 1.25 },
};

// Normalize model names (handle dated variants like gpt-4o-2024-08-06)
function normalizeModel(model: string): string {
  const lower = model.toLowerCase();
  for (const key of Object.keys(PRICING)) {
    if (lower.startsWith(key)) return key;
  }
  return lower;
}

export function computeCost(model: string, promptTokens: number, completionTokens: number): number {
  const normalized = normalizeModel(model);
  const pricing = PRICING[normalized];
  if (!pricing) return 0;
  const cost = (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
  return Math.round(cost * 1_000_000) / 1_000_000; // 6 decimal places
}

export function getModelProvider(model: string): string {
  const lower = model.toLowerCase();
  if (lower.startsWith('gpt-') || lower.startsWith('o1') || lower.startsWith('o3')) return 'openai';
  if (lower.startsWith('claude')) return 'anthropic';
  if (lower.startsWith('gemini')) return 'google';
  return 'unknown';
}

// Stub — will fetch from layeroi API in week 2
export async function fetchPricing(): Promise<typeof PRICING> {
  return PRICING;
}

export { PRICING };
