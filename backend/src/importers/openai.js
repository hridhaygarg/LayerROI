import { ImporterResult } from './base.js';

const OPENAI_USAGE_URL = 'https://api.openai.com/v1/organization/usage/completions';

const PRICING = {
  'gpt-4o':        { input: 0.0025, output: 0.010 },
  'gpt-4o-mini':   { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo':   { input: 0.010, output: 0.030 },
  'gpt-4':         { input: 0.030, output: 0.060 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'o1':            { input: 0.015, output: 0.060 },
  'o1-mini':       { input: 0.003, output: 0.012 },
  'o3':            { input: 0.010, output: 0.040 },
  'o3-mini':       { input: 0.002, output: 0.008 },
};

function normalizeModel(model) {
  return model.replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

function costFor(model, tokensIn, tokensOut) {
  const p = PRICING[normalizeModel(model)] || PRICING['gpt-4o-mini'];
  return (tokensIn / 1000) * p.input + (tokensOut / 1000) * p.output;
}

export async function run(source, { since }) {
  const apiKey = source.credentials.api_key;

  // 30 days ago at midnight UTC
  const maxSince = new Date();
  maxSince.setUTCDate(maxSince.getUTCDate() - 30);
  maxSince.setUTCHours(0, 0, 0, 0);
  const sinceDate = since && since > maxSince ? since : maxSince;
  const sinceUnix = Math.floor(sinceDate.getTime() / 1000);

  const rows = [];
  let cursor = null;
  let pages = 0;

  while (pages < 10) {
    const params = new URLSearchParams({
      start_time: sinceUnix.toString(),
      bucket_width: '1d',
      group_by: 'model',
      limit: '31',
    });
    if (cursor) params.set('page', cursor);

    const res = await fetch(`${OPENAI_USAGE_URL}?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await res.text();
    if (!res.ok) throw new Error(`OpenAI usage API ${res.status}: ${body.slice(0, 300)}`);
    const data = JSON.parse(body);

    for (const bucket of data.data || []) {
      for (const result of bucket.results || []) {
        const tokensIn = result.input_tokens || 0;
        const tokensOut = result.output_tokens || 0;
        if (tokensIn === 0 && tokensOut === 0) continue;

        rows.push({
          external_id: `openai:${bucket.start_time}:${result.model}`,
          agent_name: normalizeModel(result.model),
          provider: 'openai',
          model: result.model,
          cost_usd: costFor(result.model, tokensIn, tokensOut),
          value: 0,
          prompt_tokens: tokensIn,
          completion_tokens: tokensOut,
          total_tokens: tokensIn + tokensOut,
          created_at: new Date(bucket.start_time * 1000).toISOString(),
        });
      }
    }

    if (!data.has_more) break;
    cursor = data.next_page;
    pages++;
  }

  return new ImporterResult({ rows, periodStart: sinceDate, periodEnd: new Date() });
}
