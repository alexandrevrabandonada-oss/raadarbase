# Estado da Nacao 042 - Ingestao Real Instagram em Staging

Data: 2026-05-01

## Escopo

Este tijolo preparou e validou a ativacao de ingestao real do Instagram em staging por sincronizacao manual via API oficial Meta/Instagram.

Producao nao foi ativada.

## Implementacao

- Criado `scripts/staging-meta-api-check.mjs`.
- Criado `scripts/staging-meta-api-smoke.mjs`.
- Adicionados scripts:
  - `npm run staging:meta-api-check`
  - `npm run staging:meta-api-smoke`
- Atualizado `/api/health` com booleans seguros:
  - `meta_access_token_present`
  - `instagram_business_account_id_present`
  - `meta_graph_version_present`
  - `meta_manual_sync_ready`
- Mantida a pagina `/integracoes/meta` com botoes manuais:
  - `Sincronizar dados da conta`
  - `Sincronizar últimos posts`
  - `Sincronizar comentários recentes`

## Envs Presentes

Local:

- `APP_URL`: sim
- `META_ACCESS_TOKEN`: nao
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`: nao
- `META_GRAPH_VERSION`: nao
- `SUPABASE_SERVICE_ROLE_KEY`: sim
- `NEXT_PUBLIC_SUPABASE_URL`: sim
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: sim

Remoto via `/api/health`:

- health endpoint reachable: sim
- `meta_access_token_present`: nao
- `instagram_business_account_id_present`: nao
- `meta_graph_version_present`: nao
- `meta_manual_sync_ready`: nao

Nenhum valor sensivel foi registrado.

## Smoke API

Resultado: FAIL

Motivo: `META_ACCESS_TOKEN` ausente no ambiente local de execucao.

Sem token real da API Meta, nao foi possivel chamar a API oficial, validar a conta Instagram Business nem buscar dados basicos da propria conta.

## Dados Sincronizados

- Posts sincronizados: 0
- Comentarios sincronizados: 0
- Pessoas criadas/atualizadas: 0
- Audit logs de sincronizacao criados: 0
- `meta_sync_runs` criados: 0

Nao houve sync manual real porque a configuracao Meta ainda nao esta pronta.

## Webhooks Staging

- `npm run staging:webhook:evidence`: READY
- totalMetaWebhookEvents: 3
- totalProcessed: 1
- totalIgnored: 2
- totalWebhookIncidents: 6
- totalWebhookAuditLogs: 29
- `npm run staging:webhook:go-no-go`: GO_STAGING

## Guardrails

- Sem DM automatica: preservado
- Sem resposta automatica: preservado
- Sem automacao de abordagem: preservado
- Sem scraping: preservado
- Sem coleta massiva de seguidores: preservado
- Sem criacao automatica de contato: preservado
- Sem score politico individual: preservado
- Tokens permanecem apenas no servidor: preservado no codigo

## Verificacao

- `npm run staging:meta-api-check`: FAIL por envs Meta ausentes
- `npm run staging:meta-api-smoke`: FAIL por `META_ACCESS_TOKEN` ausente
- `npm run staging:webhook:evidence`: OK
- `npm run staging:webhook:go-no-go`: GO_STAGING
- `npm run verify`: OK

Observacoes:

- `lint` passou com 11 warnings existentes.
- `build` passou.
- `test` passou com 147 testes.
- `check:rls` passou para bloqueio anonimo de escrita.
- `check:health` passou sem exposicao de segredos conhecidos.
- E2E local foi pulado porque `E2E_RUN=true` nao esta configurado.

## Decisao

NO_GO_STAGING_REAL_INGESTION

## Producao

Producao permanece bloqueada.

Nenhuma secret de producao foi configurada e nenhuma ativacao de producao foi executada.

## Pendencias

- Configurar `META_ACCESS_TOKEN` real no ambiente de staging.
- Configurar `INSTAGRAM_BUSINESS_ACCOUNT_ID` no ambiente de staging.
- Garantir `META_GRAPH_VERSION` no ambiente de staging.
- Redeployar o runtime de staging para publicar os novos booleans de healthcheck.
- Rodar novamente `npm run staging:meta-api-check`.
- Rodar novamente `npm run staging:meta-api-smoke`.
- Entrar autenticado em `/integracoes/meta` e executar os tres botoes manuais.
- Conferir `ig_posts`, `ig_people`, `ig_interactions`, `audit_logs` e `meta_sync_runs` depois da sync manual.

## Proximo Tijolo Recomendado

Configurar as envs Meta reais no staging, redeployar o host de staging, executar o smoke da API oficial e realizar a primeira sincronizacao manual autenticada em `/integracoes/meta`.
