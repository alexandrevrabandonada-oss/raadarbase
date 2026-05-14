# Estado da Nação: CODEX06 Campo e Memória Loop

Data: 2026-05-14  
Base: `ecdf489` + mudanças locais até CODEX06

## Objetivo

Fechar o loop entre `Campo`, `Memória` e `Ritmo` para que ação presencial não termine em presença solta: ela precisa gerar resultado agregado, memória útil e próximo ciclo visível.

## O que entrou

### Camada nova

Arquivos criados:

- [C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.ts](</C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.ts>)
- [C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.test.ts](</C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.test.ts>)

Responsabilidades da camada:

- mapear fases operacionais do campo: `Planejar`, `Convidar`, `Confirmar`, `Realizar`, `Registrar`, `Follow-up`;
- detectar `Campo sem fechamento`;
- detectar `Confirmação pendente`;
- detectar `Follow-up pendente`;
- sugerir memórias operacionais sem expor pessoas.

### Reuso de estrutura existente

Sem alterar schema, a rodada passou a usar:

- [C:/Projetos/Radar de Base/src/lib/data/field-agenda-journey.ts](</C:/Projetos/Radar de Base/src/lib/data/field-agenda-journey.ts>) para fase e progresso;
- [C:/Projetos/Radar de Base/src/lib/data/strategic-memory.ts](</C:/Projetos/Radar de Base/src/lib/data/strategic-memory.ts>) com a função nova `countStrategicMemoryLinksByEntity`;
- `strategic_memory_links` com `entity_type = "result"` para detectar quando um resultado de campo já virou memória.

## Integração por rota

### /campo

Arquivo:

- [C:/Projetos/Radar de Base/src/app/campo/page.tsx](</C:/Projetos/Radar de Base/src/app/campo/page.tsx>)

Mudanças:

- hero prioriza `loop aberto` quando não há missão ativa, mas ainda há campo sem fechamento;
- seção `Loop do campo` mostra:
  - campo sem fechamento
  - confirmação pendente
  - follow-up pendente
- seção `Memória sugerida` mostra sugestões como:
  - `Registro de Campo`
  - `Memória da Semana`
  - `Trava Recorrente`
  - `Pauta Viva`
  - `Devolutiva Territorial`
- eventos concluídos agora deixam explícito quando existe `resultado salvo` mas `memória pendente`.

### /memoria

Arquivo:

- [C:/Projetos/Radar de Base/src/app/memoria/page.tsx](</C:/Projetos/Radar de Base/src/app/memoria/page.tsx>)

Mudanças:

- novo bloco `Sugestões da engine` no topo;
- novo bloco `Loop aberto` com:
  - rascunhos ativos
  - campo sem memória
  - fechamentos da semana
- as sugestões apontam para criação manual de memória e para a rota de origem.

### /ritmo

Arquivos:

- [C:/Projetos/Radar de Base/src/app/ritmo/page.tsx](</C:/Projetos/Radar de Base/src/app/ritmo/page.tsx>)
- [C:/Projetos/Radar de Base/src/app/ritmo/ritmo-client.tsx](</C:/Projetos/Radar de Base/src/app/ritmo/ritmo-client.tsx>)

Mudanças:

- `field_without_closure` deixou de significar apenas `evento passado sem resultado`;
- agora ele também conta `resultado sem memória vinculada`;
- `pending_memory` ganhou complemento agregado a partir das sugestões do loop;
- a card de campo em `Ritmo` passou a falar em `Ciclo aberto`, não apenas `resultado ausente`.

## Guardrails preservados

- sem nomes de cidadãos em visão agregada;
- sem conversão automática de presença em voluntariado;
- sem criação de mapa individual;
- sem alteração do convite manual;
- sem escrita automática de memória;
- sem dado sensível em síntese sugerida.

## Regras operacionais implementadas

### Campo

- evento passado sem resultado => `Campo sem fechamento`
- evento com interessados sem confirmação => `Confirmação pendente`
- evento com presença/ajuda sem continuidade => `Follow-up pendente`

### Memória

Tipos consolidados na engine:

- `Registro de Campo`
- `Pauta Viva`
- `Trava Recorrente`
- `Cuidado da Base`
- `Devolutiva Territorial`
- `Aprendizado de Mensagem`
- `Memória da Semana`

Regras:

- resultado de campo sem link de memória => sugerir `Registro de Campo`
- fechamento semanal detectado por `dailyClosuresGenerated` => sugerir `Memória da Semana`
- feedback recorrente => sugerir `Trava Recorrente`, `Cuidado da Base` ou `Aprendizado de Mensagem`, conforme categoria

## Validação

Executado:

- `npm run verify`
- `npm run check:rls`

Resultado:

- lint sem erros, com 89 warnings antigos/adjacentes
- build passou
- 36 arquivos de teste e 239 testes passaram
- `check:rls` passou
- `check:health` passou dentro de `verify`
- E2E local continua pulado sem `E2E_RUN=true`

## Riscos restantes

- a criação da memória continua manual; a engine apenas sugere;
- o vínculo `result -> strategic_memory_links` depende de uso consistente do fluxo de link já existente;
- a tela `/memoria/[id]` ainda não tem navegação especializada para origem `result`, então o contexto da origem está melhor na lista/sugestão do que no detalhe do vínculo;
- ainda vale uma passada manual autenticada em `/campo`, `/memoria` e `/ritmo` com dados reais para calibrar densidade visual dos blocos novos.

## Recomendação

**GO**

O loop lógico está fechado sem mexer em banco nem em regra operacional central. O próximo passo seguro é integrar criação assistida de memória a partir de `resultado de campo`, sempre mantendo revisão humana antes de salvar.
