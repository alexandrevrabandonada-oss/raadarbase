# Radar de Base - Direcao Gameful UI

Este documento define a nova direcao de layout, arquitetura de interface e linguagem visual do Radar de Base como uma **Base de Operacoes de Mobilizacao**.

A proposta nao transforma o sistema em jogo competitivo. Ela usa linguagem, estrutura e ritmo de jogo cooperativo de estrategia para tornar o trabalho mais claro, bonito e situado, preservando os guardrails eticos ja estabelecidos.

## 1. Tese de produto

O Radar de Base deve deixar de parecer um painel empresarial generico e passar a parecer uma base de operacoes viva, onde uma equipe coordena escuta, vinculo, territorio e campo com responsabilidade.

O produto deve comunicar:
- existe uma operacao em andamento;
- cada pessoa tem um proximo passo claro;
- cada territorio tem maturidade e contexto;
- cada missao precisa ser concluida com cuidado;
- a equipe progride junto, nao compete entre si.

## 2. Fantasia de produto

### Base de Operacoes

A Base de Operacoes e o espaco principal do sistema. Ela substitui mentalmente a ideia de "dashboard" por uma sala de situacao cooperativa.

Papel na interface:
- mostrar o estado atual da operacao;
- revelar bloqueios eticos e operacionais;
- indicar a proxima melhor acao;
- conectar Jornada, Territorios, Campo e Ritmo.

Tratamento visual:
- cabecalho de operacao com data, turno e leitura de saude;
- paineis densos, legiveis e interligados;
- mapa, trilhas e ciclos como metaforas visuais;
- nenhum elemento de placar individual.

### Missoes

Missoes sao unidades de trabalho com contexto, dono, fase e fechamento. Uma missao pode ser uma conversa, um encaminhamento, uma revisao de base, uma acao de campo ou um ritual de coordenacao.

Regras:
- toda missao tem objetivo claro;
- toda missao mostra fase atual;
- toda missao mostra o que bloqueia o avanco;
- toda missao tem criterio de conclusao saudavel;
- nenhuma missao recompensa volume bruto.

Exemplos de rotulos:
- Missao do Dia;
- Missao de Vinculo;
- Missao de Campo;
- Missao de Revisao;
- Missao de Fechamento.

### Jornada

A Jornada e a trilha operacional que orienta o operador sem pressionar. Ela continua baseada no fluxo:

Preparar -> Conversar -> Registrar -> Encaminhar -> Concluir

Na nova UI, a Jornada deve aparecer como uma trilha persistente, nao como uma barra decorativa. A etapa atual precisa estar visivel nas telas de trabalho, especialmente em Ficha Rapida, Minha Fila, Conversas e Encaminhamentos.

### Mapa da Mobilizacao

O Mapa da Mobilizacao e a leitura territorial do sistema. Ele nao precisa ser apenas um mapa geografico literal; pode combinar lista, mapa, heatmap e fases de territorio.

Os territorios devem parecer areas de campanha em maturacao:
- Observacao;
- Escuta;
- Mobilizacao;
- Campo;
- Continuidade.

Cada territorio deve responder rapidamente:
- em que fase estamos aqui;
- qual foi o ultimo sinal relevante;
- qual e o proximo passo coletivo;
- existe acao de campo vinculada;
- existe risco de abandono, excesso ou ruido.

### Missoes de Campo

Campo deve parecer campanha em andamento, nao apenas agenda. Acoes presenciais precisam ser representadas como ciclos:

Planejar -> Convidar -> Confirmar -> Realizar -> Registrar -> Follow-up

Cada acao de campo deve mostrar:
- territorio;
- objetivo;
- janela temporal;
- responsaveis;
- pendencias;
- fechamento;
- aprendizados.

### Central de Ritmo

A Central de Ritmo e o modo de leitura rapida da coordenacao. Ela deve manter o foco em ritmo sustentavel, saude da operacao e fechamento de ciclos.

Ela deve responder em ate 2 minutos:
- o que precisa de atencao hoje;
- onde a operacao esta travada;
- qual territorio precisa de cuidado;
- qual acao de campo precisa de fechamento;
- se a equipe esta sobrecarregada.

### Memoria da Equipe

A Memoria da Equipe e a camada que guarda aprendizado coletivo, sem vigilancia punitiva. Ela transforma fechamento de ciclos em conhecimento operacional.

Ela inclui:
- retrospectivas;
- notas de aprendizado;
- padroes de resposta;
- temas emergentes;
- decisoes de coordenacao;
- historico de cuidado com base e territorio.

Nao deve incluir:
- ranking de operadores;
- comparacao individual de produtividade;
- placar de disparos;
- metricas para punicao.

## 3. Dois modos de uso

### Modo Jornada (operador)

Modo Jornada e a experiencia principal de quem executa trabalho diario de vinculo.

Objetivo:
- reduzir duvida;
- mostrar a proxima acao;
- proteger o operador contra excesso;
- manter registro fiel e fechamento responsavel.

Arquitetura da tela:
- topo: Missao do Dia, fase atual e alertas eticos;
- centro: fila ou missao ativa;
- lateral ou drawer: contexto da pessoa, historico e roteiro;
- rodape ou bloco final: fechamento da etapa.

Prioridades de interface:
- uma acao primaria por vez;
- bloqueios antes de CTA;
- sugestao de mensagem sem envio automatico;
- confirmacao manual explicita;
- fechamento com aprendizado, nao apenas "feito".

Rotas existentes que podem compor este modo:
- `/pessoas` como Fila de Missoes;
- `/abordagem` como Jornada de Vinculo;
- `/mensagens` como Arsenal de Roteiros;
- telas de detalhe/drawer como Ficha de Missao.

### Modo Comando (coordenacao)

Modo Comando e a experiencia de coordenacao coletiva da operacao.

Objetivo:
- ler o estado geral;
- redistribuir trabalho;
- detectar bloqueios;
- acompanhar territorios;
- fechar ciclos de campo e semana;
- preservar qualidade e bem-estar.

Arquitetura da tela:
- topo: estado da operacao, janela do ciclo e alertas de saude;
- centro: mapa/territorios, ritmo e pendencias criticas;
- lado: fila de decisoes, bloqueios e revisoes;
- fechamento: aprendizados e proximos comandos.

Prioridades de interface:
- leitura em camadas;
- filtros por territorio, fase e risco;
- alertas coletivos sem exposicao indevida;
- nenhuma ordenacao por performance individual;
- decisoes registraveis na Memoria da Equipe.

Rotas existentes que podem compor este modo:
- `/dashboard` como Base de Operacoes;
- `/ritmo` como Central de Ritmo;
- `/relatorios/territorios` como Mapa da Mobilizacao;
- `/campo` como Missoes de Campo;
- `/relatorios` como Inteligencia e Memoria.

## 4. Navegacao lateral proposta

A reorganizacao abaixo nao exige quebrar rotas existentes. Ela redefine agrupamentos, rotulos visuais e hierarquia.

### Grupo 1: Operar Agora

Uso: trabalho diario do operador.

Itens:
- Missao do Dia -> rota atual de foco operacional ou dashboard filtrado;
- Fila de Missoes -> `/pessoas`;
- Jornada de Vinculo -> `/abordagem`;
- Roteiros de Conversa -> `/mensagens`.

Experiencia:
- deve ser o primeiro grupo;
- deve destacar proxima pendencia;
- deve indicar fase atual sem poluir;
- deve caber em mobile sem depender de memorizacao.

### Grupo 2: Mapa da Mobilizacao

Uso: leitura territorial e estrategia de mobilizacao.

Itens:
- Territorios -> rota territorial existente;
- Mapa de Calor -> relatorios territoriais ou visao equivalente;
- Fases Territoriais -> relatorio/visao de maturidade;
- Missoes de Campo -> `/campo`.

Experiencia:
- territorios aparecem como areas vivas;
- fases aparecem como maturidade, nao score;
- campo aparece conectado ao territorio;
- alertas mostram risco de abandono, excesso ou falta de fechamento.

### Grupo 3: Central de Comando

Uso: coordenacao, ritmo e saude operacional.

Itens:
- Base de Operacoes -> `/dashboard`;
- Central de Ritmo -> `/ritmo`;
- Ritmo da Semana -> bloco ou rota existente;
- Fechamentos -> relatorios de ciclos, campo e semana.

Experiencia:
- leitura rapida;
- foco em saude, gargalos e decisoes;
- tom de sala de situacao;
- zero comparacao individual.

### Grupo 4: Memoria da Equipe

Uso: aprendizado, historico e governanca.

Itens:
- Relatorios -> `/relatorios`;
- Retrospectivas -> documentos/relatorios de fechamento;
- Qualidade da Base -> auditorias e revisoes;
- Treinamento -> materiais de onboarding e modo treinamento.

Experiencia:
- deve parecer biblioteca operacional;
- registrar aprendizados sem burocracia;
- permitir consulta rapida;
- reforcar cultura etica.

### Grupo 5: Sistema

Uso: configuracoes, acesso e governanca tecnica.

Itens:
- Configuracoes;
- Usuarios e permissoes;
- Importacao;
- Governanca.

Experiencia:
- menos destaque no uso diario;
- acesso claro para coordenacao;
- linguagem objetiva e administrativa quando necessario.

## 5. Principios da nova UX

### O proximo passo sempre deve estar claro

Toda tela precisa responder: "o que faco agora?". Se houver bloqueio, o bloqueio vira a proxima acao.

Padroes:
- CTA primaria unica;
- texto de apoio curto;
- estado vazio com proxima acao concreta;
- alerta etico antes de qualquer avanco.

### A etapa atual sempre deve estar visivel

O usuario deve saber em qual fase esta sem procurar.

Padroes:
- trilha de Jornada no topo da missao;
- badge de fase nos cards;
- fase territorial sempre junto do nome do territorio;
- fase de campo sempre junto da data da acao.

### Cada tela precisa parecer parte do mesmo mundo

O sistema deve ter linguagem visual compartilhada:
- trilhas;
- mapas;
- paineis de comando;
- fichas de missao;
- logs de memoria;
- estados de ciclo.

Nao deve haver uma tela com estetica SaaS generica e outra com estetica operacional. A fantasia de Base de Operacoes precisa atravessar todo o produto.

### Tarefas devem parecer missoes

Uma tarefa vira missao quando tem contexto, objetivo, fase, bloqueio e fechamento.

Campos recomendados:
- objetivo;
- fase;
- responsavel;
- proximo passo;
- bloqueios;
- criterio de conclusao.

### Territorios devem parecer mapa

Mesmo em lista, territorio deve ser apresentado como area de operacao.

Padroes:
- agrupamento por regiao/bairro;
- fase territorial proeminente;
- indicador de ultimo movimento;
- acao recomendada;
- vinculo com campo e ritmo.

### Campo deve parecer campanha em andamento

Campo nao e calendario isolado. Ele e uma sequencia de preparacao, convite, realizacao, registro e retorno.

Padroes:
- linha do tempo da acao;
- checklist de fechamento;
- pendencias pos-evento;
- aprendizado conectado a Memoria da Equipe.

### Conclusao deve parecer fechamento de ciclo

Concluir nao e "ganhar pontos". Concluir e remover pendencia, preservar memoria e cuidar da continuidade.

Padroes:
- tela ou bloco de fechamento;
- resumo do que foi resolvido;
- aprendizado opcional;
- proximo ciclo sugerido;
- mensagem de cuidado, sem euforia artificial.

## 6. Linguagem visual

### Direcao estetica

O visual deve se aproximar de um jogo cooperativo de estrategia maduro:
- sofisticado;
- claro;
- tatico;
- humano;
- responsavel.

Evitar:
- neon excessivo;
- avatares caricatos;
- medalhas;
- trofeus;
- ranking;
- barras de XP;
- moedas;
- linguagem militar agressiva;
- fantasia de combate.

Preferir:
- cartografia leve;
- paineis de situacao;
- linhas de conexao;
- trilhas de jornada;
- marcadores territoriais;
- textura sutil de mapa ou papel tecnico;
- icones funcionais;
- estados de ciclo.

### Paleta

A paleta deve comunicar operacao, cuidado e territorio, sem virar tema escuro generico ou SaaS frio.

Recomendacao:
- base clara ou neutra com contraste forte;
- verde como continuidade/cuidado;
- azul como informacao/escuta;
- amarelo/ambar como atencao;
- vermelho apenas para bloqueio ou risco real;
- tons terrosos ou cartograficos em apoio, sem dominar a tela.

### Tipografia e densidade

O sistema deve ser mais denso que landing page e mais expressivo que planilha.

Regras:
- titulos curtos e situacionais;
- labels objetivos;
- microcopy orientada a acao;
- evitar hero gigante em telas internas;
- manter leitura rapida em mobile.

### Iconografia

Icones devem apoiar reconhecimento, nao decorar.

Familias recomendadas:
- mapa/territorio;
- rota/trilha;
- alvo como objetivo, nao competicao;
- escuta/conversa;
- calendario/campo;
- arquivo/memoria;
- alerta/cuidado.

## 7. Guardrails eticos da interface

A nova direcao visual nao pode enfraquecer a etica do projeto.

Proibido:
- ranking competitivo;
- pontuacao individual;
- placar de DMs;
- medalhas por volume;
- automatizacao de DM;
- sugestao de spam;
- urgencia artificial;
- comparacao publica de operadores;
- mecanicas de pressao por streak.

Obrigatorio:
- respeitar Nao Abordar;
- indicar janelas de espera;
- confirmar envio manual;
- destacar bloqueios eticos;
- valorizar fechamento de ciclo;
- mostrar progresso coletivo;
- proteger bem-estar da equipe;
- manter acessibilidade e clareza.

## 8. Arquitetura de interface por componente

### MissionCard

Card padrao para qualquer missao.

Conteudo:
- titulo;
- tipo de missao;
- fase atual;
- proximo passo;
- bloqueios;
- responsavel;
- CTA primaria.

### JourneyRail

Trilha visual da jornada.

Uso:
- Ficha Rapida;
- Jornada de Vinculo;
- Missoes de Campo;
- Fechamentos.

### TerritoryMapPanel

Painel de territorio em modo mapa/lista.

Conteudo:
- territorio;
- fase;
- sinais recentes;
- acao recomendada;
- pendencias de campo;
- estado de continuidade.

### CommandHeader

Cabecalho da Base de Operacoes e Modo Comando.

Conteudo:
- ciclo atual;
- saude operacional;
- alertas;
- filtro de territorio;
- link para fechamento.

### TeamMemoryLog

Registro de aprendizados e decisoes.

Conteudo:
- data;
- ciclo;
- aprendizado;
- decisao;
- impacto;
- proxima revisao.

## 9. Direcao de implementacao

Ordem sugerida para redesign:

1. Renomear e reagrupar a navegacao lateral sem alterar rotas.
2. Criar linguagem de cards de missao.
3. Aplicar JourneyRail nas telas de operador.
4. Transformar dashboard em Base de Operacoes.
5. Transformar territorios em Mapa da Mobilizacao.
6. Transformar campo em campanha em andamento.
7. Criar Memoria da Equipe como camada de fechamento e aprendizado.
8. Revisar mobile, acessibilidade e estados vazios.

## 10. Criterio de sucesso

A proxima rodada de redesign sera bem sucedida se:
- um operador souber a proxima acao em ate 5 segundos;
- a coordenacao entender a saude da operacao em ate 2 minutos;
- territorios parecerem parte de um mapa vivo;
- tarefas parecerem missoes com fechamento;
- campo parecer campanha em andamento;
- conclusoes gerarem memoria e continuidade;
- nenhuma tela incentivar competicao, spam ou vigilancia punitiva.

