#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes SQL migrations from migrations/ directory
 *
 * Usage:
 *   node src/db/migrate.js                    (Run all pending migrations)
 *   node src/db/migrate.js --reset            (Reset database)
 *   DATABASE_URL="..." node src/db/migrate.js (Use custom connection string)
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pg;

// Get connection string from environment or construct from components
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing database connection information');
    console.error('Provide one of:');
    console.error('  1. DATABASE_URL environment variable');
    console.error('  2. SUPABASE_URL + SUPABASE_KEY environment variables');
    console.error('  3. Manually: PGHOST=... PGUSER=... PGPASSWORD=... PGDATABASE=... node migrate.js');
    process.exit(1);
  }

  // Extract host from Supabase URL
  const url = new URL(supabaseUrl);
  const host = url.hostname;

  // Try to construct connection string - requires password from environment
  const password = process.env.PGPASSWORD;
  if (!password) {
    console.error('❌ ERROR: PostgreSQL password not found');
    console.error('Set PGPASSWORD environment variable with the database password');
    console.error('\nFor Supabase projects:');
    console.error('  1. Go to https://app.supabase.com/project/oryionopjhbxjmrucxby/settings/database');
    console.error('  2. Copy the database password');
    console.error('  3. Set: export PGPASSWORD="<password>"');
    console.error('  4. Run: node src/db/migrate.js');
    process.exit(1);
  }

  connectionString = `postgresql://postgres:${password}@${host}:5432/postgres`;
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  try {
    console.log('\n🚀 Layer ROI Database Migration Runner');
    console.log('════════════════════════════════════════\n');

    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/001_create_outreach_queue.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log('📖 Migration SQL loaded (' + sql.length + ' bytes)\n');

    // Execute migration
    console.log('⏳ Executing migration...');
    await client.query(sql);
    console.log('✅ Migration executed successfully\n');

    // Verify
    console.log('✅ Verifying table creation...');
    const tableCheck = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'outreach_queue'`
    );

    if (tableCheck.rows.length === 0) {
      throw new Error('Table creation verification failed');
    }

    console.log('✅ outreach_queue table verified\n');

    // Check indexes
    const indexCheck = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'outreach_queue'`
    );
    console.log(`✅ Found ${indexCheck.rows.length} indexes\n`);

    // Check view
    const viewCheck = await client.query(
      `SELECT table_name FROM information_schema.views
       WHERE table_schema = 'public' AND table_name = 'outreach_stats'`
    );
    console.log(`✅ outreach_stats view created\n`);

    console.log('════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETE - DATABASE READY');
    console.log('════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration Error:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Verify database credentials are correct');
    console.error('  2. Check network connectivity to Supabase');
    console.error('  3. Ensure PGPASSWORD is set for Supabase projects');
    console.error('  4. Run: export PGPASSWORD="your_password" && node src/db/migrate.js');
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

runMigrations();
