# Radar de Base - Diagnostico Tecnico para Mission Engine v1

Data: 2026-05-14

## 1. Escopo deste diagnostico

Este documento mapeia o estado atual do Radar de Base antes da implementacao da Mission Engine v1.

Objetivo desta rodada:

- identificar dados existentes;
- localizar tipos, queries, mappers e componentes que ja produzem "quase missoes";
- entender quais rotas consomem esses dados;
- mapear guardrails eticos e operacionais ja embutidos;
- definir o menor caminho seguro para implementar uma engine explicavel sem mexer em banco, UI ou fluxo atual.

Fora de escopo:

- criar a engine agora;
- alterar schema;
- alterar regras de negocio;
- reescrever telas;
- mexer em Meta/Instagram ou automacao de DM.

## 2. Visao geral

O projeto ja possui um nucleo logico parcial de "missao", mas ele esta distribuido em modulos diferentes:

- prioridade de pessoa: `src/lib/data/people-priority.ts`
- jornada/fase de pessoa: `src/lib/data/journey-mapper.ts`
- quadro de abordagem: `src/lib/outreach-workflow.ts`
- perfil operacional individual: `src/lib/data/person-profile.ts`
- missoes agregadas de dashboard/ritmo: `src/lib/data/mission-engine.ts`

Em outras palavras: o produto ja sabe ranquear, rotular fase, sugerir proximo passo e aplicar bloqueios eticos. O que ainda falta e centralizar isso em uma camada explicavel e estavel, capaz de produzir uma "missao" unica por pessoa ou por fila sem duplicar heuristicas.

## 3. Fontes de dados existentes

### 3.1 Base Instagram e abordagem

| Dominio | Armazenamento / tipo | Arquivos principais | O que fornece hoje |
| --- | --- | --- | --- |
| Pessoas Instagram | `ig_people`, `IgPeopleRow`, `PersonWithContact` | `supabase/migrations/001_initial_schema.sql`, `src/lib/supabase/database.types.ts`, `src/lib/data/people.ts`, `src/lib/types.ts` | username, display_name, status, themes, notes, total_interactions, last_interaction_at, responsible_id, do_not_contact_reason |
| Interacoes Instagram | `ig_interactions`, `IgInteractionRow`, `InteractionWithPost` | `src/lib/data/people-priority.ts`, `src/lib/data/person-profile.ts`, `src/lib/types.ts` | comentarios, likes, story replies, DM manual, texto, tema, data, contexto de post |
| Contatos | `contacts`, `ContactRecord` | `src/lib/data/people.ts`, `src/app/actions.ts`, `src/lib/types.ts` | consentimento, canal, valor, last_contacted_at, confirmacao de contato |
| Tarefas de abordagem | `outreach_tasks`, `OutreachTaskRow`, `OutreachTask` | `src/lib/data/outreach.ts`, `src/lib/outreach-workflow.ts`, `src/app/actions.ts`, `src/lib/types.ts` | coluna atual, titulo, notas, responsavel, due_at, completed_at |
| Templates de mensagem | `message_templates`, `MessageTemplate` | `src/lib/data/messages.ts`, `src/lib/data/people-priority.ts`, `src/app/mensagens/page.tsx` | categoria, tema, body, when_to_use, ativo |
| Encaminhamentos | `ig_person_referrals`, `PersonReferral` | `src/lib/data/referrals.ts`, `src/app/actions.ts`, `src/lib/types.ts` | target_type, target_id, status, notes, responsavel, ultimo evento |
| Auditoria | `audit_logs`, `AuditLogEntry` | `src/lib/audit/write-audit-log.ts`, `src/app/actions.ts`, `src/lib/data/person-profile.ts`, `src/lib/types.ts` | trilha de acoes, resumo, entidade, ator, metadata |

### 3.2 Campo, territorio, memoria e apoio

| Dominio | Armazenamento / tipo | Arquivos principais | O que fornece hoje |
| --- | --- | --- | --- |
| Agenda de campo | `field_agenda_events`, `FieldAgendaEvent` | `src/lib/data/field-agenda.ts`, `src/lib/supabase/database.types.ts` | titulo, bairro, tema, tipo, status, horario, links de origem |
| Resultado de campo | `field_agenda_event_results`, `FieldAgendaEventResult` | `src/lib/data/field-agenda.ts`, `src/lib/data/field-agenda-journey.ts` | presenca, fechamento, follow-up, resumo por evento |
| Voluntarios de campo | `field_agenda_event_volunteers` | `src/lib/data/field-agenda.ts`, `src/lib/data/volunteers.ts` | equipe escalada por evento |
| Voluntariado | `campaign_volunteers`, `campaign_squads`, `campaign_squad_members` | `src/lib/data/volunteers.ts`, `src/lib/data/volunteer-review-dashboard.ts` | base consentida, squads, habilidades, disponibilidade, status |
| Memoria | `strategic_memories`, `strategic_memory_links` | `src/lib/data/strategic-memory.ts` | aprendizados, links com entidades, status, territorio, periodo |
| Territorio | agregacao derivada sobre pessoas/interacoes/eventos | `src/lib/data/territories.ts`, `src/lib/data/territory-mapper.ts`, `src/lib/data/territorial-expansion.ts` | fase territorial, calor, temas, eventos, memoria recente, acao recomendada |

### 3.3 Observacoes criticas sobre os dados

1. Nao existe tabela dedicada `do_not_contact`.
   Hoje o bloqueio etico mora em `ig_people.status = "nao_abordar"` e/ou `ig_people.do_not_contact_reason`.

2. O status de pessoa nao e o mesmo que a coluna de tarefa.
   - pessoa: enum `person_status`
   - tarefa/quadro: `KanbanColumnId` e `BoardColumnId`
   Existe mapper entre os dois, mas eles nao sao a mesma verdade.

3. O encaminhamento existe como dado real (`ig_person_referrals`), mas parte da logica de prioridade ainda usa heuristica.

4. Campo, territorio e memoria ja existem e podem enriquecer missoes, mas a jornada principal operador ainda nasce do conjunto pessoa + interacao + tarefa + template.

## 4. Queries, loaders e composicao atual

### 4.1 Loader mais importante para uma futura engine

O loader mais proximo de uma Mission Engine hoje e `listPriorityPeople()` em `src/lib/data/people-priority.ts`.

Ele compoe:

- `listPeople()`
- `outreach_tasks`
- `message_templates`
- `ig_interactions`

E produz `PriorityPerson`, que ja contem:

- motivo da prioridade;
- proxima acao;
- fase inferida;
- mensagem sugerida;
- score;
- responsibleId/responsibleName;
- flags de risco;
- indicio de bloqueio ou espera.

### 4.2 Outros loaders relevantes

| Loader / helper | Arquivo | Papel atual |
| --- | --- | --- |
| `listPeople()` | `src/lib/data/people.ts` | carrega pessoas e contatos |
| `listOutreachTasks()` | `src/lib/data/outreach.ts` | carrega tarefas com pessoa associada |
| `buildPersonOperationalProfile()` | `src/lib/data/person-profile.ts` | monta timeline e contexto detalhado da ficha individual |
| `mapPersonToJourney()` | `src/lib/data/journey-mapper.ts` | traduz status e contexto para fases `preparar/conversar/registrar/encaminhar/concluir` |
| `normalizeOutreachColumn()` / `mapBoardColumnToPersonStatus()` | `src/lib/outreach-workflow.ts` | normaliza colunas do mural e sincroniza status da pessoa |
| `listPersonReferralsForPerson()` | `src/lib/data/referrals.ts` | traz encaminhamentos reais de uma pessoa |
| `listFieldAgendaEvents()` | `src/lib/data/field-agenda.ts` | base de missoes de campo |
| `listStrategicMemories()` | `src/lib/data/strategic-memory.ts` | base da memoria da equipe |
| `calculateOperatorMission()` | `src/lib/data/mission-engine.ts` | missoes agregadas da interface, nao missoes explicaveis por pessoa |

## 5. Rotas que consomem esses dados

| Rota | Arquivo | Dados principais consumidos |
| --- | --- | --- |
| `/dashboard` | `src/app/dashboard/page.tsx` | `listPriorityPeople`, alertas operacionais, metricas de qualidade, territorios, campo, ritmo, wellness, `calculateOperatorMission` |
| `/minha-fila` | `src/app/minha-fila/page.tsx` | `listPriorityPeople`, filtro por `responsibleId`, pendencias antigas, jornada do operador |
| `/pessoas` | `src/app/pessoas/page.tsx` | `listPriorityPeople`, operadores ativos; usa a lista priorizada como base de operacao |
| `/abordagem` | `src/app/abordagem/page.tsx` | `listOutreachTasks`, `listPriorityPeople`, operadores ativos |
| `/ritmo` | `src/app/ritmo/page.tsx` | metricas agregadas, territorios, campo, alertas, adocao de fluxo, wellness, `calculateOperatorMission` |
| `/relatorios/territorios` | `src/app/relatorios/territorios/page.tsx` | `listTerritorySummaries`, `getTerritorialExpansionCandidates` |
| `/campo` | `src/app/campo/page.tsx` | `listFieldAgendaEvents`, resultados por evento, `getFieldJourneySnapshot` |
| `/memoria` | `src/app/memoria/page.tsx` | `listStrategicMemories` |
| `/mensagens` | `src/app/mensagens/page.tsx` | `listMessageTemplates` |
| `/voluntarios` | `src/app/voluntarios/page.tsx` | `getVolunteerStats`, `listVolunteers`, `listSquads`, `getVolunteerReviewDashboard` |

### Leitura pratica

- `dashboard`, `minha-fila`, `pessoas` e `abordagem` ja dependem fortemente da mesma materia-prima.
- `ritmo` usa a camada agregada, nao a camada individual.
- `territorios`, `campo`, `memoria`, `mensagens` e `voluntarios` sao dominios adjacentes que podem enriquecer explicacoes ou encaminhamentos futuros.

## 6. Componentes gameful ja existentes

Os componentes pedidos no escopo ja existem e definem o envelope visual onde a engine futura deve plugar:

| Componente | Arquivo | Papel atual |
| --- | --- | --- |
| `MissionCard` | `src/components/radar/mission-card.tsx` | card de missao para pessoa prioritaria, com motivo, fase, proxima acao e trilha |
| `JourneyBar` | `src/components/radar/journey-bar.tsx` | visual de etapas/fases |
| `GamefulMetricCard` | `src/components/radar/gameful-metric-card.tsx` | metricas compactas gameful |
| `EthicalGuardrailBanner` | `src/components/radar/ethical-guardrail-banner.tsx` | banner de restricao etica/manualidade |
| `OperationalCommandBar` | `src/components/radar/operational-command-bar.tsx` | barra persistente de proxima acao |
| `CompactModeToggle` | `src/components/radar/compact-mode-toggle.tsx` | toggle de modo compacto |
| `FieldMissionCard` | `src/components/radar/field-mission-card.tsx` | card de missao de campo |
| `TerritoryNodeCard` | `src/components/radar/territory-node-card.tsx` | card/no de territorio |
| `RhythmPanel` | `src/components/radar/rhythm-panel.tsx` | painel de ritmo, carga e bem-estar |
| `AlertBeacon` | `src/components/radar/alert-beacon.tsx` | sinal padronizado para alertas |

Observacao importante: a UI ja esta pronta para receber uma engine mais centralizada. O gargalo esta na logica e na forma como os dados sao consolidados, nao no kit visual.

## 7. Tipos, enums e mappers atuais

### 7.1 Tipos centrais

Principais tipos em `src/lib/types.ts`:

- `PersonStatus`
- `ConsentStatus`
- `KanbanColumnId`
- `PriorityPerson`
- `OutreachTask`
- `MessageTemplate`
- `PersonReferral`
- `AuditLogEntry`
- `TerritorySummary`
- `TerritoryDetail`

### 7.2 Enums e estados relevantes

`PersonStatus`:

- `novo`
- `responder`
- `abordado`
- `respondeu`
- `contato_confirmado`
- `nao_abordar`

`KanbanColumnId` e variantes normalizadas:

- `para_abordar`
- `mensagem_enviada`
- `esperando_resposta`
- `respondeu`
- `precisa_encaminhar`
- `convidado`
- `entrou_na_base`
- `primeira_acao_feita`
- `nao_insistir`
- `nao_abordar`

Fases de jornada inferidas por `mapPersonToJourney()`:

- `preparar`
- `conversar`
- `registrar`
- `encaminhar`
- `concluir`

Status de encaminhamento (`PersonReferralStatus`):

- `interessado`
- `convidado`
- `confirmado`
- `compareceu`
- `nao_compareceu`
- `nao_respondeu`
- `recusou`

### 7.3 Helpers e mappers relevantes

| Helper | Arquivo | Papel |
| --- | --- | --- |
| `normalizeOutreachColumn()` | `src/lib/outreach-workflow.ts` | normaliza colunas legadas |
| `mapBoardColumnToPersonStatus()` | `src/lib/outreach-workflow.ts` | reflete coluna em status da pessoa |
| `boardColumnNeedsDoNotContactReason()` | `src/lib/outreach-workflow.ts` | obriga razao ao fechar eticamente |
| `boardColumnCountsAsReferral()` | `src/lib/outreach-workflow.ts` | marca estados que contam como encaminhamento |
| `boardColumnIsPendingResponse()` | `src/lib/outreach-workflow.ts` | detecta espera por retorno |
| `computePriorityScore()` | `src/lib/data/people-priority.ts` | score atual de prioridade |
| `getNextAction()` | `src/lib/data/people-priority.ts` | texto de proxima acao atual |
| `getPriorityReason()` | `src/lib/data/people-priority.ts` | explicacao humana atual da prioridade |
| `mapPersonToJourney()` | `src/lib/data/journey-mapper.ts` | fase atual + proximo passo de jornada |

## 8. Guardrails existentes

Os guardrails mais importantes ja estao presentes em dados, actions e UI.

### 8.1 Nao abordar / bloqueio etico

Presenca atual:

- `ig_people.status = "nao_abordar"`
- `ig_people.do_not_contact_reason`
- `boardColumnNeedsDoNotContactReason()`
- banners e estados especificos em `MissionCard`, `PersonQuickSheet`, `QueueCard`, `PeopleClient`

### 8.2 Contato recente / espera etica

Presenca atual:

- `people-priority.ts` marca `riskFlags.recentOutreach` quando houve `dm_manual` recente
- `journey-mapper.ts` bloqueia com "Aguardar regua etica" quando `lastInteractionAt` e muito recente

Observacao: ja existe inconsistencia de janela temporal entre esses dois modulos.

### 8.3 Voluntariado consentido

Presenca atual:

- `campaign_volunteers` possui `consent_to_contact` e `consent_to_store_data`
- `src/lib/data/volunteers.ts` valida consentimento explicitamente
- `convertPersonToVolunteer()` em `src/app/actions.ts` nao converte sem consentimento claro

### 8.4 Mensagem manual / bloqueio de DM automatica

Presenca atual:

- `registerManualDm()` registra somente apos acao humana
- `recordDMPreparedAction()` faz auditoria/telemetria, nao envia nada
- telas de `Minha Jornada`, `Pessoas` e `Mensagens` repetem a regra de copiar, revisar e enviar manualmente
- modulo Meta documenta que DM automatica e proibida

### 8.5 Dados sensiveis e auditoria

Presenca atual:

- `audit_logs` e `writeAuditLog()` centralizam trilha de acoes
- `person-profile.ts` injeta auditoria na timeline operacional
- metricas agregadas usam proxies eticos como `do_not_contact_reason`
- territorio e relatorios trabalham por leitura agregada, nao por ranking politico individual

## 9. Lacunas tecnicas antes da Mission Engine

### 9.1 Heuristicas ainda dispersas

Hoje a "verdade da missao" esta fragmentada:

- score em `people-priority.ts`
- fase em `journey-mapper.ts`
- coluna em `outreach-workflow.ts`
- timeline em `person-profile.ts`
- agregados de missao em `mission-engine.ts`

Isso gera risco de divergencia funcional entre telas.

### 9.2 Encaminhamento real x encaminhamento inferido

`people-priority.ts` ainda usa heuristica para inferir `hasReferral` em alguns cenarios, em vez de consultar sempre `ig_person_referrals`.

### 9.3 Janela etica inconsistente

- `riskFlags.recentOutreach` usa janela curta sobre `dm_manual`
- `journey-mapper.ts` usa outra logica baseada em `lastInteractionAt`

Uma engine central precisa consolidar esse critero.

### 9.4 Colisoes de nomenclatura

Ja existe `src/lib/data/mission-engine.ts`, mas ele resolve missoes agregadas de dashboard/ritmo, nao uma engine explicavel por pessoa/fila.

Se a nova camada mantiver esse nome sem separacao clara, a ambiguidade vai piorar.

### 9.5 Dependencia excessiva de `PriorityPerson`

`PriorityPerson` ja e um DTO muito rico e util para a v1, mas ele mistura:

- dados brutos;
- score derivado;
- texto pronto de UI;
- guardrails;
- sugestao de mensagem.

Para uma engine explicavel, vale separar melhor:

- fatos de entrada;
- regras aplicadas;
- resultado de missao;
- explicacao textual.

## 10. Menor caminho seguro para implementar

### Recomendacao tecnica

A Mission Engine v1 deve nascer como uma camada pura de composicao sobre o que ja existe, sem alterar schema.

Sequencia segura:

1. reutilizar loaders atuais;
2. centralizar regras de fase, elegibilidade, bloqueio e proximo passo;
3. produzir um objeto `PersonMission` explicavel;
4. adaptar os consumidores atuais gradualmente, sem trocar UI de uma vez.

### Inputs minimos da v1

Para a primeira versao, a engine pode operar com:

- `PersonWithContact`
- interacoes recentes da pessoa
- tarefa ativa da pessoa
- encaminhamentos reais da pessoa
- templates ativos
- contexto opcional de territorio/campo/memoria

### Output minimo recomendado

Algo proximo de:

- `missionId`
- `personId`
- `phase`
- `status` (`ativa`, `bloqueada`, `espera`, `concluida`)
- `priority`
- `whyNow[]`
- `nextAction`
- `availableActions[]`
- `ethicalConstraints[]`
- `supportingContext` (template, referral, territory, campo, memoria)

## 11. Proposta de arquivos para a engine

Separacao conservadora recomendada:

- `src/lib/mission-engine/types.ts`
- `src/lib/mission-engine/inputs.ts`
- `src/lib/mission-engine/eligibility.ts`
- `src/lib/mission-engine/phase.ts`
- `src/lib/mission-engine/priority.ts`
- `src/lib/mission-engine/explanations.ts`
- `src/lib/mission-engine/build-person-mission.ts`
- `src/lib/mission-engine/build-queue-missions.ts`
- `src/lib/mission-engine/index.ts`

Integracoes iniciais sem quebra:

- `src/lib/data/people-priority.ts` pode virar adaptador temporario para a nova engine;
- `src/lib/data/person-profile.ts` pode consumir `PersonMission` para a ficha;
- `src/app/minha-fila/page.tsx`, `src/app/pessoas/page.tsx` e `src/app/abordagem/page.tsx` sao os melhores primeiros consumidores.

## 12. Recomendacao incremental

### Fase 1 - extracao sem mudar comportamento

- criar tipos e builders puros;
- espelhar a logica atual de prioridade/jornada;
- cobrir com testes unitarios;
- manter `PriorityPerson` como formato de saida adaptado.

### Fase 2 - substituir heuristicas dispersas

- trocar heuristica de referral por query real;
- unificar regra de espera etica;
- consolidar `nextAction`, `priorityReason` e `journey`.

### Fase 3 - enriquecer contexto

- incluir memoria, territorio e campo como contexto explicativo;
- gerar missoes tambem para coordenacao, nao so operador.

## 13. Conclusao

O Radar ja possui os dados, os tipos e os componentes necessarios para a Mission Engine v1.

O menor caminho seguro nao e inventar uma camada nova do zero, e sim centralizar a logica que hoje ja existe espalhada entre:

- `people-priority.ts`
- `journey-mapper.ts`
- `outreach-workflow.ts`
- `person-profile.ts`

Isso permite entregar uma engine explicavel, incremental e sem mudanca de schema, preservando os guardrails eticos e o comportamento atual das telas.
