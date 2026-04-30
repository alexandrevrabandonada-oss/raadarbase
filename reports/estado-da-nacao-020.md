# Estado da Nacao 020

Data: 2026-04-30
Escopo: validacao real de staging para webhooks Meta/Instagram (sem liberar producao).

## Resultado executivo

A validacao externa real permaneceu bloqueada por conectividade do APP_URL e ausencia de configuracao efetiva do Supabase de staging no ambiente de execucao atual.

Decisao formal: PENDING_EXTERNAL_VALIDATION.

## Campos obrigatorios

- APP_URL testado: sim
- staging db check: PENDING
- dry-run externo: PENDING
- eventos recebidos: 0
- eventos em quarentena: 0
- eventos ignorados por operador: 0
- eventos processados por operador: 0
- audit logs relacionados: 0
- incidentes relacionados: 0
- healthcheck sem segredos: nao (nao foi possivel validar endpoint remoto)
- noDmAutomatic: sim
- noAutoContact: sim
- noPoliticalScore: sim
- decisao: PENDING_EXTERNAL_VALIDATION

## Evidencias coletadas

1. Diagnostico de URL (`reports/staging-check-url.json`)
- APP_URL estava configurada e com formato valido.
- Todas as verificacoes de rede retornaram `fetch failed`:
  - GET APP_URL
  - GET APP_URL/api/health
  - GET APP_URL/api/meta/webhook
- Causa provavel registrada: deploy dormindo, dominio errado, bloqueio de rede ou app fora do ar.

2. Check de banco (`reports/staging-db-check.json`)
- Status: PENDING_EXTERNAL_VALIDATION.
- Razao: Supabase staging nao configurado (URL/service role ausentes no ambiente).

3. Dry-run externo (`reports/staging-webhook-dry-run.json`)
- Status: PENDING_EXTERNAL_VALIDATION.
- Razao: Dry-run externo indisponivel (`fetch failed`).

4. Evidencia SQL (`reports/staging-webhook-evidence.json`)
- Status: PENDING_EXTERNAL_VALIDATION.
- Sem conexao com staging DB no ambiente atual.

5. Go/No-Go (`reports/staging-webhook-go-no-go.json`)
- Decisao: PENDING_EXTERNAL_VALIDATION.
- Sinais essenciais ausentes por falta de validacao externa executada.

## Regras e guardrails preservados

- Webhooks continuam com quarentena obrigatoria.
- Nenhuma DM automatica foi habilitada.
- Nenhuma criacao automatica de contato foi habilitada.
- Nenhum score politico individual foi criado.
- Nenhuma inferencia sensivel foi adicionada.
- Producao permanece bloqueada.
- `META_WEBHOOK_ENABLED` permanece `false` ate validacao externa real completa.

## Recomendacao operacional

- Ativar META_WEBHOOK_ENABLED=true em staging? nao, ainda nao.
- Ativar em producao? nao.

## Pendencias reais para concluir GO/NO-GO real

1. Tornar APP_URL de staging acessivel externamente (resolver DNS/deploy/rede/rota).
2. Garantir envs de staging no runtime de execucao:
   - APP_URL
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - META_APP_SECRET
   - META_WEBHOOK_VERIFY_TOKEN
   - META_WEBHOOK_ENABLED=false
   - META_WEBHOOK_ALLOWED_OBJECTS=instagram
   - META_WEBHOOK_MAX_PAYLOAD_BYTES=262144
3. Reexecutar cadeia obrigatoria:
   - `npm run staging:check-url`
   - `npm run staging:db-check`
   - `npm run staging:webhook:dry-run`
   - `npm run staging:webhook:evidence`
   - `npm run staging:webhook:go-no-go`
   - `npm run staging:webhook:report`
4. Operar manualmente no staging:
   - ignorar 1 evento
   - processar 1 evento permitido
   - confirmar contagens em audit/incidentes/eventos

## Proximo tijolo recomendado

Tijolo 021: fechamento da validacao externa real de staging (conectividade + banco + operacao manual de eventos + decisao final GO_STAGING ou NO_GO_STAGING).
