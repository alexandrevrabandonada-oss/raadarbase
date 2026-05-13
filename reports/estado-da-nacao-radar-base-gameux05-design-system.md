# Estado da Nacao - Radar Base GameUX05

## Escopo

Definicao do design system gameful do Radar de Base para unificar a estetica premium, moderna e cooperativa ja iniciada nas rodadas de Base de Operacoes, Jornada do Operador, Mapa da Mobilizacao e Missoes de Campo.

## Entregas

- Criado o documento `docs/radar-de-base-design-system-gameful.md`.
- Definida a linguagem visual: strategy game, command center e cooperative RPG, sem estetica caricatural ou neon excessivo.
- Definidos tokens de cor, fase, alerta, conclusao, fundos, bordas, sombras, raios e gradientes.
- Definida a anatomia dos componentes prioritarios:
  - `MissionHero`
  - `MissionCard`
  - `JourneyBar`
  - `AlertBeacon`
  - `TerritoryNode`
  - `RhythmPanel`
  - `CompletionToast`
  - `FieldQuestCard`
  - `QuestColumn`
  - `WellbeingMeter`
- Definidos estados visuais: ativo, pendente, bloqueado, em espera, concluido e cuidado.
- Definida hierarquia tipografica baseada em Geist com titulos fortes, microcopy clara e badges consistentes.
- Definidos padroes de motion para entrada de painel, avanco de fase, conclusao e alertas.
- Incluidas regras de acessibilidade e checklist de implementacao por rota.

## Decisoes principais

- `indigo` fica como cor de comando, mas nao deve dominar sozinho a interface.
- Fases usam familias distintas para reduzir monotonia e melhorar reconhecimento.
- Bloqueios eticos podem usar fundo escuro estavel para comunicar seriedade.
- Conclusao deve parecer fechamento de ciclo, nao recompensa de jogo.
- Bem-estar passa a ser estado visual de primeira classe.
- Territorio e campo usam a mesma linguagem de mapa, missao, fase e continuidade.

## Arquivos

- `docs/radar-de-base-design-system-gameful.md`
- `reports/estado-da-nacao-radar-base-gameux05-design-system.md`

## Verificacao

Executar `npm run verify` apos a criacao da documentacao para manter o fluxo de aceite do projeto.

## Risco residual

O documento define o contrato visual e operacional. A proxima rodada deve transformar esses tokens em helpers/classes/componentes reutilizaveis para reduzir duplicacao de Tailwind nas telas ja redesenhadas.
