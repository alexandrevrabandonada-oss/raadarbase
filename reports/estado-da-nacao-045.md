# Estado da Nacao 045 - Painel de Reconciliacao Operacional Meta

Data: 2026-05-04

## Escopo

Criar painel operacional seguro para comparar contagens do dashboard, contagens diretas do Supabase e ultimas `meta_sync_runs`, reduzindo confusao quando uma run antiga em `started` ja tiver sido superada por runs posteriores finalizadas.

Producao nao foi ativada.

## Painel Criado

- Nova camada: `src/lib/data/meta-reconciliation.ts`
- Nova pagina: `/operacao/meta-reconciliacao`
- Link adicionado em `/operacao`: `Reconciliação Meta`
- Link adicionado no card Meta do `/dashboard`

## Fonte da Verdade

A fonte da verdade do painel e o Supabase:

- `ig_posts`
- `ig_interactions`
- `ig_people`
- `meta_sync_runs`
- `audit_logs`

Contagens consolidadas da ingestao real anterior:

- posts no banco: 26
- interacoes/comentarios no banco: 542
- pessoas no banco: 451
- `meta_sync_runs`: 27
- `audit_logs` Meta sync: 56

## Runs Presas

- Regra mantida: `status = started`, `finished_at` vazio e `started_at` mais antigo que 15 minutos.
- Runs presas conhecidas antes deste tijolo: 0
- O painel lista runs presas, quando existirem, com link para o detalhe operacional.

## Divergencias

O painel agora mostra divergencias potenciais entre dashboard e fonte da verdade:

- dashboard mostra X, banco mostra Y;
- run `started` sem finalizacao;
- run `started` antiga em comparacao com run finalizada posterior;
- diferenca de contagens quando houver cache/filtro divergente.

## Dashboard

O card "Ultima sincronizacao Meta" foi ajustado para priorizar a ultima run finalizada (`success` ou `error`) em vez de exibir cegamente uma run `started`.

Se houver run iniciada sem finalizacao, o dashboard exibe aviso separado:

- "Há run iniciada sem finalização, ver reconciliação."

## Healthcheck

Campos seguros adicionados ao `/api/health`:

- `meta_real_ingestion_configured`
- `meta_posts_count`
- `meta_interactions_count`
- `meta_people_count`
- `meta_sync_runs_count`
- `meta_started_runs_count`
- `meta_stuck_runs_count`
- `latest_meta_sync_status`

Nao foram expostos token, payload bruto, username detalhado, comentarios, dados pessoais ou service role.

## Testes

Criados:

- `src/lib/data/meta-reconciliation.test.ts`
- `e2e/meta-reconciliation.spec.ts`

Cobertura adicionada:

- contagem correta;
- runs presas;
- ultima run finalizada;
- divergencia de dashboard;
- banco vazio;
- renderizacao da pagina de reconciliacao;
- ausencia de segredo na tela;
- link do dashboard para reconciliacao.

## Guardrails

- Sem DM automatica.
- Sem abordagem automatica.
- Sem criacao automatica de contato.
- Sem score politico individual.
- Sem scraping.
- Sem coleta massiva de seguidores.
- Leitura operacional e diagnostico seguro apenas.

## Verificacao

- `npm run lint`: OK com 11 warnings existentes.
- `npm run build`: OK.
- `npm run test`: OK, 19 arquivos e 152 testes passaram.
- `npm run e2e:ci`: OK, 49 testes passaram.
- `npm run check:health`: OK.
- `npm run readiness`: OK, com avisos esperados de `META_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ACCOUNT_ID` ausentes no terminal local.
- `npm run verify`: OK.
  - lint: OK com 11 warnings existentes.
  - build: OK.
  - test: OK, 152 testes passaram.
  - check:rls: OK.
  - check:health: OK.
  - e2e local: pulado porque `E2E_RUN=true` nao esta configurado.
- `npm run staging:webhook:evidence`: OK.
  - total events: 3
  - processed: 1
  - ignored: 2
  - failed: 0
  - webhook incidents: 6
  - webhook audit logs: 29
- `npm run staging:webhook:go-no-go`: GO_STAGING.

## Decisao

META_RECONCILIATION_PANEL_READY

## Proximo Tijolo Recomendado

Adicionar captura de evidencia operacional assinada para cada ciclo de reconciliacao, registrando somente contagens agregadas, status das runs e hash do relatorio, sem payload bruto ou dados pessoais.
