import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const templatesBase = [
  {
    name: "Comentou uma denúncia",
    category: "Comentou uma denúncia",
    theme: "escuta",
    body: "Oi, tudo bem? Vi seu comentário sobre esse problema. A gente está organizando uma rede para transformar esses relatos em ação concreta. Posso te mandar uma ideia rápida de como participar?",
    when_to_use: "Quando a pessoa trouxer um problema real nos comentários.",
    active: true
  },
  {
    name: "Respondeu story",
    category: "Respondeu story",
    theme: "geral",
    body: "Valeu por responder! A gente está mapeando quem quer construir algo diferente na cidade. Você toparia entrar num grupo fechado nosso pra acompanhar os próximos passos?",
    when_to_use: "Interação rápida ou emoji em stories.",
    active: true
  },
  {
    name: "Sempre curte",
    category: "Sempre curte, mas nunca comentou",
    theme: "geral",
    body: "Oi! A gente percebeu que você tá sempre acompanhando nossos conteúdos. Valeu pela força! Você é de qual bairro? A gente tá chamando o pessoal mais próximo para uma conversa em breve.",
    when_to_use: "Pessoa com alta temperatura apenas por curtidas.",
    active: true
  },
  {
    name: "Perguntou como ajudar",
    category: "Perguntou como ajudar",
    theme: "voluntariado",
    body: "Que massa! Tem dois jeitos principais agora: você prefere ajudar espalhando conteúdo nas redes ou prefere ir pra rua com a gente colar cartaz e panfletar?",
    when_to_use: "Quando a pessoa pedir ativamente para ajudar.",
    active: true
  },
  {
    name: "Convite Evento/Missão ÉLuta",
    category: "Convite geral",
    theme: "evento",
    body: "Oi, tudo bem? A gente vai fazer uma plenária/ação no final de semana. Lembra que a gente conversou sobre os problemas do bairro? Queria muito te convidar. Topa?",
    when_to_use: "Para encaminhar pessoas já abordadas para ações reais.",
    active: true
  }
];

async function seedTemplates() {
  console.log("==========================================");
  console.log(" SEED DE TEMPLATES DO RADAR DE BASE       ");
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

  for (const template of templatesBase) {
    // Check if it already exists to avoid duplicates
    const { data: existing, error: searchError } = await supabase
      .from('message_templates')
      .select('id')
      .eq('name', template.name)
      .maybeSingle();

    if (searchError) {
      console.error(`Erro ao buscar template '${template.name}':`, searchError.message);
      continue;
    }

    if (existing) {
      console.log(`⚠️ Template '${template.name}' já existe. Pulando.`);
    } else {
      const { error: insertError } = await supabase
        .from('message_templates')
        .insert({
          id: crypto.randomUUID(),
          ...template,
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error(`❌ Erro ao inserir '${template.name}':`, insertError.message);
      } else {
        console.log(`✅ Template '${template.name}' criado com sucesso.`);
      }
    }
  }

  console.log("\nSeed concluído.");
}

seedTemplates().catch(err => {
  console.error("Erro fatal durante o seed:", err);
  process.exit(1);
});
