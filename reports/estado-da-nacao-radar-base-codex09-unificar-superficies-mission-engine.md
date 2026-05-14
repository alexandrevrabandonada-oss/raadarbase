# Estado da Nação — CODEX09 — Unificar Superfícies com Mission Engine

Data: 2026-05-14  
Projeto: Radar de Base  
Escopo: alinhar `/pessoas`, `/abordagem` e `/dashboard` à mesma lógica operacional da Mission Engine já usada em `/minha-fila`, sem reescrever telas e sem remover fallback legado.

## Objetivo da rodada

Fazer as superfícies principais de operação falarem a mesma linguagem de missão:

- tipo de missão;
- fase;
- motivo;
- próximo passo;
- guardrail de contato;
- fallback seguro para a lógica antiga quando a engine não produzir missão.

## Arquivos principais alterados

### Adaptador e contrato de missão para `PriorityPerson`

- `C:/Projetos/Radar de Base/src/lib/missions/priority-person-mission-adapter.ts`
- `C:/Projetos/Radar de Base/src/lib/types.ts`
- `C:/Projetos/Radar de Base/src/lib/data/people-priority.ts`

## Superfícies integradas

### Pessoas

- `C:/Projetos/Radar de Base/src/components/radar/mission-card.tsx`
- `C:/Projetos/Radar de Base/src/components/radar/person-priority-card.tsx`
- `C:/Projetos/Radar de Base/src/components/radar/person-operational-list.tsx`

Resultado:

- cards e lista densa agora preferem metadata da Mission Engine;
- fase, motivo e próximo passo passam a sair da engine quando disponíveis;
- `Não Abordar` e bloqueios equivalentes passam a bloquear ações de contato também na lista operacional.

### Abordagem

- `C:/Projetos/Radar de Base/src/app/abordagem/kanban-client.tsx`

Resultado:

- cards do mural continuam com drag/avanço/retrocesso intactos;
- a missão da engine entrou como camada explicativa;
- cards bloqueados mostram guardrail ético visível;
- ações de contato ficam removidas/limitadas quando a missão está bloqueada.

### Dashboard

- `C:/Projetos/Radar de Base/src/components/radar/mission-card.tsx`
- `C:/Projetos/Radar de Base/src/lib/data/people-priority.ts`

Resultado:

- o bloco `Próximas Missões` agora renderiza com a mesma metadata de missão que abastece `Minha Jornada` e `Pessoas`;
- a narrativa diária continua vindo da Narrative Engine, sem duplicar raciocínio paralelo nos cards.

## Como a integração foi feita

### 1. Adaptador compatível com `PriorityPerson`

O novo adaptador:

- recebe `priorityPeople`, interações, tarefas, encaminhamentos e audit logs;
- chama a Mission Engine;
- anexa a missão à pessoa sem quebrar o shape legado.

Campos adicionados de forma opcional em `PriorityPerson`:

- `missionPlan`
- `missionTypeLabel`
- `missionPhaseLabel`
- `missionStateLabel`
- `missionReason`
- `missionNextStep`
- `missionGuardrailText`
- `missionSignals`
- `missionBlocksContact`
- `missionExplainability`
- `missionFallbackUsed`

### 2. Fonte principal unificada

`listPriorityPeople()` agora:

- continua montando o ranking legado;
- busca também `ig_person_referrals` e audit logs relevantes;
- anexa metadata da Mission Engine;
- reordena a saída por prioridade de missão quando houver missão;
- mantém o comportamento anterior quando a engine não produz nada para a pessoa.

### 3. Fallback preservado

Se a engine:

- não tiver sinais suficientes; ou
- devolver `null` para a pessoa;

as telas continuam usando:

- `priorityReason`
- `nextAction`
- `mapPersonToJourney`
- flags antigas de risco

sem quebrar o fluxo atual.

## Testes criados/atualizados

- `C:/Projetos/Radar de Base/src/lib/missions/priority-person-mission-adapter.test.ts`
- `C:/Projetos/Radar de Base/src/components/radar/mission-card.test.tsx`

Cobertura nova:

- `Não Abordar` gera missão `CUIDADO` bloqueada;
- DM preparada sem confirmação gera `RETORNO`;
- comentário recente com tema claro gera `ESCUTA`;
- fallback antigo continua funcionando quando `missionPlan` é nulo;
- `MissionCard` renderiza metadata de missão consumível por dashboard e demais superfícies.

## Validações executadas

Comandos:

- `npm run verify`
- `npm run check:rls`
- `npm run check:health`

Resultado:

- `lint`: sem erros, com 89 warnings antigos/adjacentes;
- `build`: passou;
- `test`: 39 arquivos e 247 testes passaram;
- `check:rls`: passou;
- `check:health`: passou;
- `e2e`: pulado localmente por ausência de `E2E_RUN=true`.

## Riscos restantes

1. `PersonQuickSheet` ainda não foi migrada para explicar missão com a mesma profundidade do card principal.  
   Hoje ela consome a pessoa já enriquecida, mas ainda carrega partes do raciocínio anterior.

2. O mural de `/abordagem` usa a missão como camada explicativa, mas ainda não move coluna com base em fase da engine.  
   Isso foi mantido de propósito para não quebrar drag/drop e workflow atual.

3. A ordenação de `PriorityPerson` agora favorece missão quando houver metadata.  
   Isso é desejado para convergência, mas vale revisão manual com dados reais para confirmar que a leitura operacional continua natural para coordenação e operador.

## Leitura final

`/minha-fila`, `/pessoas`, `/abordagem` e o bloco principal de missões do `/dashboard` agora compartilham a mesma camada explicável de missão.  
O raciocínio antigo segue vivo como fallback, então a integração ficou incremental e reversível.

## Status

GO

O tijolo ficou estável, validado e pronto para seguir para a próxima integração transversal sem abrir divergência nova entre superfícies.
