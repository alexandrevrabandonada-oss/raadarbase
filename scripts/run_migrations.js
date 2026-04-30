import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRef = process.env.SUPABASE_PROJECT_ID ?? 'blimjnitngthldhazvwh';
const pat = process.env.SUPABASE_ACCESS_TOKEN;

if (!pat) {
  console.error('SUPABASE_ACCESS_TOKEN is required to run remote migrations.');
  process.exit(1);
}

const apiUrl = 'https://api.supabase.com/v1/projects/' + projectRef + '/database/query';

const reqHeaders = {
  'Authorization': 'Bearer ' + pat,
  'Content-Type': 'application/json'
};

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(function(f) { return f.endsWith('.sql'); })
  .sort();

console.log('Found ' + files.length + ' migrations\n');

function runQuery(sql) {
  const body = JSON.stringify({ query: sql });
  const urlObj = new URL(apiUrl);
  return new Promise(function(resolve, reject) {
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: Object.assign({}, reqHeaders, { 'Content-Length': Buffer.byteLength(body) })
    }, function(res) {
      let data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch(_e) { resolve(data); }
        } else {
          reject(new Error('HTTP ' + res.statusCode + ': ' + data));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  let allOk = true;

  for (const file of files) {
    process.stdout.write('Applying ' + file + '... ');
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await runQuery(sql);
      console.log('OK');
    } catch (err) {
      allOk = false;
      console.log('FAILED');
      console.log('  ' + err.message.substring(0, 400));
    }
  }

  console.log('\nChecking tables in public schema...');
  try {
    const tables = await runQuery(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    if (Array.isArray(tables)) {
      tables.forEach(function(t) { console.log('  - ' + t.table_name); });
      console.log('\nTotal: ' + tables.length + ' tables');
    } else {
      console.log('Response: ' + JSON.stringify(tables));
    }
  } catch(err) {
    console.log('Verify failed: ' + err.message);
  }

  console.log(allOk ? '\nALL MIGRATIONS APPLIED SUCCESSFULLY' : '\nWARNING: SOME MIGRATIONS FAILED - check above');
}

main().catch(function(err) { console.error(err); process.exit(1); });
