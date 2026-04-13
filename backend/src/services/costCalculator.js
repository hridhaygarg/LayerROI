import { CONFIG, DEFAULT_MODEL_PRICE } from '../config/constants.js';

export function calculateCost(modelName, inputTokens, outputTokens) {
  const model = modelName || 'gpt-4o';
  const pricing = CONFIG.LLM_PRICING[model] || DEFAULT_MODEL_PRICE;

  // Pricing is per million tokens
  const inputCost = (inputTokens / 1_000_000) * (pricing.input || 0);
  const outputCost = (outputTokens / 1_000_000) * (pricing.output || 0);

  return {
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    totalCost: parseFloat((inputCost + outputCost).toFixed(6)),
  };
}
