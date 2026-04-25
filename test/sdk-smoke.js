#!/usr/bin/env node
/**
 * SDK Smoke Test — verifies end-to-end flow against production
 *
 * Usage: node test/sdk-smoke.js
 *
 * Requirements:
 * - Production backend deployed with /v1/log endpoint
 * - LAYEROI_API_KEY env var set (or uses hardcoded test key)
 * - Supabase access for verification queries
 */

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// ── Config ──────────────────────────────────────────────────
const API_ENDPOINT = 'https://api.layeroi.com';
const API_KEY = process.env.LAYEROI_API_KEY || 'sk-layeroi-cc66e63c4234c06a0c3c389ca25c4ead';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oryionopjhbxjmrucxby.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;

const SMOKE_SDK_VERSION = `smoke-${Date.now()}`;
const EXPECTED_RECORDS = 50;
const ORG_ID = '85d68d55-513f-42aa-b5a1-c2cbfb18e1f2'; // Hridhay's org

// ── Pricing (must match SDK pricing.ts) ─────────────────────
const PRICING = {
  'gpt-4o':        { input: 2.50,  output: 10.00 },
  'gpt-4o-mini':   { input: 0.15,  output: 0.60 },
};

function computeCost(model, promptTokens, completionTokens) {
  const p = PRICING[model];
  if (!p) return 0;
  return Math.round((promptTokens * p.input + completionTokens * p.output) / 1_000_000 * 1_000_000) / 1_000_000;
}

// ── Generate 50 fake records ────────────────────────────────
function generateRecords() {
  const records = [];
  const models = ['gpt-4o', 'gpt-4o-mini'];
  const agents = ['smoke-agent-a', 'smoke-agent-b'];

  for (let i = 0; i < EXPECTED_RECORDS; i++) {
    const model = models[i % 2];
    const agent = agents[i % 2];
    const promptTokens = 100 + Math.floor(Math.random() * 400);
    const completionTokens = 50 + Math.floor(Math.random() * 200);
    const taskGroup = Math.floor(i / 5); // 10 tasks of 5 records each

    records.push({
      sdk_record_id: randomUUID(),
      agent,
      task_id: `smoke-task-${taskGroup}`,
      model,
      provider: 'openai',
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      cost_usd: computeCost(model, promptTokens, completionTokens),
      latency_ms: 100 + Math.floor(Math.random() * 500),
      status: 'success',
      metadata: { smoke_test: true, batch: i },
      sdk_version: SMOKE_SDK_VERSION,
      timestamp: new Date().toISOString(),
    });
  }
  return records;
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   layeroi-sdk Smoke Test (Production)    ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Step 1: Send records via /v1/log
  const records = generateRecords();
  console.log(`[1/4] Sending ${records.length} records to ${API_ENDPOINT}/v1/log ...`);

  // Send in 2 batches of 25 to test batching
  for (let i = 0; i < records.length; i += 25) {
    const batch = records.slice(i, i + 25);
    const res = await fetch(`${API_ENDPOINT}/v1/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Layeroi-Key': API_KEY,
      },
      body: JSON.stringify({ records: batch }),
    });

    const body = await res.json();
    console.log(`       Batch ${i / 25 + 1}: HTTP ${res.status} → accepted: ${body.accepted}`);

    if (res.status !== 200) {
      console.error('  FAIL: Non-200 response', body);
      process.exit(1);
    }
    if (body.accepted !== batch.length) {
      console.error(`  FAIL: Expected ${batch.length} accepted, got ${body.accepted}`);
      process.exit(1);
    }
  }
  console.log('       ✓ All records accepted\n');

  // Step 2: Test idempotency — resend first batch, should dedupe
  console.log('[2/4] Testing idempotency (resending first 25 records) ...');
  const dupRes = await fetch(`${API_ENDPOINT}/v1/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Layeroi-Key': API_KEY,
    },
    body: JSON.stringify({ records: records.slice(0, 25) }),
  });
  const dupBody = await dupRes.json();
  console.log(`       HTTP ${dupRes.status} → accepted: ${dupBody.accepted} (dupes silently ignored)`);
  console.log('       ✓ Idempotency OK\n');

  // Step 3: Test auth rejection
  console.log('[3/4] Testing auth rejection with bad key ...');
  const badRes = await fetch(`${API_ENDPOINT}/v1/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Layeroi-Key': 'sk-invalid-key',
    },
    body: JSON.stringify({ records: [records[0]] }),
  });
  if (badRes.status !== 401) {
    console.error(`  FAIL: Expected 401, got ${badRes.status}`);
    process.exit(1);
  }
  console.log('       ✓ Bad key correctly rejected with 401\n');

  // Step 4: Verify records in database
  console.log('[4/4] Verifying records in Supabase ...');
  if (!SUPABASE_KEY) {
    console.log('       ⚠ SUPABASE_KEY not set — skipping DB verification');
    console.log('       Run with SUPABASE_KEY=<service-role-key> to verify DB records\n');
  } else {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from('api_logs')
      .select('sdk_record_id, agent_name, task_id, cost_usd, model, sdk_version')
      .eq('org_id', ORG_ID)
      .eq('sdk_version', SMOKE_SDK_VERSION);

    if (error) {
      console.error('  FAIL: Supabase query error', error.message);
      process.exit(1);
    }

    console.log(`       Found ${data.length} records with sdk_version=${SMOKE_SDK_VERSION}`);

    if (data.length !== EXPECTED_RECORDS) {
      console.error(`  FAIL: Expected ${EXPECTED_RECORDS} records, found ${data.length}`);
      process.exit(1);
    }
    console.log('       ✓ Record count matches\n');

    // Verify cost computation
    const sample = data[0];
    const expectedRecord = records.find(r => r.sdk_record_id === sample.sdk_record_id);
    if (expectedRecord && Math.abs(sample.cost_usd - expectedRecord.cost_usd) > 0.000001) {
      console.error(`  FAIL: Cost mismatch. DB: ${sample.cost_usd}, expected: ${expectedRecord.cost_usd}`);
      process.exit(1);
    }
    console.log('       ✓ Cost computation verified');

    // Verify task_ids
    const taskIds = [...new Set(data.map(r => r.task_id).filter(Boolean))];
    console.log(`       ✓ ${taskIds.length} unique task_ids recorded`);

    // Verify agents created
    const { data: agents } = await supabase
      .from('agents')
      .select('name')
      .eq('org_id', ORG_ID)
      .in('name', ['smoke-agent-a', 'smoke-agent-b']);
    console.log(`       ✓ ${agents?.length || 0} smoke test agents auto-created`);

    // Clean up smoke test data
    await supabase.from('api_logs').delete().eq('sdk_version', SMOKE_SDK_VERSION);
    await supabase.from('agents').delete().eq('org_id', ORG_ID).in('name', ['smoke-agent-a', 'smoke-agent-b']);
    console.log('       ✓ Smoke test data cleaned up');
  }

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║             SMOKE TEST: PASS               ║');
  console.log('╚════════════════════════════════════════════╝');
}

main().catch(err => {
  console.error('\n  SMOKE TEST FAILED:', err.message);
  process.exit(1);
});
