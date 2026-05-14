# Radar de Base - Estado Atual do Projeto

Data: 2026-05-14

## Resumo executivo

O Radar de Base deixou de ser um painel operacional genérico e hoje funciona como uma Base de Operações de Mobilização com linguagem gameful profissional, foco em missões, leitura territorial e fluxo cooperativo. A direção visual já está consolidada nas superfícies principais e o trabalho mais recente saiu da camada conceitual para a camada de uso real: overflow, primeira dobra, barra de comando e modo compacto.

Estado de referência:

- último commit publicado: `ecdf489` (`Propagate gameful identity to remaining surfaces`)
- estado local atual: inclui as rodadas GAMEUX14, GAMEUX15 e GAMEUX16, validadas localmente com `npm run verify`

## Posição atual do produto

O sistema hoje se organiza como um conjunto de áreas conectadas:

- `Base de Operações` como hub principal
- `Minha Jornada` como trilha diária do operador
- `Prioridades da Equipe` para leitura e assunção de missões
- `Mural de Missões` para coordenação e avanço por fase
- `Mapa da Mobilização` para leitura territorial agregada
- `Missões de Campo` para a operação presencial
- `Central de Ritmo` para carga, alertas e bem-estar
- `Memória da Equipe` para continuidade e contexto

Essa estrutura já está refletida tanto na navegação lateral quanto no desenho das telas principais.

## Rotas principais

Rotas já tratadas ou convergidas no ciclo atual:

- `/dashboard`
- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/relatorios/territorios`
- `/campo`
- `/ritmo`
- `/mensagens`
- `/memoria`
- `/voluntarios`

Rotas com melhor maturidade visual e operacional hoje:

- `/dashboard`
- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/relatorios/territorios`

## Estado da interface

### Identidade visual

- linguagem visual consolidada em papel claro, painéis escuros, acento dourado e grid técnico
- estética de sala de comando e jogo cooperativo de estratégia, sem caricatura gamer
- microcopy operacional orientada a missão, jornada, ciclo, trava, cuidado e mapa
- guardrails éticos visíveis nas superfícies operacionais

### Navegação

- sidebar reorganizada por mundos:
  - Base
  - Jornada
  - Território
  - Campo
  - Memória
  - Comando
  - Sistema
- estado ativo mais expressivo
- dashboard com `Mapa Rápido` e portais principais

### Padrões compartilhados

Kit visual já reutilizado entre as telas principais:

- `GamefulHero`
- `GamefulMetricCard`
- `GamefulPortalCard`
- `GamefulEmptyState`
- `MissionCard`
- `JourneyBar`
- `RhythmPanel`
- `TerritoryNodeCard`
- `FieldMissionCard`
- `EthicalGuardrailBanner`
- `AlertBeacon`
- `OperationalCommandBar`
- `CompactModeToggle`

## O que está consolidado por área

### 1. Dashboard / Base de Operações

Já funciona como hub principal do sistema:

- hero principal com missão do dia, fase semanal e status
- próximas missões em linguagem de campanha
- alertas do sistema
- portais da operação
- integração com campo, mapa, ritmo e bem-estar
- barra de comando operacional persistente

### 2. Minha Jornada

Já funciona como tela principal do operador:

- hero de jornada
- próxima missão em destaque
- card principal de missão com CTA claro
- trilha das próximas missões
- completion moments
- integração com bem-estar
- barra de comando persistente
- modo compacto automático em notebook ou alta carga

### 3. Pessoas / Prioridades da Equipe

Já funciona como superfície de operação e triagem:

- hero alinhado ao kit
- filtros operacionais
- cards em linguagem de missão
- lista densa para uso real
- ficha rápida conectada ao fluxo
- barra de comando persistente
- filtros sticky
- modo compacto automático quando há mais de 20 missões ou viewport menor

### 4. Abordagem / Mural de Missões

Já funciona como mural operacional:

- colunas por fase da missão
- filtros e leitura de gargalo
- distribuição de trabalho
- cards de missão convergidos ao kit visual
- barra de comando persistente
- balanceamento recolhível
- colunas mais compactas em notebook

### 5. Territórios / Mapa da Mobilização

Já funciona como leitura agregada do território:

- hero e narrativa territorial
- bairros como nós/cartas territoriais
- fase territorial, calor, temas e ação recomendada
- estados vazios já tratados para ausência de bairros mapeados

### 6. Campo / Missões de Campo

Já está conectado ao mesmo universo visual:

- jornada da ação
- progresso
- convites, confirmações, presença e follow-up
- leitura operacional alinhada ao restante do produto

### 7. Ritmo / Central de Ritmo

Já compõe o mesmo sistema:

- pulso operacional
- alertas e carga
- bem-estar da base
- painel escuro integrado ao restante da Base de Operações

## GAMEUX - fotografia dos ciclos

### Consolidado anteriormente

- `GAMEUX01`: direção geral gameful
- `GAMEUX02`: Base de Operações no dashboard
- `GAMEUX03`: jornada do operador
- `GAMEUX04`: mapa e campo
- `GAMEUX05`: design system gameful
- `GAMEUX06`: polimento visual
- `GAMEUX07`: navegação em mapa de mundos
- `GAMEUX08`: Minha Jornada como tela diária
- `GAMEUX09`: empty/loading/zero states
- `GAMEUX10`: kit de componentes compartilhados
- `GAMEUX11`: QA com dados reais e overflow
- `GAMEUX12`: convergência de componentes locais
- `GAMEUX13`: primeira dobra em notebook

### Rodadas recentes validadas localmente

- `GAMEUX14`: correção de overflow, hero grande demais e grupos de botões em uso real
- `GAMEUX15`: criação da `OperationalCommandBar`
- `GAMEUX16`: modo compacto automático com preferência local

Relatórios já existentes nesta fase:

- [estado-da-nacao-radar-base-gameux14-overflow-layout-real.md](</C:/Projetos/Radar de Base/reports/estado-da-nacao-radar-base-gameux14-overflow-layout-real.md>)
- [estado-da-nacao-radar-base-gameux15-barra-comando.md](</C:/Projetos/Radar de Base/reports/estado-da-nacao-radar-base-gameux15-barra-comando.md>)
- [estado-da-nacao-radar-base-gameux16-modo-compacto.md](</C:/Projetos/Radar de Base/reports/estado-da-nacao-radar-base-gameux16-modo-compacto.md>)

## Qualidade e validação

Validação mais recente executada no estado local atual:

- `npm run verify` passou
- `npm run lint` passou com warnings antigos/adjacentes, sem erros
- `npm run build` passou
- `vitest`: 31 arquivos, 209 testes passando
- `npm run check:rls` passou
- `npm run check:health` passou
- `e2e` local continua sendo pulado quando `E2E_RUN=true` não está definido

## Estado do repositório

No momento deste relatório:

- o repositório **não está limpo**
- existem mudanças locais relevantes ainda não publicadas
- há arquivos novos e modificados ligados principalmente às rodadas GAMEUX14-GAMEUX16

Em termos práticos, isso significa:

- o estado funcional mais recente está validado localmente
- o estado publicado em `origin/main` ainda está atrás dessas três rodadas

## Riscos restantes

### 1. Publicação pendente

As melhorias mais recentes de layout real, barra de comando e modo compacto ainda precisam de commit/push para virarem baseline do projeto.

### 2. Warnings acumulados

O repositório segue com warnings antigos e adjacentes, especialmente em arquivos de suporte, scripts e algumas telas fora do foco imediato.

### 3. Validação com dados reais autenticados

Mesmo com `verify` verde, ainda vale uma passada manual autenticada em staging/produção para revisar:

- notebook `1024x768`
- notebook `1366x768`
- desktop `1440x900`
- mobile `390px`

### 4. Superfícies secundárias

As superfícies principais estão bastante convergidas. O trabalho restante é mais de acabamento fino e uniformização de áreas secundárias do que de redefinição estrutural.

## Próximos passos recomendados

1. Publicar as mudanças locais de GAMEUX14, GAMEUX15 e GAMEUX16.
2. Fazer QA visual manual autenticado nas rotas operacionais mais usadas.
3. Limpar warnings de lint fora do fluxo crítico, começando pelos arquivos operacionais mais tocados.
4. Revalidar comportamento sticky e modo compacto em notebook real.
5. Continuar a convergência das telas secundárias no mesmo kit, evitando novos componentes locais de responsabilidade mista.

## Leitura final

Hoje o Radar de Base já tem uma direção de produto clara, um sistema visual consistente e um fluxo operacional muito mais forte do que no início da fase gameful. O problema principal deixou de ser direção e passou a ser acabamento, publicação e validação fina em uso real. Isso é um bom sinal: a fundação está de pé, e o trabalho restante é tornar a operação mais robusta e previsível no dia a dia.
