# Estado da Nação 006 - Observabilidade ativa

Data: 2026-04-27

## O que foi implementado

- Helper `src/lib/operation/stuck-runs.ts` para detectar sincronizações presas.
- Alerta em `/operacao` com runs presas, última run presa e erro recorrente em 24h.
- Ações auditadas `markSyncRunAsFailedAction` e `retryMetaSyncRunAction`.
- Página `/operacao/sync/[id]` com alerta de run presa, botões operacionais, retries e link para run original.
- Healthcheck ampliado com `stuck_sync_runs_count`, último status e data Meta.
- Card “Saúde operacional” em `/configuracoes`.
- `check:rls` com suporte opcional a `SUPABASE_TEST_EMAIL` e `SUPABASE_TEST_PASSWORD`.
- Playwright configurado com E2E condicional.
- Testes unitários para runs presas e ações operacionais.

## Arquivos criados/editados

- `README.md`
- `package.json`
- `package-lock.json`
- `playwright.config.ts`
- `vitest.config.mts`
- `middleware.ts`
- `scripts/check-rls.mjs`
- `scripts/check-health.mjs`
- `scripts/run-e2e-if-configured.mjs`
- `e2e/login.spec.ts`
- `e2e/operacao.spec.ts`
- `e2e/integracoes-meta.spec.ts`
- `src/app/api/health/route.ts`
- `src/app/configuracoes/page.tsx`
- `src/app/configuracoes/settings-client.tsx`
- `src/app/operacao/actions.ts`
- `src/app/operacao/actions.test.ts`
- `src/app/operacao/page.tsx`
- `src/app/operacao/sync/[id]/page.tsx`
- `src/app/operacao/sync/[id]/sync-actions-client.tsx`
- `src/lib/config.ts`
- `src/lib/data/operation.ts`
- `src/lib/meta/sync.ts`
- `src/lib/operation/stuck-runs.ts`
- `src/lib/operation/stuck-runs.test.ts`
- `src/lib/supabase/auth.ts`
- `src/lib/types.ts`
- `reports/estado-da-nacao-006.md`

## Como testar

```bash
npm run lint
npm run build
npm run test
npm run check:rls
npm run verify
```

## Como rodar E2E

```bash
npm run e2e
E2E_RUN=true npm run e2e
```

O runner ativa `NODE_ENV=test`, `E2E_BYPASS_AUTH=true`, `E2E_TEST_MODE=true` e `NEXT_PUBLIC_USE_MOCKS=true` para testar rotas autenticadas sem depender de Supabase Auth real. No servidor local do Next, o bypass só entra em não-produção e modo mock.

## Como validar RLS com usuário real

```bash
SUPABASE_TEST_EMAIL=teste@example.com SUPABASE_TEST_PASSWORD=senha npm run check:rls
```

Sem essas variáveis, o script roda apenas a validação anon e informa que a parte autenticada foi pulada.

## Como usar reprocessamento seguro

1. Abrir `/operacao`.
2. Abrir `/operacao/sync/[id]`.
3. Para run presa, usar `Marcar como falha`.
4. Para repetir manualmente, usar `Reprocessar com segurança`.
5. Conferir nova run com `metadata.retry_of`.
6. Conferir `audit_logs` com `meta.sync_marked_failed` ou `meta.sync_retried`.

## Riscos corrigidos

- Runs presas agora aparecem no painel.
- Operador pode encerrar run presa sem apagar histórico.
- Retry cria nova execução e preserva referência à original.
- Ações operacionais sensíveis geram audit log.
- Healthcheck não expõe segredos nem dados pessoais.
- RLS tem validação anon e opção com usuário real.

## Pendências

- Executar E2E com navegador instalado no ambiente local/CI.
- Validar `check:rls` com usuário real de teste no Supabase do projeto.
- Criar alerta específico por falha repetida do mesmo `kind`.
- Definir política de retenção para `meta_sync_runs` e `audit_logs`.

## Próximo tijolo recomendado

Consolidar CI com lint, build, unit, RLS e E2E antes de abrir discussão sobre webhooks.
