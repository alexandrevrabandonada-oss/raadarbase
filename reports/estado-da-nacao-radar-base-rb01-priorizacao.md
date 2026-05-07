# Estado da Nacao RB01 - Priorizacao de Pessoas

Data: 2026-05-07

## Resumo

O projeto ja tem quase todas as pecas operacionais para um Radar de Base funcional sem abrir um modulo paralelo novo. O que existe hoje resolve bem a captura de sinais publicos, a leitura manual da pessoa, o registro de abordagem manual, o registro de resposta, a confirmacao de contato consentido, os templates de mensagem e o encaminhamento para voluntariado consentido.

O que ainda nao existe de forma fechada e confiavel e a trilha completa de priorizacao operacional:

1. uma resposta objetiva para "quem abordar hoje?";
2. uma justificativa humana pronta para a equipe;
3. um proximo passo estruturado por pessoa;
4. persistencia confiavel do quadro de abordagem;
5. vinculos explicitos entre pessoa, encaminhamento para evento, grupo, voluntariado ou missao.

Em termos praticos: os dados-base ja existem, mas a priorizacao ainda esta espalhada entre `/pessoas`, `/pessoas/[id]`, `/abordagem` e `/mensagens`.

## Tabelas Que Ja Resolvem Parte Do Problema

### `ig_people`

Resolve o cadastro operacional basico da pessoa oriunda das interacoes publicas.

Campos observados em uso:
- `id`
- `username`
- `display_name`
- `total_interactions`
- `last_interaction_at`
- `themes`
- `status`
- `notes`
- `do_not_contact_reason`
- `synced_at`

Ja responde parcialmente:
- quem abordar;
- por que abordar;
- se ja foi abordada;
- se respondeu;
- se esta marcada como `nao_abordar`.

### `ig_interactions`

Resolve o historico de sinais publicos e a linha do tempo da relacao.

Campos observados em uso:
- `id`
- `person_id`
- `post_id`
- `type`
- `occurred_at`
- `text_content`
- `theme`

Tipos observados:
- `comentario`
- `curtida`
- `resposta_story`
- `dm_manual`
- `mencao`

Ja responde parcialmente:
- por que abordar;
- quais interacoes recentes importam;
- se houve DM manual registrada.

### `contacts`

Resolve consentimento e meios de contato estruturados.

Campos observados em uso:
- `person_id`
- `contact_channel`
- `contact_value`
- `phone`
- `email`
- `consent_given`
- `consent_purpose`
- `consent_recorded_at`
- `consent_status`
- `last_contacted_at`
- `source`

Ja responde parcialmente:
- se existe contato consentido;
- se houve contato recente;
- se a pessoa nao quer contato.

### `outreach_tasks`

Resolve a fila operacional de abordagem.

Campos observados em uso:
- `id`
- `person_id`
- `column_key`
- `title`
- `notes`
- `due_at`
- `completed_at`
- `created_at`

Ja responde parcialmente:
- qual proximo passo;
- se existe tarefa de abordagem aberta;
- em que etapa operacional a pessoa esta.

Limitacao critica:
- a tela `/abordagem` aparenta movimentar tarefas entre colunas apenas no estado local do cliente; nao ficou evidente persistencia da mudanca de coluna na camada atual.

### `message_templates`

Resolve o repertorio de mensagens manuais.

Campos observados em uso:
- `id`
- `name`
- `theme`
- `body`
- `active`
- `updated_at`

Ja responde parcialmente:
- qual mensagem sugerida usar;
- como manter mensagens por tema sem automatizar envio.

### `field_agenda_events`

Resolve atividades de campo e encaminhamento coletivo.

Campos observados em uso:
- `id`
- `title`
- `description`
- `type`
- `status`
- `neighborhood`
- `topic_slug`
- `starts_at`
- `ends_at`
- `location_text`
- `public_url`
- `metadata`

Ja responde parcialmente:
- qual proximo passo coletivo;
- para qual evento ou acao faz sentido encaminhar.

### `field_agenda_event_results`

Resolve resultado agregado de campo.

Campos observados em uso:
- `id`
- `event_id`
- `result_summary`
- `estimated_people_count`
- `topics_discussed`
- `neighborhoods_mentioned`
- `next_steps`
- `metadata`

Utilidade para Radar de Base:
- baixa para priorizacao individual direta;
- alta para contexto de territorio e follow-up coletivo.

### `campaign_volunteers`

Resolve a conversao da pessoa para base ativa consentida de voluntariado.

Campos observados em uso:
- `id`
- `display_name`
- `neighborhood`
- `city`
- `contact_email`
- `contact_phone`
- `contact_preference`
- `consent_to_contact`
- `consent_to_store_data`
- `availability`
- `skills`
- `interests`
- `status`
- `source`
- `metadata`

Ja responde parcialmente:
- se houve encaminhamento para voluntariado;
- em que estado o voluntario esta.

### `campaign_volunteer_applications`

Resolve a fila de inscricoes publicas com revisao humana.

Campos observados em uso:
- `id`
- `display_name`
- `neighborhood`
- `city`
- `contact_email`
- `contact_phone`
- `contact_preference`
- `consent_to_contact`
- `consent_to_store_data`
- `availability`
- `skills`
- `interests`
- `status`
- `review_notes`
- `reviewed_by`
- `reviewed_at`
- `converted_volunteer_id`
- `retention_status`
- `retention_reason`

Ja responde parcialmente:
- se houve encaminhamento para voluntariado;
- se foi aprovado, rejeitado ou arquivado;
- se virou voluntario de fato.

## Como O App Responde Hoje As 7 Perguntas

### 1. Quem abordar hoje?

Resposta atual: parcial.

Hoje isso e inferido por combinacao de:
- `/pessoas` ordenando por `last_interaction_at` ou `total_interactions`;
- filtros por `status` e `theme`;
- `/abordagem` com tarefas existentes em `outreach_tasks`.

O app ainda nao entrega uma priorizacao operacional unificada pronta para a equipe.

### 2. Por que essa pessoa deve ser abordada?

Resposta atual: parcial, mas boa.

Ja existem sinais suficientes:
- volume de interacoes (`total_interactions`);
- recencia (`last_interaction_at`);
- timeline detalhada em `ig_interactions`;
- temas (`themes` e `interaction.theme`);
- notas internas.

Falta consolidar isso em uma explicacao curta e humana na lista principal.

### 3. Qual mensagem sugerida?

Resposta atual: parcial.

Hoje existe:
- mensagem base em `/pessoas/[id]`, derivada do primeiro tema;
- biblioteca de templates em `/mensagens`.

Falta:
- associar melhor template e etapa operacional;
- sugerir template por contexto sem automatizar envio.

### 4. Qual proximo passo?

Resposta atual: parcial.

Hoje isso aparece de forma espalhada:
- status da pessoa;
- coluna da tarefa em `outreach_tasks`;
- possibilidade de marcar resposta, contato confirmado ou nao abordar;
- possibilidade futura de encaminhar para campo ou voluntariado.

Falta um campo operacional unico de "proximo passo recomendado".

### 5. A pessoa ja foi abordada?

Resposta atual: sim, com ressalvas.

Sinais existentes:
- `ig_people.status = abordado`;
- interacao `ig_interactions.type = dm_manual`;
- `contacts.last_contacted_at`;
- audit logs.

Ressalva:
- depende de disciplina operacional para registrar a abordagem manual.

### 6. Ela respondeu?

Resposta atual: sim.

Sinais existentes:
- `ig_people.status = respondeu`;
- timeline de interacoes;
- notes e audit logs.

### 7. Foi encaminhada para evento, grupo, voluntariado ou missao?

Resposta atual: incompleta.

Hoje existe bem:
- encaminhamento para voluntariado via `campaign_volunteer_applications` e `campaign_volunteers`;
- organizacao de voluntarios em squads e eventos.

Hoje falta explicitamente:
- vinculo pessoa -> evento de campo;
- vinculo pessoa -> grupo;
- vinculo pessoa -> missao de mobilizacao;
- trilha unificada de encaminhamento por pessoa.

## Camada De Dados E Rotas Mais Relevantes

### `src/lib/data/people.ts`

Ja faz:
- lista pessoas;
- combina `ig_people` com `contacts`;
- entrega contato, status, temas e notas.

Gap:
- nao calcula score operacional;
- nao gera motivo de prioridade;
- nao gera proximo passo.

### `src/lib/data/interactions.ts`

Ja faz:
- carrega timeline por pessoa;
- traz post vinculado quando existe.

Gap:
- nao gera resumo operacional pronto para priorizacao.

### `src/lib/data/outreach.ts`

Ja faz:
- lista tarefas da abordagem;
- vincula tarefa a pessoa.

Gap critico:
- so lista; nao ficou visivel nesta camada a persistencia de mudancas de coluna feitas na UI.

### `src/lib/data/messages.ts`

Ja faz:
- listar templates.

Gap:
- nao ha relacao estruturada template <-> etapa de abordagem <-> tipo de sinal.

### `src/lib/data/volunteers.ts`

Ja faz:
- listar voluntarios;
- detalhar squads;
- vincular voluntarios a eventos de campo.

Gap para Radar de Base:
- modulo opera depois da conversao para voluntariado;
- nao fecha o elo com a pessoa do Instagram na trilha principal.

### `src/lib/data/volunteer-applications.ts`

Ja faz:
- submissao publica consentida;
- fila de revisao;
- aprovacao e conversao para `campaign_volunteers`.

Gap para Radar de Base:
- nao ha hoje um vinculo explicito do fluxo `/pessoas/[id]` para gerar ou registrar esse encaminhamento.

## Componentes E Paginas Que Ja Carregam A Jornada

### `/pessoas`

Papel atual:
- lista operacional de pessoas;
- filtro por status e tema;
- ordenacao por recencia e interacoes;
- mostra username, total de interacoes, ultima interacao, temas e status.

Bom ponto de entrada para:
- score simples;
- motivo da prioridade;
- sugestao de proximo passo.

### `/pessoas/[id]`

Papel atual:
- visao 360 da pessoa;
- timeline de interacoes;
- resumo de temas;
- acoes manuais de abordagem;
- notas e tags.

Bom ponto para:
- mostrar por que a pessoa entrou em prioridade;
- sugerir template;
- registrar encaminhamento.

### `/abordagem`

Papel atual:
- quadro operacional por etapas.

Bom ponto para:
- fila de hoje;
- SLA de abordagem;
- proximos passos.

Risco:
- alta chance de desalinhamento operacional se a movimentacao entre colunas nao persistir.

### `/mensagens`

Papel atual:
- repositrio de templates ativos.

Bom ponto para:
- amarrar template por tema e etapa;
- manter tudo manual e humano.

### `/campo`

Papel atual:
- agenda de acoes coletivas;
- proximos eventos por territorio e tema.

Bom ponto para:
- exibir eventos sugeridos como proximo passo.

### `/voluntarios`

Papel atual:
- gerenciar base consentida de voluntarios ativos;
- exportar com restricoes;
- revisar inscricoes.

Bom ponto para:
- receber encaminhamentos apos resposta e consentimento.

## Campos Que Ja Existem

### Para priorizacao
- `ig_people.total_interactions`
- `ig_people.last_interaction_at`
- `ig_people.themes`
- `ig_interactions.type`
- `ig_interactions.occurred_at`
- `ig_interactions.theme`
- `ig_interactions.text_content`

### Para status de contato
- `ig_people.status`
- `ig_people.notes`
- `ig_people.do_not_contact_reason`
- `contacts.consent_status`
- `contacts.last_contacted_at`

### Para fila de abordagem
- `outreach_tasks.column_key`
- `outreach_tasks.due_at`
- `outreach_tasks.completed_at`
- `outreach_tasks.notes`

### Para mensagens
- `message_templates.theme`
- `message_templates.body`
- `message_templates.active`

### Para encaminhamento
- `campaign_volunteer_applications.status`
- `campaign_volunteer_applications.converted_volunteer_id`
- `campaign_volunteers.status`
- `field_agenda_events.*`

## Campos Que Faltam Ou Nao Estao Fechados

### Faltam no nivel operacional
- score operacional calculado;
- motivo da prioridade em linguagem humana;
- proximo passo recomendado estruturado;
- ultimo resultado da abordagem;
- tipo de encaminhamento realizado;
- data do ultimo encaminhamento;
- template sugerido por pessoa/tarefa.

### Faltam nos vinculos
- pessoa -> evento indicado;
- pessoa -> evento confirmado/presente;
- pessoa -> grupo;
- pessoa -> missao;
- pessoa -> inscricao de voluntariado originada da abordagem.

### Faltam na persistencia do fluxo
- persistencia confiavel do movimento do quadro `/abordagem`;
- audit log claro de mudanca de etapa de abordagem;
- separacao melhor entre status da pessoa e status da tarefa.

## Rotas Que Devem Ser Alteradas Nos Proximos Tijolos

### `/pessoas`

Mudancas recomendadas:
- adicionar score operacional calculado em leitura;
- adicionar "motivo da prioridade";
- adicionar "proximo passo";
- permitir ordenacao por prioridade.

Risco:
- tela e central para o time; qualquer regressao de consulta ou excesso visual piora a operacao diaria.

### `/pessoas/[id]`

Mudancas recomendadas:
- consolidar explicacao de prioridade;
- sugerir template manual;
- registrar encaminhamento para evento, grupo, voluntariado ou missao;
- mostrar historico de abordagem de forma mais operacional.

Risco:
- acoes desta tela atualizam status, consentimento e audit log; mexer sem cuidado pode embaralhar semantica de contato e revisao.

### `/abordagem`

Mudancas recomendadas:
- persistir mudanca de coluna;
- mostrar vencimento, urgencia e proximo passo;
- permitir abrir a pessoa certa sem perder contexto.

Risco:
- risco operacional alto porque a UI atual passa impressao de fluxo ativo mesmo sem persistencia clara.

### `/mensagens`

Mudancas recomendadas:
- relacionar templates a tema e etapa de abordagem;
- melhorar sugeridor manual, sem envio automatico.

Risco:
- baixo a medio; risco principal e degradar a simplicidade e criar burocracia desnecessaria.

### `/campo`

Mudancas recomendadas:
- expor melhor eventos utilizaveis como encaminhamento;
- futuramente registrar indicacoes por pessoa.

Risco:
- medio; o modulo hoje e coletivo e territorial. Nao deve virar CRM individual desorganizado.

### `/voluntarios`

Mudancas recomendadas:
- receber origem mais explicita do encaminhamento;
- mostrar melhor a trilha "pessoa -> inscricao -> voluntario".

Risco:
- medio; nao pode furar revisao humana, consentimento nem guardrails de contato.

## Riscos Tecnicos Atuais

1. `/abordagem` aparenta ter mudanca de coluna local no cliente sem persistencia server-side.
2. O app usa bastante leitura com admin client; qualquer nova agregacao precisa cuidado para nao aumentar superficie de exposicao indevida.
3. O status da pessoa esta carregando muita semantica sozinho; isso tende a confundir abordagem, resposta e encaminhamento.
4. Nao ha ainda um modelo explicito de encaminhamento individual para evento, grupo ou missao.
5. Templates existem, mas sem estrategia estruturada de sugestao por etapa.
6. O fluxo depende de registro manual disciplinado; isso e correto politicamente, mas pede UI muito clara.

## Proposta De Score Operacional Simples

Objetivo: responder "quem abordar hoje?" sem perfil psicologico, sem inferencia sensivel e sem score politico.

Score sugerido, calculado em leitura, nao persistido neste primeiro momento:

- `+4` comentario nos ultimos 7 dias
- `+3` resposta de story nos ultimos 7 dias
- `+2` mencao recente
- `+1` curtida recente repetida
- `+3` 3 ou mais interacoes publicas nos ultimos 14 dias
- `+2` existe tarefa de abordagem aberta com vencimento hoje ou atrasado
- `+2` pessoa ja respondeu anteriormente
- `+2` contato consentido confirmado
- `-100` `status = nao_abordar`
- `-50` `do_not_contact_reason` preenchido

Regras de uso:
- score serve para fila operacional, nao para classificacao politica;
- mostrar sempre o motivo em texto;
- nunca usar dado sensivel, inferencia ideologica ou comportamento privado.

## Proposta De Status De Abordagem

Hoje o projeto ja tem:
- `novo`
- `responder`
- `abordado`
- `respondeu`
- `contato_confirmado`
- `nao_abordar`

Recomendacao incremental:

### Status da pessoa
- `novo`
- `abordado`
- `respondeu`
- `contato_confirmado`
- `nao_abordar`

### Status da tarefa de abordagem
- `novo`
- `responder_comentario`
- `mandar_dm_manual`
- `aguardando_resposta`
- `convidar_grupo`
- `contato_confirmado`
- `nao_abordar`

### Encaminhamento final
- `encaminhado_evento`
- `encaminhado_grupo`
- `encaminhado_voluntariado`
- `encaminhado_missao`

Os tres niveis nao devem ser espremidos em um unico campo.

## Proposta De Motivo Da Prioridade Em Linguagem Humana

Exemplos recomendados:

- "Comentou 3 vezes nos ultimos 7 dias e ainda nao recebeu abordagem registrada."
- "Respondeu a uma abordagem manual e ja tem contexto para proximo passo."
- "Interagiu recentemente sobre transporte e existe tarefa aberta de abordagem."
- "Ja tem contato consentido confirmado; pode ser convidada para atividade coletiva."
- "Participou publicamente mais de uma vez no mesmo tema nas ultimas duas semanas."

Objetivo:
- texto curto;
- baseado em sinais observaveis;
- sem inferencia psicologica;
- sem linguagem de voto;
- sem classificar a pessoa politicamente.

## Recomendacoes De Implementacao Incremental

### Tijolo RB02

Atuar em `/pessoas` e `src/lib/data/people.ts`.

Entregar:
- score operacional calculado em leitura;
- motivo da prioridade;
- ordenacao por prioridade;
- destaque visual de quem abordar hoje.

### Tijolo RB03

Atuar em `/pessoas/[id]` e `/mensagens`.

Entregar:
- sugestao manual de template por contexto;
- bloco de "proximo passo recomendado";
- registro simples de encaminhamento.

### Tijolo RB04

Atuar em `/abordagem`.

Entregar:
- persistencia real de mudanca de coluna;
- SLA de tarefa;
- audit log da etapa de abordagem.

### Tijolo RB05

Atuar em `/campo` e `/voluntarios`.

Entregar:
- registrar encaminhamento da pessoa para evento;
- registrar encaminhamento da pessoa para voluntariado;
- manter consentimento, revisao humana e sem automacao.

## Conclusao

O Radar de Base nao precisa nascer como modulo separado. A base certa ja existe:
- `/pessoas` para priorizar;
- `/pessoas/[id]` para contextualizar;
- `/abordagem` para operar;
- `/mensagens` para apoiar a escrita;
- `/campo` e `/voluntarios` para encaminhar.

O gargalo principal nao e falta de dominio. E falta de costura operacional entre dominios que ja existem.

O primeiro passo tecnicamente mais util e adicionar priorizacao explicavel em `/pessoas`. O segundo, quase obrigatorio, e persistir de verdade o fluxo de `/abordagem`.
