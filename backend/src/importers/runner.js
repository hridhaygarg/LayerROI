import { supabase } from '../config/database.js';
import { decryptCredential } from '../lib/crypto.js';
import { logger } from '../utils/logger.js';

const IMPORTERS = {};

async function getImporter(provider) {
  if (!IMPORTERS[provider]) {
    if (provider === 'openai') IMPORTERS[provider] = await import('./openai.js');
    else if (provider === 'anthropic') IMPORTERS[provider] = await import('./anthropic.js');
    else if (provider === 'bedrock') IMPORTERS[provider] = await import('./bedrock.js');
    else throw new Error(`Unknown provider: ${provider}`);
  }
  return IMPORTERS[provider];
}

export async function syncSource(sourceId) {
  const { data: source, error } = await supabase.from('billing_sources').select('*').eq('id', sourceId).single();
  if (error || !source) throw new Error(`Source not found: ${sourceId}`);
  if (source.status === 'disabled') return { skipped: true };

  const importer = await getImporter(source.provider);

  const { data: run } = await supabase.from('source_sync_runs').insert({
    source_id: source.id, status: 'running',
  }).select().single();

  try {
    const credentials = JSON.parse(decryptCredential(source.credentials_encrypted));
    console.log('[runner] decrypted credentials for source', source.id);
    console.log('[runner] decrypted credential keys:', Object.keys(credentials));
    console.log('[runner] api_key first 20 chars:', credentials.api_key?.slice(0, 20));
    const since = source.last_synced_at ? new Date(source.last_synced_at) : new Date(Date.now() - 30 * 86400000);

    const result = await importer.run({ ...source, credentials }, { since });

    console.log('[runner] importer returned', result.rows.length, 'rows');
    if (result.rows.length > 0) {
      console.log('[runner] first row sample:', JSON.stringify(result.rows[0]));
    }

    let imported = 0;
    for (let i = 0; i < result.rows.length; i += 500) {
      const batch = result.rows.slice(i, i + 500).map(r => ({
        org_id: source.org_id,
        source_id: source.id,
        external_id: r.external_id,
        agent_name: r.agent_name,
        provider: r.provider,
        model: r.model,
        cost_usd: r.cost_usd || r.cost || 0,
        value: r.value || 0,
        prompt_tokens: r.prompt_tokens || r.tokens_input || 0,
        completion_tokens: r.completion_tokens || r.tokens_output || 0,
        total_tokens: (r.prompt_tokens || r.tokens_input || 0) + (r.completion_tokens || r.tokens_output || 0),
        created_at: r.created_at,
        status: 'success',
      }));
      console.log('[runner] about to upsert batch of', batch.length, 'rows');
      console.log('[runner] batch[0] keys:', Object.keys(batch[0]));
      console.log('[runner] batch[0]:', JSON.stringify(batch[0]));

      const { error: insertErr, data: insertData } = await supabase.from('api_logs').upsert(batch, {
        onConflict: 'source_id,external_id',
        ignoreDuplicates: true,
      });

      if (insertErr) {
        console.error('[runner] UPSERT FAILED:', JSON.stringify(insertErr));
        throw insertErr;
      }
      console.log('[runner] upsert success, data:', insertData ? insertData.length : 'null');
      imported += batch.length;
    }
    console.log('[runner] total imported:', imported);

    const sourceUpdate = { status: 'active', last_error: null, updated_at: new Date().toISOString() };
    if (imported > 0) sourceUpdate.last_synced_at = new Date().toISOString();
    await supabase.from('billing_sources').update(sourceUpdate).eq('id', source.id);

    await supabase.from('source_sync_runs').update({
      status: 'success', finished_at: new Date().toISOString(), rows_imported: imported,
      period_start: result.periodStart, period_end: result.periodEnd,
    }).eq('id', run.id);

    logger.info('Source sync complete', { sourceId, imported });
    return { success: true, imported };
  } catch (err) {
    await supabase.from('billing_sources').update({
      status: 'error', last_error: err.message.slice(0, 500), updated_at: new Date().toISOString(),
    }).eq('id', source.id);
    await supabase.from('source_sync_runs').update({
      status: 'error', finished_at: new Date().toISOString(), error_message: err.message.slice(0, 500),
    }).eq('id', run.id);
    throw err;
  }
}

export async function syncAllActive() {
  const { data: sources } = await supabase.from('billing_sources').select('id').in('status', ['active', 'pending']);
  const results = [];
  for (const s of sources || []) {
    try { results.push({ source_id: s.id, ...(await syncSource(s.id)) }); }
    catch (err) { results.push({ source_id: s.id, error: err.message }); }
  }
  return results;
}
