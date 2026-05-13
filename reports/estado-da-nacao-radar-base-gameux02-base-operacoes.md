# Estado da Nacao - Radar de Base - GAMEUX02
## Base de Operacoes no dashboard

Data: 13/05/2026
Status: Implementado

## Objetivo

Transformar `/dashboard` no hub principal do Radar de Base com linguagem de base operacional cooperativa, foco em acao guiada e leitura integrada de missao, ritmo, territorio, campo e cuidado.

## Entrega principal

Implementacoes realizadas:
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/dashboard-client.tsx`
- `src/app/territorios/page.tsx`

## O que mudou

1. Hero principal
- Novo hero com titulo `Base de Operacoes`.
- Subtitulo: `Seu centro de missões, ritmo e mobilização territorial.`
- Hero mostra Missao do Dia, Fase da Semana, Status Geral e CTAs para iniciar jornada e abrir a Central de Ritmo.

2. Proximas Missoes
- `Pessoas Prioritarias para Hoje` foi substituida por `Proximas Missoes`.
- Cada card agora trata a pessoa como missao ativa, com motivo, fase atual, proxima acao, trilha de jornada e CTA principal.

3. Alertas do Sistema
- Quatro sinais principais em formato de beacon:
- tarefas sem responsavel;
- tarefas paradas;
- territorios pedindo acao;
- acoes de campo sem fechamento.

4. Mapa Rapido
- Nova secao com leitura de bairros em Mobilizacao, Campo e Continuidade.
- Inclui destaques territoriais e CTA operacional para `/territorios`.

5. Campo em Andamento
- Painel com proximas acoes, acoes precisando confirmacao e acoes passadas sem fechamento.

6. Cuidado e Ritmo
- Bloco consolidado com carga da equipe, bem-estar operacional, cuidado da base e progresso coletivo.

7. Alias de navegacao
- Nova rota `/territorios` redireciona para `/relatorios/territorios`, mantendo o CTA prometido sem quebrar a estrutura existente.

## Direcao visual aplicada

A tela deixa de parecer um dashboard empresarial comum e passa a operar como sala de situacao:
- hero de comando;
- cartografia leve em background;
- linguagem de missao e ciclo;
- sinais operacionais;
- densidade de ferramenta real;
- ausencia de ranking, score individual ou pressao por volume.

## Guardrails mantidos

- sem ranking competitivo;
- sem pontuacao individual;
- sem incentivo a spam;
- sem automatizacao de DM;
- sem linguagem caricata de gamer;
- foco em cooperacao, fechamento de ciclo e clareza operacional.

## Verificacao

Comando solicitado:
- `npm run verify`

Resultado:
- Concluido com sucesso.

Detalhes tecnicos:
- `npm run lint`: passou com 140 warnings pre-existentes de imports/variaveis nao utilizados.
- `npm run build`: passou com Next.js 16.2.4.
- `npm run test`: 31 arquivos e 209 testes passaram.
- `npm run check:rls`: passou.
- `npm run check:health`: passou.
- `npm run e2e`: pulado pelo script porque `E2E_RUN=true` nao esta definido.

Validacao visual:
- Captura desktop e mobile realizada com Playwright em `http://127.0.0.1:3102/dashboard`.
- O preview exigiu instancia local com `E2E_BYPASS_AUTH=true`, `E2E_TEST_MODE=true` e `NEXT_PUBLIC_USE_MOCKS=true`, porque a rota interna `/dashboard` redireciona para login sem sessao autenticada.
- A tela renderizada confirmou hero principal como entrada do hub, secoes de missoes, alertas, mapa rapido, campo e cuidado/ritmo em uma unica composicao coerente.
