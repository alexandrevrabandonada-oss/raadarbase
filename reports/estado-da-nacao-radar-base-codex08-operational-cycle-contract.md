# Estado da Nação: CODEX08 Operational Cycle Contract

Data: 2026-05-14  
Base: `ecdf489` + mudanças locais até CODEX08

## Objetivo

Criar um contrato compartilhado de ciclo operacional para alinhar `Mission Engine`, `Rhythm Engine`, `Narrative Engine` e `Field-Memory Loop`, sem reescrever engines nem alterar comportamento visual.

## Entregas

### Camada nova

Arquivos criados em [C:/Projetos/Radar de Base/src/lib/operational-cycle](</C:/Projetos/Radar de Base/src/lib/operational-cycle>):

- [cycle-types.ts](</C:/Projetos/Radar de Base/src/lib/operational-cycle/cycle-types.ts>)
- [cycle-priority.ts](</C:/Projetos/Radar de Base/src/lib/operational-cycle/cycle-priority.ts>)
- [cycle-copy.ts](</C:/Projetos/Radar de Base/src/lib/operational-cycle/cycle-copy.ts>)
- [cycle-contract.test.ts](</C:/Projetos/Radar de Base/src/lib/operational-cycle/cycle-contract.test.ts>)

### Vocabulário comum padronizado

#### Tipos de ciclo

- `person`
- `mission`
- `rhythm`
- `field`
- `memory`
- `territory`

#### Severidades

- `stable`
- `info`
- `attention`
- `care`
- `critical`

#### Estados comuns

- `suggested`
- `active`
- `waiting`
- `blocked`
- `completed`
- `archived`

#### Guardrails comuns

- `do_not_contact`
- `recent_contact`
- `consent_required`
- `sensitive_data`
- `waiting_window`
- `overload`
- `manual_action_required`

#### Ações comuns

- `review`
- `prepare_message`
- `open_instagram`
- `confirm_manual_send`
- `register_response`
- `refer`
- `pause`
- `archive`
- `create_field_action`
- `register_result`
- `create_memory`

#### Copy comum

- `Cuidar também é pausar.`
- `Interesse não é consentimento.`
- `Mensagem manual: confirme apenas depois de enviar.`
- `Campo sem memória ainda é ciclo aberto.`
- `Ciclo fechado com segurança.`

## Aplicação mínima nas engines

### Mission Engine

Arquivos tocados:

- [C:/Projetos/Radar de Base/src/lib/missions/mission-types.ts](</C:/Projetos/Radar de Base/src/lib/missions/mission-types.ts>)
- [C:/Projetos/Radar de Base/src/lib/missions/mission-copy.ts](</C:/Projetos/Radar de Base/src/lib/missions/mission-copy.ts>)
- [C:/Projetos/Radar de Base/src/lib/missions/mission-engine.ts](</C:/Projetos/Radar de Base/src/lib/missions/mission-engine.ts>)

Aplicação:

- `MissionSubjectType` agora deriva do contrato comum;
- severidade de sinais usa subconjunto da severidade compartilhada;
- guardrails reutilizam copy comum onde faz sentido;
- ações passaram a carregar `cycleAction` sem mudar o `kind` legado.

### Rhythm Engine

Arquivos tocados:

- [C:/Projetos/Radar de Base/src/lib/rhythm/cycle-alert-engine.ts](</C:/Projetos/Radar de Base/src/lib/rhythm/cycle-alert-engine.ts>)
- [C:/Projetos/Radar de Base/src/lib/rhythm/next-decision.ts](</C:/Projetos/Radar de Base/src/lib/rhythm/next-decision.ts>)
- [C:/Projetos/Radar de Base/src/lib/rhythm/rhythm-copy.ts](</C:/Projetos/Radar de Base/src/lib/rhythm/rhythm-copy.ts>)
- [C:/Projetos/Radar de Base/src/lib/rhythm/rhythm-summary.ts](</C:/Projetos/Radar de Base/src/lib/rhythm/rhythm-summary.ts>)
- [C:/Projetos/Radar de Base/src/app/ritmo/ritmo-client.tsx](</C:/Projetos/Radar de Base/src/app/ritmo/ritmo-client.tsx>)

Aplicação:

- alertas passaram a usar `stable | attention | critical`;
- mapeamento visual para a UI atual foi preservado no client de ritmo;
- comportamento visual não mudou, só o vocabulário interno.

### Narrative Engine

Arquivo tocado:

- [C:/Projetos/Radar de Base/src/lib/narrative/narrative-copy.ts](</C:/Projetos/Radar de Base/src/lib/narrative/narrative-copy.ts>)

Aplicação:

- lista de palavras proibidas agora vem da camada comum;
- a validação de texto proibido passou a usar `assertOperationalCycleText`;
- parte da copy reutiliza frases compartilhadas de guardrail e fechamento.

### Field-Memory Loop

Arquivo tocado:

- [C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.ts](</C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.ts>)

Aplicação:

- `FieldLoopMission` ganhou `state` comum;
- `FieldMemorySuggestion` ganhou `state` comum;
- severidade passou a usar `attention | critical`;
- a missão de campo sem memória reutiliza a copy compartilhada.

## Testes

Novos testes:

- [C:/Projetos/Radar de Base/src/lib/operational-cycle/cycle-contract.test.ts](</C:/Projetos/Radar de Base/src/lib/operational-cycle/cycle-contract.test.ts>)

Cobertura validada:

- palavras proibidas não entram na copy comum;
- `do_not_contact` sempre resolve para `critical`;
- `manual_action_required` não permite inferência de automação.

Também revalidei testes das engines já existentes:

- `mission-engine.test.ts`
- `cycle-alert-engine.test.ts`
- `narrative-engine.test.ts`
- `field-memory-loop.test.ts`

## Validação

Executado:

- `npm run verify`

Resultado:

- lint sem erros, com **89 warnings** antigos/adjacentes
- build passou
- **37 arquivos de teste** e **242 testes** passaram
- `check:rls` passou
- `check:health` passou
- E2E local segue pulado sem `E2E_RUN=true`

## Riscos restantes

- o contrato comum ainda convive com estados legados em maiúsculas na Mission Engine por compatibilidade;
- nem todas as superfícies de UI consomem ainda `cycleAction` ou `state` comum;
- o mapeamento entre severidade compartilhada e tons visuais continua distribuído em alguns clients, especialmente em `ritmo-client.tsx`;
- o contrato reduz duplicação conceitual, mas não substitui ainda todos os tipos locais históricos.

## Resultado prático

As engines continuam funcionando como antes, mas agora compartilham:

- vocabulário base de ciclo;
- semântica comum de severidade;
- guardrails centrais;
- copy ética reutilizável;
- ações operacionais nomeadas de forma consistente.

## Recomendação

**GO**

O contrato foi introduzido de forma conservadora, sem quebra de UI, sem schema e sem regressão de testes. O próximo passo seguro é usar `cycleAction` e `OperationalCycleState` como adaptadores de integração nas próximas rotas, em vez de abrir novos dialetos locais.
