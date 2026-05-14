# Estado da Nacao - CODEX02 Mission Engine v1

Data: 2026-05-14

## Resumo executivo

Foi criada a Mission Engine v1 como camada pura de logica em `src/lib/missions/`, sem alterar banco, UI, integracao Meta/Instagram ou fluxo operacional existente.

O objetivo desta rodada foi transformar sinais ja existentes em missoes operacionais explicaveis, com tipos, fases, estados, guardrails, prioridade e proximos passos claros.

## Arquivos criados

- `src/lib/missions/mission-types.ts`
- `src/lib/missions/mission-engine.ts`
- `src/lib/missions/mission-priority.ts`
- `src/lib/missions/mission-guards.ts`
- `src/lib/missions/mission-copy.ts`
- `src/lib/missions/mission-mappers.ts`
- `src/lib/missions/mission-engine.test.ts`

## O que a engine faz

### Tipos oficiais de missao

- `ESCUTA`
- `VINCULO`
- `RETORNO`
- `ENCAMINHAMENTO`
- `CUIDADO`
- `CAMPO`
- `MEMORIA`

### Fases

- `PREPARAR`
- `CONVERSAR`
- `REGISTRAR`
- `ENCAMINHAR`
- `CONCLUIR`

### Estados

- `SUGERIDA`
- `ASSUMIDA`
- `EM_ANDAMENTO`
- `EM_ESPERA`
- `BLOQUEADA`
- `CONCLUIDA`
- `ARQUIVADA`

### Output padrao por missao

Cada missao agora retorna:

- id estavel
- tipo
- fase
- estado
- titulo
- subjectType
- subjectId
- motivo
- sinais
- guardrail
- nextStep
- primaryAction
- secondaryActions
- prioridade
- createdFrom
- explainabilityText

## Regras cobertas nesta v1

- `Nao Abordar` gera missao `CUIDADO`, `BLOQUEADA`, com acao primaria de respeitar bloqueio
- contato recente gera `CUIDADO` em `EM_ESPERA`
- DM preparada sem confirmacao gera `RETORNO`
- resposta positiva sem destino gera `ENCAMINHAMENTO`
- comentario recente com tema claro gera `ESCUTA`
- interacoes recorrentes geram `VINCULO`
- evento de campo sem fechamento gera `CAMPO`
- prioridade coloca `CUIDADO` acima de `ESCUTA`

## Decisoes tecnicas

### 1. Camada pura e isolada

A engine nao consulta banco e nao depende de tela. Ela recebe inputs tipados e devolve missoes.

### 2. Reuso conservador do modelo atual

A v1 foi desenhada para falar com os dados e heuristicas que o projeto ja possui hoje:

- pessoas
- interacoes
- contatos
- tarefas
- auditoria de DM preparada/enviada
- encaminhamentos
- eventos de campo

### 3. Guardrails eticos embutidos

A engine impede que uma missao bloqueada sugira contato e trata manualidade como regra explicita, nao como detalhe de UI.

## Testes implementados

Foram adicionados testes unitarios para:

- bloqueio por `Nao Abordar`
- `RETORNO` por DM preparada
- `ESCUTA` por comentario recente
- `VINCULO` por recorrencia
- `ENCAMINHAMENTO` por resposta positiva
- `CUIDADO` por espera longa
- `CAMPO` por evento sem fechamento
- prioridade de `CUIDADO` acima de `ESCUTA`

## Riscos restantes

### 1. Ainda nao integrada aos loaders atuais

Nesta rodada a engine foi criada, mas nao substituiu `people-priority.ts`, `journey-mapper.ts` ou consumidores das telas.

### 2. Heuristicas antigas continuam existindo em paralelo

Enquanto a integracao nao acontecer, seguiremos com duas camadas:

- a nova Mission Engine
- a logica atual espalhada pelos modulos existentes

### 3. `MEMORIA` e `territory` ainda estao preparados no modelo, mas nao explorados em profundidade nesta v1

O objetivo aqui foi fechar o coracao minimo da engine sem abrir refactor lateral.

## Validacao

Executado:

- `npx vitest run src/lib/missions/mission-engine.test.ts`
- `npm run verify`

Resultado esperado desta rodada:

- engine isolada funcionando
- testes unitarios verdes
- nenhuma tela quebrada
- nenhuma mudanca de banco ou fluxo operacional

## Proximo passo recomendado

Integrar a Mission Engine primeiro como adaptadora de `people-priority.ts`, mantendo o formato atual de consumo das telas e trocando a origem logica por baixo, com baixo risco.
