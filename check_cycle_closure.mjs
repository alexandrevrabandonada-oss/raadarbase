import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const text = readFileSync(join(__dirname, '.env.local'), 'utf8');
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
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const CYCLE_ID = 'b3d045f9-fae4-4133-afcc-b636b2cb8e31';

async function run() {
  const { data: cycle, error: cycleErr } = await supabase
    .from('public_receipt_distribution_cycles')
    .select('*')
    .eq('id', CYCLE_ID)
    .single();

  if (cycleErr) throw cycleErr;

  const now = new Date();
  const startsAt = new Date(cycle.starts_at);
  const endsAt = new Date(cycle.ends_at);
  const isComplete = now >= endsAt;

  console.log(`Cycle: ${cycle.title}`);
  console.log(`Status: ${cycle.status}`);
  console.log(`Started: ${startsAt.toLocaleString()}`);
  console.log(`Ends: ${endsAt.toLocaleString()}`);
  console.log(`Now: ${now.toLocaleString()}`);
  console.log(`Is Complete: ${isComplete}`);

  // Get data
  const { count: reportCount } = await supabase
    .from('bairro_escuta_submissions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startsAt.toISOString());

  console.log(`Reports during cycle: ${reportCount}`);
}

run().catch(console.error);
