# Estado da Nacao - CODEX04 Rhythm Engine

Data: 2026-05-14

## Resumo executivo

Foi criada a Rhythm Engine para transformar `/ritmo` em mesa de decisão da coordenação.

O foco desta rodada foi:

- agregar travas do ciclo sem expor cidadãos;
- escolher uma `Próxima decisão` por prioridade operacional;
- manter linguagem de apoio, não de cobrança;
- preservar as superfícies já existentes de ritmo, campo, território e cuidado.

## Arquivos criados

- `src/lib/rhythm/cycle-alert-engine.ts`
- `src/lib/rhythm/rhythm-summary.ts`
- `src/lib/rhythm/next-decision.ts`
- `src/lib/rhythm/rhythm-copy.ts`
- `src/lib/rhythm/cycle-alert-engine.test.ts`

## Arquivos alterados

- `src/app/ritmo/page.tsx`
- `src/app/ritmo/ritmo-client.tsx`

## O que a engine faz

### Alertas agregados do ciclo

A engine agora produz alertas para:

- missões sem responsável
- retornos pendentes
- encaminhamentos abertos
- cuidados urgentes
- campo sem fechamento
- território em mobilização sem ação
- memória pendente
- carga alta da equipe
- território pronto para ação

Cada alerta retorna:

- `type`
- `severity`
- `title`
- `description`
- `whyItMatters`
- `recommendedAction`
- `href`
- `count`
- `guardrailNote` quando necessário

### Próxima decisão

A engine escolhe uma decisão principal com esta ordem:

1. `urgent_care`
2. `pending_returns`
3. `unassigned_missions`
4. `open_referrals`
5. `field_without_closure`
6. `pending_memory`
7. `territory_ready`

Se não houver alertas, `/ritmo` cai em estado estável com copy de manutenção leve do ciclo.

### Resumo de ritmo

Também foi criada uma síntese agregada com:

- total de alertas
- alertas críticos
- alertas de atenção
- total de ciclos travados
- status agregado
- microcopy de orientação

## Aplicação em /ritmo

### Novo bloco "Próxima decisão"

O topo da página agora mostra:

- qual trava resolver primeiro
- por que isso importa agora
- qual o próximo passo recomendado
- CTA para a rota certa
- nota de guardrail quando houver

### Nova lista "Travas do ciclo"

As travas agora aparecem como beacons agregados, com:

- contagem
- tom visual por severidade
- texto de ação
- CTA direto

### Continuidade das superfícies existentes

Mantidos como apoio:

- `WeeklyRhythmCard`
- `DailyMission`
- saúde da operação
- cuidado da base
- territórios
- campo
- bem-estar
- adoção de fluxo
- gerador de fechamento semanal

## Fontes de dados usadas

Sem schema novo.

Reuso de agregações existentes:

- `getPilotDashboardData()`
- `getCollectiveProgressMetrics()`
- `getOperationalCycleAlerts()`
- `getStrategicMemoryStats()`
- `getTerritorialExpansionCandidates()`
- `getTeamFlowAdoptionMetrics()`
- `listFieldAgendaEvents()`
- `listFieldAgendaEventResultsByEventIds()`

## Guardrails mantidos

- sem ranking de operador
- sem melhor/pior operador
- sem exposição de cidadãos na visão agregada
- sem incentivo a volume de DM
- sem automação de DM

## Testes

Foram adicionados testes para:

- geração de alertas com severidade
- prioridade de `urgent_care` sobre retornos e sem responsável
- escolha de `pending_returns` quando não há cuidado urgente
- estado estável sem alertas
- prioridade de memória pendente antes de território pronto

Arquivo:

- `src/lib/rhythm/cycle-alert-engine.test.ts`

## Validação

Executado:

- `npx eslint src/app/ritmo/page.tsx src/app/ritmo/ritmo-client.tsx src/lib/rhythm/cycle-alert-engine.ts src/lib/rhythm/next-decision.ts src/lib/rhythm/rhythm-summary.ts src/lib/rhythm/rhythm-copy.ts src/lib/rhythm/cycle-alert-engine.test.ts`
- `npx vitest run src/lib/rhythm/cycle-alert-engine.test.ts`
- `npm run verify`

Resultado esperado desta rodada:

- engine agregada funcionando
- `/ritmo` orientado por decisão, não só por métrica
- sem regressão nas rotas existentes

## Riscos restantes

### 1. Parte dos números ainda vem de agregações diferentes

O Radar já tinha mais de uma fonte de backlog e health. Nesta rodada, a Rhythm Engine compõe essas fontes sem unificá-las estruturalmente.

### 2. `territory_without_action` ainda usa a leitura legada para bairros em mobilização sem plano

Funciona, mas vale consolidar esse cálculo depois dentro da própria camada `src/lib/rhythm/`.

### 3. Memória pendente ainda usa `draftCount` como proxy

É um bom mínimo para coordenação, mas pode evoluir depois para detectar memória esperada após campo e ainda não aberta.

## Próximo passo recomendado

Conectar a Mission Engine e a Rhythm Engine por um contrato comum de ciclo, para que `/dashboard`, `/minha-fila`, `/abordagem` e `/ritmo` compartilhem a mesma leitura de trava, próximo passo e fechamento.
