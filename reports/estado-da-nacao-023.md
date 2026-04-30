# Estado da Nacao 023

Data: 2026-04-30
Escopo: resolucao da infraestrutura externa de staging para webhooks Meta/Instagram, sem liberar producao.

## Resumo executivo

A validacao foi repetida com foco em deploy publico e exposure do Supabase staging.

Resultado: **PENDING_EXTERNAL_VALIDATION**.

Bloqueios comprovados neste ciclo:

1. O dominio candidato `https://radar-base-staging.vercel.app` nao aponta para um deployment ativo da aplicacao. O retorno da plataforma foi `DEPLOYMENT_NOT_FOUND`.
2. O runtime principal usado pelos scripts ainda nao possui `APP_URL` configurado.
3. No Supabase staging, as tabelas `meta_webhook_events` e `meta_webhook_event_links` existem via service role, mas continuam fora do schema cache/exposure da API PostgREST.
4. Sem deploy publico funcional e sem exposure correto da API, nao foi possivel concluir dry-run externo real nem operacao manual obrigatoria.

## URL publica final

- URL candidata testada: `https://radar-base-staging.vercel.app`
- Status: invalida para staging real neste momento.
- Diagnostico da plataforma: `DEPLOYMENT_NOT_FOUND`

## Diagnostico do deploy

Comprovacoes obtidas:

- GET `/`: 404
- GET `/api/health`: 404
- GET `/api/meta/webhook`: 404
- Resposta bruta da Vercel: `The deployment could not be found on Vercel.`
- Codigo de plataforma: `DEPLOYMENT_NOT_FOUND`

Leitura tecnica:

- o dominio nao aponta para um deployment ativo do projeto;
- pode ser alias removido, projeto Vercel errado, branch nao publicada nesse host, ou dominio incorreto;
- localmente o build gera as rotas esperadas, entao o problema atual nao e ausencia de rota no codigo, e sim deploy/alias externo.

## Envs configuradas (apenas booleans observaveis neste ambiente)

No ambiente local de execucao atual:

- APP_URL presente no runtime principal: false
- NEXT_PUBLIC_SUPABASE_URL presente: true
- NEXT_PUBLIC_SUPABASE_ANON_KEY presente: true
- SUPABASE_SERVICE_ROLE_KEY presente: true
- META_APP_SECRET presente: true
- META_WEBHOOK_VERIFY_TOKEN presente: true
- META_WEBHOOK_ENABLED observado nos scripts locais: nao habilitado para staging externo

Observacao:

- nao foi possivel verificar ou alterar as envs do deploy Vercel a partir deste ambiente, porque nao havia sessao autenticada disponivel no dashboard da Vercel.
- tambem nao foi possivel confirmar nem alterar settings do Supabase staging via dashboard, porque nao havia sessao autenticada disponivel no dashboard do Supabase.

## Resultado staging:check-url

Fonte: `reports/staging-check-url.json`

- Status: `PENDING_EXTERNAL_VALIDATION`
- APP_URL no runtime principal: ausente
- Razao no runtime principal: `APP_URL ausente no ambiente.`

Diagnostico manual adicional do host candidato:

- candidato HTTPS testado: `https://radar-base-staging.vercel.app`
- retorno: `DEPLOYMENT_NOT_FOUND`

## Resultado staging:db-check

Fonte: `reports/staging-db-check.json`

- Status: `PENDING_EXTERNAL_VALIDATION`
- Tabelas existem via service role: sim
- Enum mencao aceito: sim
- RLS anon bloqueado: sim
- Exposure API de webhook:
  - `metaWebhookEvents`: `schema_cache_stale_or_not_exposed`
  - `metaWebhookEventLinks`: `schema_cache_stale_or_not_exposed`

## Correcao do schema cache

Foi reforcado o diagnostico no script `scripts/staging-db-check.mjs` para classificar explicitamente:

- `table_missing`
- `api_schema_cache_stale_or_not_exposed`
- `permission_or_rls_block`
- `unknown_error`

Resultado deste ciclo:

- nao houve evidencia de tabela ausente;
- houve evidencia consistente de schema cache/exposure quebrado na API do staging.

Acao ainda pendente no ambiente real:

- executar `NOTIFY pgrst, 'reload schema';`
- confirmar `public` em `Exposed schemas`
- confirmar que `meta_webhook_events` e `meta_webhook_event_links` estao no schema `public` do projeto correto

## Resultado dry-run externo

Fonte: `reports/staging-webhook-dry-run.json`

- Status: `NO_GO_STAGING`
- GET verification: 404
- POST assinado: 404
- POST sem assinatura: 404
- DM proibida: 404
- objeto invalido: 404
- healthcheck: 404

Interpretacao:

- o script executou contra host configurado manualmente para teste;
- como o host nao possui deployment ativo, o resultado nao comprova comportamento de webhook, apenas confirma bloqueio de deploy.

## Eventos recebidos

Fonte: `reports/staging-webhook-evidence.json`

- eventos recebidos: 0
- quarentenados: 0
- ignorados: 0
- processados: 0
- audit logs webhook: 0
- incidentes webhook: 0

## Resultado go/no-go

Fonte: `reports/staging-webhook-go-no-go.json`

- Resultado do script: `NO_GO_STAGING`
- Sinais preservados:
  - `noDmAutomatic`: true
  - `noAutoContact`: true
  - `noPoliticalScore`: true
- Sinais ausentes:
  - `healthOk`
  - `healthSecretsSafe`
  - `signedEventSeen`
  - `unsignedRejectionSeen`
  - `operatorIgnoredSeen`
  - `operatorProcessedSeen`
  - `auditLogsFound`
  - `incidentsFound`

## Decisao final

- **PENDING_EXTERNAL_VALIDATION**

Racional:

- o host publico testado nao existe como deployment ativo na Vercel;
- o runtime principal nao tem `APP_URL` configurado;
- a API do Supabase staging continua sem exposure/schema cache funcional para as tabelas de webhook;
- sem isso, ainda nao existe validacao externa real suficiente para decidir `GO_STAGING` ou `NO_GO_STAGING` sobre um staging funcional.

## Recomendacao

- Ativar `META_WEBHOOK_ENABLED=true` em staging? **Nao**.
- Ativar producao? **Nao**.
- Produção permanece bloqueada.

## Pendencias reais

1. Corrigir alias/deploy publico na Vercel para um host que aponte para deployment ativo do projeto.
2. Configurar `APP_URL` no deploy de staging com esse host publico real.
3. Fazer redeploy apos gravar as envs de staging.
4. Recarregar schema cache do PostgREST no Supabase staging.
5. Confirmar exposure correta de `meta_webhook_events` e `meta_webhook_event_links`.
6. Reexecutar dry-run externo real.
7. Executar operacao manual obrigatoria: ignorar 1 evento e processar 1 evento permitido.

## Proximo tijolo recomendado

Tijolo 024: correção assistida com acesso autenticado aos dashboards Vercel e Supabase para:

- vincular o dominio de staging ao deployment correto;
- gravar `APP_URL` e demais envs no deploy;
- executar `reload schema` no Supabase staging;
- repetir dry-run, operacao manual, evidencia e decisao final.

## Verificacao obrigatoria executada neste ciclo

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run check:health`
- `npm run check:rls`
- `npm run e2e:ci`
- `npm run ci`
- `npm run readiness`
- `npm run verify`
- `npm run staging:check-url`
- `npm run staging:db-check`
- `APP_URL=https://radar-base-staging.vercel.app npm run staging:webhook:dry-run`
- `npm run staging:webhook:evidence`
- `npm run staging:webhook:go-no-go`
- `npm run staging:webhook:report`
