# Estado da Nacao 060

Data: 2026-05-05

## Resumo executivo

Ciclo 060 concluido com geracao do snapshot pos-observacao da janela territorial ativa apos o novo lote de divulgacao manual. Total de relatos permanece zero. Conversao do novo lote registrada como waiting_results (lote divulgado ha menos de 24h). Plano atualizado com metricas de conversao no item de monitoramento. Evidencia operacional registrada. Hipoteses de proxima comunicacao documentadas. Producao permanece bloqueada.

## Janela territorial

- window_id: 116d07a6-c9c3-4443-ae21-52f4d6194cbd
- status: open
- source_report_id: f64c9551-6c9c-4767-a816-489dc701ac6b
- action_plan_id: b8c2f738-5cb2-456c-b013-6d21d3bd7e4d

## Snapshot pos-observacao

Snapshot gerado em: 2026-05-05T16:58:04.423+00:00

- id: 9b43575e-b33d-47bb-ac4a-836a64cd4e8c
- snapshot_date: 2026-05-05
- status: attention
- notes: Novo reforço manual registrado; ainda sem conversão em relatos.

Contagens agregadas (sem PII):

- total_reports: 0
- total_with_contact_consent: 0
- total_without_contact_consent: 0
- neighborhoods_count: 0
- topics_count: 0
- pending_review_count: 0
- reviewed_count: 0
- forwarded_count: 0
- archived_count: 0
- top_neighborhoods: []
- top_topics: []

## Medicao de conversao do novo lote

Lote divulgado:

- new_batch_shared_count: 2
- canais: instagram_story, whatsapp
- first_new_batch_shared_at: 2026-05-05T15:21:41.941+00:00

Metricas agregadas de conversao (sem PII, sem relato bruto):

- reports_before_first_new_batch_shared: 0
- reports_after_first_new_batch_shared: 0
- new_batch_conversion_difference_absolute: 0
- new_batch_conversion_status: waiting_results

Leitura operacional:

O lote foi divulgado em 2026-05-05T15:21:41.941+00:00. O snapshot foi gerado em 2026-05-05T16:58:04.423+00:00, ou seja, menos de 24 horas apos o primeiro shared. O status waiting_results esta correto pela regra de negocio: apenas apos 24h sem relatos o status muda para no_conversion_yet.

## Plano atualizado

Action plan: b8c2f738-5cb2-456c-b013-6d21d3bd7e4d

Item "Monitorar escuta por bairro por 7 dias" (22407956-48eb-4481-a0df-1e0de2aec0c2):

- status: doing
- metadata territorial_monitoring atualizado:
  - latest_snapshot_id: 9b43575e-b33d-47bb-ac4a-836a64cd4e8c
  - latest_snapshot_date: 2026-05-05
  - latest_snapshot_status: attention
  - latest_snapshot_at: 2026-05-05T16:58:04.423+00:00
  - latest_conversion_status: waiting_results
  - latest_reports_after_shared: 0
  - latest_conversion_delta: 0

Evidencia operacional registrada no item com:

- evidence_type: resultado
- titulo: Snapshot diario territorial 2026-05-05
- descricao: Total de relatos 0. Com consentimento 0. Sem consentimento 0. Status attention.

## Hipoteses recomendadas (total_reports = 0)

Status da conversao: waiting_results (ainda na janela de 24h do primeiro shared do novo lote). Se no proximo ciclo o status mudar para no_conversion_yet, recomendam-se as seguintes hipoteses de comunicacao:

1. CTA mais direto: texto com pedido explicito de acao ("Preencha agora em 30 segundos").
2. Arte com QR code: material visual impresso ou digital com QR apontando para /escuta/bairro.
3. Link fixado na bio: garantir que o link esteja acessivel sem busca no perfil Instagram.
4. Chamada em post de feed: publicacao permanente (nao story) com maior durabilidade.
5. Abordagem presencial ou coletiva: mobilizacao em reunioes de bairro, grupos comunitarios e espacos de convivencia, sem abordagem individual automatizada.

## Exportacao segura (validacao de guardrails)

O snapshot exportado contem:

- deltas agregados: sim
- nomes: nao
- contato: nao
- relato bruto: nao
- origem individual: nao

## Entregas de codigo (060)

- territorial-listening-monitoring.ts: campo territorial_monitoring do action plan item expandido com:
  - latest_conversion_status
  - latest_reports_after_shared
  - latest_conversion_delta

Mudanca minima e direcionada; sem refatoracao ou expansao de escopo.

## Validacoes executadas

Executado com sucesso:

- npm run lint (0 erros; 14 warnings pre-existentes, inalterados)
- npm run build (compilado com sucesso, todas as 50 rotas)
- npm run test (20 arquivos, 156 testes passando)
- npm run e2e:ci (50 testes passando)
- npm run check:health (sem segredos no healthcheck)
- npm run readiness (avisos esperados de variaveis de producao ausentes)
- npm run verify (pipeline completo OK)
- npm run staging:devolution-db-check (resultado: OK)
- npm run staging:webhook:evidence (3 eventos, 0 quarentenados, 29 audit logs)
- npm run staging:webhook:go-no-go (decisao: GO_STAGING, todos os gates OK)

## Guardrails preservados

- Sem ativacao de producao.
- Sem automacao de publicacao.
- Sem automacao de DM.
- Sem automacao de resposta.
- Sem criacao automatica de contato.
- Sem score politico individual.
- Sem microtargeting.
- Sem exposicao de PII ou relato bruto em metricas.
- Conversao medida apenas em agregado.
- Links por pauta seguem preselect-only, sem tracking individual.

## Producao

- Producao permanece bloqueada.
- Webhooks seguem GO_STAGING.
- Operacao mantida em staging/internal.

## Proximo tijolo

Aguardar completar a janela de 24h apos o primeiro shared do novo lote (2026-05-05T15:21:41.941+00:00). No proximo ciclo, gerar novo snapshot e verificar:

- Se new_batch_conversion_status mudar para conversion_detected: registrar evidencia positiva, atualizar item de monitoramento e documentar delta agregado.
- Se new_batch_conversion_status mudar para no_conversion_yet: aplicar hipoteses de comunicacao documentadas acima (CTA direto, arte com QR code, link na bio, post de feed, abordagem presencial/coletiva).
- Monitoramento continua por 7 dias a partir da abertura da janela.
