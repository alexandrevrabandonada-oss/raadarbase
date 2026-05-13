# Estado da Nacao - Radar de Base GAMEUX06

Data: 2026-05-13

## Escopo

Rodada de polimento visual e UX gameful nas telas redesenhadas dos ciclos GAMEUX01 a GAMEUX05, com foco em legibilidade, hierarquia, ritmo visual e clareza do proximo passo. A intervencao priorizou `/dashboard` e componentes compartilhados que afetam `/minha-fila`, `/pessoas`, `/abordagem` e Ficha Rapida.

Rotas revisadas em smoke visual:

- `/dashboard`
- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/ritmo`
- `/relatorios/territorios`
- `/campo`

## Problemas encontrados

- Cards de Proximas Missoes no dashboard tinham leitura apertada em telas medias e pequenas.
- Username e nome publico podiam competir com badges e quebrar a linha de forma pouco controlada.
- Motivo e proxima acao ficavam lado a lado, dificultando escaneamento.
- JourneyBar compacta era pequena demais e podia parecer uma faixa tecnica, nao uma trilha.
- A ordem da `/dashboard` ainda parecia mais um painel com colunas do que um hub operacional guiado.
- O bloco escuro de Cuidado e Ritmo tinha boa presenca visual, mas parecia isolado da narrativa da Base.
- Faltavam portais grandes para as entradas principais da operacao.
- Havia microcopy sem acento e termos menos consistentes com a nova fantasia de produto.

## Decisoes visuais

- Reorganizei a `/dashboard` na ordem: Hero, Comecar Jornada, Proximas Missoes, Alertas, Portais, Campo e Territorios, Ritmo e Bem-estar.
- Transformei os cards de Proximas Missoes em blocos mais verticais, com avatar, fase atual destacada, motivo e proxima acao em areas separadas.
- A JourneyBar compacta virou uma trilha de segmentos com fase atual marcada e contador legivel.
- A JourneyBar completa virou uma sequencia de cinco etapas com blocos maiores, icones e labels separados para evitar labels grudados.
- Adicionei Portais da Operacao: Minha Jornada, Mapa da Mobilizacao, Missoes de Campo, Central de Ritmo e Memoria da Equipe.
- Integrei Cuidado e Ritmo como fechamento da pagina, com painel escuro maior, texto de sustentacao da operacao e cards internos mais equilibrados.
- Ajustei CTAs e microcopy para linguagem de missao cooperativa madura: Abrir Missao, Continuar Jornada, Ver Mapa, Fechar Ciclo, Resolver Trava e Cuidar da Base.
- Corrigi o `CycleAlertList` para usar o padrao correto de link renderizado pelo `Button`, reduzindo ruido do Base UI em superficies compartilhadas.

## Rotas e superficies impactadas

- `/dashboard`: nova hierarquia, hero refinado, Comecar Jornada, cards de missao verticais, alertas, portais, mapa/campo e ritmo integrado.
- `/minha-fila`: recebeu a nova JourneyBar completa e compacta via componente compartilhado.
- `/pessoas`: recebeu a nova JourneyBar compacta nos cards de pessoa.
- `/abordagem`: recebeu a nova JourneyBar compacta nos cards do mural.
- Ficha Rapida: recebeu a nova JourneyBar completa no painel de missao.
- `/ritmo`, `/relatorios/territorios` e `/campo`: revisadas em smoke para garantir que continuam renderizando dentro do universo visual atual.

## QA visual

Capturas geradas para validacao manual:

- `test-results/gameux06/dashboard-390.png`
- `test-results/gameux06/dashboard-768.png`
- `test-results/gameux06/dashboard-1024.png`
- `test-results/gameux06/dashboard-1440.png`

Pontos a validar manualmente nos prints:

- O hero da Base de Operacoes tem hierarquia clara e CTAs com area de toque adequada.
- Cards de missao nao esmagam usernames longos.
- Jornada aparece como trilha, nao como texto comprimido.
- Portais parecem entradas principais do hub.
- Cuidado e Ritmo fecha a pagina como parte da operacao, nao como widget solto.

## Riscos restantes

- Existem avisos antigos de lint e alguns avisos de console relacionados a padroes de `Button nativeButton={false}` em outras partes do app. Esta rodada corrigiu o caso compartilhado encontrado no dashboard, mas uma limpeza global deve ser tratada em tarefa propria.
- A validacao visual foi feita com dados locais/simulados. Estados extremos com textos muito longos, muitos alertas simultaneos ou listas vazias devem ser revisados em uma rodada especifica de QA de conteudo.
- O polimento se concentrou em componentes ja existentes; nao houve criacao de um kit completo de componentes reutilizaveis para todos os padroes gameful.

## Resultado

A `/dashboard` passou a funcionar mais claramente como hub principal da Base de Operacoes, com fluxo guiado, portais de navegacao e cards de missao mais legiveis. A JourneyBar agora sustenta a sensacao de trilha cooperativa sem usar ranking, pontos, XP, medalhas ou incentivo a volume de DM.
