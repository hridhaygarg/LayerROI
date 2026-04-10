const PRICING = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
  'gpt-4-vision': { input: 0.01, output: 0.03 },
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
};

export function calculateCost(model, promptTokens, completionTokens) {
  const pricing = PRICING[model] || PRICING['gpt-3.5-turbo'];

  const inputCost = (promptTokens / 1000) * pricing.input;
  const outputCost = (completionTokens / 1000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    model,
    promptTokens,
    completionTokens,
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    totalCost: parseFloat(totalCost.toFixed(6)),
  };
}

export function getCostForRequest(requestLog) {
  if (!requestLog.promptTokens) return null;

  return calculateCost(
    requestLog.model,
    requestLog.promptTokens,
    requestLog.completionTokens
  );
}
