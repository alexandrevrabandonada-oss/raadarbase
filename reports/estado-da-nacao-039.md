# Estado da Nacao 039 - GO_STAGING apos migrations

Data: 2026-05-01

## Resumo

- Host validado: `https://raadarbase.vercel.app`
- Projeto Supabase: `blimjnitngthldhazvwh`
- Migrations/tabelas remotas: verificadas
- Usuario interno informado: existente, `active`, `admin`
- Decisao staging webhook: `GO_STAGING`
- Producao autorizada: nao

## Migrations Supabase

As migrations foram executadas contra o projeto remoto. Varios arquivos antigos retornaram erro esperado de objeto ja existente, indicando que as estruturas principais ja estavam aplicadas.

Aplicaram com sucesso nesta rodada:

- `005_backfill_internal_users.sql`
- `006_bootstrap_first_admin.sql`
- `007_retention_policy.sql`
- `015a_add_mention_type.sql`
- `015b_restrict_webhook_grants.sql`

Verificacao remota:

- total de tabelas publicas: 29
- `internal_users`: presente
- `meta_webhook_events`: presente
- `meta_webhook_event_links`: presente
- `audit_logs`: presente
- `operational_incidents`: presente

## Acesso interno

O usuario informado no fluxo de login foi verificado sem registrar credenciais:

- usuario existe em `auth.users`: true
- perfil existe em `internal_users`: true
- status interno: active
- papel interno: admin

Observacao: o print mostrava acesso a um deployment direto antigo. O alias recomendado e `https://raadarbase.vercel.app`.

## Staging webhook

Fonte: `reports/staging-webhook-config-check.json`, `reports/staging-webhook-evidence.json`, `reports/staging-webhook-go-no-go.json`.

- health endpoint reachable: true
- verify token present: true
- app secret present: true
- service role present: true
- webhook enabled: true
- allowed object includes instagram: true
- max payload configured: true
- dry-run executed: true
- signedEventSeen: true
- unsignedRejectionSeen: true
- operatorIgnoredSeen: true
- operatorProcessedSeen: true
- auditLogsFound: true
- incidentsFound: true
- noDmAutomatic: true
- noAutoContact: true
- noPoliticalScore: true

## Evidencias

- totalMetaWebhookEvents: 3
- totalQuarantined: 0
- totalProcessed: 1
- totalIgnored: 2
- totalFailed: 0
- totalInvalidSignature: 0
- totalWebhookAuditLogs: 28
- totalWebhookIncidents: 6

## Decisao

- Decisao staging: `GO_STAGING`
- Decisao producao: `NO_GO_PRODUCTION`

Motivo: staging cumpriu os sinais obrigatorios, mas producao continua bloqueada por falta de ata/decisao humana completa, conforme `reports/estado-da-nacao-038.md`.

## Validacoes executadas

- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:config-check`: passou
- `APP_URL=https://raadarbase.vercel.app npm run staging:check-url`: host e health 200; webhook sem query 403 esperado
- `npm run staging:webhook:evidence`: passou
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:go-no-go`: `GO_STAGING`
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:report`: passou
- `npm run check:rls`: passou
- healthcheck remoto: passou sem segredos

## Recomendacao

- manter `META_WEBHOOK_ENABLED=true` em staging: sim
- ativar producao: nao
- usar apenas o alias vivo `https://raadarbase.vercel.app` para validacao operacional
- rotacionar tokens colados no chat apos encerrar a validacao assistida

## Proximo tijolo recomendado

Tijolo 040: decisao humana de producao.

- Coletar ata real preenchida.
- Validar responsaveis, janela de observacao, rollback e aceitacao de riscos.
- Somente com decisao humana completa preparar ativacao manual controlada.
