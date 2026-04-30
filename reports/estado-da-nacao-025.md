# Estado da Nacao 025

Data: 2026-04-30
Escopo: continuidade da validacao externa com credenciais Supabase atualizadas e hardening de acesso nas tabelas de webhook.

## Resumo executivo

Resultado do ciclo: **NO_GO_STAGING**.

Avancos confirmados:

1. Supabase remoto estabilizado para webhook: tabelas existem, enum `mencao` aceito, RLS basico bloqueando anon e exposure classificado como `blocked_by_policy_or_auth`.
2. Dry-run evoluiu de `404` para `403/503`, indicando que o endpoint `/api/meta/webhook` existe no host e esta ativo, mas bloqueado por configuracao operacional.
3. Evidencias operacionais agora mostram `audit_logs` e `incidents` relacionados a webhook.

Bloqueios restantes:

1. GET de verificacao do webhook retorna `403`.
2. POST assinado/unsigned e cenarios proibidos retornam `503`.
3. Nenhum evento novo em `meta_webhook_events` nesta rodada de dry-run.

## Cadeia executada com credenciais fornecidas

- `npm run staging:check-url`
- `npm run staging:db-check`
- `npm run staging:webhook:dry-run`
- `npm run staging:webhook:evidence`
- `npm run staging:webhook:go-no-go`
- `npm run staging:webhook:report`

## Resultado de URL

Fonte: `reports/staging-check-url.json`

- APP_URL: configurada (`https://raadarbase.vercel.app`)
- GET `/`: `200`
- GET `/api/health`: `200`
- GET `/api/meta/webhook`: `403`
- Diagnostico: `erro de configuracao, token invalido ou bloqueio de acesso`
- Status: `PENDING_EXTERNAL_VALIDATION`

## Resultado de banco staging

Fonte: `reports/staging-db-check.json`

- Status: `READY`
- Tabelas webhook e correlatas: `ok`
- Enum `mencao`: `ok`
- RLS basico anon: `ok` (bloqueado)
- Exposure API webhook:
  - `metaWebhookEvents`: `blocked_by_policy_or_auth`
  - `metaWebhookEventLinks`: `blocked_by_policy_or_auth`

Conclusao de banco:

- a pendencia de schema cache/exposure foi resolvida;
- o bloqueio atual migrou para a camada de configuracao operacional do webhook no deploy remoto.

## Resultado de dry-run externo

Fonte: `reports/staging-webhook-dry-run.json`

- GET verification: `403`
- POST signed: `503`
- POST unsigned rejected: `503`
- DM prohibited: `503`
- Invalid object: `503`
- Healthcheck safe: `200`
- Status do artefato: `NO_GO_STAGING`

Interpretacao:

- endpoint existe e responde;
- verificacao/token e/ou estado de habilitacao do webhook impedem validacao funcional;
- sem aceitar POSTs neste estado, nao ha como produzir os sinais exigidos para `GO_STAGING`.

## Evidencias SQL

Fonte: `reports/staging-webhook-evidence.json`

- Status: `READY`
- total eventos webhook: `0`
- quarentenados/processados/ignorados/failed: `0`
- incidentes webhook: `2`
- audit logs webhook: `2`
- ultimo incidente: `meta.webhook_invalid_signature` (critical, open)

## Decisao go/no-go

Fonte: `reports/staging-webhook-go-no-go.json`

- Decisao: `NO_GO_STAGING`
- Sinais OK:
  - `appUrlConfigured`
  - `healthOk`
  - `healthSecretsSafe`
  - `dryRunExecuted`
  - `auditLogsFound`
  - `incidentsFound`
  - `noDmAutomatic`
  - `noAutoContact`
  - `noPoliticalScore`
- Sinais ausentes:
  - `signedEventSeen`
  - `unsignedRejectionSeen`
  - `operatorIgnoredSeen`
  - `operatorProcessedSeen`

## Decisao final

- **NO_GO_STAGING**

Racional:

- apesar do banco e das protecoes de acesso estarem ajustados, o webhook remoto ainda nao passa na verificacao (`403`) e retorna indisponibilidade operacional nos POSTs (`503`);
- sem processamento funcional de eventos, faltam sinais obrigatorios de validacao externa real.

## Recomendacao imediata

1. Revisar no deploy remoto os valores de `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET` e flag de habilitacao de webhook para o ambiente de staging.
2. Reexecutar dry-run com o mesmo APP_URL apos ajustar configuracao.
3. Executar fluxo manual obrigatorio (ignorar 1 evento, processar 1 evento permitido) para completar os sinais faltantes.
