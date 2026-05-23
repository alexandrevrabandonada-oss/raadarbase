import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const NEW_BODY = `Oi! Tudo bem?

Queria te contar em primeira mão: estou colocando meu nome à disposição como *pré-candidato a deputado estadual* pelo projeto *Alexandre VR Abandonada*.

Essa pré-campanha nasce com alguns valores muito claros: escutar quem vive os problemas de verdade, cuidar das pessoas, defender justiça social e ambiental, enfrentar o abandono do nosso estado e construir organização popular de baixo para cima.

A gente sabe que política não pode ser só promessa, palanque e propaganda. Por isso estamos criando o *App Missão ÉLuta*, uma ferramenta para organizar essa luta: formação, missões simples, escuta nos bairros, mobilização e participação coletiva.

Se você tiver interesse em conhecer melhor ou participar dessa construção, me responde aqui com *“quero entrar”* que eu te mando o convite do app.

*Ajude a gente a mudar o estado.*
Escutar • Cuidar • Organizar`;

async function updateCampaignTemplate() {
  console.log("==========================================");
  console.log(" ATUALIZANDO TEMPLATE DE CAMPANHA DB      ");
  console.log("==========================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Credenciais do Supabase ausentes no .env.local.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // 1. Procurar por um template com is_campaign_default = true
  const { data: existing, error: searchError } = await supabase
    .from('message_templates')
    .select('id, name')
    .eq('is_campaign_default', true)
    .maybeSingle();

  if (searchError) {
    console.error("❌ Erro ao buscar template padrão de campanha:", searchError.message);
    process.exit(1);
  }

  if (existing) {
    console.log(`Found campaign default template: '${existing.name}' (ID: ${existing.id}). Updating body...`);
    const { error: updateError } = await supabase
      .from('message_templates')
      .update({
        body: NEW_BODY,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error("❌ Erro ao atualizar template:", updateError.message);
      process.exit(1);
    }
    console.log("✅ Template padrão atualizado com sucesso!");
  } else {
    console.log("No template with is_campaign_default=true found. Searching by name...");
    // 2. Procurar por nome "Aviso de Pré-Candidatura e Apoio"
    const { data: namedTemplate, error: nameSearchError } = await supabase
      .from('message_templates')
      .select('id')
      .eq('name', 'Aviso de Pré-Candidatura e Apoio')
      .maybeSingle();

    if (nameSearchError) {
      console.error("❌ Erro ao buscar template por nome:", nameSearchError.message);
      process.exit(1);
    }

    if (namedTemplate) {
      console.log(`Found template by name. Setting it as default campaign and updating body...`);
      const { error: updateError } = await supabase
        .from('message_templates')
        .update({
          is_campaign_default: true,
          body: NEW_BODY,
          updated_at: new Date().toISOString()
        })
        .eq('id', namedTemplate.id);

      if (updateError) {
        console.error("❌ Erro ao atualizar template por nome:", updateError.message);
        process.exit(1);
      }
      console.log("✅ Template padrão configurado e atualizado por nome!");
    } else {
      console.log("Template not found by name either. Creating a new default campaign template...");
      // 3. Criar um novo template padrão
      const { error: insertError } = await supabase
        .from('message_templates')
        .insert({
          id: crypto.randomUUID(),
          name: "Aviso de Pré-Candidatura e Apoio",
          theme: "conversao",
          body: NEW_BODY,
          active: true,
          is_campaign_default: true,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("❌ Erro ao criar novo template:", insertError.message);
        process.exit(1);
      }
      console.log("✅ Novo template de campanha padrão criado e ativado!");
    }
  }
}

updateCampaignTemplate().catch(err => {
  console.error("Erro fatal durante atualização do banco:", err);
  process.exit(1);
});
