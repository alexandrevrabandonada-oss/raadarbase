import { createClient } from "@supabase/supabase-js";
import 'dotenv/config'; // carrega variáveis do .env e .env.local

async function runDiagnostico() {
  console.log("==========================================");
  console.log(" RADAR DE BASE - PRONTIDÃO DE PRODUÇÃO    ");
  console.log("==========================================\n");

  let hasErrors = false;

  // 1. Verificar USE_MOCKS
  const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS;
  if (useMocks === "true") {
    console.error("❌ NEXT_PUBLIC_USE_MOCKS está 'true'. Para produção, deve ser 'false' (ou não definido).");
    hasErrors = true;
  } else {
    console.log("✅ NEXT_PUBLIC_USE_MOCKS desligado.");
  }

  // 2. Verificar variáveis de ambiente
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL não definido.");
    hasErrors = true;
  } else {
    console.log(`✅ Supabase URL configurada: ${supabaseUrl.substring(0, 20)}...`);
  }

  if (!anonKey) {
    console.error("❌ Chave pública do Supabase não definida.");
    hasErrors = true;
  } else {
    console.log("✅ Chave pública do Supabase configurada.");
  }

  if (!serviceRoleKey) {
    console.error("❌ Service Role Key não definida.");
    hasErrors = true;
  } else {
    console.log("✅ Service Role Key configurada.");
  }

  if (hasErrors) {
    console.error("\n⚠️  Erros de configuração encontrados. Interrompendo diagnóstico.");
    process.exit(1);
  }

  // 3. Testar conexão (Service Role)
  console.log("\nConectando ao Supabase...");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Teste de conexão simples
  const { error: healthError } = await supabase.from('ig_people').select('id').limit(1);
  if (healthError) {
    console.error(`❌ Falha ao conectar ao banco de dados: ${healthError.message}`);
    process.exit(1);
  }
  console.log("✅ Conexão com o banco estabelecida com sucesso.");

  // 4. Verificar tabelas obrigatórias
  console.log("\nVerificando tabelas necessárias:");
  const tabelasObrigatorias = [
    "ig_people",
    "ig_interactions",
    "outreach_tasks",
    "message_templates",
    "ig_person_referrals",
    "field_agenda_events",
    "campaign_volunteers",
    "campaign_volunteer_applications",
    "audit_logs"
  ];

  for (const tabela of tabelasObrigatorias) {
    const { count, error } = await supabase.from(tabela).select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ Tabela ausente ou inacessível: ${tabela} (${error.message})`);
      hasErrors = true;
    } else {
      console.log(`  - ${tabela}: ✅ OK (${count} registros)`);
    }
  }

  // 5. Teste RLS (Anon Key)
  console.log("\nTestando RLS (Row Level Security)...");
  const anonClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  
  const { error: rlsError } = await anonClient.from('ig_people').insert({ 
    id: "teste", 
    username: "teste", 
    total_interactions: 0 
  });

  if (rlsError && rlsError.code === '42501') { // 42501 é RLS Policy Violation
    console.log("✅ RLS ativo: bloqueou inserção anônima em ig_people.");
  } else if (!rlsError) {
    console.error("❌ PERIGO: Inserção anônima permitida em ig_people. RLS pode estar desativado!");
    hasErrors = true;
  } else {
    console.log(`⚠️ RLS verificado com outro erro: ${rlsError.message}`);
  }

  console.log("\n==========================================");
  if (hasErrors) {
    console.error("🔴 O ambiente AINDA NÃO ESTÁ PRONTO para produção.");
    process.exit(1);
  } else {
    console.log("🟢 AMBIENTE PRONTO PARA PRODUÇÃO CONTROLADA.");
  }
}

runDiagnostico().catch(err => {
  console.error("Erro fatal durante o diagnóstico:", err);
  process.exit(1);
});
