#!/usr/bin/env node
/**
 * Anthropic SDK integration smoke test.
 * Uses a mock Anthropic client — no real API calls, no keys needed.
 *
 * Usage: node tests/anthropic-smoke.js
 */

import { randomUUID } from 'node:crypto';

// Import from built dist
const { layeroi, computeCost, getModelProvider, PRICING } = await import('../dist/index.mjs');

// ── Mock Anthropic client ────────────────────────────
class MockAnthropic {
  constructor() {
    // Anthropic SDK sets these
    this._options = { baseURL: 'https://api.anthropic.com' };
  }

  messages = {
    create: async (params) => {
      // Simulate ~200ms latency
      await new Promise(r => setTimeout(r, 50));
      return {
        id: `msg_${randomUUID().slice(0, 8)}`,
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: 'Hello! How can I help you today?' }],
        model: params.model,
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 42,
          output_tokens: 18,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      };
    },
  };
}

// ── Capture transport pushes ─────────────────────────
let capturedRecords = [];
const origInit = layeroi.init.bind(layeroi);

// Init with a fake key — we'll intercept the transport
layeroi.init({
  apiKey: 'sk-test-fake',
  endpoint: 'https://httpbin.org', // Won't actually flush in time
  debug: false,
});

// Monkey-patch the transport to capture records
const transport = layeroi['transport'];
const origPush = transport.push.bind(transport);
transport.push = (record) => {
  capturedRecords.push(record);
  // Don't actually push to network for this test
};

// ── Tests ────────────────────────────────────────────
console.log('╔════════════════════════════════════════════╗');
console.log('║   Anthropic SDK Integration Smoke Test     ║');
console.log('╚════════════════════════════════════════════╝\n');

// Test 1: Provider detection
console.log('[1/6] Provider detection...');
const mockClient = new MockAnthropic();
const { isAnthropicClient } = await import('../dist/index.mjs').then(async () => {
  // isAnthropicClient isn't exported from index — test it via wrap behavior
  return { isAnthropicClient: null };
});

// Test 2: Wrap doesn't throw
console.log('[2/6] Wrapping Anthropic client...');
const anthropic = layeroi.wrap(mockClient, { agent: 'test-anthropic-agent' });
console.log('       ✓ wrap() returned without error');

// Test 3: Wrapped client still works
console.log('[3/6] Calling messages.create()...');
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello' }],
});

if (response.type !== 'message' || !response.content[0].text) {
  console.error('  FAIL: Response shape wrong:', response);
  process.exit(1);
}
console.log('       ✓ Response shape intact:', { type: response.type, model: response.model });

// Test 4: Record was captured
console.log('[4/6] Verifying captured record...');
if (capturedRecords.length !== 1) {
  console.error(`  FAIL: Expected 1 record, got ${capturedRecords.length}`);
  process.exit(1);
}
const record = capturedRecords[0];
console.log('       Record:', {
  provider: record.provider,
  model: record.model,
  prompt_tokens: record.prompt_tokens,
  completion_tokens: record.completion_tokens,
  cost_usd: record.cost_usd,
  status: record.status,
  agent: record.agent,
});

if (record.provider !== 'anthropic') {
  console.error(`  FAIL: Expected provider 'anthropic', got '${record.provider}'`);
  process.exit(1);
}
if (record.prompt_tokens !== 42 || record.completion_tokens !== 18) {
  console.error(`  FAIL: Token counts wrong: ${record.prompt_tokens}/${record.completion_tokens}`);
  process.exit(1);
}
if (record.agent !== 'test-anthropic-agent') {
  console.error(`  FAIL: Agent name wrong: ${record.agent}`);
  process.exit(1);
}
console.log('       ✓ Record correct');

// Test 5: Cost calculation
console.log('[5/6] Verifying cost calculation...');
const expectedCost = computeCost('claude-sonnet-4-5', 42, 18);
if (Math.abs(record.cost_usd - expectedCost) > 0.000001) {
  console.error(`  FAIL: Cost mismatch. Record: ${record.cost_usd}, expected: ${expectedCost}`);
  process.exit(1);
}
console.log(`       ✓ Cost matches: $${expectedCost} (42 input + 18 output @ claude-sonnet-4-5 rates)`);

// Test 6: Pricing table has all Anthropic models
console.log('[6/6] Verifying Anthropic pricing entries...');
const anthropicModels = ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus', 'claude-3-haiku'];
for (const m of anthropicModels) {
  if (!PRICING[m]) {
    console.error(`  FAIL: Missing pricing for ${m}`);
    process.exit(1);
  }
}
console.log(`       ✓ All ${anthropicModels.length} Anthropic models in pricing table`);

// Test: getModelProvider
if (getModelProvider('claude-sonnet-4-5') !== 'anthropic') {
  console.error('  FAIL: getModelProvider does not return anthropic');
  process.exit(1);
}
console.log('       ✓ getModelProvider("claude-sonnet-4-5") → "anthropic"');

// Test: task context propagation
console.log('\n[Bonus] Task context with Anthropic...');
capturedRecords = [];
await layeroi.task('ticket-789', { customer: 'acme' }, async () => {
  await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 256,
    messages: [{ role: 'user', content: 'Quick question' }],
  });
});
if (capturedRecords[0]?.task_id !== 'ticket-789') {
  console.error(`  FAIL: task_id not propagated: ${capturedRecords[0]?.task_id}`);
  process.exit(1);
}
console.log('       ✓ task_id "ticket-789" propagated to record');

console.log('\n╔════════════════════════════════════════════╗');
console.log('║         ANTHROPIC SMOKE TEST: PASS          ║');
console.log('╚════════════════════════════════════════════╝');
