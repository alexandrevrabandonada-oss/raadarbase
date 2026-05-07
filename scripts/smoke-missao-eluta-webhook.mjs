import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
  try {
    const text = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
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
  } catch {
    return process.env;
  }
}

const env = loadEnv();
const secret = env.MISSAO_ELUTA_WEBHOOK_SECRET || 'eluta_secret_test_123';
const baseUrl = process.argv[2] || 'http://localhost:3000';
const apiUrl = `${baseUrl}/api/integrations/missao-eluta/events`;

async function postEvent(payload, token = secret) {
  const body = JSON.stringify(payload);
  const urlObj = new URL(apiUrl);
  const client = urlObj.protocol === 'https:' ? https : http;

  console.log(`\nTesting ${payload.event_type}...`);
  return new Promise((resolve) => {
    const req = client.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', e => {
      console.error(`Error: ${e.message}`);
      resolve({ status: 500, error: e.message });
    });
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log(`Missão ÉLuta Webhook Smoke Test`);
  console.log(`Target: ${apiUrl}`);

  // 1. Unauthorized
  await postEvent({ event_type: 'test' }, 'wrong_token');

  // 2. Invalid Payload
  await postEvent({ event_type: '' });

  // 3. Person Not Found
  await postEvent({
    external_person_ref: 'non-existent-uuid',
    instagram_handle: 'non_existent_user_xyz',
    event_type: 'mission_eluta_accessed',
    event_id: `evt_nf_${Date.now()}`
  });

  // 4. Valid Event (Finding by username)
  // Assuming 'ana.vr' exists from mock data or real DB
  await postEvent({
    instagram_handle: 'ana.vr',
    event_type: 'mission_eluta_accessed',
    mission_slug: 'mutirao-vila-rica',
    event_id: `evt_ok_${Date.now()}`
  });

  // 5. Idempotency Test
  const idempId = `evt_idemp_${Date.now()}`;
  await postEvent({
    instagram_handle: 'ana.vr',
    event_type: 'mission_eluta_first_mission_done',
    event_id: idempId
  });
  await postEvent({
    instagram_handle: 'ana.vr',
    event_type: 'mission_eluta_first_mission_done',
    event_id: idempId
  });
}

runTests();
