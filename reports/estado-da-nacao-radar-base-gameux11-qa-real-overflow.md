# Estado da Nacao - GAMEUX11

## Objetivo

Rodada de QA visual focada em dados reais para remover overflow, cortes de texto, densidade excessiva e sinais visuais contraditorios nas rotas gameful principais.

## Rotas revisadas

- `/dashboard`
- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/relatorios/territorios`
- `/campo`
- `/ritmo`

## Problemas encontrados

1. Hero da Base de Operacoes com mini-cards estreitos demais em notebook, especialmente em `1024px` e `1366px`.
2. Hero de `Minha Jornada` usando textos longos dentro dos cards pequenos, o que pressionava fase, carga e progresso.
3. Cards de missao e de pessoas usando vermelho em estados neutros e textos de espera/bloqueio pouco precisos.
4. Grid de `/pessoas` agressivo demais em notebook, comprimindo motivo, proxima acao e bloco de espera.
5. Sidebar cortando labels como `Prioridades da Equipe` e `Modelos de Mensagem`.
6. `/campo` com erro de serializacao entre Server Component e Client Component ao passar icone como tipo em vez de elemento.

## Correcoes aplicadas

### Dashboard

- Hero compactado com tres metricas mais curtas: `Missao`, `Semana` e `Status`.
- Mini-cards do hero migrados para layout `split`, com valor curto, detalhe curto e tooltip no card para contexto completo.
- Painel de comando interno tambem passou a usar labels mais curtas nos cards pequenos: `Ativas`, `Respostas`, `Encaminh.`.
- Mantido CTA principal sem competicao direta com textos longos.

### Minha Jornada

- Missao do dia saiu do card pequeno e virou texto principal do hero.
- Metricas do topo agora usam `Fila`, `Progresso`, `Fase` e `Carga`, todas em formato compacto.
- Bloco de estado da proxima missao diferencia com clareza:
  - `blocked` em rosa/vermelho;
  - `waiting` em amarelo;
  - `free` em verde.
- Texto neutro padronizado para `Caminho livre. Sem bloqueio ativo agora.`.

### MissionCard e cards de pessoa

- `username` longo truncado com `title`.
- `Motivo`, `Proxima acao` e texto de espera/bloqueio com `line-clamp` e `title`.
- `JourneyBar` ficou mais contido dentro do card.
- Estado neutro deixou de usar tons de alerta.

### Pessoas

- Grid de cards reduzido em notebook para evitar esmagamento horizontal.
- Blocos de `Acao principal` e `Bloqueio ou espera` passaram a empilhar melhor no card.

### Sidebar

- Labels principais agora aceitam duas linhas.
- Microcopy secundaria foi encurtada para uma linha.
- `title` foi adicionado para preservar leitura completa no hover.

### Campo e Territorios

- Corrigido o contrato de icones do kit gameful para aceitar `ReactNode`.
- `/campo` e `/relatorios/territorios` passaram a enviar elemento renderizado, eliminando o erro de serializacao.

## Decisoes visuais

- Card pequeno nao deve carregar narrativa longa.
- Valor curto no topo; contexto completo no corpo adjacente ou em `title`.
- Vermelho fica restrito a trava real.
- Espera etica usa amarelo.
- Estado livre usa verde/neutro e nomenclatura positiva.

## Validacao

- `npm run verify`: passou.
- `npm run check:rls`: passou.
- `npm run check:health`: passou.

Observacao de QA:

- Os achados desta rodada vieram de captura anterior com dados reais desta sessao.
- Na recaptura local final, a autenticacao voltou a exigir login porque o bypass deste projeto so fica ativo com `E2E_TEST_MODE=true` e `NEXT_PUBLIC_USE_MOCKS=true`, o que nao serve para validacao real.
- Para signoff visual final, a revisao manual precisa acontecer em staging autenticado.

## Prints recomendados para validacao manual

1. `/dashboard` em `1024px` e `1366px`, com foco no hero e em `Proximas Missoes`.
2. `/minha-fila` em `1024px` e `1366px`, com foco no hero e no card `Proxima Missao`.
3. `/pessoas` em `1024px`, com usernames longos e varias missoes abertas.
4. `/abordagem` em `1024px`, para conferir densidade de colunas.
5. `/campo` em `1024px`, para garantir que o hero voltou a renderizar sem erro.
6. `/relatorios/territorios` em `1024px`, com verificacao do hero e dos nos territoriais.

## Riscos restantes

1. `/abordagem` ainda merece uma rodada propria para reduzir densidade em cards com muitos sinais simultaneos.
2. Falta uma passada autenticada em staging depois deste patch para validar dados longos nas mesmas combinacoes que geraram o overflow original.
3. Os warnings de lint continuam preexistentes e nao foram o foco desta rodada.
