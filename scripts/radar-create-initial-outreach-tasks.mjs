import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function createInitialTasks() {
  console.log("==========================================");
  console.log(" GERADOR DE TAREFAS INICIAIS - RADAR      ");
  console.log("==========================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Credenciais do Supabase ausentes.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // 1. Buscar pessoas aptas
  console.log("Buscando pessoas aptas para abordagem...");
  const { data: people, error: fetchError } = await supabase
    .from('ig_people')
    .select('id, username, display_name, total_interactions, last_interaction_at, themes, status, do_not_contact_reason')
    .neq('status', 'nao_abordar')
    .is('do_not_contact_reason', null)
    .order('total_interactions', { ascending: false })
    .limit(200);

  if (fetchError) {
    console.error("❌ Erro ao buscar pessoas:", fetchError.message);
    process.exit(1);
  }

  console.log(`Total de pessoas analisadas: ${people.length}`);

  // 2. Filtrar e Priorizar
  const themesPrioritarios = ['saúde', 'poluição', 'transporte', 'servidor', 'educação', 'bairro', 'csn', 'upv'];
  
  const aptas = people.filter(p => {
    // Evitar pessoas sem interações recentes (opcional, mas bom para o piloto)
    return p.total_interactions > 0;
  });

  // Ordenação inteligente: Temas prioritários primeiro, depois total de interações
  const prioritarias = aptas.sort((a, b) => {
    const hasThemeA = a.themes?.some(t => themesPrioritarios.includes(t.toLowerCase())) ? 1 : 0;
    const hasThemeB = b.themes?.some(t => themesPrioritarios.includes(t.toLowerCase())) ? 1 : 0;
    
    if (hasThemeA !== hasThemeB) return hasThemeB - hasThemeA;
    return (b.total_interactions || 0) - (a.total_interactions || 0);
  }).slice(0, 50);

  console.log(`Pessoas selecionadas para o piloto: ${prioritarias.length}`);

  let criadas = 0;
  let ignoradasExistentes = 0;

  // 3. Criar tarefas (Idempotente)
  for (const p of prioritarias) {
    // Verificar se já existe tarefa aberta
    const { data: existing } = await supabase
      .from('outreach_tasks')
      .select('id')
      .eq('person_id', p.id)
      .neq('column_key', 'concluido')
      .maybeSingle();

    if (existing) {
      ignoradasExistentes++;
      continue;
    }

    const motivo = p.themes?.length > 0 
      ? `Interagiu com temas: ${p.themes.join(', ')}.` 
      : `Alta interação geral (${p.total_interactions} interações).`;

    const { error: insertError } = await supabase
      .from('outreach_tasks')
      .insert({
        id: crypto.randomUUID(),
        person_id: p.id,
        column_key: 'para_abordar',
        title: `Abordagem Inicial: @${p.username}`,
        notes: `Prioridade Piloto: ${motivo} Próximo passo: Enviar mensagem de acolhimento baseada no tema.`,
        due_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 dias de prazo
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error(`❌ Erro ao criar tarefa para @${p.username}:`, insertError.message);
    } else {
      criadas++;
      console.log(`✅ Tarefa criada para @${p.username} (${p.total_interactions} interações)`);
    }
  }

  // 4. Relatório Final
  console.log("\n==========================================");
  console.log(" RELATÓRIO DE CARGA INICIAL               ");
  console.log("==========================================");
  console.log(`Total Analisado:      ${people.length}`);
  console.log(`Aptas Filtradas:      ${aptas.length}`);
  console.log(`Ignoradas (Já tem):   ${ignoradasExistentes}`);
  console.log(`Tarefas Criadas:      ${criadas}`);
  console.log("==========================================\n");
}

createInitialTasks().catch(err => {
  console.error("Erro fatal durante a criação de tarefas:", err);
  process.exit(1);
});
