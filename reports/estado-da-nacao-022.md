# Estado da Nacao 022

Data: 2026-04-30
Escopo: validacao externa real de staging para webhooks Meta/Instagram, mantendo producao bloqueada.

## Resumo executivo

A cadeia obrigatoria foi executada integralmente neste ciclo. O ambiente local segue estavel (lint/build/test/e2e/readiness/verify), mas a validacao externa real de staging permaneceu bloqueada por dois fatores:

1. APP_URL publico real de staging ainda nao esta corretamente publicado para as rotas esperadas (tentativa HTTPS retornou 404).
2. Embora as tabelas existam via service role, a API/PostgREST de staging continua sem expor `meta_webhook_events` e `meta_webhook_event_links` no schema cache.

Decisao operacional deste tijolo: **PENDING_EXTERNAL_VALIDATION**.

## APP_URL publico usado (sem segredos)

- URL testada: `https://radar-base-staging.vercel.app`
- Resultado: nao valida para staging real neste momento.

## Resultado staging:check-url

Fonte: `reports/staging-check-url.json`

- Status: `PENDING_EXTERNAL_VALIDATION`
- GET APP_URL: HTTP 404
- GET APP_URL/api/health: HTTP 404
- GET APP_URL/api/meta/webhook: HTTP 404
- Causa provavel: rota nao publicada ou path incorreto

## Resultado staging:db-check

Fonte: `reports/staging-db-check.json`

- Status: `PENDING_EXTERNAL_VALIDATION`
- Tabelas detectadas via service role: OK
  - meta_webhook_events
  - meta_webhook_event_links
  - audit_logs
  - operational_incidents
  - ig_posts
  - ig_people
  - ig_interactions
- Enum mencao: aceito
- RLS anon: bloqueio de leitura/escrita indevida mantido
- Diagnostico de exposicao API webhook:
  - metaWebhookEvents: `schema_cache_stale_or_not_exposed`
  - metaWebhookEventLinks: `schema_cache_stale_or_not_exposed`

## Correcao aplicada no schema cache/exposure

Foi aplicado ajuste no script `scripts/staging-db-check.mjs` para diferenciar explicitamente:

- tabela inexistente;
- schema cache stale / tabela nao exposta na API;
- bloqueio esperado por permissao/RLS;
- erro desconhecido.

Com isso, o diagnostico agora evidencia o bloqueio de API/schema cache sem falso positivo de prontidao.

## Resultado dry-run externo

Fonte: `reports/staging-webhook-dry-run.json`

- Status do dry-run: `NO_GO_STAGING`
- GET verification: status 404
- POST assinado: status 404
- POST sem assinatura rejeitado: status 404 (endpoint inexistente)
- DM proibida: status 404
- Objeto invalido: status 404
- /api/health seguro: status 404 (nao acessivel)

## Operacao manual obrigatoria (UI)

- Nao executada neste ciclo.
- Motivo: sem endpoint de staging funcional para `/integracoes/meta/webhooks` e sem fluxo externo valido de eventos.

## Evidencias consolidadas

Fonte: `reports/staging-webhook-evidence.json`

- Status: `PENDING_EXTERNAL_VALIDATION`
- Eventos recebidos: 0
- Quarentenados: 0
- Ignorados: 0
- Processados: 0
- Audit logs webhook: 0
- Incidentes webhook: 0

## Resultado go/no-go

Fonte: `reports/staging-webhook-go-no-go.json`

- Resultado script: `NO_GO_STAGING`
- Sinais ausentes: healthOk, healthSecretsSafe, signedEventSeen, unsignedRejectionSeen, operatorIgnoredSeen, operatorProcessedSeen, auditLogsFound, incidentsFound.
- Guardrails preservados: noDmAutomatic, noAutoContact, noPoliticalScore = true.

## Decisao final deste tijolo

- **PENDING_EXTERNAL_VALIDATION**

Racional: o `NO_GO_STAGING` atual foi obtido sobre endpoint publico que retorna 404 e com schema cache/exposure ainda quebrado. A validacao externa real ainda nao ocorreu em um staging publico funcional.

## Recomendacoes

- Ativar `META_WEBHOOK_ENABLED=true` em staging? **Nao**.
- Ativar producao? **Nao**.
- Producao permanece bloqueada.

## Pendencias reais

1. Publicar staging HTTPS funcional e configurar APP_URL no deploy para host valido.
2. Confirmar migrations 015/015a no projeto Supabase de staging correto.
3. Recarregar schema cache no staging (`NOTIFY pgrst, 'reload schema';`).
4. Confirmar exposicao/consulta de `meta_webhook_events` e `meta_webhook_event_links` pela API de staging sem abrir acesso anon indevido.
5. Reexecutar dry-run externo com endpoint real.
6. Executar operacao manual obrigatoria (1 ignored, 1 processed).

## Proximo tijolo recomendado

Tijolo 023: fechamento de infraestrutura externa de staging (deploy publico + cache/exposure PostgREST) e repeticao da cadeia ate decisao final inequívoca (`GO_STAGING` ou `NO_GO_STAGING`) sobre endpoint real.

## Comandos obrigatorios executados neste ciclo

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run check:health`
- `npm run check:rls`
- `npm run e2e:ci`
- `npm run ci`
- `npm run readiness`
- `npm run verify`
- `npm run staging:check-url`
- `npm run staging:db-check`
- `APP_URL=https://staging.exemplo.com npm run staging:webhook:dry-run`
- `npm run staging:webhook:evidence`
- `npm run staging:webhook:go-no-go`
- `npm run staging:webhook:report`
