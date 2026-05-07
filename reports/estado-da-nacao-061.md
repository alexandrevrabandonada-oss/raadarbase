# Estado da Nacao 061

Data: 2026-05-05

## Resumo executivo

Ciclo 061: Implementacao do modulo "Radar de Silencios". Modulo identifica bairros com baixa participacao, pautas com alto engajamento em posts mas pouca conversao para formulario, posts com alto engajamento e score zero, e bairros historicamente presentes mas ausentes na janela territorial ativa. Pagina /radar/silencios disponivel internamente. Integracao com plano de acao para criacao de tarefas por bairro e pauta. Guardrails preservados. Producao bloqueada.

## Modulo entregue

### /radar/silencios

Rota: `/radar/silencios`
Tipo: server component, dynamic, autenticado (admin/operador)

Cards implementados:

1. Bairros com poucos relatos
   - Fonte: bairro_escuta_submissions agrupado por bairro na janela ativa
   - Threshold: menos de 3 relatos
   - Exibe contagem agregada por bairro; sem PII
   - Botao "Criar tarefa" integrado ao plano de acao ativo

2. Pautas com muito comentario e pouco formulario
   - Fonte: ig_posts (metrics.comments_count + metrics.topic_category) x bairro_escuta_submissions (pauta)
   - Metrica: engagementToFormRatio = commentCount / (formCount + 1) >= 2
   - Exibe topic, post_count, comment_count, form_count, ratio
   - Sem PII, sem origem individual
   - Botao "Criar tarefa" integrado

3. Posts com engajamento alto e baixa conversao
   - Fonte: ig_posts com interactions >= 5 e mobilization_score = 0
   - Exibe shortcode, caption excerpt (sanitizado, sem PII), interactions, topic
   - Botao "Criar tarefa para pauta" integrado

4. Bairros ausentes na janela territorial
   - Fonte: historico de bairro_escuta_submissions x bairros presentes na janela ativa
   - Exibe bairros historicos que nao participaram na janela atual
   - Exibe total historico e ultima participacao (data apenas, sem identificador individual)
   - Botao "Criar tarefa" integrado

### Sugestoes coletivas publicas

Painel de sugestoes de acao coletiva sem targeting individual:

- Reforcar chamada por bairro (publicacao manual)
- Criar card explicativo com link direto
- Abrir roda de escuta presencial ou online
- Fazer pergunta publica sobre pauta ou bairro

### Integracao com plano de acao

Acoes do servidor (src/app/radar/silencios/actions.ts):

- createNeighborhoodReinforcementItemAction:
  - type: escuta_bairro
  - title: "Reforcar escuta no bairro: [bairro]"
  - metadata: origin=silence_radar
  - audit log registrado

- createTopicExplanationItemAction:
  - type: material_explicativo
  - title: "Explicar pauta: [topico]"
  - metadata: origin=silence_radar
  - audit log registrado

Plano alvo: action_plan_id da janela territorial ativa (activeWindowActionPlanId) ou primeiro plano ativo disponivel.

### Camada de dados

Arquivo: src/lib/data/silence-radar.ts

Funcao: getSilenceRadarData()

Dados retornados (todos agregados, sem PII):

- quietNeighborhoods: bairros com < 3 relatos na janela ativa
- lowFormTopics: pautas com engagementToFormRatio >= 2
- highEngagementPosts: posts com interactions >= 5 e mobilization_score = 0
- absentNeighborhoods: bairros historicos ausentes da janela atual
- activeWindowId, activeWindowActionPlanId, activeWindowStartsAt
- totalSubmissions

Retorna estrutura vazia no modo mock (shouldUseMockData = true).

### Navegacao

AppShell atualizado com entrada "Radar de Silenciosˮ (icone EarOff da Lucide) apos "Memoriaˮ.

## Guardrails preservados

- Sem score individual.
- Sem classificacao de pessoa.
- Sem DM automatica.
- Sem microtargeting.
- Sem exposicao de PII ou relato bruto.
- Analise apenas em agregados por pauta, bairro, canal e periodo.
- Tarefas criadas manualmente por operador humano, sem automacao.
- Sugestoes sao publicas e coletivas.

## Validacoes executadas

Executado com sucesso:

- npm run lint (0 erros; 14 warnings pre-existentes, inalterados)
- npm run build (compilado; /radar/silencios aparece na lista de rotas)
- npm run test (20 arquivos, 156 testes passando)
- npm run e2e:ci (50 testes passando)
- npm run check:health (sem segredos)
- npm run readiness (avisos esperados de variaveis de producao ausentes)
- npm run staging:devolution-db-check (resultado: OK)
- npm run staging:webhook:evidence (3 eventos, 0 quarentenados, 29 audit logs)
- npm run staging:webhook:go-no-go (decisao: GO_STAGING)

## Producao

- Producao permanece bloqueada.
- Webhooks seguem GO_STAGING.
- Operacao mantida em staging/internal.

## Proximo tijolo

Acompanhar uso do Radar de Silenciosˮ nas proximas janelas de escuta territorial:

- Se bairros continuarem ausentes apos tarefas criadas: avaliar abordagem presencial/coletiva.
- Se pautas continuarem com ratio alto: avaliar criacao de card explicativo dedicado.
- Se posts continuarem com mobilization_score = 0: considerar adicionar chamada de escuta nos comentarios dos posts.
- Considerar adicionar filtro de periodo (7d / 30d / janela atual) na pagina para facilitar analise temporal.
