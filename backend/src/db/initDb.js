import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Client: PgClient } = pg;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

let initPromise = null;

async function executeMigrationViaPg() {
  // Try direct PostgreSQL connection if DATABASE_URL is available (e.g., on Railway)
  if (!DATABASE_URL) {
    return false;
  }

  const client = new PgClient({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    statement_timeout: 30000,
    connect_timeout: 10000
  });

  try {
    logger.info('🔌 Attempting database connection...');
    await client.connect();
    logger.info('✅ Connected');

    const migrationPath = path.join(__dirname, '../migrations/001_create_outreach_queue.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    logger.info('⏳ Executing migration...');
    await client.query(sql);
    logger.info('✅ Migration executed');

    // Verify
    const result = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'outreach_queue'`
    );

    if (result.rows.length > 0) {
      logger.info('✅ Database schema verified');
      return true;
    }

    return false;
  } catch (err) {
    logger.debug(`PostgreSQL connection: ${err.message}`);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

async function checkTableViaSupabaseClient() {
  // Non-intrusive check using Supabase JS client
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    const { data: tables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    return tables?.some(t => t.table_name === 'outreach_queue') ?? false;
  } catch (err) {
    return null;
  }
}

export async function initializeDatabase() {
  // Cache to prevent multiple simultaneous initialization attempts
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      logger.info('🔄 Initializing database...');

      // First, try to execute via direct PostgreSQL (Railway environment)
      const migrationExecuted = await executeMigrationViaPg();
      if (migrationExecuted) {
        return true;
      }

      // Check current state via Supabase client
      const tableExists = await checkTableViaSupabaseClient();

      if (tableExists === true) {
        logger.info('✅ Database ready');
        return true;
      }

      if (tableExists === false) {
        logger.warn('⚠️  Schema missing - execute: node src/db/migrate.js');
        return false;
      }

      logger.warn('⚠️  Cannot verify database state');
      return false;
    } catch (err) {
      logger.error('Database init error:', err.message);
      return false;
    }
  })();

  return initPromise;
}
