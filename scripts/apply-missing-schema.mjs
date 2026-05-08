const sql = `
ALTER TABLE public.ig_people ADD COLUMN IF NOT EXISTS responsible_id uuid REFERENCES public.internal_users(id);
ALTER TABLE public.outreach_tasks ADD COLUMN IF NOT EXISTS responsible_id uuid REFERENCES public.internal_users(id);
ALTER TABLE public.ig_person_referrals ADD COLUMN IF NOT EXISTS responsible_id uuid REFERENCES public.internal_users(id);
ALTER TABLE public.outreach_tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_ig_people_responsible_id ON public.ig_people(responsible_id);
CREATE INDEX IF NOT EXISTS idx_outreach_tasks_responsible_id ON public.outreach_tasks(responsible_id);
CREATE INDEX IF NOT EXISTS idx_referrals_responsible_id ON public.ig_person_referrals(responsible_id);
`;

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || '';
  if (!token) {
    console.error('Erro: defina SUPABASE_ACCESS_TOKEN no ambiente antes de executar este script.');
    process.exit(1);
  }
  // Try the Management API
  const res = await fetch('https://api.supabase.com/v1/projects/blimjnitngthldhazvwh/database/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query: sql })
  });
  console.log('Status:', res.status);
  const body = await res.text();
  console.log('Response:', body.substring(0, 1000));
}

main().catch(console.error);
