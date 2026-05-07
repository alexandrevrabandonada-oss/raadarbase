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
const WINDOW_ID = '116d07a6-c9c3-4443-ae21-52f4d6194cbd';

async function run() {
  const { data: cycle } = await supabase.from('public_receipt_distribution_cycles').select('*').eq('id', CYCLE_ID).single();
  const now = new Date();
  const endsAt = new Date(cycle.ends_at);
  const isComplete = now >= endsAt;

  console.log(`--- Status do Ciclo ---`);
  console.log(`Fim previsto: ${endsAt.toLocaleString()}`);
  console.log(`Completou 24h: ${isComplete ? 'SIM' : 'NÃO'}`);

  if (!isComplete) {
    console.log(`\nGerando snapshot parcial...`);
    // Aqui simulamos a geração do snapshot chamando a lógica do componente ou via rpc se disponível
    // Mas vamos apenas ler os dados agregados para o relatório
    
    const { data: window } = await supabase.from('territorial_listening_windows').select('*').eq('id', WINDOW_ID).single();
    
    const { data: submissions } = await supabase
      .from('bairro_escuta_submissions')
      .select('bairro, pauta, status, consent_to_contact')
      .eq('source_report_id', window.source_report_id)
      .gte('created_at', cycle.starts_at);

    const totalReports = submissions?.length || 0;
    const neighborhoods = new Set(submissions?.map(s => s.bairro) || []);
    const topics = new Set(submissions?.map(s => s.pauta) || []);
    
    console.log(`\n--- Dados Parciais ---`);
    console.log(`Relatos: ${totalReports}`);
    console.log(`Bairros: ${neighborhoods.size}`);
    console.log(`Pautas: ${topics.size}`);
    
    // Impacto
    const impactStatus = totalReports > 0 ? 'gerou_retorno' : 'sem_retorno_ainda';
    console.log(`Status de Impacto: ${impactStatus}`);
  }
}

run().catch(console.error);
