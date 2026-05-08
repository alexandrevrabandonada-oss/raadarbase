import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://blimjnitngthldhazvwh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_KEY) {
  console.error('Erro: defina SUPABASE_SERVICE_ROLE_KEY no ambiente antes de executar este script.');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY,
  { auth: { persistSession: false } }
);

async function runSQL(label, sql) {
  console.log(`\n[APPLYING] ${label}...`);
  const { error } = await supabase.rpc('exec_sql', { query: sql }).maybeSingle();
  if (error) {
    // Try direct approach via REST
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });
    if (!res.ok) {
      console.log(`  [SKIP/WARN] ${label}: ${error.message}`);
    }
  } else {
    console.log(`  [OK] ${label}`);
  }
}

async function checkColumnExists(table, column) {
  const { data } = await supabase
    .from(table)
    .select(column)
    .limit(0);
  return data !== null; // if null, column doesn't exist
}

async function main() {
  console.log('=== Applying missing schema to remote Supabase ===');
  
  // Test: does ig_people have responsible_id?
  const { data: testPeople, error: testErr } = await supabase
    .from('ig_people')
    .select('id, responsible_id')
    .limit(1);
  
  if (testErr) {
    console.log('ig_people.responsible_id does NOT exist. Error:', testErr.message);
    console.log('\nYou need to apply migrations via Supabase SQL Editor.');
    console.log('Go to: https://supabase.com/dashboard/project/blimjnitngthldhazvwh/sql/new');
    console.log('\nPaste and run each migration SQL file from supabase/migrations/ (008 through 034).');
  } else {
    console.log('ig_people.responsible_id EXISTS.');
    
    // Check FK to internal_users
    const { data: testJoin, error: joinErr } = await supabase
      .from('ig_people')
      .select('*, internal_users(full_name)')
      .limit(1);
    
    if (joinErr) {
      console.log('FK ig_people -> internal_users is MISSING. Error:', joinErr.message);
      console.log('\nThe column exists but has no FK constraint.');
      console.log('Go to Supabase SQL Editor and run:');
      console.log('ALTER TABLE public.ig_people ADD CONSTRAINT ig_people_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.internal_users(id);');
    } else {
      console.log('FK ig_people -> internal_users WORKS!');
    }
  }
  
  // Check outreach_tasks
  const { data: testTasks, error: taskErr } = await supabase
    .from('outreach_tasks')
    .select('id')
    .limit(1);
  
  if (taskErr) {
    console.log('\noutreach_tasks table may not exist. Error:', taskErr.message);
  } else {
    console.log('\noutreach_tasks EXISTS.');
  }
  
  // Check contacts
  const { data: testContacts, error: contactErr } = await supabase
    .from('contacts')
    .select('id')
    .limit(1);
  
  if (contactErr) {
    console.log('contacts table may not exist. Error:', contactErr.message);
  } else {
    console.log('contacts EXISTS.');
  }
  
  // Check ig_person_referrals
  const { data: testReferrals, error: refErr } = await supabase
    .from('ig_person_referrals')
    .select('id')
    .limit(1);
  
  if (refErr) {
    console.log('ig_person_referrals may not exist. Error:', refErr.message);
  } else {
    console.log('ig_person_referrals EXISTS.');
  }
}

main().catch(console.error);
