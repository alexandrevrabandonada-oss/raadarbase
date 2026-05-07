# Validacao de Staging dos Webhooks Meta

- Data/hora: 2026-05-01T13:17:08.253Z
- APP_URL presente: sim
- dry-run executado: sim
- decisao go/no-go: GO_STAGING

## Evidencias SQL redigidas

- total meta_webhook_events: 3
- total em quarentena: 0
- total processado: 1
- total ignorado: 2
- total failed: 0
- total assinatura invalida: 0
- total incidentes relacionados a webhook: 6
- total audit_logs relacionados a webhook: 28

## Ultimos sinais (redigidos)

- ultimo evento: {"id":"b8ed4b4b-efef-4c35-a3df-cfb2fb399007","status":"ignored","eventType":"messaging","objectType":"instagram","signatureValid":true,"receivedAt":"2026-04-30T22:29:12.226478+00:00"}
- ultimo incidente: {"id":"55e2a23e-5540-480a-bef5-c0f3e699ddc0","kind":"meta.webhook_invalid_signature","severity":"critical","status":"resolved","title":"Assinatura inválida em webhook Meta","createdAt":"2026-04-30T22:34:25.520957+00:00"}

## Resultado go/no-go


- sinais avaliados:
  - appUrlConfigured: ok
  - healthOk: ok
  - healthSecretsSafe: ok
  - dryRunExecuted: ok
  - signedEventSeen: ok
  - unsignedRejectionSeen: ok
  - operatorIgnoredSeen: ok
  - operatorProcessedSeen: ok
  - auditLogsFound: ok
  - incidentsFound: ok
  - noDmAutomatic: ok
  - noAutoContact: ok
  - noPoliticalScore: ok


## Pendencias

- Sem pendencias externas obrigatorias identificadas neste momento.

## Checklist final

- [x] dry-run externo com APP_URL
- [x] eventos webhook registrados
- [x] audit logs encontrados
- [x] incidentes encontrados
- [x] decisao GO_STAGING

## Aviso

Nao colar secrets neste relatorio.
