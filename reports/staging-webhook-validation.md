# Validacao de Staging dos Webhooks Meta

- Data/hora: 2026-04-30T22:34:50.852Z
- APP_URL presente: sim
- dry-run executado: sim
- decisao go/no-go: NO_GO_STAGING

## Evidencias SQL redigidas

- total meta_webhook_events: 3
- total em quarentena: 1
- total processado: 0
- total ignorado: 2
- total failed: 0
- total assinatura invalida: 0
- total incidentes relacionados a webhook: 5
- total audit_logs relacionados a webhook: 21

## Ultimos sinais (redigidos)

- ultimo evento: {"id":"b8ed4b4b-efef-4c35-a3df-cfb2fb399007","status":"ignored","eventType":"messaging","objectType":"instagram","signatureValid":true,"receivedAt":"2026-04-30T22:29:12.226478+00:00"}
- ultimo incidente: {"id":"f3b069cc-4c19-4f70-a381-ec26116335c0","kind":"meta.webhook_invalid_signature","severity":"critical","status":"open","title":"Assinatura inválida em webhook Meta","createdAt":"2026-04-30T22:31:10.088204+00:00"}

## Resultado go/no-go


- sinais avaliados:
  - appUrlConfigured: ok
  - healthOk: ok
  - healthSecretsSafe: ok
  - dryRunExecuted: ok
  - signedEventSeen: ok
  - unsignedRejectionSeen: ok
  - operatorIgnoredSeen: ok
  - operatorProcessedSeen: missing
  - auditLogsFound: ok
  - incidentsFound: ok
  - noDmAutomatic: ok
  - noAutoContact: ok
  - noPoliticalScore: ok


## Pendencias

- Existem sinais pendentes ou bloqueios externos a resolver antes do GO_STAGING.

## Checklist final

- [x] dry-run externo com APP_URL
- [x] eventos webhook registrados
- [x] audit logs encontrados
- [x] incidentes encontrados
- [ ] decisao GO_STAGING

## Aviso

Nao colar secrets neste relatorio.
