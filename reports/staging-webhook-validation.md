# Validacao de Staging dos Webhooks Meta

- Data/hora: 2026-04-30T16:36:01.931Z
- APP_URL presente: sim
- dry-run executado: sim
- decisao go/no-go: NO_GO_STAGING

## Evidencias SQL redigidas

- total meta_webhook_events: 0
- total em quarentena: 0
- total processado: 0
- total ignorado: 0
- total failed: 0
- total assinatura invalida: 0
- total incidentes relacionados a webhook: 0
- total audit_logs relacionados a webhook: 0

## Ultimos sinais (redigidos)

- ultimo evento: n/a
- ultimo incidente: n/a

## Resultado go/no-go


- sinais avaliados:
  - appUrlConfigured: ok
  - healthOk: ok
  - healthSecretsSafe: ok
  - dryRunExecuted: ok
  - signedEventSeen: missing
  - unsignedRejectionSeen: missing
  - operatorIgnoredSeen: missing
  - operatorProcessedSeen: missing
  - auditLogsFound: missing
  - incidentsFound: missing
  - noDmAutomatic: ok
  - noAutoContact: ok
  - noPoliticalScore: ok


## Pendencias

- Tabelas de webhook indisponiveis na API de staging (schema cache/route exposure).

## Checklist final

- [x] dry-run externo com APP_URL
- [ ] eventos webhook registrados
- [ ] audit logs encontrados
- [ ] incidentes encontrados
- [ ] decisao GO_STAGING

## Aviso

Nao colar secrets neste relatorio.
