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
- GET `/api/meta/webhook`: falhou (HTTP 404)
- GET `/integracoes/meta/webhooks`: ok (HTTP 200, pagina autenticada da app)
- Healthcheck observado: `ok=true`, `supabase_configured=true`, `meta_configured=false`, `environment=production`

## Causa provavel

- O dominio `radar-base-staging.vercel.app` nao esta associado a um deployment ativo da aplicacao no momento.
- O dominio `raadarbase.vercel.app` aponta para um deployment vivo da app, mas esse deploy nao publica a rota `/api/meta/webhook`.
- Como o build local gera `/api/meta/webhook`, a causa mais provavel para o segundo host e deploy de branch errada, deployment antigo ou projeto/alias apontando para uma revisao sem a rota de webhook.
- Alem disso, o Supabase staging continua com `meta_webhook_events` e `meta_webhook_event_links` fora do schema cache/exposure da API.

## Correcao aplicada

1. Ajuste no script `scripts/staging-db-check.mjs` para diagnostico explicito de:
    - tabela inexistente;
    - schema cache stale / API sem exposicao;
    - bloqueio esperado por permissao/RLS.
2. Ajuste no script `scripts/generate-staging-webhook-report.mjs` para nao mascarar bloqueios externos quando o dry-run ou a evidencia ainda estao pendentes.
3. Diagnostico de URL atualizado com os dois cenarios reproduziveis:
      - host inexistente (`DEPLOYMENT_NOT_FOUND`);
      - host vivo sem a rota `/api/meta/webhook` publicada.

## Proxima acao obrigatoria

- Confirmar no Vercel qual branch/deployment esta por tras de `https://raadarbase.vercel.app` e publicar um deploy que exponha:
   - `/`
   - `/api/health`
   - `/api/meta/webhook`
- Configurar `APP_URL` no ambiente de deploy que for validado.
- Corrigir o exposure/schema cache do Supabase staging e recarregar o PostgREST.
- Reexecutar:
   - `APP_URL=https://HOST-REAL npm run staging:check-url`
   - `APP_URL=https://HOST-REAL npm run staging:webhook:dry-run`
   - `APP_URL=https://HOST-REAL npm run staging:webhook:evidence`
   - `APP_URL=https://HOST-REAL npm run staging:webhook:go-no-go`
