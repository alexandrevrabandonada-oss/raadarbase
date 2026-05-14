# Estado da Nacao - GAMEUX16 - Modo compacto

Data: 2026-05-14

## Objetivo

Reduzir scroll e densidade excessiva nas telas operacionais sem mudar regra de negocio, banco ou fluxo manual de operacao.

## Rotas tratadas

- `/minha-fila`
- `/pessoas`
- `/abordagem`

## O que mudou

### Base compartilhada

- Criado `useCompactMode` para combinar:
  - modo automatico por viewport menor que `1366px`;
  - gatilho por volume de trabalho;
  - preferencia local persistida em `localStorage`.
- Criado `CompactModeToggle` com o rotulo `Modo compacto`.
- `GamefulHero` agora aceita variante compacta real, com:
  - padding menor;
  - titulo reduzido;
  - descricoes mais curtas;
  - grid de metricas mais denso.

### Minha Jornada

- Hero agora entra em modo compacto automaticamente em notebook ou quando a fila passa de 5 missoes.
- `Mapa da trilha` saiu do hero em modo compacto e foi movido para leitura complementar expansivel.
- `QueueCard` ganhou versao compacta para reduzir altura e evitar empurrar a proxima acao para baixo.
- `QueueList` ganhou versao compacta.
- `OperatorWellnessCard` fica abaixo da dobra em modo compacto, dentro da leitura complementar, preservando foco na proxima missao.

### Pessoas

- Hero compacto em notebook e quando houver mais de 20 missoes filtradas.
- Lista densa continua como preferencia automatica acima de 20 missoes.
- Barra de filtros virou bloco `sticky`.
- Onboarding e ajuda contextual foram recolhidos em `details` no modo compacto.
- Grid de cards ficou mais conservador em `xl`.

### Abordagem

- Hero compacto em notebook e quando houver mais de 18 tarefas filtradas.
- Filtros passaram a ficar sempre visiveis com comportamento `sticky`.
- Painel de balanceamento virou bloco recolhivel; em modo compacto abre fechado por padrao.
- Colunas do mural ficaram mais estreitas em modo compacto para caber melhor em notebook.
- Guardrails e ajuda operacional foram recolhidos em leitura complementar.

## Decisoes de UX

- O modo compacto nao remove acao principal; ele move leitura secundaria para baixo ou para um expansivel.
- A preferencia local so força o compacto para cima; quando desligada, a tela volta ao comportamento automatico.
- O sistema continua manual: nenhum botao novo envia DM automaticamente ou cria pressao por volume.

## Riscos restantes

- `details/summary` atende bem ao caso, mas ainda merece validacao visual fina com dados reais nas tres rotas.
- `PeopleClient` e `KanbanClient` ainda carregam imports/estados antigos fora do escopo desta rodada; isso nao muda comportamento, mas ainda deixa warnings adjacentes.
- O limiar de volume (`> 5`, `> 20`, `> 18`) e pragmatico; pode ser recalibrado depois de observar uso real.

## Validacao executada

- `npm run verify`

## Proximo checkpoint manual recomendado

- Notebook `1024x768`
- Notebook `1366x768`
- Desktop `1440x900`
- Mobile `390px`

Validar:

- CTA principal visivel sem scroll inicial;
- ausencia de overflow horizontal;
- filtros sticky sem cobrir conteudo;
- leitura complementar funcionando sem quebrar ritmo.
