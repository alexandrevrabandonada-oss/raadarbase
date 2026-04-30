# Validacao de Staging dos Webhooks Meta

- Data/hora: 2026-04-30T16:51:10.052Z
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
- total incidentes relacionados a webhook: 2
- total audit_logs relacionados a webhook: 2

## Ultimos sinais (redigidos)

- ultimo evento: n/a
- ultimo incidente: {"id":"860342cb-6dff-4c25-9a24-cb95f1b5db9f","kind":"meta.webhook_invalid_signature","severity":"critical","status":"open","title":"Assinatura inválida em webhook Meta","createdAt":"2026-04-30T02:47:01.357154+00:00"}

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
  - auditLogsFound: ok
  - incidentsFound: ok
  - noDmAutomatic: ok
  - noAutoContact: ok
  - noPoliticalScore: ok


## Pendencias

- Dry-run externo bloqueado em GET verification (status=403).

## Checklist final

- [x] dry-run externo com APP_URL
- [ ] eventos webhook registrados
- [x] audit logs encontrados
- [x] incidentes encontrados
- [ ] decisao GO_STAGING

## Aviso

Nao colar secrets neste relatorio.
