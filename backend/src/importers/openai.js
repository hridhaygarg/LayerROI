import { ImporterResult } from './base.js';

const PRICING = {
  'gpt-4o':        { input: 0.0025, output: 0.010 },
  'gpt-4o-mini':   { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo':   { input: 0.010, output: 0.030 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'o1':            { input: 0.015, output: 0.060 },
  'o3-mini':       { input: 0.002, output: 0.008 },
};

function costFor(model, tokensIn, tokensOut) {
  const p = PRICING[model] || PRICING['gpt-4o-mini'];
  return (tokensIn / 1000) * p.input + (tokensOut / 1000) * p.output;
}

export async function run(source, { since }) {
  console.log('[openai-importer] run() called');
  console.log('[openai-importer] source.credentials type:', typeof source.credentials);
  console.log('[openai-importer] source.credentials keys:', source.credentials ? Object.keys(source.credentials) : 'null');
  console.log('[openai-importer] api_key prefix (first 20 chars):', source.credentials?.api_key?.slice(0, 20));
  console.log('[openai-importer] api_key starts with sk-admin-test-:', source.credentials?.api_key?.startsWith?.('sk-admin-test-'));

  const apiKey = source.credentials.api_key;

  // Test mode: mock data for pipeline verification
  if (apiKey && apiKey.startsWith('sk-admin-test-')) {
    console.log('[openai-importer] TEST MODE TRIGGERED - returning mock data');
    return generateMockOpenAIData(since);
  }
  console.log('[openai-importer] TEST MODE NOT TRIGGERED - calling real OpenAI API');

  // OpenAI max limit is 31 for 1d buckets. Cap since to 30 days ago.
  const maxSince = new Date(Date.now() - 30 * 86400000);
  const sinceDate = since && since > maxSince ? since : maxSince;
  const sinceUnix = Math.floor(sinceDate.getTime() / 1000);

  const params = new URLSearchParams({ start_time: sinceUnix.toString(), bucket_width: '1d', group_by: 'model,project_id', limit: '31' });
  const res = await fetch(`https://api.openai.com/v1/organization/usage/completions?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`OpenAI usage API ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const rows = [];

  for (const bucket of data.data || []) {
    for (const result of bucket.results || []) {
      const tokensIn = result.input_tokens || 0;
      const tokensOut = result.output_tokens || 0;
      if (tokensIn === 0 && tokensOut === 0) continue;
      const model = result.model || 'gpt-4o-mini';
      const projectId = result.project_id || 'default';
      rows.push({
        external_id: `openai:${bucket.start_time}:${model}:${projectId}`,
        agent_name: `project:${projectId}`, // TODO: allow customer to rename agents
        provider: 'openai', model,
        cost: costFor(model, tokensIn, tokensOut), value: 0,
        tokens_input: tokensIn, tokens_output: tokensOut,
        created_at: new Date(bucket.start_time * 1000).toISOString(),
      });
    }
  }

  return new ImporterResult({ rows, periodStart: new Date(sinceUnix * 1000), periodEnd: new Date() });
}

function generateMockOpenAIData(since) {
  const sinceDate = since || new Date(Date.now() - 7 * 86400000);
  const days = Math.max(1, Math.ceil((Date.now() - sinceDate.getTime()) / 86400000));
  const mockAgents = [
    { project_id: 'proj_customer_support', model: 'gpt-4o-mini', calls_per_day: 420, avg_in: 850, avg_out: 180 },
    { project_id: 'proj_lead_enrichment', model: 'gpt-4o', calls_per_day: 60, avg_in: 2400, avg_out: 600 },
    { project_id: 'proj_doc_summarizer', model: 'gpt-4o-mini', calls_per_day: 180, avg_in: 4200, avg_out: 320 },
    { project_id: 'proj_email_classifier', model: 'gpt-4o-mini', calls_per_day: 900, avg_in: 180, avg_out: 25 },
  ];
  const rows = [];
  for (let d = 0; d < days; d++) {
    const bucketStart = Math.floor(sinceDate.getTime() / 1000) + d * 86400;
    for (const a of mockAgents) {
      const jitter = 0.7 + Math.random() * 0.6;
      const calls = Math.floor(a.calls_per_day * jitter);
      const tokensIn = calls * a.avg_in;
      const tokensOut = calls * a.avg_out;
      rows.push({
        external_id: `openai:${bucketStart}:${a.model}:${a.project_id}`,
        agent_name: a.project_id, provider: 'openai', model: a.model,
        cost: costFor(a.model, tokensIn, tokensOut), value: 0,
        tokens_input: tokensIn, tokens_output: tokensOut,
        created_at: new Date(bucketStart * 1000).toISOString(),
      });
    }
  }
  return new ImporterResult({ rows, periodStart: sinceDate, periodEnd: new Date() });
}
