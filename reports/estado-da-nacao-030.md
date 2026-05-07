# Estado da Nacao 030

Data: 2026-04-30
Escopo: consolidacao do estado atual apos correcoes de webhook staging e autorizacao interna.

## Resumo executivo

Status geral do projeto: estavel em desenvolvimento e homologacao.

Decisao operacional atual: NO_GO_STAGING.

Motivo principal do no-go: falta concluir a etapa manual obrigatoria de processar ao menos 1 evento permitido na fila de quarentena (operatorProcessedSeen=false).

## Estado funcional por area

### 1. Aplicacao e infraestrutura

- Host vivo: https://raadarbase.vercel.app
- Rotas principais publicas respondendo: ok
- Ambiente de producao com Supabase configurado: ok
- Build e testes locais: ok

### 2. Webhook Meta/Instagram (staging)

Fonte principal:
- reports/staging-webhook-config-check.json
- reports/staging-webhook-evidence.json
- reports/staging-webhook-go-no-go.json

Sinais tecnicos atuais:

- verify token present: true
- app secret present: true
- service role present: true
- webhook enabled: true
- allowed objects includes instagram: true
- max payload configured: true

Evidencias atuais:

- totalMetaWebhookEvents: 3
- totalQuarantined: 1
- totalIgnored: 2
- totalProcessed: 0
- totalWebhookAuditLogs: 27
- totalWebhookIncidents: 6
- signedEventSeen: true
- unsignedRejectionSeen (go-no-go): true
- operatorIgnoredSeen: true
- operatorProcessedSeen: false

Decisao atual de gate:

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

### 3. Autorizacao interna (login)

Problema identificado anteriormente:

- policy RLS recursiva em public.internal_users, causando erro de leitura do perfil interno apos autenticacao.

Correcao aplicada:

- funcao security definer para checagem de admin atual
- policies de admin recriadas sem recursao
- migration registrada no repo:
  - supabase/migrations/016_fix_internal_users_admin_rls.sql

Validacao apos fix:

- autenticacao do usuario admin: ok
- leitura do perfil em internal_users: ok
- status: active
- role: admin

## Qualidade e verificacoes

Consolidado recente:

- lint: passou (warnings existentes fora do escopo critico)
- build: passou
- test: passou
- check:health: passou
- check:rls: passou para bloqueio anon esperado
- e2e:ci: passou
- ci/readiness/verify: executados no ciclo anterior com resultado geral positivo para continuidade

## Riscos e pendencias reais

1. Pendencia operacional manual ainda aberta no staging:
- processar 1 evento permitido via painel autenticado
- sem isso, operatorProcessedSeen continua false

2. Enquanto NO_GO_STAGING persistir:
- manter bloqueio de promocao para producao

3. Governanca e seguranca:
- manter quarentena obrigatoria
- manter rejeicao de assinatura invalida
- manter proibicao de DM automatica, criacao automatica de contato e score politico individual

## Recomendacao objetiva

1. Executar operacao manual obrigatoria no painel de webhooks:
- ignorar 1 evento (ja evidenciado)
- processar 1 evento permitido (faltante)

2. Regerar artefatos:
- npm run staging:webhook:evidence
- npm run staging:webhook:go-no-go
- npm run staging:webhook:report

3. Se operatorProcessedSeen=true apos a acao manual:
- promover status para GO_STAGING
- manter producao bloqueada ate confirmacao formal final

## Referencias

- reports/estado-da-nacao-029.md
- reports/staging-webhook-config-check.json
- reports/staging-webhook-evidence.json
- reports/staging-webhook-go-no-go.json
- supabase/migrations/016_fix_internal_users_admin_rls.sql
