# Estado da Nacao - Radar de Base - GAMEUX01
## Direcao geral da Base de Operacoes de Mobilizacao

Data: 13/05/2026
Status: Direcao definida

## Objetivo

Definir a nova direcao de layout, arquitetura de interface e linguagem visual do Radar de Base para orientar a proxima rodada de redesign.

A decisao central e reposicionar o produto como uma **Base de Operacoes de Mobilizacao**: uma experiencia cooperativa, estrategica e madura, com sensacao de jogo de estrategia sem cair em estetica gamer caricata, competicao, pontuacao individual ou incentivo a volume.

## Entrega principal

Documento criado:
- `docs/radar-de-base-direcao-gameful-ui.md`

Este documento consolida:
- fantasia de produto;
- modos de uso;
- reorganizacao da navegacao lateral;
- principios da nova UX;
- linguagem visual;
- guardrails eticos;
- componentes conceituais;
- ordem sugerida de implementacao.

## Fantasia de produto definida

A nova linguagem do Radar passa a se organizar em sete blocos:

1. Base de Operacoes
- Substitui a leitura mental de dashboard por sala de situacao cooperativa.
- Mostra estado atual, bloqueios, proxima acao e saude da operacao.

2. Missoes
- Transformam tarefas em unidades com objetivo, fase, bloqueio e fechamento.
- Evitam qualquer recompensa por volume bruto.

3. Jornada
- Mantem o fluxo Preparar -> Conversar -> Registrar -> Encaminhar -> Concluir.
- Deve aparecer como trilha persistente e orientadora.

4. Mapa da Mobilizacao
- Reposiciona territorios como areas de operacao em maturacao.
- Usa fases territoriais: Observacao, Escuta, Mobilizacao, Campo e Continuidade.

5. Missoes de Campo
- Reposiciona agenda de campo como campanha em andamento.
- Usa ciclo Planejar -> Convidar -> Confirmar -> Realizar -> Registrar -> Follow-up.

6. Central de Ritmo
- Mantem a coordenacao focada em leitura rapida, saude e gargalos.
- Reforca progresso coletivo e ritmo sustentavel.

7. Memoria da Equipe
- Guarda aprendizados, decisoes e retrospectivas.
- Evita vigilancia punitiva e comparacao individual.

## Modos de uso definidos

### Modo Jornada

Modo principal para operadores.

Foco:
- proxima acao clara;
- fase atual visivel;
- bloqueios eticos antes de CTA;
- sugestao de mensagem sem envio automatico;
- fechamento responsavel.

Rotas relacionadas:
- `/pessoas`;
- `/abordagem`;
- `/mensagens`;
- fichas e drawers operacionais.

### Modo Comando

Modo principal para coordenacao.

Foco:
- leitura geral da operacao;
- saude da equipe;
- gargalos;
- territorios;
- campo;
- fechamento de ciclos;
- memoria e aprendizado.

Rotas relacionadas:
- `/dashboard`;
- `/ritmo`;
- `/relatorios/territorios`;
- `/campo`;
- `/relatorios`.

## Navegacao lateral proposta

A proposta preserva rotas existentes e altera a organizacao conceitual:

1. Operar Agora
- Missao do Dia;
- Fila de Missoes;
- Jornada de Vinculo;
- Roteiros de Conversa.

2. Mapa da Mobilizacao
- Territorios;
- Mapa de Calor;
- Fases Territoriais;
- Missoes de Campo.

3. Central de Comando
- Base de Operacoes;
- Central de Ritmo;
- Ritmo da Semana;
- Fechamentos.

4. Memoria da Equipe
- Relatorios;
- Retrospectivas;
- Qualidade da Base;
- Treinamento.

5. Sistema
- Configuracoes;
- Usuarios e permissoes;
- Importacao;
- Governanca.

## Principios UX consolidados

A nova rodada de interface deve seguir estes principios:

- o proximo passo sempre deve estar claro;
- a etapa atual sempre deve estar visivel;
- cada tela precisa parecer parte do mesmo mundo;
- tarefas devem parecer missoes;
- territorios devem parecer mapa;
- campo deve parecer campanha em andamento;
- conclusao deve parecer fechamento de ciclo.

## Linguagem visual decidida

Direcao:
- jogo cooperativo de estrategia maduro;
- base operacional viva;
- cartografia leve;
- paineis de situacao;
- trilhas, fases e ciclos;
- densidade de ferramenta real, nao landing page.

Evitar:
- neon excessivo;
- trofeus;
- medalhas;
- barras de XP;
- moedas;
- ranking;
- placar individual;
- tom militar agressivo;
- caricatura gamer.

## Guardrails preservados

A direcao reforca os guardrails existentes:
- sem ranking competitivo;
- sem pontuacao individual;
- sem incentivo a spam;
- sem automatizar DM;
- sem comparacao publica de operadores;
- sem urgencia artificial;
- respeito a Nao Abordar;
- confirmacao manual de envio;
- progresso coletivo;
- fechamento de ciclo;
- bem-estar da equipe.

## Componentes conceituais sugeridos

Foram definidos cinco componentes de referencia para guiar a proxima implementacao:

- `MissionCard`: unidade padrao de missao;
- `JourneyRail`: trilha visual de fases;
- `TerritoryMapPanel`: painel de territorio em modo mapa/lista;
- `CommandHeader`: cabecalho de Base de Operacoes;
- `TeamMemoryLog`: registro de aprendizados e decisoes.

## Proxima rodada recomendada

Ordem sugerida:

1. Reorganizar sidebar com novos grupos e rotulos, preservando rotas.
2. Criar padrao visual de `MissionCard`.
3. Aplicar `JourneyRail` no Modo Jornada.
4. Reposicionar `/dashboard` como Base de Operacoes.
5. Reposicionar territorios como Mapa da Mobilizacao.
6. Reposicionar `/campo` como Missoes de Campo.
7. Criar camada de Memoria da Equipe.
8. Validar responsividade, contraste, foco de teclado e estados vazios.

## Criterio de aceite

O criterio de aceite desta etapa foi atendido: a nova direcao esta clara o suficiente para orientar a proxima rodada de redesign sem alterar codigo de produto nesta entrega.

## Verificacao

Comando solicitado:
- `npm run verify`

Resultado:
- Concluido com sucesso.

Detalhes:
- `npm run lint`: passou com 152 warnings pre-existentes de imports/variaveis nao utilizados.
- `npm run build`: passou com Next.js 16.2.4.
- `npm run test`: 31 arquivos de teste passaram, 209 testes passaram.
- `npm run check:rls`: passou; credenciais opcionais de papeis admin/operador/leitura ausentes foram puladas pelo script.
- `npm run check:health`: passou.
- `npm run e2e`: pulado pelo script porque `E2E_RUN=true` nao esta definido.
