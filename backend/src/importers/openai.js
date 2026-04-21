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
  return model
    .replace(/-\d{4}-\d{2}-\d{2}$/, '')  // "gpt-4o-2024-08-06" -> "gpt-4o"
    .replace(/-\d{4}$/, '');              // "gpt-3.5-turbo-0125" -> "gpt-3.5-turbo"
}

function costFor(model, tokensIn, tokensOut) {
  const p = PRICING[normalizeModel(model)] || PRICING['gpt-4o-mini'];
  return (tokensIn / 1000) * p.input + (tokensOut / 1000) * p.output;
}

export async function run(source, { since }) {
  console.log('[openai-importer] ENTRY: run() called for source', source.id);
  console.log('[openai-importer] has credentials:', !!source.credentials, 'has api_key:', !!source.credentials?.api_key);
  console.log('[openai-importer] api_key prefix:', source.credentials?.api_key?.slice(0, 20));
  console.log('[openai-importer] since param:', since);

  const apiKey = source.credentials.api_key;

  // Always look back at least 30 days — billing data is aggregated, not a stream
  const floor30d = new Date();
  floor30d.setUTCDate(floor30d.getUTCDate() - 30);
  floor30d.setUTCHours(0, 0, 0, 0);
  const sinceDate = floor30d; // ignore `since` param — always pull full 30-day window
  const sinceUnix = Math.floor(sinceDate.getTime() / 1000);

  console.log('[openai-importer] sinceDate:', sinceDate.toISOString(), 'sinceUnix:', sinceUnix);

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

    console.log('[openai-importer] ABOUT TO FETCH: page', pages, 'URL:', OPENAI_USAGE_URL, 'params:', params.toString());

    const res = await fetch(`${OPENAI_USAGE_URL}?${params}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await res.text();

    console.log('[openai-importer] FETCH COMPLETE: status=', res.status, 'bodyLength=', body.length);

    if (!res.ok) throw new Error(`OpenAI usage API ${res.status}: ${body.slice(0, 300)}`);
    const data = JSON.parse(body);

    console.log('[openai-importer] has_more=', data.has_more, 'buckets=', data.data?.length);

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

    console.log('[openai-importer] rows so far:', rows.length);

    if (!data.has_more) break;
    cursor = data.next_page;
    pages++;
  }

  console.log('[openai-importer] EXIT: returning', rows.length, 'rows');
  return new ImporterResult({ rows, periodStart: sinceDate, periodEnd: new Date() });
}
