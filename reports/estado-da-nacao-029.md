# Estado da Nacao 029

Data: 2026-04-30
Escopo: configuracao dos secrets Meta, redeploy, dry-run assinado e tentativa de GO_STAGING.

## Host validado

- Host: `https://raadarbase.vercel.app`
- Projeto Vercel: `alexandrevrabandonada-oss-projects/raadarbase`
- Deployment ativo final: `dpl_5tFRKY6AUBxh9UwZ2ecwzsCrJY46`
- URL do deployment final: `https://raadarbase-cir9grnl5-alexandrevrabandonada-oss-projects.vercel.app`
- Target: production
- Status do deploy: Ready
- Alias confirmado: `https://raadarbase.vercel.app`
- Rotas confirmadas no build: `/`, `/api/health`, `/api/meta/webhook`, `/api/meta/webhook/diagnostics`, `/integracoes/meta/webhooks`

## Envs remotas

Valores nao foram registrados.

- `APP_URL`: true
- `NEXT_PUBLIC_SUPABASE_URL`: true
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: true
- `SUPABASE_SERVICE_ROLE_KEY`: true
- `META_APP_SECRET`: true
- `META_WEBHOOK_VERIFY_TOKEN`: true
- `META_WEBHOOK_ENABLED`: true
- `META_WEBHOOK_ALLOWED_OBJECTS`: true
- `META_WEBHOOK_ALLOWED_OBJECTS` inclui instagram: true
- `META_WEBHOOK_MAX_PAYLOAD_BYTES`: true
- `META_APP_SECRET` com prefixo `NEXT_PUBLIC_`: false observado
- `META_WEBHOOK_VERIFY_TOKEN` com prefixo `NEXT_PUBLIC_`: false observado
- `SUPABASE_SERVICE_ROLE_KEY` com prefixo `NEXT_PUBLIC_`: false observado

## Redeploy

- Redeploy apos secrets Meta: true
- Redeploy apos correcao do handler: true
- Redeploy apos idempotencia de eventos: true
- Deploy final Ready: true
- Alias final atualizado: true

## Ajustes tecnicos executados

Sem criar funcionalidade nova de produto.

- Corrigido audit log de POST sem assinatura para nao tentar gravar ID externo textual em coluna UUID.
- Corrigida extracao de ID de DM para usar `message.mid` antes de `entry.id`, evitando colisao com comentario publico.
- Tornada a criacao de evento webhook idempotente quando o mesmo `external_event_id` ja existe, evitando 500 em retries/dry-run repetido.

## Config-check

Fonte: `reports/staging-webhook-config-check.json`.

- health endpoint reachable: true
- verify token present: true
- app secret present: true
- service role present: true
- webhook enabled: true
- allowed objects configured: true
- allowed object includes instagram: true
- max payload configured: true
- diagnostics endpoint status: 404
- source: health
- environment: production
- runtime: nodejs

## Check-url

Fonte: `reports/staging-check-url.json`.

- `GET /`: 200
- `GET /api/health`: 200
- `GET /api/meta/webhook` sem query: 403
- Interpretacao: 403 sem query continua aceitavel para o handler; o teste decisivo foi o GET verification do dry-run.

## Dry-run assinado

Fonte: `reports/staging-webhook-dry-run.json`.

- GET verification: true, status 200
- POST signed: true, status 200
- POST unsigned rejected: true, status 401
- DM prohibited: true, status 200
- Invalid object: true, status 200
- Healthcheck safe: true, status 200
- Resultado do dry-run: GO_STAGING tecnico

## Evidencias

Fonte: `reports/staging-webhook-evidence.json`.

- totalMetaWebhookEvents: 3
- totalQuarantined: 1
- totalIgnored: 2
- totalProcessed: 0
- totalFailed: 0
- totalInvalidSignature: 0
- totalWebhookAuditLogs: 21
- totalWebhookIncidents: 5
- signedEventSeen: true
- unsignedRejectionSeen no artefato evidence: false
- unsignedRejectionSeen no go/no-go via dry-run: true
- operatorIgnoredSeen: true
- operatorProcessedSeen: false

## Operacao manual obrigatoria

- Painel alvo: `https://raadarbase.vercel.app/integracoes/meta/webhooks`
- Entrar autenticado: nao executado nesta sessao
- Ignorar 1 evento: ja observado como true por evento ignorado/proibido
- Processar 1 evento permitido: nao executado
- Motivo: falta sessao autenticada operacional remota nesta execucao; nao foi simulado via banco para nao mascarar a exigencia de acao humana.

## Go/no-go

Fonte: `reports/staging-webhook-go-no-go.json`.

- appUrlConfigured: true
- healthOk: true
- healthSecretsSafe: true
- dryRunExecuted: true
- signedEventSeen: true
- unsignedRejectionSeen: true
- operatorIgnoredSeen: true
- operatorProcessedSeen: false
- auditLogsFound: true
- incidentsFound: true
- noDmAutomatic: true
- noAutoContact: true
- noPoliticalScore: true
- decisao: NO_GO_STAGING

Motivo: falta `operatorProcessedSeen=true`, que depende da operacao manual autenticada de processar 1 evento permitido.

## Verificacao obrigatoria

- `npm run lint`: passou com 11 warnings existentes
- `npm run build`: passou
- `npm run test`: passou, 147 testes
- `npm run check:health`: passou
- `npm run check:rls`: passou para escrita anon bloqueada; papeis admin/operador/leitura sem credenciais locais
- `npm run e2e:ci`: passou, 47 testes
- `npm run ci`: passou
- `npm run readiness`: passou com avisos locais de `META_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ACCOUNT_ID` ausentes
- `npm run verify`: passou; `e2e` local pulou por `E2E_RUN=true` ausente
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:config-check`: passou
- `APP_URL=https://raadarbase.vercel.app npm run staging:check-url`: PENDING_EXTERNAL_VALIDATION por GET webhook sem query 403
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:dry-run`: passou
- `npm run staging:webhook:evidence`: passou
- `npm run staging:webhook:go-no-go`: NO_GO_STAGING
- `npm run staging:webhook:report`: passou

## Recomendacao

- manter `META_WEBHOOK_ENABLED=true` em staging: sim, ate a operacao manual obrigatoria ser concluida.
- ativar producao: nao.

## Pendencias reais

1. Entrar com sessao autenticada no painel remoto.
2. Processar manualmente 1 evento permitido em quarentena.
3. Rodar novamente `npm run staging:webhook:evidence`.
4. Confirmar `totalProcessed >= 1` e `operatorProcessedSeen=true`.
5. Rodar novamente `npm run staging:webhook:go-no-go`.
6. Manter producao bloqueada ate GO_STAGING real.
7. Rotacionar os secrets colados no chat quando a validacao assistida terminar.

## Proximo tijolo recomendado

Tijolo 030: operacao manual autenticada.

- Abrir o painel remoto com usuario interno.
- Processar 1 evento permitido em quarentena.
- Regerar evidence/go-no-go/report.
- Se todos os sinais ficarem true, registrar GO_STAGING.
