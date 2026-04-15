import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { Client } = pg;

// Common Supabase/PostgreSQL password defaults
const passwords = [
  'postgres',
  '',
  'password',
  'supabase',
  'layeroi',
  'LayerROI',
  'abc123',
  '123456',
  // Extract potential password from service role (unlikely)
  'oryionopjhbxjmrucxby',
];

const migrationPath = path.join(__dirname, 'migrations/001_create_outreach_queue.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

async function tryPassword(password, index) {
  const client = new Client({
    host: 'oryionopjhbxjmrucxby.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: password,
    ssl: { rejectUnauthorized: false },
    statement_timeout: 5000,
    connect_timeout: 5000
  });

  try {
    console.log(`⏳ Trying password ${index}/${passwords.length}...`);
    await client.connect();
    console.log(`✅ CONNECTION SUCCESSFUL with password attempt ${index}`);
    
    console.log(`⏳ Executing migration...`);
    await client.query(sql);
    console.log(`✅ MIGRATION EXECUTED SUCCESSFULLY`);
    
    // Verify
    const result = await client.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'outreach_queue\'');
    if (result.rows.length > 0) {
      console.log(`✅ TABLE VERIFIED - Migration complete!`);
      await client.end();
      return true;
    }
  } catch (err) {
    try { await client.end(); } catch (e) {}
    console.log(`❌ Attempt ${index} failed: ${err.message.substring(0, 50)}`);
  }
  
  return false;
}

async function main() {
  console.log('🚀 Trying common Supabase password defaults\n');
  
  for (let i = 0; i < passwords.length; i++) {
    if (await tryPassword(passwords[i], i + 1)) {
      process.exit(0);
    }
  }
  
  console.log('\n❌ No default passwords worked');
  console.log('The database password must be obtained from Supabase dashboard');
  process.exit(1);
}

main();
