# Diagnostico de URL de Staging

Data: 2026-04-30

## APP_URL testado

- APP_URL no runtime principal: ausente no ambiente local principal.
- Candidato 1 testado manualmente: `https://radar-base-staging.vercel.app`.
- Candidato 2 informado pelo usuario: `https://raadarbase.vercel.app`.

## Resultado dos testes HTTP

### Candidato 1: `https://radar-base-staging.vercel.app`

- GET `/`: falhou (HTTP 404)
- GET `/api/health`: falhou (HTTP 404)
- GET `/api/meta/webhook`: falhou (HTTP 404)
- Diagnostico HTTP bruto do host: `The deployment could not be found on Vercel.`
- Codigo retornado pela plataforma: `DEPLOYMENT_NOT_FOUND`

### Candidato 2: `https://raadarbase.vercel.app`

- GET `/`: ok (HTTP 200)
- GET `/api/health`: ok (HTTP 200)
- GET `/api/meta/webhook`: falhou (HTTP 403)
- GET `/integracoes/meta/webhooks`: ok (HTTP 200, pagina autenticada da app)
- Healthcheck observado: `ok=true`, `supabase_configured=true`, `meta_configured=false`, `environment=production`
- Dry-run externo de webhook:
   - GET verification: 403
   - POST signed: 503
   - POST unsigned rejected: 503
   - DM prohibited: 503
   - Invalid object: 503

## Causa provavel

- O dominio `radar-base-staging.vercel.app` nao esta associado a um deployment ativo da aplicacao no momento.
- O dominio `raadarbase.vercel.app` aponta para um deployment vivo com rota de webhook presente, mas bloqueada para verificacao (`403`) e com processamento desabilitado/nao configurado (`503`).
- O healthcheck do host continua reportando `meta_configured=false`, consistente com bloqueio operacional de webhook.
- Com os ajustes remotos mais recentes no Supabase, as tabelas `meta_webhook_events` e `meta_webhook_event_links` agora estao acessiveis por service role e bloqueadas para anon (`blocked_by_policy_or_auth`), sem pendencia de schema cache/exposure.

## Correcao aplicada

1. Ajuste no script `scripts/staging-db-check.mjs` para diagnostico explicito de:
    - tabela inexistente;
    - schema cache stale / API sem exposicao;
    - bloqueio esperado por permissao/RLS.
2. Ajuste no script `scripts/generate-staging-webhook-report.mjs` para nao mascarar bloqueios externos quando o dry-run ou a evidencia ainda estao pendentes.
3. Hardening remoto de grants no Supabase webhook (`015b_restrict_webhook_grants.sql`), revogando acesso default de `anon` e `authenticated` nas tabelas sensiveis de webhook.
4. Diagnostico de URL atualizado com os dois cenarios reproduziveis:
   - host inexistente (`DEPLOYMENT_NOT_FOUND`);
   - host vivo com rota de webhook presente, mas bloqueada por configuracao (`403/503`).

## Proxima acao obrigatoria

- Confirmar no Vercel qual branch/deployment esta por tras de `https://raadarbase.vercel.app` e publicar um deploy que exponha:
   - `/`
   - `/api/health`
   - `/api/meta/webhook`
- Configurar `APP_URL` no ambiente de deploy que for validado.
- Configurar corretamente o webhook Meta no deploy remoto (verify token, app secret e flag de habilitacao para o ambiente de staging), mantendo guardrails de seguranca.
- Reexecutar:
   - `APP_URL=https://HOST-REAL npm run staging:check-url`
   - `APP_URL=https://HOST-REAL npm run staging:webhook:dry-run`
   - `APP_URL=https://HOST-REAL npm run staging:webhook:evidence`
   - `APP_URL=https://HOST-REAL npm run staging:webhook:go-no-go`
