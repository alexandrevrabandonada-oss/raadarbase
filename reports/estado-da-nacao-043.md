# Estado da Nacao 043 - Ativacao de Ingestao Real Instagram em Staging

Data: 2026-05-02

## Escopo

Este tijolo tentou configurar as variaveis reais da API Meta/Instagram no staging, validar o smoke oficial e executar a primeira sincronizacao manual autenticada.

Producao nao foi ativada.

## Configuracao de Envs

Vercel:

- `META_ACCESS_TOKEN`: nao
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`: nao
- `META_GRAPH_VERSION`: existente no Vercel, mas health remoto ainda reporta falso no runtime ativo

Ambiente local de execucao:

- `APP_URL`: sim
- `META_ACCESS_TOKEN`: nao
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`: nao
- `META_GRAPH_VERSION`: nao
- `SUPABASE_SERVICE_ROLE_KEY`: sim
- `NEXT_PUBLIC_SUPABASE_URL`: sim
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: sim

Nenhum valor sensivel foi impresso ou registrado.

## Redeploy

Redeploy realizado: nao

Motivo: os valores reais obrigatorios de `META_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ACCOUNT_ID` nao estao disponiveis no ambiente local nem configurados no Vercel. Nao ha como publicar um runtime funcional de ingestao real sem esses segredos.

## Healthcheck Remoto

`/api/health` em `https://raadarbase.vercel.app` respondeu, mas os booleans seguros de ingestao ainda indicam bloqueio:

- `meta_access_token_present`: false
- `instagram_business_account_id_present`: false
- `meta_graph_version_present`: false
- `meta_manual_sync_ready`: false

## Smoke API

Resultado: FAIL

Motivo: `META_ACCESS_TOKEN` ausente no ambiente de execucao.

Dados basicos da conta validados: nao

Nao foi feita chamada funcional a API oficial porque o token real nao esta disponivel.

## Sincronizacao Manual

Execucao no painel `/integracoes/meta`: nao executada

Motivo: a sincronizacao manual depende de `META_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID` e `META_GRAPH_VERSION` presentes no runtime. Como os checks falharam, avancar para clique no painel geraria erro operacional e nao validaria ingestao real.

## Dados no Supabase

- Posts sincronizados: 0
- Comentarios sincronizados: 0
- Pessoas criadas/atualizadas: 0
- `meta_sync_runs` criados: 0
- Audit logs de sincronizacao criados: 0

## Webhooks Staging

- `npm run staging:webhook:evidence`: OK
- totalMetaWebhookEvents: 3
- totalProcessed: 1
- totalIgnored: 2
- totalWebhookIncidents: 6
- totalWebhookAuditLogs: 29
- `npm run staging:webhook:go-no-go`: GO_STAGING

## Verificacao

- `npm run staging:meta-api-check`: FAIL
- `npm run staging:meta-api-smoke`: FAIL
- `npm run staging:webhook:evidence`: OK
- `npm run staging:webhook:go-no-go`: GO_STAGING
- `npm run verify`: OK

Observacoes:

- `lint` passou com 11 warnings existentes.
- `build` passou.
- `test` passou com 147 testes.
- `check:rls` passou para bloqueio anonimo de escrita.
- `check:health` passou sem expor segredos conhecidos.
- E2E local foi pulado porque `E2E_RUN=true` nao esta configurado.

## Guardrails

- Producao permanece bloqueada.
- Sem scraping.
- Sem coleta massiva de seguidores.
- Sem DM automatica.
- Sem resposta automatica.
- Sem automacao de abordagem.
- Sem criacao automatica de contato.
- Sem score politico individual.
- Tokens mantidos fora de telas, logs e relatorios.

## Decisao

NO_GO_STAGING_REAL_INGESTION

## Pendencias

- Fornecer/configurar `META_ACCESS_TOKEN` real no Vercel staging sem expor o valor.
- Configurar `INSTAGRAM_BUSINESS_ACCOUNT_ID` no Vercel staging.
- Garantir `META_GRAPH_VERSION=v23.0` no runtime ativo.
- Redeployar o host `https://raadarbase.vercel.app`.
- Configurar as mesmas variaveis no terminal local de execucao dos scripts sem imprimir valores.
- Reexecutar `npm run staging:meta-api-check`.
- Reexecutar `npm run staging:meta-api-smoke`.
- Somente apos smoke OK, entrar autenticado em `/integracoes/meta` e executar os tres botoes manuais.

## Proximo Tijolo Recomendado

Configurar os segredos reais de Meta/Instagram no Vercel e no ambiente local de execucao, redeployar staging, validar `meta_manual_sync_ready=true` no healthcheck e executar a primeira sincronizacao manual autenticada.
