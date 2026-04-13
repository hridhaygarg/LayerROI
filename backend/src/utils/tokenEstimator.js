export function estimateTokens(messages) {
  if (!Array.isArray(messages)) return 0;
  let total = 0;
  for (const msg of messages) {
    const text = msg.content || '';
    total += Math.ceil(text.length / 4);
  }
  return total;
}
