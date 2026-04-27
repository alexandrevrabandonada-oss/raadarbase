# Estado da Nação 007 - Prontidão de produção

Data: 2026-04-27

## O que foi implementado

- Workflow de CI em `.github/workflows/ci.yml` para `push` em `main` e `pull_request`.
- Script `scripts/run-e2e-ci.mjs` para E2E seguro no CI com Playwright Chromium.
- Script `scripts/production-readiness.mjs` para diagnóstico de prontidão de produção.
- Helper `src/lib/security/production-guards.ts` com guardrails centralizados.
- Helper `src/lib/operation/repeated-failures.ts` para detectar falhas recorrentes em 24h.
- Migration `supabase/migrations/007_retention_policy.sql` para políticas de retenção operacional.
- Bloco de retenção em `/configuracoes`.
- Card `Falhas recorrentes` em `/operacao`.
- `/api/health` endurecido com warnings de produção e métricas operacionais adicionais.
- Novos testes unitários e E2E para healthcheck, guardrails e falhas recorrentes.

## Arquivos criados/editados

- `.github/workflows/ci.yml`
- `README.md`
- `package.json`
- `scripts/check-health.mjs`
- `scripts/production-readiness.mjs`
- `scripts/run-e2e-ci.mjs`
- `e2e/configuracoes.spec.ts`
- `e2e/health.spec.ts`
- `e2e/production-guards.spec.ts`
- `src/app/api/health/route.ts`
- `src/app/configuracoes/page.tsx`
- `src/app/configuracoes/settings-client.tsx`
- `src/app/operacao/page.tsx`
- `src/lib/data/retention.ts`
- `src/lib/operation/repeated-failures.test.ts`
- `src/lib/operation/repeated-failures.ts`
- `src/lib/security/production-guards.test.ts`
- `src/lib/security/production-guards.ts`
- `src/lib/supabase/database.types.ts`
- `src/lib/types.ts`
- `supabase/migrations/007_retention_policy.sql`

## Workflow CI criado

Pipeline em GitHub Actions com os passos:

- `npm ci`
- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run check:health`
- `npm run e2e:ci`

O workflow usa placeholders de ambiente para não exigir segredos reais nem Supabase real para passar no CI deste tijolo.

## Scripts adicionados

- `npm run e2e:ci`
- `npm run ci`
- `npm run readiness`

## Como testar localmente

```bash
npm run lint
npm run build
npm run test
npm run check:health
npm run e2e
npm run e2e:ci
npm run ci
npm run readiness
npm run verify
```

## Como testar no CI

1. Abrir branch ou PR.
2. Confirmar que o workflow `CI` dispara automaticamente.
3. Verificar que nenhum passo exige token Meta real ou Supabase real.
4. Verificar que logs não expõem segredos.

## Como validar readiness

Execute:

```bash
npm run readiness
```

O comando valida envs, build, scripts, migrations, README e resposta segura de `/api/health`.

## Como interpretar retenção

- `meta_sync_runs`: 180 dias
- `audit_logs`: 365 dias
- `meta_account_snapshots`: 365 dias

Nenhuma limpeza automática foi ativada. O bloco de retenção em `/configuracoes` existe para dar visibilidade operacional e preparar futura rotina manual/assistida.

## Riscos corrigidos

- Regressões de lint/build/test/e2e agora podem ser barradas automaticamente no CI.
- `/api/health` ficou mais rígido e observável sem expor segredos.
- Erros recorrentes Meta passaram a ter sinalização explícita.
- Ambiente inseguro de produção ganhou guardrails centralizados.
- Política de retenção operacional foi formalizada sem exclusão automática prematura.

## Pendências

- Aplicar a migration `007_retention_policy.sql` no Supabase remoto quando for conveniente.
- Decidir futura rotina manual/assistida de limpeza com auditoria própria.
- Opcionalmente ampliar E2E para mais rotas protegidas com foco em diagnóstico.

## Próximo tijolo recomendado

Consolidar governança operacional: painel de incidentes, revisão de RLS com usuário real de teste e preparação explícita para webhooks sem ainda implementá-los.