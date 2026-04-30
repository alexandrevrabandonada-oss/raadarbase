# Estado da Nacao 027

Data: 2026-04-30
Escopo: diagnostico seguro de configuracao remota, alinhamento de dry-run e revalidacao completa de staging no host vivo.

## URL validada

- Host: https://raadarbase.vercel.app
- GET /: 200
- GET /api/health: 200
- GET /api/meta/webhook: 403
- Resultado: PENDING_EXTERNAL_VALIDATION (bloqueio de configuracao no webhook)

## Env booleans remotos (sem segredos)

Fonte: reports/staging-webhook-config-check.json

- source: health
- diagnostics endpoint status: 404
- health endpoint reachable: ok
- verify token present: nao confirmado
- app secret present: nao confirmado
- service role present: nao confirmado
- webhook enabled: nao confirmado
- allowed objects configured: nao confirmado
- allowed object includes instagram: nao confirmado
- max payload configured: nao confirmado
- environment: production
- runtime: nao informado pelo host atual

Interpretacao:

- O deploy remoto ainda nao expoe os novos booleans de diagnostico seguro.
- O endpoint de diagnostico protegido retorna 404 em producao sem token interno (comportamento esperado de bloqueio publico).
- Ainda e necessario redeploy do host com a versao nova para leitura completa dos booleans.

## Resultado GET verification

Fonte: reports/staging-webhook-dry-run.json

- GET verification: 403 (falhou)
- Status esperado para destravar: 200 com body challenge.

## Resultado POST signed

Fonte: reports/staging-webhook-dry-run.json

- POST signed: 503 (falhou)
- Status esperado para destravar: 200 (recebido/quarentenado).

## Resultado POST unsigned

Fonte: reports/staging-webhook-dry-run.json

- POST unsigned rejected: 503 (falhou)
- Status esperado para conformidade: 401/403 (rejeicao por assinatura invalida).

## Evidencias operacionais

Fonte: reports/staging-webhook-evidence.json

- total de eventos: 0
- total quarentenados: 0
- total ignorados: 0
- total processados: 0
- audit logs webhook: 6
- incidentes webhook: 2

## Operacao manual obrigatoria

Status: pendente.

- Nao foi possivel executar aqui o passo manual no painel /integracoes/meta/webhooks (ignorar 1 e processar 1) por depender de sessao autenticada operacional no ambiente remoto.
- Sem esse passo, os sinais operatorIgnoredSeen e operatorProcessedSeen permanecem faltantes.

## Decisao final

- Decisao: NO_GO_STAGING

Motivos objetivos:

1. GET verification segue 403.
2. POST signed segue 503.
3. POST unsigned nao esta sendo rejeitado com 401/403.
4. totalMetaWebhookEvents continua 0.
5. Sinais faltantes: signedEventSeen, unsignedRejectionSeen, operatorIgnoredSeen, operatorProcessedSeen.

## Recomendacao

- manter META_WEBHOOK_ENABLED=true em staging?
  - Ainda nao. Manter desabilitado ate concluir alinhamento de env no runtime remoto e validar GET/POST assinados com sucesso.
- ativar producao?
  - Nao. Producao permanece bloqueada.

## Pendencias reais

1. Alinhar no deploy remoto os envs de webhook e redeployar o host vivo:
   - APP_URL=https://raadarbase.vercel.app
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - META_APP_SECRET
   - META_WEBHOOK_VERIFY_TOKEN
   - META_WEBHOOK_ALLOWED_OBJECTS=instagram
   - META_WEBHOOK_MAX_PAYLOAD_BYTES=262144
2. Confirmar que META_APP_SECRET, META_WEBHOOK_VERIFY_TOKEN e SUPABASE_SERVICE_ROLE_KEY nao sao NEXT_PUBLIC.
3. Reexecutar staging:webhook:config-check apos redeploy e confirmar booleans em READY.
4. Destravar GET verification para 200/challenge.
5. Destravar POST signed para 200 e inserir evento em quarentena.
6. Garantir POST unsigned com 401/403.
7. Executar operacao manual obrigatoria no painel (ignorar 1 e processar 1).

## Proximo tijolo recomendado

Tijolo 028: operacao assistida de runtime remoto.

- Aplicar envs no Vercel no ambiente que serve raadarbase.
- Redeployar e validar diagnostics/config-check.
- Rodar dry-run com token/secret alinhados.
- Executar operacao manual obrigatoria com operador autenticado.
- Regerar evidencia e tentar promover para GO_STAGING.
