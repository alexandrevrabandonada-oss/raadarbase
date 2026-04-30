# Estado da Nacao 028

Data: 2026-04-30
Escopo: operacao assistida no runtime remoto que serve `https://raadarbase.vercel.app`.

## Host validado

- Host: `https://raadarbase.vercel.app`
- Projeto Vercel: `alexandrevrabandonada-oss-projects/raadarbase`
- Deployment ativo: `dpl_BWrg2978tUN5Ao7K5iNqb1LbGx52`
- URL do deployment: `https://raadarbase-jqjzliiih-alexandrevrabandonada-oss-projects.vercel.app`
- Target: production
- Status do deploy: Ready
- Criado em: 2026-04-30 18:58:07 -03:00
- Alias confirmado: `https://raadarbase.vercel.app`

## Checklist Vercel

- dominio raadarbase.vercel.app aponta para o projeto certo: true
- branch/deploy contem `/api/meta/webhook`: true
- branch/deploy contem `/api/health`: true
- branch/deploy contem `/integracoes/meta/webhooks`: true
- branch/deploy contem endpoint diagnostico `/api/meta/webhook/diagnostics`: true
- ultimo deploy terminou com sucesso: true
- protecao/preview auth bloqueando webhook externo: false observado para `/` e `/api/health`; `/api/meta/webhook` retorna 403 por verificacao/token ausente

## Envs remotas

Valores nao foram registrados.

- `APP_URL`: true
- `NEXT_PUBLIC_SUPABASE_URL`: true
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: true
- `SUPABASE_SERVICE_ROLE_KEY`: true
- `META_APP_SECRET`: false
- `META_WEBHOOK_VERIFY_TOKEN`: false
- `META_WEBHOOK_ENABLED`: true
- `META_WEBHOOK_ALLOWED_OBJECTS`: true
- `META_WEBHOOK_ALLOWED_OBJECTS` inclui instagram: true
- `META_WEBHOOK_MAX_PAYLOAD_BYTES`: true
- `SUPABASE_SERVICE_ROLE_KEY` como `NEXT_PUBLIC_*`: false observado
- `META_APP_SECRET` como `NEXT_PUBLIC_*`: false observado
- `META_WEBHOOK_VERIFY_TOKEN` como `NEXT_PUBLIC_*`: false observado

## Redeploy

- Redeploy executado: true
- Build Vercel: sucesso
- Alias atualizado para o novo deployment: true
- Rotas publicadas no build: true

## Diagnostico seguro

Fonte: `reports/staging-webhook-config-check.json`.

- source: health
- diagnostics endpoint status: 404
- health endpoint reachable: true
- verify token present: false
- app secret present: false
- service role present: true
- webhook enabled: true
- allowed objects configured: true
- allowed object includes instagram: true
- max payload configured: true
- environment: production
- runtime: nodejs

Interpretacao: diagnostico minimo via `/api/health` esta disponivel e sem valores sensiveis, mas os dois envs Meta obrigatorios ainda nao existem no runtime remoto.

## GET verification

Fonte: `reports/staging-check-url.json` e `reports/staging-webhook-dry-run.json`.

- `GET /`: 200
- `GET /api/health`: 200
- `GET /api/meta/webhook`: 403
- dry-run com token alinhado: nao executado
- motivo: `META_WEBHOOK_VERIFY_TOKEN` ausente local/remoto
- criterio esperado: 200/challenge
- resultado: falhou

## POST signed

Fonte: `reports/staging-webhook-dry-run.json`.

- executado: false
- motivo: `META_APP_SECRET` e `META_WEBHOOK_VERIFY_TOKEN` sao obrigatorios para dry-run alinhado ao runtime remoto
- evento em quarentena gerado: false
- criterio esperado: 200/quarantined
- resultado: falhou

## POST unsigned

Fonte: `reports/staging-webhook-dry-run.json`.

- executado no dry-run final: false
- unsigned rejection seen: false
- criterio esperado: 401 ou 403
- resultado: nao validado por bloqueio anterior dos secrets Meta

## Evidencias Supabase

Fonte: `reports/staging-webhook-evidence.json`.

- totalMetaWebhookEvents: 0
- totalQuarantined: 0
- totalIgnored: 0
- totalProcessed: 0
- totalFailed: 0
- totalInvalidSignature: 0
- totalWebhookAuditLogs: 7
- totalWebhookIncidents: 2
- signedEventSeen: false
- unsignedRejectionSeen: false
- operatorIgnoredSeen: false
- operatorProcessedSeen: false

## Operacao manual obrigatoria

- painel alvo: `/integracoes/meta/webhooks`
- ignorar 1 evento: nao executado
- processar 1 evento permitido: nao executado
- motivo: nenhum evento foi gerado em quarentena porque POST signed nao pode rodar sem `META_APP_SECRET`
- ignored >= 1: false
- processed >= 1: false
- operatorIgnoredSeen: false
- operatorProcessedSeen: false
- auditLogsFound: true
- incidentsFound: true
- noAutoContact: true
- noDmAutomatic: true
- noPoliticalScore: true

## Go/no-go

Fonte: `reports/staging-webhook-go-no-go.json`.

- appUrlConfigured: true
- healthOk: true
- healthSecretsSafe: true
- dryRunExecuted: false
- signedEventSeen: false
- unsignedRejectionSeen: false
- operatorIgnoredSeen: false
- operatorProcessedSeen: false
- auditLogsFound: true
- incidentsFound: true
- noDmAutomatic: true
- noAutoContact: true
- noPoliticalScore: true
- decisao do script: PENDING_EXTERNAL_VALIDATION
- decisao operacional do tijolo: NO_GO_STAGING

Motivo da decisao operacional: os criterios obrigatorios de GO_STAGING nao foram cumpridos. GET verification nao saiu de 403, POST signed nao rodou, nenhum evento foi quarentenado e a operacao manual obrigatoria nao pode ser executada.

## Verificacao obrigatoria

- `npm run lint`: passou com 11 warnings existentes
- `npm run build`: passou
- `npm run test`: passou, 147 testes
- `npm run check:health`: passou apos encerrar servidor local antigo na porta 3201
- `npm run check:rls`: passou para escrita anon bloqueada; papeis admin/operador/leitura sem credenciais locais
- `npm run e2e:ci`: passou, 47 testes
- `npm run ci`: passou
- `npm run readiness`: passou com avisos de `META_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ACCOUNT_ID` ausentes no ambiente local
- `npm run verify`: passou; `e2e` local pulou por `E2E_RUN=true` ausente
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:config-check`: falhou criterios Meta ausentes
- `APP_URL=https://raadarbase.vercel.app npm run staging:check-url`: PENDING_EXTERNAL_VALIDATION por GET webhook 403
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:dry-run`: PENDING_EXTERNAL_VALIDATION por secrets Meta ausentes
- `npm run staging:webhook:evidence`: passou
- `npm run staging:webhook:go-no-go`: PENDING_EXTERNAL_VALIDATION no script
- `npm run staging:webhook:report`: passou

## Recomendacao

- manter `META_WEBHOOK_ENABLED=true` em staging: sim, somente enquanto este host permanecer como staging controlado e bloqueado para producao real.
- ativar producao: nao.

## Pendencias reais

1. Configurar no Vercel, sem prefixo `NEXT_PUBLIC_`, os envs reais `META_APP_SECRET` e `META_WEBHOOK_VERIFY_TOKEN`.
2. Redeployar novamente apos incluir esses dois envs.
3. Rodar o dry-run com os mesmos `META_APP_SECRET` e `META_WEBHOOK_VERIFY_TOKEN` no ambiente local, sem imprimir valores.
4. Confirmar GET verification 200/challenge.
5. Confirmar POST signed 200/quarantined e insercao em `meta_webhook_events`.
6. Confirmar POST unsigned 401/403 e incidente/audit log seguro.
7. Executar a operacao manual autenticada: ignorar 1 evento e processar 1 evento permitido.
8. Regerar evidence, go-no-go e report.
9. Rotacionar as credenciais sensiveis coladas no chat apos concluir a validacao assistida.

## Proximo tijolo recomendado

Tijolo 029: finalizar validacao Meta com secrets reais.

- Aplicar `META_APP_SECRET` e `META_WEBHOOK_VERIFY_TOKEN` no Vercel.
- Redeployar o host.
- Rodar dry-run assinado.
- Gerar evento em quarentena.
- Executar operacao manual obrigatoria.
- Tentar obter GO_STAGING mantendo producao bloqueada.
