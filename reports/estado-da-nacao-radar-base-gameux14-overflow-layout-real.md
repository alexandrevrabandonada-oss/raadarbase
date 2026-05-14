# Estado da Nacao - Radar Base - GAMEUX14 Overflow e Layout Real

Data: 2026-05-14

## Objetivo

Corrigir problemas reais de layout nas rotas principais gameful, com foco em notebook e mobile, sem alterar regra de negocio, banco ou fluxo operacional.

## Rotas revisadas

- `/dashboard`
- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/relatorios/territorios`

## Problemas encontrados

- Heros estavam grandes demais para `1024x768` e `1366x768`, empurrando a operacao principal para baixo.
- `GamefulHero` estava abrindo composicao lateral cedo demais para notebook.
- `Minha Jornada` tinha grids laterais agressivos em `lg`, o que aumentava risco de corte e competicao visual.
- `QueueCard` ainda concentrava botoes demais na mesma linha e tinha bloco com largura minima rigida.
- `Mural de Missoes` usava titulo muito grande e colunas largas demais para notebook.
- `Prioridades da Equipe` ainda chegava tarde na lista util quando o hero ocupava espaco demais.
- `/relatorios/territorios` continuava com overflow real em `390px`, vindo do bloco `TerritorialExpansionBlock`.

## Decisoes visuais e de layout

- O componente compartilhado `GamefulHero` foi compactado para notebook:
  - menos padding;
  - gaps menores;
  - titulo e descricao mais contidos;
  - `aside` empilhado ate `2xl`, em vez de abrir duas colunas cedo demais.
- Os heros de `/dashboard`, `/minha-fila`, `/pessoas`, `/abordagem` e `/relatorios/territorios` passaram a usar escala tipografica mais curta em notebook.
- Em `/minha-fila`, os grids laterais principais foram empurrados para `xl`, e o bloco `Mapa da Trilha` deixou de disputar largura no topo.
- Em `QueueCard`, a acao primaria passou a liderar o rodape com secundarios em linhas mais seguras, sem corte.
- Em `/abordagem`, a largura das colunas foi reduzida e a composicao do hero ficou mais compacta para que filtros e primeiras colunas aparecam antes.
- Em `/pessoas`, o hero foi encurtado e a tabela densa teve larguras minimas reduzidas para manter o scroll horizontal contido apenas dentro do componente, nao na pagina.
- Em `TerritorialExpansionBlock`, o header, os KPIs e as tabs foram adaptados para mobile, removendo o overflow global da tela territorial.

## Arquivos principais alterados

- `src/components/radar/gameful-hero.tsx`
- `src/app/minha-fila/queue-client.tsx`
- `src/app/minha-fila/queue-card.tsx`
- `src/app/dashboard/dashboard-client.tsx`
- `src/app/pessoas/people-client.tsx`
- `src/components/radar/person-operational-list.tsx`
- `src/components/radar/operational-status-bar.tsx`
- `src/app/abordagem/kanban-client.tsx`
- `src/app/relatorios/territorios/territories-client.tsx`
- `src/components/radar/territorial-expansion-block.tsx`

## QA responsivo executado

Ambiente usado para QA visual:

- `next dev` local em `http://127.0.0.1:3000`
- modo mock com bypass de auth apenas para validacao interna

Viewports validados:

- `1024x768`
- `1366x768`
- `1440x900`
- `390x844`

Resultado objetivo da coleta automatizada:

- Nenhuma das cinco rotas terminou com overflow horizontal global.
- `qa-summary.json` confirmou `hasHorizontalOverflow: false` em todas as combinacoes finais.

Artefatos gerados:

- `test-results/gameux14/qa-summary.json`
- `test-results/gameux14/dashboard-1024x768.png`
- `test-results/gameux14/dashboard-1366x768.png`
- `test-results/gameux14/dashboard-1440x900.png`
- `test-results/gameux14/dashboard-390x844.png`
- `test-results/gameux14/minha-fila-1024x768.png`
- `test-results/gameux14/minha-fila-1366x768.png`
- `test-results/gameux14/minha-fila-1440x900.png`
- `test-results/gameux14/minha-fila-390x844.png`
- `test-results/gameux14/pessoas-1024x768.png`
- `test-results/gameux14/pessoas-1366x768.png`
- `test-results/gameux14/pessoas-1440x900.png`
- `test-results/gameux14/pessoas-390x844.png`
- `test-results/gameux14/abordagem-1024x768.png`
- `test-results/gameux14/abordagem-1366x768.png`
- `test-results/gameux14/abordagem-1440x900.png`
- `test-results/gameux14/abordagem-390x844.png`
- `test-results/gameux14/territorios-1024x768.png`
- `test-results/gameux14/territorios-1366x768.png`
- `test-results/gameux14/territorios-1440x900.png`
- `test-results/gameux14/territorios-390x844.png`

## Verificacao tecnica

- `npm run verify` passou.
- `npm run check:rls` passou dentro de `verify`.
- `npm run check:health` passou dentro de `verify`.
- O lint segue sem erros, com warnings antigos e adjacentes no repositorio.

## Riscos restantes

- `/pessoas` ainda carrega warnings antigos de codigo nao usado, fora do escopo desta rodada.
- A comprovacao automatica de "acao principal acima da dobra" ainda depende de leitura visual humana, mesmo com os screenshots gerados.
- O modo de QA com bypass foi usado apenas para validacao local; a passada final em staging autenticado continua recomendada.

## Prints recomendados para validacao manual

- `/dashboard` em `1366x768`: confirmar hero compacto e parte de `Proximas Missoes` visivel cedo.
- `/minha-fila` em `1024x768`: confirmar ausencia de scroll horizontal e `Proxima Missao` acima da dobra.
- `/pessoas` em `1366x768`: confirmar hero curto e lista densa aparecendo cedo.
- `/abordagem` em `1024x768`: confirmar titulo menor e primeiras colunas operacionais visiveis sem excesso de cabecalho.
- `/relatorios/territorios` em `390x844`: confirmar ausencia de overflow lateral e tabs de expansao territorial quebrando corretamente.
