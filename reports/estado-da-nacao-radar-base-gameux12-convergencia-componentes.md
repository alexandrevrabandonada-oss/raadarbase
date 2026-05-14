# Estado da Nacao - GAMEUX12

## Objetivo

Convergir telas gameful restantes para o kit compartilhado, reduzindo duplicacao visual sem alterar regra de negocio, banco ou fluxo operacional de DM.

## Componentes locais mapeados

- `QueueCard`
- `QueueList`
- `PersonQuickSheet`
- `SystemAlertsSection`
- `QuickMapSection`
- `PersonPriorityCard`
- cards do `Mural de Missoes` em `/abordagem`

## Convergencias aplicadas

### Shared kit

- Criado `src/components/radar/alert-beacon.tsx` para unificar sinais operacionais com valor, detalhe, tom e CTA curto.

### `/dashboard`

- `SystemAlertsSection` saiu do card local `BeaconCard` e passou a usar `AlertBeacon`.
- `QuickMapSection` aproximou os blocos locais do kit usando `GamefulMetricCard` no resumo territorial.

### `/pessoas`

- `PersonPriorityCard` em modo card agora usa `MissionCard` como shell principal.
- Acoes complementares como `Assumir` e badges de responsavel ficaram no `footer`, sem manter um segundo layout paralelo.

### `/minha-fila`

- `QueueList` passou a mostrar `JourneyBar` compartilhado dentro da trilha.
- `QueueCard` trocou `JourneyProgress` por `JourneyBar`.
- Sinais sensiveis do card principal passaram a usar `EthicalGuardrailBanner`.

### `PersonQuickSheet`

- Trilha do topo convergiu para `JourneyBar`.
- Sinais de `Nao abordar` e `Contato recente` passaram a usar `EthicalGuardrailBanner`.
- Vazios de memoria recente e de encaminhamento passaram a usar `GamefulEmptyState`.

### `/abordagem`

- Indicadores do topo convergiram para `GamefulMetricCard`.
- Banner etico do mural convergiu para `EthicalGuardrailBanner`.
- O corpo dos cards do mural agora usa `MissionCard` quando ha `priority` associada, preservando auditoria, responsavel, movimento entre colunas, resposta rapida e CTA.
- Tarefas sem `priority` mantiveram fallback simples e conservador.

## Decisoes

- A convergencia foi feita por composicao, nao por reescrita de fluxo.
- Onde o comportamento era mais sensivel, o shell visual foi trocado primeiro e os handlers foram preservados.
- O kit continua sendo expandido por props e composicao, nao por copias de Tailwind.

## Riscos restantes

1. `/abordagem` ainda carrega logica e apresentacao no mesmo arquivo; a proxima rodada pode separar o card para reduzir carga cognitiva.
2. `PersonQuickSheet` continua grande e merece divisao interna por secoes, mas ja fala a mesma linguagem visual do restante.
3. Ha warnings antigos de lint fora do escopo desta rodada.

## Validacao

- `npm run verify`

Resultado esperado desta rodada:

- rotas principais compartilhando os mesmos shells visuais;
- menos variacao solta de cards locais;
- alertas, trilhas e vazios usando o mesmo vocabulário de componentes.
