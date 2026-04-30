# Estado da Nacao 019

Data: 2026-04-30

## Objetivo do tijolo

Executar preparacao e validacao controlada de staging para webhooks Meta/Instagram com decisao formal go/no-go, mantendo producao bloqueada.

## O que foi implementado

- Runbook operacional de staging com fases A-E.
- Script de evidencias redigidas para staging.
- Script de decisao formal go/no-go para staging.
- Script de geracao automatica de relatorio de validacao.
- Artefatos JSON de dry-run/evidence/go-no-go em `reports/`.
- Atualizacao da UI de webhooks com secao "Validacao externa" e decisao atual.
- Atualizacao do healthcheck com status seguro de validacao de staging e booleans exigidos.
- Atualizacao da documentacao no README para operacao de staging.
- Novos testes unitarios e E2E para validacao de staging e health sem segredos.

## Scripts criados

- `scripts/staging-webhook-evidence.mjs`
- `scripts/staging-webhook-go-no-go.mjs`
- `scripts/generate-staging-webhook-report.mjs`

## Docs criados/atualizados

- `docs/meta-webhooks-staging-runbook.md` (novo)
- `README.md` (secao "Operacao de staging dos webhooks")

## Pagina atualizada

- `src/app/integracoes/meta/webhooks/page.tsx`
- `src/app/integracoes/meta/webhooks/webhooks-list-client.tsx`
- `src/app/integracoes/meta/webhooks/actions.ts`

## Healthcheck atualizado

Endpoint: `/api/health`

Novos campos:

- `staging_webhook_validation_status`
- `staging_webhook_signed_event_seen`
- `staging_webhook_unsigned_rejection_seen`
- `staging_webhook_operator_processed_seen`
- `staging_webhook_operator_ignored_seen`

## Resultado dos comandos obrigatorios

- `npm run lint`: OK (11 warnings, 0 errors)
- `npm run build`: OK
- `npm run test`: OK (147/147)
- `npm run check:health`: OK
- `npm run check:rls`: OK (papel admin/operador/leitura pulado por credenciais ausentes)
- `npm run e2e:ci`: OK (47/47)
- `npm run ci`: OK
- `npm run readiness`: OK (avisos de env Meta ausentes)
- `npm run verify`: OK (`e2e` local pulado por `E2E_RUN=true` ausente)
- `npm run staging:webhook:dry-run`: PENDING_EXTERNAL_VALIDATION (APP_URL configurado, fetch failed)
- `npm run staging:webhook:evidence`: PENDING_EXTERNAL_VALIDATION (Supabase real nao configurado)
- `npm run staging:webhook:go-no-go`: PENDING_EXTERNAL_VALIDATION
- `npm run staging:webhook:report`: OK (arquivo gerado)

## Resultado do staging

- Decisao atual: `PENDING_EXTERNAL_VALIDATION`
- Artefato de decisao: `reports/staging-webhook-go-no-go.json`
- Relatorio automatico: `reports/staging-webhook-validation.md`

## Recomendacao de ativacao

- Pode ativar em staging? **Nao, ainda nao**. Falta validacao externa real (APP_URL acessivel + Supabase staging com evidencias reais).
- Pode ativar em producao? **Nao**. Producao permanece bloqueada por politica deste ciclo.

## Pendencias reais

1. Executar `APP_URL=https://staging-real... npm run staging:webhook:dry-run` com endpoint de staging acessivel.
2. Configurar `SUPABASE_SERVICE_ROLE_KEY` + URL real de staging para gerar evidencias SQL reais.
3. Coletar sinais minimos de operador (1 ignorado, 1 processado permitido, audit logs, incidentes).
4. Reexecutar go/no-go e obter `GO_STAGING`.

## Proximo tijolo recomendado

Operacao assistida de staging real:

1. validar conectividade do APP_URL de staging;
2. executar dry-run externo completo;
3. operar manualmente 1 evento ignorado e 1 processado;
4. coletar evidencias SQL reais;
5. emitir decisao final de habilitacao em staging com `GO_STAGING`.
