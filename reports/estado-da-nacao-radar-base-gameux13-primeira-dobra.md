# Estado da Nação: GAMEUX13 - Primeira Dobra

## Objetivo
Garantir que as telas principais mostrem antes da primeira dobra, em `1024px` e `1366px`:

- onde o usuário está;
- o que importa agora;
- qual é o próximo passo;
- qual é o CTA principal.

## Rotas revisadas

### `/minha-fila`
- Subi o bloco realmente acionável para cima da dobra.
- `QueueCard` agora aparece antes da leitura complementar da missão.
- O topo passou a mostrar primeiro:
  - `Minha Jornada`;
  - CTA `Continuar Jornada`;
  - fase atual;
  - pessoa em foco;
  - navegação imediata entre missões.
- A leitura detalhada da missão e a trilha das próximas cinco foram mantidas, mas desceram para depois do bloco principal.

### `/pessoas`
- Reestruturei o topo para priorizar uso real.
- O cabeçalho operacional entrou antes de onboarding e ajuda contextual.
- `OperationalStatusBar`, busca e primeiras missões permanecem no topo da experiência.
- Os blocos de orientação foram deslocados para baixo para não empurrar filtros e cards para fora da primeira dobra.

### `/abordagem`
- O mural agora entra mais cedo na página.
- `RadarPageHeader`, métricas e filtros continuam no topo.
- O painel de balanceamento só aparece quando há missões órfãs.
- `EthicalGuardrailBanner`, `ContextHelpCard` e onboarding foram movidos para depois do board.
- Reduzi a altura mínima visual das colunas para melhorar leitura inicial em notebook.

### `/campo`
- `Campo em andamento` foi puxado para logo depois do hero.
- O CTA principal passou a ficar no cabeçalho da seção acionável:
  - `Fechar ciclo`, quando existe missão ativa;
  - `Criar missão`, quando não existe.
- As missões ativas agora aparecem antes dos painéis resumidos de jornada e fechamento.

### `/ritmo`
- Reordenei a página para priorizar comando operacional.
- O topo agora mostra:
  - ritmo semanal;
  - missão do dia;
  - saúde do dia;
  - CTAs `Resolver travas` e `Fechar campo`.
- `CycleAlertList` foi mantido, mas desceu para depois dos blocos principais.
- `TeamFlowAdoptionPanel` e `WeeklyClosureMarkdownGenerator` foram movidos para baixo porque são apoio, não primeiro passo.

## Rotas mantidas com ajuste indireto

### `/dashboard`
- A hierarquia principal já atendia ao critério com `Base de Operações`, status geral e CTA de jornada no hero.
- Nesta rodada, o foco ficou em telas que ainda escondiam a ação principal atrás de onboarding, painéis auxiliares ou resumos.

### `/relatorios/territorios`
- O hero já entregava `Mapa da Mobilização`, território mais quente ou missão inicial e CTA claro.
- Mantido sem refatoração estrutural nesta rodada.

## Decisões visuais
- Ação principal acima, contexto complementar abaixo.
- Onboarding e ajuda contextual nunca competem com o primeiro passo.
- Painéis de coordenação aparecem cedo apenas quando alteram a ação imediata.
- CTAs de notebook precisam estar visíveis sem depender de scroll.

## Riscos restantes
- `/dashboard` ainda depende de validação visual manual em `1024px` para confirmar se parte de `Próximas Missões` continua tangenciando a dobra quando o conteúdo real do hero cresce.
- `/relatorios/territorios` ainda merece checagem com bairros e temas muito longos.
- `/abordagem` pode exigir ajuste fino adicional se colunas reais com muitos badges aumentarem demais a altura do topo.

## Prints recomendados para validação manual
- `/dashboard` em `1024x768`
- `/minha-fila` em `1024x768`
- `/pessoas` em `1024x768`
- `/abordagem` em `1366x768`
- `/relatorios/territorios` em `1366x768`
- `/campo` em `1024x768`
- `/ritmo` em `1024x768`

## Verificação
- `npm run verify` passou.
- Lint segue sem erros, com warnings antigos/adjacentes.
