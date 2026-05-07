# Estado da Nacao - SEMEAR Territorios 049

Data: 2026-05-07

## Resumo

O Tijolo 049 reorganizou visualmente o sistema interno com base no mockup enviado. A mudanca foi feita como camada de layout e apresentacao, sem alterar banco de dados, migrations, RLS, regras de autenticacao, permissoes, webhooks ou fluxos de publicacao.

O projeto original continua sendo Radar de Base, mas agora possui uma casca visual SEMEAR Territorios para as principais rotas internas e entradas operacionais equivalentes.

## Diagnostico inicial

Rotas solicitadas no mockup que ja existiam diretamente ou por equivalente:

- `/` redireciona para `/dashboard`.
- `/acoes` e `/acoes/novo` ja existiam.
- `/relatorios` ja existia.
- Fluxos de escuta existiam como `/recibo/escuta`, `/escuta/bairro` e `/escuta/bairro/admin`.
- Agenda/campo existia em `/campo`.

Rotas solicitadas que nao existiam neste repositorio e receberam entradas internas seguras:

- `/escutas`
- `/escutas/lote`
- `/territorios`
- `/mapa`
- `/pos-banca`
- `/ajuda`
- `/equipe`
- `/transparencia/snapshots`
- `/transparencia/preview`
- `/transparencia/homologacao`

## Paginas redesenhadas ou adicionadas

- `/dashboard`: redesenhada com sidebar, header, filtros, banner, KPIs, proxima operacao, padroes, mapa-lista territorial e Transparencia Viva.
- `/mapa`: criada como mapa-lista, sem geografia real, sem geocodificacao e sem pontos individuais.
- `/territorios`: criada como resumo territorial agregado.
- `/escutas`: criada como entrada interna para revisao e acesso aos fluxos existentes.
- `/escutas/lote`: criada como entrada visual para digitacao, apontando para o fluxo atual sem criar novo schema.
- `/ajuda`: criada com orientacoes operacionais e de privacidade.
- `/pos-banca`: criada para homologacao, devolutiva e fechamento.
- `/equipe`: criada para identificacao da sessao interna.
- `/transparencia/*`: criadas como entradas internas para snapshots, preview e homologacao, sem exposicao publica nova.

## Componentes criados

- `src/components/layout/semear-app-shell.tsx`
  - Sidebar fixa no desktop.
  - Navegacao principal SEMEAR.
  - Navegacao responsiva no mobile.
  - Destaque da rota ativa.
  - Bloco inferior de equipe/sessao.

- `src/components/ui/page-header.tsx`
  - Eyebrow, titulo, descricao, acoes e filtros.

- `src/components/ui/metric-card.tsx`
  - Card padrao para indicadores com icone, label, valor, observacao e status visual.

- `src/components/ui/filter-bar.tsx`
  - Barra visual de filtros e pills operacionais.

## Componentes alterados

- `src/components/app-shell.tsx`
  - Agora usa o shell SEMEAR preservando `getInternalSession` e `USE_MOCKS`.

- `src/components/page-header.tsx`
  - Mantido como compatibilidade para imports existentes, usando o novo componente de UI.

- `src/app/globals.css`
  - Paleta ajustada para verde escuro, mostarda e fundo claro quente.

## Melhorias de navegacao

- Sidebar fixa no desktop.
- Menu mobile horizontal e funcional.
- Rotas principais SEMEAR no menu:
  - Dashboard
  - Acoes
  - Escutas
  - Territorios
  - Mapa
  - Relatorios
  - Pos-banca
  - Ajuda

## Melhorias de dashboard

- Header "Dashboard de padroes".
- Filtros visuais de periodo, bairro e tema.
- CTA "Nova acao".
- Banner explicativo curto.
- KPIs:
  - Total de acoes
  - Total de escutas
  - Bairros visitados
  - Pendencias de revisao
- Bloco "Proxima operacao".
- Grid com temas, escutas por periodo, temas por bairro e palavras recorrentes.
- Bloco "Mapa-lista territorial".
- Bloco "Transparencia Viva" sem dados brutos.

## Melhorias de mapa-lista

- `/mapa` foi criado como lista territorial agregada.
- Inclui aviso explicito:
  - mapa-lista sem precisao geografica;
  - sem geocodificacao;
  - sem pontos individuais.
- Cards territoriais mostram status, acoes, temas e ultima data.

## Melhorias de filtros

- `FilterBar` e `FilterPill` foram criados para padronizar filtros visuais.
- Aplicados no dashboard e no mapa-lista.

## Correcoes tecnicas relacionadas a verificacao

- Corrigido retorno JSX dentro de `try/catch` no dashboard para obedecer a regra React/Next usada pelo lint atual.
- Corrigido acesso ao retorno de `getInternalSession`, que nesta base nao retorna `{ user }`.
- Corrigidos dois erros triviais preexistentes que impediam lint/build:
  - cast `any` em `src/app/pessoas/people-client.tsx`;
  - aspas nao escapadas em `src/app/relatorios/page.tsx`.

## Confirmacao de seguranca

- Nenhuma migration criada.
- Nenhuma alteracao de schema.
- Nenhuma alteracao de RLS.
- Nenhuma regra de autenticacao ou permissao alterada.
- Nenhum uso de `service_role` no frontend.
- Nenhum webhook alterado.
- Nenhum dado sensivel exposto de forma nova.
- Nenhum mapa geografico criado.
- Nenhuma pagina publica nova criada; as novas rotas usam `requireInternalPageSession`.

## Verificacao

Comandos executados:

- `npm run lint` - OK, com warnings preexistentes.
- `npm run build` - OK.
- `npm run verify` - OK.

Resumo do `verify`:

- lint: OK com 47 warnings.
- build: OK.
- testes: 31 arquivos, 209 testes aprovados.
- check:rls: OK para os bloqueios anonimos testados.
- check:health: OK sem segredos conhecidos.
- e2e local: pulado porque `E2E_RUN=true` estava ausente.

## Riscos restantes

- O repositorio ainda mistura nomenclaturas Radar de Base e SEMEAR Territorios. O shell visual ja usa SEMEAR, mas varias paginas internas existentes mantem textos do produto anterior.
- Algumas rotas SEMEAR foram criadas como entradas operacionais leves porque nao havia modulo nativo correspondente neste app.
- Tabelas/listas antigas ainda podem precisar de refinamento visual profundo pagina a pagina.
- O dashboard usa alguns agrupamentos operacionais existentes e alguns chips/padroes estaticos de apresentacao ate existir uma camada SEMEAR especifica de analytics.

## Proximos passos sugeridos

1. Redesenhar `/acoes`, `/relatorios`, `/campo` e `/voluntarios` com os novos componentes sem alterar regras.
2. Criar componente padrao de tabela responsiva para listas internas.
3. Consolidar nomes do produto entre Radar de Base e SEMEAR Territorios.
4. Adicionar testes visuais/browser para `/dashboard`, `/mapa` e menu mobile.
5. Substituir os padroes estaticos do dashboard por consultas agregadas especificas quando o dominio SEMEAR estiver estabilizado.
