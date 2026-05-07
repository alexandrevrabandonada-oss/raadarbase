# Estado da Nacao 058

Data: 2026-05-05

## Resumo executivo

Foi implementado o ciclo de governanca para divulgacao manual da chamada de 30 segundos com confirmacao humana explicita antes de marcar shared, metricas agregadas de conversao inicial e export/health atualizados. Nesta rodada, a confirmacao recebida foi de que nenhum novo reforco do lote recente foi divulgado manualmente; por isso os logs novos permaneceram planned e o item "Publicar nova chamada de 30 segundos" permaneceu todo.

## O que foi implementado

### 1) Confirmacao humana obrigatoria para shared

- O fluxo de marcar shared no admin agora exige checkbox obrigatorio: confirmacao de divulgacao manual por operador humano.
- Sem confirmacao, a action bloqueia a mudanca de status.
- Os campos de URL publica e notas operacionais agora aparecem no formulario de shared (opcionais).

### 2) Regra de plano: atualizar chamada so com shared confirmado

- O item de plano da chamada passa a ser sincronizado a partir do estado real dos logs shared.
- Criar log planned nao altera automaticamente status do item de plano.
- Arquivar log tambem nao promove item automaticamente.
- Somente a acao de marcar shared (com confirmacao manual) atualiza metadados/canais compartilhados.

### 3) Metricas de conversao agregadas

Foi criada camada de metricas agregadas com:

- plannedCount
- sharedCount
- reportsBeforeFirstShared
- reportsAfterFirstShared
- differenceAbsolute
- firstSharedAt
- status de conversao: no_shared_yet | waiting_results | conversion_detected | no_conversion_yet

Essas metricas foram expostas em:

- Painel admin (cards de conversao)
- Healthcheck
- Export de snapshot (Markdown e HTML)

### 4) Snapshot com nota operacional especifica

Quando total de relatos for 0 e houver shared registrado na janela, a nota operacional do snapshot passa a ser:

Divulgacao manual registrada; aguardando conversao em relatos.

## Evidencia em staging

Janela ativa:

- window_id: 116d07a6-c9c3-4443-ae21-52f4d6194cbd

Confirmacao humana recebida nesta rodada:

- Nenhum reforco novo do lote recente foi divulgado manualmente.
- Resultado operacional: logs 13598ecb-b5de-4163-8eed-674b2366cf22 e 19a8a53c-db98-4592-9b7c-ff3599820d72 permaneceram planned.

Observacao de contexto historico da janela:

- Ja existiam dois logs mais antigos em shared (85408a22-18dd-46e2-bb86-e1bacefcb5a5 e 1bfe888f-a018-4cef-865a-769dd364d72c).

Novo snapshot gerado para linha de base de conversao:

- id: d7f8eb5c-4d03-4c6c-ae16-2085583fef8a
- snapshot_date: 2026-05-08
- status: attention
- total_reports: 0
- notes: Divulgacao manual registrada; aguardando conversao em relatos.
- metadata conversao:
  - outreach_planned_count: 2
  - outreach_shared_count: 2
  - conversion_status: waiting_results
  - reports_before_first_shared: 0
  - reports_after_first_shared: 0
  - conversion_difference_absolute: 0

Ajuste de plano de monitoramento:

- Item 22407956-48eb-4481-a0df-1e0de2aec0c2 atualizado para referenciar o snapshot 2026-05-08 em territorial_monitoring.latest_snapshot_*.

## Plano e status (foco 30 segundos)

Action plan: b8c2f738-5cb2-456c-b013-6d21d3bd7e4d

- Reduzir atrito do formulario de escuta (06aa330e-7c64-4c10-8084-cf609a1fe7ad): done
- Publicar nova chamada de 30 segundos (af7ebe44-60df-43bc-80e6-85a67f330dad): todo (sem nova confirmacao de divulgacao manual)
- Monitorar escuta por bairro por 7 dias (22407956-48eb-4481-a0df-1e0de2aec0c2): doing

## Validacoes executadas

Executado com sucesso:

- npm run build
- npm run test
- npm run e2e:ci
- npm run check:health
- npm run staging:devolution-db-check
- npm run staging:webhook:evidence
- npm run staging:webhook:go-no-go

Observacoes:

- npm run lint: sem erros, apenas warnings pre-existentes.
- npm run check:readiness e npm run check:verify: scripts inexistentes no package.json desta workspace.

## Guardrails preservados

- Sem automacao de DM.
- Sem resposta automatica.
- Sem criacao automatica de contato.
- Sem score politico individual.
- Sem microtargeting.
- Sem exposicao de nome, username, telefone, e-mail ou relato bruto nos indicadores/export.
- Conversao apenas em agregado.

## Produção

- Producao permanece bloqueada.
- Operacao segue em staging/internal.

## Proximo tijolo

Assim que houver confirmacao humana de divulgacao manual do novo lote planned, marcar shared no admin com checkbox de confirmacao e gerar snapshot seguinte para medir delta de conversao apos o primeiro shared desse lote.
