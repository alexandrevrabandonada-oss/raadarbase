# Estado da Nacao 044 - Consolidacao da Primeira Ingestao Real Instagram

Data: 2026-05-04

## Escopo

Consolidar a primeira ingestao real do Instagram em staging, validar contagens no Supabase, verificar `meta_sync_runs` presas, conferir paginas operacionais e registrar guardrails.

Producao nao foi ativada.

## Ingestao Real

- Ingestao real executada: sim
- Ambiente: staging
- Fonte: API oficial Meta/Instagram
- Posts sincronizados: 26
- Comentarios/interacoes sincronizadas: 542
- Pessoas criadas/atualizadas: 451
- Contatos automaticos criados: 0

Observacao: as contagens atuais do Supabase sao maiores que o snapshot operacional anterior informado no dashboard. O banco agora registra 26 posts, 542 interacoes e 451 pessoas.

## Supabase

Consulta realizada com service role de staging, sem imprimir segredos.

- `ig_posts`: 26
- `ig_interactions`: 542
- `ig_people`: 451
- `meta_sync_runs`: 27
- `audit_logs` relacionados a Meta sync: 56

## Sync Runs Presas

Regra operacional existente: uma run e considerada presa quando `status = started`, `finished_at` vazio e `started_at` mais antigo que 15 minutos.

Resultado:

- `meta_sync_runs` com `status = started`: 0
- sync_runs presas encontradas: 0
- sync_runs presas corrigidas: 0
- audit_log de correcao criado: nao aplicavel

Conclusao: o estado "Ultima sincronizacao Meta: started" observado anteriormente nao corresponde mais ao estado atual do Supabase. A ultima run consultada esta `success`.

## Paginas Validadas

Paginas conferidas no codigo e cobertas pela verificacao de build:

- `/dashboard`
- `/integracoes/meta`
- `/pessoas`
- `/posts`
- `/temas`
- `/relatorios`
- `/operacao`

Todas permanecem protegidas por sessao interna e usam leitura via camada de dados do projeto.

## Guardrails

- Nenhuma DM automatica implementada.
- Nenhuma abordagem automatica implementada.
- Nenhum contato automatico criado pelo fluxo Meta/webhook.
- Nenhum score politico individual implementado.
- Nenhum scraping implementado.
- Nenhuma coleta em massa de seguidores implementada.
- Dados sensiveis seguem fora de relatorios e logs operacionais.
- Filtro/classificacao por tema continua descrevendo conteudo de interacao ou post, nao perfil politico da pessoa.

## Webhooks

- Webhooks seguem em staging.
- Estado esperado: `GO_STAGING`.
- Producao permanece bloqueada por governanca.

## Verificacao

Comandos solicitados para este tijolo:

- `npm run staging:meta-api-check`: FAIL no terminal local por envs Meta ausentes (`APP_URL`, `META_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `META_GRAPH_VERSION`).
- `npm run staging:meta-api-smoke`: FAIL no terminal local por `META_ACCESS_TOKEN` ausente.
- `npm run staging:webhook:evidence`: OK.
  - total events: 3
  - processed: 1
  - ignored: 2
  - failed: 0
  - webhook incidents: 6
  - webhook audit logs: 29
- `npm run staging:webhook:go-no-go`: GO_STAGING.
- `npm run verify`: OK.
  - lint: OK com 11 warnings existentes.
  - build: OK.
  - test: 147 testes passaram.
  - check:rls: OK.
  - check:health: OK.
  - e2e local: pulado porque `E2E_RUN=true` nao esta configurado.

Observacao: a falha dos scripts Meta locais reflete ausencia de segredos no terminal desta sessao, nao ausencia de dados reais no Supabase. A ingestao real ja esta evidenciada pelas contagens persistidas e pelas `meta_sync_runs` bem-sucedidas.

## Decisao

STAGING_REAL_INGESTION_CONSOLIDATED

## Proximo Tijolo Recomendado

Criar um painel operacional de reconciliacao Meta com comparacao entre contagens do dashboard, contagens diretas do Supabase e ultimas `meta_sync_runs`, para evitar confusao quando uma sincronizacao anterior em `started` ja tiver sido superada por runs posteriores bem-sucedidas.
