# Estado da Nação: GAMEUX10 - Kit de componentes gameful

Data: 2026-05-13
Projeto: Radar de Base
Escopo: design system real para Dashboard, Minha Jornada, Territórios, Campo e Ritmo

## Objetivo da rodada

Transformar a linguagem gameful em componentes reutilizaveis de verdade, reduzindo duplicacao de Tailwind e mantendo consistencia visual entre as principais rotas operacionais.

## Padroes duplicados mapeados

Antes desta rodada, os mesmos blocos apareciam repetidos com pequenas variacoes em varias telas:

- hero de comando com gradiente escuro ou claro;
- cards pequenos de metrica;
- cards de portal/navegacao;
- cards de missao de pessoa;
- trilha de jornada;
- painel escuro de ritmo/cuidado;
- no territorial de bairro;
- card de missao de campo;
- banner curto de guardrail etico.

Os pontos de maior duplicacao estavam em:

- `src/app/dashboard/dashboard-client.tsx`
- `src/app/minha-fila/queue-client.tsx`
- `src/app/relatorios/territorios/territories-client.tsx`
- `src/app/campo/page.tsx`
- `src/app/ritmo/ritmo-client.tsx`

## Componentes extraidos ou consolidados

Criados/refinados em `src/components/radar/`:

- `gameful-hero.tsx`
- `gameful-metric-card.tsx`
- `gameful-portal-card.tsx`
- `gameful-empty-state.tsx` (mantido e documentado como biblioteca oficial)
- `mission-card.tsx`
- `journey-bar.tsx`
- `rhythm-panel.tsx`
- `territory-node-card.tsx`
- `field-mission-card.tsx`
- `ethical-guardrail-banner.tsx`

Compatibilidade preservada:

- `journey-progress.tsx` passou a delegar para `journey-bar.tsx`, evitando quebra nas chamadas antigas.

## Rotas revisadas

### `/dashboard`

- `HeroSection` passou a usar `GamefulHero` e `GamefulMetricCard`;
- `Próximas Missões` agora usa `MissionCard`;
- `Mapa Rápido` agora usa `GamefulPortalCard`;
- `Cuidado e Ritmo` agora usa `RhythmPanel`.

### `/minha-fila`

- hero do operador passou a usar `GamefulHero` e `GamefulMetricCard`;
- guardrail operacional passou a usar `EthicalGuardrailBanner`;
- a tela continua usando `QueueCard` e `QueueList`, mas agora em cima da mesma base visual do kit.

### `/relatorios/territorios`

- hero territorial passou a usar `GamefulHero` e `GamefulMetricCard`;
- card de bairro passou a usar `TerritoryNodeCard`;
- banner de leitura agregada passou a usar `EthicalGuardrailBanner`.

### `/campo`

- hero de campo passou a usar `GamefulHero` e `GamefulMetricCard`;
- cards de missao ativa e concluida passaram a usar `FieldMissionCard`.

### `/ritmo`

- painel de cuidado da base passou a usar `RhythmPanel`;
- blocos numericos de territorio, campo e bem-estar passaram a usar `GamefulMetricCard`.

## Decisoes de implementacao

- a extracao foi conservadora: priorizou mover visual repetido para componentes sem refazer contratos de dados;
- props foram mantidas simples para favorecer composicao por `variant`, `tone`, `compact`, `metrics`, `aside` e `footer`;
- a mudanca evitou criar novos modulos grandes ou reescrever rotas inteiras;
- componentes locais ainda existentes foram preservados onde havia acoplamento funcional alto, mas o visual principal agora converge para o kit compartilhado.

## Acessibilidade e responsividade

Preservado nesta rodada:

- contraste forte entre paineis claros/escuros;
- labels curtas e legiveis;
- CTAs com altura consistente;
- truncamento controlado em cards de missao;
- grids adaptando entre mobile, tablet e desktop;
- compatibilidade visual com estados vazios e rotas ja polidas em GAMEUX09.

## Riscos restantes

- ainda existem componentes locais antigos com responsabilidade mista de layout e comportamento, principalmente em `QueueCard`, `QueueList` e `PersonQuickSheet`;
- `SystemAlertsSection`, `QuickMapSection` e alguns helpers do dashboard ainda nao foram totalmente absorvidos pelo kit;
- a convergencia completa de `/pessoas` e `/abordagem` para o novo `MissionCard` pode ser feita em uma rodada seguinte, reduzindo ainda mais a duplicacao.

## Validacao executada

Executado com sucesso:

- `npm run verify`

Resultado:

- lint passou com warnings antigos/adjacentes, sem erros;
- build passou;
- 31 arquivos de teste e 209 testes passaram;
- `check:rls` passou;
- `check:health` passou;
- `e2e` local continuou pulado sem `E2E_RUN=true`.

## Conclusao

As principais telas gameful agora compartilham um kit visual real, em vez de depender apenas de variacoes locais de layout. O Radar fica mais consistente para a proxima rodada de redesign e com custo menor de manutencao visual.
