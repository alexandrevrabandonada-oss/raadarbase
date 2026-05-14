# Estado da Nacao - CODEX01 Diagnostico Mission Engine

Data: 2026-05-14
Commit de referencia: `ecdf489`

## Resumo executivo

O projeto ja possui quase toda a materia-prima da Mission Engine v1, mas essa logica ainda esta distribuida entre prioridade, jornada, quadro de abordagem, perfil de pessoa e missoes agregadas de dashboard.

Conclusao tecnica:

- **dados existem**
- **consumidores principais existem**
- **guardrails eticos ja estao espalhados pelo sistema**
- **o menor caminho seguro e extrair e centralizar, nao reinventar**

## Arquivos encontrados

### Fontes e tipos centrais

- `supabase/migrations/001_initial_schema.sql`
- `src/lib/supabase/database.types.ts`
- `src/lib/types.ts`
- `src/lib/data/people.ts`
- `src/lib/data/outreach.ts`
- `src/lib/data/people-priority.ts`
- `src/lib/data/person-profile.ts`
- `src/lib/outreach-workflow.ts`
- `src/lib/data/journey-mapper.ts`
- `src/lib/data/referrals.ts`
- `src/lib/data/messages.ts`
- `src/lib/audit/write-audit-log.ts`
- `src/app/actions.ts`

### Dominios adjacentes que podem enriquecer a engine

- `src/lib/data/field-agenda.ts`
- `src/lib/data/field-agenda-journey.ts`
- `src/lib/data/territories.ts`
- `src/lib/data/territory-mapper.ts`
- `src/lib/data/territorial-expansion.ts`
- `src/lib/data/strategic-memory.ts`
- `src/lib/data/volunteers.ts`
- `src/lib/data/volunteer-review-dashboard.ts`

### Rotas consumidoras principais

- `src/app/dashboard/page.tsx`
- `src/app/minha-fila/page.tsx`
- `src/app/pessoas/page.tsx`
- `src/app/abordagem/page.tsx`
- `src/app/ritmo/page.tsx`
- `src/app/relatorios/territorios/page.tsx`
- `src/app/campo/page.tsx`
- `src/app/memoria/page.tsx`
- `src/app/mensagens/page.tsx`
- `src/app/voluntarios/page.tsx`

### Componentes gameful relevantes

- `src/components/radar/mission-card.tsx`
- `src/components/radar/journey-bar.tsx`
- `src/components/radar/gameful-metric-card.tsx`
- `src/components/radar/ethical-guardrail-banner.tsx`
- `src/components/radar/operational-command-bar.tsx`
- `src/components/radar/compact-mode-toggle.tsx`
- `src/components/radar/field-mission-card.tsx`
- `src/components/radar/territory-node-card.tsx`
- `src/components/radar/rhythm-panel.tsx`
- `src/components/radar/alert-beacon.tsx`

## Dados disponiveis

### Base de pessoa/missao

Disponivel hoje:

- pessoa Instagram (`ig_people`)
- contatos e consentimento (`contacts`)
- interacoes (`ig_interactions`)
- tarefas/colunas de abordagem (`outreach_tasks`)
- templates ativos (`message_templates`)
- encaminhamentos (`ig_person_referrals`)
- auditoria (`audit_logs`)

Isso ja permite montar uma missao por pessoa com:

- fase atual;
- proxima acao;
- motivo da prioridade;
- bloqueios/esperas;
- responsavel;
- sugestao de mensagem;
- status de encaminhamento.

### Contexto adicional

Disponivel e reutilizavel depois:

- bairro e fase territorial
- eventos de campo e resultados
- memoria estrategica
- base consentida de voluntarios

## Lacunas encontradas

### 1. Logica fragmentada

Hoje a "missao" esta espalhada entre:

- `people-priority.ts`
- `journey-mapper.ts`
- `outreach-workflow.ts`
- `person-profile.ts`
- `mission-engine.ts`

Risco: duas telas diferentes podem explicar a mesma pessoa de formas ligeiramente diferentes.

### 2. Heuristica de encaminhamento

Parte da prioridade ainda trata encaminhamento como inferencia, quando o sistema ja possui `ig_person_referrals` como dado proprio.

### 3. Regua etica inconsistente

O criterio de "contato recente / espera etica" nao esta totalmente centralizado:

- uma parte olha `dm_manual`
- outra olha `lastInteractionAt`
- as janelas nao sao identicas

### 4. Nome `mission-engine` ja ocupado

Ja existe `src/lib/data/mission-engine.ts`, mas ele resolve missoes agregadas de dashboard/ritmo. A nova camada precisa evitar ambiguidade.

### 5. Dependencia de DTO misto

`PriorityPerson` e util, mas mistura fato, score, texto pronto, fase e guardrail num mesmo pacote. Para uma engine explicavel, vale separar melhor.

## Riscos

### Risco baixo

- criar uma camada pura em cima dos loaders atuais;
- usar testes unitarios para espelhar a logica existente;
- adaptar `PriorityPerson` a partir da nova engine sem trocar UI de primeira.

### Risco medio

- substituir criterios atuais de score ou fase cedo demais;
- tentar unificar tudo de uma vez, incluindo territorio, campo e memoria na primeira versao.

### Risco alto

- reusar o nome `mission-engine.ts` sem separar responsabilidades;
- introduzir schema novo antes de provar a camada logica;
- mexer no fluxo de DM, consentimento ou bloqueio etico junto com a engine.

## Proposta de arquivos para a engine

Estrutura recomendada:

- `src/lib/mission-engine/types.ts`
- `src/lib/mission-engine/inputs.ts`
- `src/lib/mission-engine/eligibility.ts`
- `src/lib/mission-engine/phase.ts`
- `src/lib/mission-engine/priority.ts`
- `src/lib/mission-engine/explanations.ts`
- `src/lib/mission-engine/build-person-mission.ts`
- `src/lib/mission-engine/build-queue-missions.ts`
- `src/lib/mission-engine/index.ts`

Adaptadores iniciais:

- `src/lib/data/people-priority.ts`
- `src/lib/data/person-profile.ts`

Primeiros consumidores:

- `/minha-fila`
- `/pessoas`
- `/abordagem`

## Recomendacao de implementacao incremental

### Etapa 1

Centralizar a logica atual sem mudar comportamento:

- fase
- elegibilidade
- bloqueio etico
- espera
- prioridade
- explicacao

### Etapa 2

Trocar heuristicas dispersas por fontes reais:

- encaminhamento real via `ig_person_referrals`
- regua etica unica

### Etapa 3

Enriquecer com contexto adicional:

- territorio
- campo
- memoria

## Validacoes executadas

Comandos rodados nesta rodada:

- `npm run verify`

Resultado:

- **passou**

Observacao:

- nao houve necessidade de alterar regra de negocio, banco ou UI para fechar este diagnostico;
- a rodada foi apenas de leitura, mapeamento e documentacao.

## Recomendacao final

**GO**

Justificativa:

- o estado atual do codigo ja permite implementar uma Mission Engine v1 por composicao;
- o menor caminho seguro esta claro;
- os principais riscos ja foram identificados antes de qualquer mudanca estrutural.
