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

async function main() {
  console.log('=== Applying missing schema to remote Supabase ===');
  
  // Test: does ig_people have responsible_id?
  const { error: testErr } = await supabase
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
    const { error: joinErr } = await supabase
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
  const { error: taskErr } = await supabase
    .from('outreach_tasks')
    .select('id')
    .limit(1);
  
  if (taskErr) {
    console.log('\noutreach_tasks table may not exist. Error:', taskErr.message);
  } else {
    console.log('\noutreach_tasks EXISTS.');
  }
  
  // Check contacts
  const { error: contactErr } = await supabase
    .from('contacts')
    .select('id')
    .limit(1);
  
  if (contactErr) {
    console.log('contacts table may not exist. Error:', contactErr.message);
  } else {
    console.log('contacts EXISTS.');
  }
  
  // Check ig_person_referrals
  const { error: refErr } = await supabase
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
