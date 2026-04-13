import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  logger.error('FATAL: Supabase credentials missing', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!SUPABASE_KEY
  });
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

logger.info('Supabase client initialised', {
  url: SUPABASE_URL.substring(0, 30) + '...'
});

// Health check function
export async function checkDatabaseHealth() {
  try {
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    return !error;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}
