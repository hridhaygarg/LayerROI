import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Executing Supabase Migration via HTTP API');
console.log('════════════════════════════════════════\n');

console.log('📖 Reading migration SQL...');
const migrationPath = path.join(__dirname, 'migrations/001_create_outreach_queue.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');
console.log('✅ SQL loaded (' + sql.length + ' bytes)\n');

// Supabase credentials
const SUPABASE_URL = 'https://oryionopjhbxjmrucxby.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yeWlvbm9wamhieGptcnVjeGJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgxOTUyMCwiZXhwIjoyMDkxMzk1NTIwfQ.aSQMoXBc0hR81oRtXczJZSRq8A199OLFgvLSIgjGyTs';

// Attempt 1: Try using the Supabase admin API endpoint
async function executeViaSQLEditor() {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ sql }));
    req.end();
  });
}

// Attempt 2: Create table via PostgREST
async function createTableViaPostgREST() {
  // Split SQL into statements
  const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
  
  console.log(`📝 Found ${statements.length} SQL statements\n`);
  console.log('Note: Supabase PostgREST API does not support raw SQL execution.');
  console.log('Manual execution required in Supabase dashboard.\n');
  
  throw new Error('PostgREST API cannot execute raw SQL');
}

async function main() {
  try {
    console.log('🔌 Attempting API-based execution...\n');
    await executeViaSQLEditor();
    console.log('✅ Migration executed via Supabase SQL API\n');
  } catch (err) {
    console.log('❌ SQL API approach failed: ' + err.message + '\n');
    
    console.log('════════════════════════════════════════');
    console.log('SUPABASE MIGRATION - MANUAL EXECUTION');
    console.log('════════════════════════════════════════\n');
    
    console.log('The Supabase JS client and API do not support direct raw SQL execution.');
    console.log('You must run the SQL in the Supabase dashboard:\n');
    
    console.log('1️⃣  Open: https://app.supabase.com/project/oryionopjhbxjmrucxby/sql/new');
    console.log('2️⃣  Copy the SQL below and paste it into the editor');
    console.log('3️⃣  Click "Run"\n');
    
    console.log('---SQL START---');
    console.log(sql);
    console.log('---SQL END---\n');
    
    console.log('4️⃣  Verify the table was created: outreach_queue should appear in Database > Tables\n');
    
    console.log('════════════════════════════════════════');
  }
}

main();
