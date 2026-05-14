# Estado da Nacao - CODEX03 Minha Jornada com Mission Engine

Data: 2026-05-14

## Resumo executivo

A rota `/minha-fila` passou a consumir a Mission Engine v1 de forma incremental, sem reescrever a tela, sem alterar banco e sem quebrar os fluxos manuais existentes.

O operador agora recebe:

- uma `Próxima Missão` explicável baseada na engine;
- um `Bloco recomendado` de até 5 missões equilibradas;
- modos de trabalho para alternar foco operacional;
- guardrails visuais mais rígidos quando a missão estiver bloqueada;
- fallback automático para o comportamento antigo quando a engine não tiver dados suficientes ou falhar.

## Arquivos alterados

### Integração da rota

- `src/app/minha-fila/page.tsx`
- `src/app/minha-fila/queue-client.tsx`
- `src/app/minha-fila/queue-card.tsx`

### Adaptador e seleção de bloco

- `src/lib/missions/queue-mission-adapter.ts`
- `src/lib/missions/queue-mission-adapter.test.ts`

## O que foi implementado

### 1. Adaptador de dados

Foi criado um adaptador para transformar os dados atuais da jornada em input da Mission Engine:

- pessoa priorizada (`PriorityPerson`)
- interações da pessoa
- tarefas da pessoa
- encaminhamentos reais
- auditoria da pessoa

Esse adaptador gera um `QueueMissionPlan` com:

- `missions`
- `orderedPersonIds`

### 2. Próxima Missão

`/minha-fila` agora usa a missão mais prioritária da engine para:

- reordenar a fila inicial, quando o plano estiver disponível;
- preencher o bloco principal de leitura da missão com:
  - tipo
  - estado
  - fase
  - motivo
  - sinais usados
  - guardrail
  - próximo passo
  - ação primária

Fallback:

- se o plano da engine falhar, a fila mantém a ordem atual;
- a UI continua usando os dados antigos de `PriorityPerson`.

### 3. Bloco recomendado de 5 missões

Foi criado um bloco equilibrado baseado na engine, com a regra:

- 1 `RETORNO` ou `CUIDADO`, se existir
- 1 `ENCAMINHAMENTO`, se existir
- 2 `ESCUTA` ou `VINCULO`
- 1 missão leve/revisão

### 4. Modos de trabalho

Foi preparado suporte para cinco modos:

- `Recomendado`
- `Resolver retornos`
- `Fazer escuta`
- `Encaminhar interessados`
- `Cuidar da base`

Esses modos filtram o bloco recomendado sem mexer no restante da tela.

### 5. Guardrails visuais

Quando a missão atual está `BLOQUEADA`:

- ações de contato ficam desabilitadas;
- a mensagem de guardrail da engine passa a dominar a leitura da missão;
- a barra de comando evita abrir contato e privilegia ação segura;
- o banner ético continua visível.

### 6. Feedback operacional

O fluxo atual foi preservado, mas a microcopy ficou mais alinhada à engine:

- `Resposta registrada. Próximo passo salvo.`
- `Pedido de não contato respeitado.`
- `Missão pausada sem perda de histórico.`
- `Envio manual confirmado.`

## Decisões técnicas

### Reuso conservador

A tela não foi reescrita. A integração entrou por baixo:

- o `QueueCard` continua o centro do fluxo;
- a Mission Engine complementa a explicação e a ordenação;
- o contrato de UI existente foi mantido.

### Fallback explícito

Se qualquer parte da coleta para a engine falhar:

- `missionPlan = null`
- a fila volta ao comportamento atual
- a tela não quebra

### Enriquecimento mínimo do loader

O loader de `/minha-fila` passou a buscar apenas o necessário para a engine:

- `outreach_tasks`
- `ig_interactions`
- `ig_person_referrals`
- `audit_logs` por pessoa

Sem alterar schema nem side effects.

## Testes

Foram adicionados testes para o adaptador:

- ordenação da fila pelo plano
- criação do plano de missão
- montagem equilibrada do bloco recomendado
- filtros de modos de trabalho

Arquivo:

- `src/lib/missions/queue-mission-adapter.test.ts`

## Validação executada

Rodado nesta rodada:

- `npx eslint src/app/minha-fila/page.tsx src/app/minha-fila/queue-client.tsx src/app/minha-fila/queue-card.tsx src/lib/missions/queue-mission-adapter.ts src/lib/missions/queue-mission-adapter.test.ts`
- `npx vitest run src/lib/missions/mission-engine.test.ts src/lib/missions/queue-mission-adapter.test.ts`
- `npm run verify`
- `npm run check:rls`
- `npm run check:health`

Resultado:

- tudo passou
- lint geral continua sem erros, com warnings antigos/adjacentes do projeto
- build passou
- 33 arquivos de teste e 222 testes passaram
- `check:rls` passou
- `check:health` passou
- `e2e` local segue pulado sem `E2E_RUN=true`

## Riscos restantes

### 1. Plano da engine ainda é estático por carregamento

Depois que a fila muda no client, a tela continua estável, mas o plano da engine não é recalculado em tempo real sem novo carregamento.

### 2. Integração ainda está concentrada em `/minha-fila`

`/pessoas` e `/abordagem` ainda usam a lógica antiga como fonte principal.

### 3. Custo de leitura por pessoa

Nesta etapa, a rota busca interações, referrals e auditoria por pessoa. Funciona para a jornada atual, mas vale consolidar isso em loader dedicado antes de expandir a engine para mais telas.

## Próximo passo recomendado

Trocar `people-priority.ts` por um adaptador sobre a Mission Engine, para que `/pessoas`, `/abordagem` e `/dashboard` passem a falar a mesma lógica operacional sem duplicação.
