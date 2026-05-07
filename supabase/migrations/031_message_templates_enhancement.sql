-- Adicionando colunas de categoria e uso operacional aos templates de mensagem
alter table message_templates add column if not exists category text;
alter table message_templates add column if not exists when_to_use text;

-- Inserindo templates base operacionais do Radar de Base
-- Comentou uma denúncia
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Abordagem de Denúncia',
  'denúncia',
  'Comentou uma denúncia',
  'Quando a pessoa relata ou comenta problema concreto em post de denúncia.',
  'Oi, tudo bem? Vi seu comentário sobre esse problema. A gente está organizando uma rede para transformar esses relatos em ação concreta. Posso te mandar uma ideia rápida de como participar?'
) on conflict do nothing;

-- Respondeu story
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Resposta de Story',
  'story',
  'Respondeu story',
  'Quando a pessoa interage com um story da página.',
  'Valeu por responder o story. Estamos juntando pessoas que querem ajudar a construir ações por bairro e por pauta. Você toparia receber os próximos chamados?'
) on conflict do nothing;

-- Sempre curte
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Apoio Silencioso (Sempre curte)',
  'apoio',
  'Sempre curte, mas nunca comentou',
  'Para quem interage muito mas ainda não iniciou conversa textual.',
  'Oi! Vi que você acompanha bastante a página. Estamos organizando uma rede de apoio da pré-campanha do Alexandre VR Abandonada, com foco em escutar, cuidar e organizar. Posso te mandar um convite?'
) on conflict do nothing;

-- Perguntou como ajudar
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Como Ajudar',
  'ajuda',
  'Perguntou como ajudar',
  'Quando a pessoa demonstra interesse explícito em colaborar.',
  'Que bom ler isso. Estamos organizando algumas formas simples de participação: divulgar pautas, enviar relatos, chamar pessoas para encontros, ajudar em ações ou testar o app Missão ÉLuta. Qual dessas combina mais com você?'
) on conflict do nothing;

-- Convite para evento
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Convite para Evento',
  'evento',
  'Convite para evento de pré-campanha',
  'Para convidar pessoas engajadas para encontros presenciais.',
  'Oi! Estamos chamando pessoas que acompanham a página para um encontro de pré-campanha do Alexandre VR Abandonada. Vai ser um espaço para escutar demandas, organizar ideias e aproximar quem quer ajudar. Posso te mandar as informações?'
) on conflict do nothing;

-- Convite para Missão ÉLuta
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Convite Missão ÉLuta',
  'missão',
  'Convite para Missão ÉLuta',
  'Para convidar para testar o app de organização.',
  'Estamos testando o app Missão ÉLuta para organizar pessoas, pautas e pequenas missões de apoio. A ideia é facilitar a participação de quem quer ajudar, mesmo com pouco tempo. Quer receber o link quando liberarmos?'
) on conflict do nothing;

-- Quer ajudar, mas tem pouco tempo
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Apoio Leve (Pouco tempo)',
  'ajuda_leve',
  'Quer ajudar, mas tem pouco tempo',
  'Quando a pessoa quer ajudar mas avisa que está sem tempo.',
  'Tranquilo. Ajuda pequena também conta. Você pode participar compartilhando uma pauta por semana, respondendo enquetes ou enviando relatos do seu bairro. Quer ficar numa lista de chamados leves?'
) on conflict do nothing;

-- Quer ajudar presencialmente
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Apoio Presencial',
  'ajuda_presencial',
  'Quer ajudar presencialmente',
  'Quando a pessoa quer se envolver em ações físicas.',
  'Ótimo. Estamos organizando ações por pauta e por território. Você prefere ajudar em atividade de rua, reunião de bairro, evento, panfletagem, registro de demandas ou apoio de bastidor?'
) on conflict do nothing;

-- Tem relato
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Acolhimento de Relato',
  'relato',
  'Tem relato',
  'Quando a pessoa envia um problema ou situação do bairro.',
  'Seu relato é importante. Podemos organizar isso com cuidado, sem expor você, e transformar em pauta para cobrar solução. Você autoriza que a gente use o caso de forma anônima?'
) on conflict do nothing;

-- Não quer contato
insert into message_templates (name, theme, category, when_to_use, body)
values (
  'Respeito ao Não Contato',
  'bloqueio',
  'Não quer contato',
  'Quando a pessoa pede para não ser abordada.',
  'Sem problema nenhum. Obrigado por responder. Vou respeitar por aqui. Se em algum momento quiser acompanhar alguma ação ou enviar relato, a página segue aberta.'
) on conflict do nothing;
