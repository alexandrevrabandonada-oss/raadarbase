import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  const text = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const env = {};
  text.split(/\r?\n/).forEach(line => {
    const idx = line.indexOf('=');
    if (idx <= 0) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

const env = loadEnv();
const projectRef = env.SUPABASE_PROJECT_ID || 'blimjnitngthldhazvwh';
const pat = env.SUPABASE_ACCESS_TOKEN;
const apiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

function runQuery(sql) {
  const body = JSON.stringify({ query: sql });
  const urlObj = new URL(apiUrl);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (_) { resolve(data); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name";
  const tables = await runQuery(sql);
  console.log(JSON.stringify(tables, null, 2));
}

main();
