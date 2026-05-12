# Estado da Nacao - Radar de Base - Ritmo 06
## Central de Ritmo

Data: 12/05/2026
Status: Implementado

## Objetivo do ritmo
Criar uma tela central para coordenacao com leitura em menos de 2 minutos, respondendo as perguntas operacionais do dia sem expor ranking individual, nomes de cidadaos ou tom competitivo.

## Entrega principal
Implementacoes realizadas:
- src/app/ritmo/page.tsx
- src/app/ritmo/ritmo-client.tsx
- src/components/sidebar.tsx

## O que foi entregue
1. Rota dedicada
- Nova rota interna em /ritmo com autenticacao de pagina interna.

2. Cabecalho da Central de Ritmo
- Titulo: Central de Ritmo.
- Subtitulo: leitura coletiva da operacao sem pressao por volume.

3. Missao do Dia e Ritmo da Semana
- Reuso dos componentes existentes:
  - DailyMission
  - WeeklyRhythmCard
- Estados calculados com dados operacionais atuais.

4. Saude da Operacao (5 metricas)
- Tarefas +48h.
- Aguardando +7 dias.
- DM sem confirmacao.
- Sem responsavel.
- Territorios sem acao recente.

5. Cuidado da Base (4 metricas)
- Nao Abordar respeitados.
- Alertas de notas sensiveis.
- Dados em revisao.
- Registros para revisao (eligibleForReviewCount).

6. Territorios
- Bloco com tres fases:
  - Mobilizacao
  - Campo
  - Continuidade
- Botao para /relatorios/territorios.

7. Campo
- Acoes planejadas.
- Acoes precisando confirmacao.
- Eventos passados sem resultado.
- Botao para /campo.

8. Bem-Estar
- Carga media da fila.
- Alertas de excesso.
- Recomendacao objetiva de redistribuicao/pausa quando necessario.

9. Navegacao lateral
- Novo item Central de Ritmo adicionado no grupo Operar hoje.

## Guardrails aplicados
- Sem ranking individual.
- Sem exibicao de nomes de cidadaos.
- Sem linguagem de competicao.
- Sem indicadores de volume de disparo.

## Fontes de dados reutilizadas
- getPilotDashboardData
- getCollectiveProgressMetrics
- getBaseQualityStats
- listTerritorySummaries + mapTerritoryToPhase
- listFieldAgendaEvents + listFieldAgendaEventResultsByEventIds
- calculateOperatorMission
- calculateWeeklyRhythm
- assessQueueWellness

## Verificacao tecnica
Comando executado:
- npm run verify

Resultado:
- Verificacao concluida com sucesso (status verde).
- Pipeline completo executado: lint, build, testes, check:rls, check:health e e2e.

## Conclusao
A Central de Ritmo consolida missao, semana, saude operacional, cuidado da base, territorios, campo e bem-estar em um unico ponto de coordenacao, com foco em qualidade, fechamento de ciclo e ritmo sustentavel.
