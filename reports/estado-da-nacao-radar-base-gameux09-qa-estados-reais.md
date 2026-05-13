# Estado da Nação: GAMEUX09 - QA de estados reais

Data: 2026-05-13
Projeto: Radar de Base
Escopo: `/dashboard`, `/minha-fila`, `/relatorios/territorios`, `/campo`, `/ritmo`, `/pessoas`, `/abordagem`, `/mensagens`, `/voluntarios`

## Objetivo da rodada

Fechar a lacuna entre direção visual e uso real:

- estados vazios que pareciam quebra;
- métricas zeradas sem próximo passo;
- loading states genéricos;
- cards pequenos com labels apertados;
- responsividade em mobile e notebook pequeno;
- consistência entre Base, Jornada, Território, Campo, Ritmo, Memória e guardrails.

## Rotas revisadas

- `/dashboard`
- `/minha-fila`
- `/relatorios/territorios`
- `/campo`
- `/ritmo`
- `/pessoas`
- `/abordagem`
- `/mensagens`
- `/voluntarios`

## Estados vazios tratados

### Biblioteca compartilhada

Foi criado o componente `GamefulEmptyState` em `src/components/radar/gameful-empty-state.tsx`, com variantes:

- `base`
- `journey`
- `territory`
- `field`
- `rhythm`
- `memory`
- `ethics`

Cada vazio agora responde explicitamente:

1. o que está vazio;
2. por que está vazio;
3. o que fazer agora.

### Aplicações principais

- `/dashboard`
  - zero missões ativas com CTA para preparar a base;
  - microcopy de campo e mapa zerados revisada.
- `/minha-fila`
  - jornada vazia tratada como trilha pausada, com CTA para assumir missões abertas.
- `/relatorios/territorios`
  - hero territorial sem bairro agora mostra missão territorial inicial;
  - explicação de dependência de bairro declarado/registrado;
  - CTA para revisar pessoas, registrar bairro e criar missão de campo;
  - guardrail agregado preservado.
- `/campo`
  - zero missões ativas;
  - zero próxima missão;
  - zero ciclos concluídos recentes.
- `/mensagens`
  - zero templates ativos com CTA direto para criar o primeiro modelo.
- `/voluntarios`
  - zero voluntários ativos com CTA para revisar inscrições e voltar às prioridades.

## Loading states revisados

`RadarLoading` foi refeito para refletir o mundo visual de cada frente:

- `base`
- `journey`
- `territory`
- `field`
- `rhythm`

Loadings adicionados ou refinados em:

- `/dashboard`
- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/relatorios/territorios`
- `/campo`
- `/ritmo`

## Problemas de responsividade corrigidos

### Dashboard

- cards de `Próximas Missões` ficaram mais verticais e legíveis;
- username com truncamento mais controlado;
- bloco de fase atual ganhou destaque próprio;
- trilha da jornada dentro dos cards deixou de espremer labels em uma linha só;
- `JourneyBar` compacta passou a usar steps em pílulas, não labels coladas;
- `Mapa Rápido` reduziu agressividade do grid em larguras intermediárias;
- `Portais da Operação` deixaram de forçar 6 colunas cedo demais;
- métricas pequenas tiveram labels encurtadas e tracking reduzido;
- sinais escuros de Ritmo receberam labels mais curtos.

### Sidebar

- descrições dos grupos encurtadas;
- tipografia dos subtítulos reduzida;
- clamp mais agressivo para evitar corte ruim em notebooks e mobile;
- `title`/hover das entradas mantido como apoio.

## Correções estruturais encontradas na QA

Durante a validação visual apareceram três problemas adicionais:

1. `/ritmo`
   - uso incorreto de `Button` com `nativeButton={false}` e `Link` interno;
   - corrigido para `render={<Link ... />}`.

2. `/voluntarios`
   - server error por passar ícone `lucide` de Server Component para Client Component no empty state;
   - removido o `icon` explícito e mantida a variante visual.

3. `/abordagem`
   - hydration error por `button` aninhado em `TooltipTrigger`;
   - `TooltipTrigger` passou a renderizar `div`;
   - CTA `Ver ficha` no `ActionButtonGroup` passou a usar `render={<Link ... />}`.

## Decisões visuais

- vazio não aparece mais como falha de carregamento;
- zero state agora é missão inicial ou ciclo em dia;
- microcopy padronizada para:
  - `Nada travado agora.`
  - `Mapa ainda sem sinais.`
  - `Nenhuma missão ativa.`
  - `Próximo passo: preparar a base.`
  - `Sem campo planejado.`
  - `Ciclo em dia.`
- a estética gameful foi mantida sem neon agressivo, ranking ou score individual.

## Validação executada

### Técnica

Executado com sucesso:

- `npm run verify`
- `npm run check:rls`
- `npm run check:health`

Observação:

- o lint segue com warnings antigos/adjacentes fora do escopo desta rodada, sem erros.
- `e2e` local continua pulado sem `E2E_RUN=true`.

### Visual

O Browser plugin do app não conseguiu acessar o `localhost` nesta sessão, então a validação foi feita com Playwright local.

Para abrir as rotas internas em QA local foi usado o bypass de autenticação já previsto no projeto:

- `E2E_BYPASS_AUTH=true`
- `E2E_TEST_MODE=true`
- `NEXT_PUBLIC_USE_MOCKS=true`

Viewports validados:

- `390px`
- `768px`
- `1024px`
- `1366px`
- `1440px`

## Riscos restantes

- a validação visual com mocks cobre layout, loading e vazio, mas não substitui revisão humana com dados reais de operação;
- alguns zero states dependem de datasets realmente vazios em produção para revisão final de tom e CTA;
- há warnings antigos no lint em áreas adjacentes que não quebram build, mas continuam adicionando ruído de manutenção;
- o Browser plugin do app precisa voltar a enxergar `localhost` para a próxima rodada de QA in-app.

## Prints recomendados para validação manual

Gerados em:

- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\dashboard-390.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\dashboard-768.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\dashboard-1024.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\dashboard-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\dashboard-1440.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\minha-fila-390.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\minha-fila-768.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\minha-fila-1024.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\minha-fila-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\relatorios_territorios-390.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\relatorios_territorios-768.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\relatorios_territorios-1024.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\relatorios_territorios-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\campo-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\ritmo-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\pessoas-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\abordagem-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\mensagens-1366.png`
- `C:\Users\Micro\AppData\Local\Temp\radar-gameux09\voluntarios-1366.png`

## Conclusão

Nenhuma das telas prioritárias revisadas deve mais parecer quebrada quando estiver vazia, zerada, carregando ou aberta em notebook pequeno. A linguagem visual continua no universo da Base de Operações e o próximo passo ficou mais explícito em todos os vazios tratados.
