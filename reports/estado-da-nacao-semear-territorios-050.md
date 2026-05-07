# Estado da Nacao - SEMEAR Territorios 050

Data: 2026-05-07

## Diagnostico mobile

Antes deste tijolo, o app ja tinha shell desktop redesenhado, mas o uso em tela pequena ainda sofria com:

- navegacao mobile pouco operacional;
- listagens ainda proximas de tabela desktop;
- `/escutas/lote` sem fluxo real de campo;
- barras de acao grandes demais para primeira dobra;
- `/relatorios` com overflow horizontal em larguras pequenas;
- formularios com campos e CTAs pequenos em rotas de cadastro.

## Componentes criados

- `src/components/layout/mobile-header.tsx`
- `src/components/layout/mobile-bottom-nav.tsx`
- `src/app/escutas/lote/mobile-batch-listen-form.tsx`
- `src/app/pos-banca/pos-banca-mobile-guide.tsx`

## Rotas adaptadas

- `/dashboard`
- `/acoes`
- `/acoes/novo`
- `/campo/novo`
- `/escutas`
- `/escutas/lote`
- `/mapa`
- `/pos-banca`
- `/ajuda`
- `/relatorios`

## Mudancas em /escutas/lote

- virou a tela principal de operacao mobile;
- topo fixo com:
  acao selecionada, bairro da acao, entrevistador e contador da sessao;
- campos grandes e em uma coluna;
- blocos claros:
  acao e sessao, fala/sintese, territorio de referencia, perfil opcional, temas e revisao;
- `Salvar e digitar proxima` em destaque;
- `Salvar rascunho` disponivel;
- aviso de privacidade curto e sempre visivel;
- usa o schema atual de `bairro_escuta_submissions`;
- rascunho e contador da sessao ficam locais no aparelho, sem mudar banco.

## Mudancas em dashboard

- mobile agora prioriza operacao antes de densidade analitica;
- bloco de proxima operacao aparece antes dos KPIs;
- KPIs seguem visiveis, mas compactos;
- grafico pesado nao sobe para a primeira dobra no mobile;
- no celular, a secao de escutas por mes cai para uma leitura resumida.

## Mudancas em /acoes

- cards mobile para cada plano;
- atalhos:
  abrir, digitar fichas, revisar;
- tabela desktop preservada;
- CTA de nova acao e contexto de governanca continuam visiveis.

## Mudancas em /mapa

- cards territoriais compactos no mobile;
- ranking de temas em lista vertical simples;
- palavras recorrentes em chips rolaveis;
- aviso de mapa-lista sem precisao geografica mantido;
- sem mapa geografico e sem geocodificacao.

## Mudancas em /pos-banca

- leitura guiada em sequencia mobile;
- seletor de acao no topo;
- blocos empilhados para resumo, pendencias, temas, territorios, devolutiva e dossie;
- botao `Copiar decisao` para uso rapido em campo.

## Outras melhorias

- shell mobile com topbar compacta, drawer e bottom nav;
- bottom nav com atalho `Digitar` em destaque;
- `/escutas` virou fila em cards com revisao rapida;
- `/campo/novo` ganhou formulario mais confortavel em mobile;
- `/ajuda` ganhou secao `Uso no celular`;
- `/relatorios` recebeu correcoes de overflow horizontal e cards mobile para a lista principal.

## Testes de largura

Validados localmente em `next dev` com:

- `NEXT_PUBLIC_USE_MOCKS=true`
- `E2E_BYPASS_AUTH=true`
- `E2E_TEST_MODE=true`

Larguras testadas:

- `360px`
- `390px`
- `430px`
- `768px`
- desktop `1366px`

Resultado:

- sem overflow horizontal nas rotas alvo;
- bottom nav/atalhos presentes no mobile;
- desktop preservado;
- ajuste adicional aplicado em `/relatorios` para remover overflow.

## Confirmacao sobre desktop

- sidebar desktop continua ativa em `lg+`;
- tabelas desktop relevantes foram preservadas;
- layout maior nao perdeu densidade onde ela ainda faz sentido.

## Confirmacao de seguranca

- nenhuma migration criada;
- nenhum schema alterado;
- nenhuma regra de RLS alterada;
- nenhuma regra de autenticacao alterada;
- nenhum dado sensivel novo exposto;
- nenhum uso de `service_role` no frontend;
- nenhuma pagina publica nova criada;
- nenhum mapa geografico criado.

## Verificacao

Comandos executados:

- `npm run lint` - OK, com warnings preexistentes.
- `npm run build` - OK.
- `npm run verify` - OK.

## Riscos restantes

- `/escutas/lote` ainda depende do schema atual de escuta territorial, entao parte do contexto operacional da sessao fica apenas local.
- `/relatorios` foi estabilizado para mobile, mas ainda pode se beneficiar de uma adaptacao visual mais profunda por aba.
- o app ainda mistura semantica de Radar de Base com SEMEAR Territorios em partes do dominio e da copy.

## Proximo tijolo recomendado

Tijolo 051: consolidar filtros mobile com bottom sheet real, estados vazios orientados por tarefa e uma camada de testes visuais versionados para as rotas internas mais usadas em campo.
