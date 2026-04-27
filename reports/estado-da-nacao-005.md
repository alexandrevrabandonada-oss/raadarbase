# Estado da Nação 005 - Confiança operacional

Data: 2026-04-27

## O que foi implementado

- Configuração de testes com Vitest.
- Fixtures locais da Meta API para conta, mídias, comentários e erros.
- Testes do cliente Meta para configuração, erros, respostas válidas e redação de token.
- Testes da sincronização Meta com Supabase em memória.
- Validação de criação de `meta_sync_runs` e `audit_logs`.
- Validação de deduplicação por `ig_interactions.external_id`.
- Script `scripts/check-rls.mjs` para checar bloqueio de escrita anon em tabelas sensíveis.
- Página `/operacao` com lista de sincronizações Meta.
- Página `/operacao/sync/[id]` com detalhe da execução, metadata e audit logs relacionados.
- Endpoint `/api/health` sem segredos.
- Bloco “Diagnóstico” em `/configuracoes`.
- Proteção de `/integracoes` e `/operacao` no middleware e checagem server-side nas páginas de operação.

## Arquivos criados/editados

- `package.json`
- `package-lock.json`
- `vitest.config.mts`
- `scripts/check-rls.mjs`
- `middleware.ts`
- `README.md`
- `src/app/api/health/route.ts`
- `src/app/configuracoes/page.tsx`
- `src/app/configuracoes/settings-client.tsx`
- `src/app/operacao/page.tsx`
- `src/app/operacao/sync/[id]/page.tsx`
- `src/components/app-shell.tsx`
- `src/lib/data/operation.ts`
- `src/lib/meta/client.ts`
- `src/lib/meta/client.test.ts`
- `src/lib/meta/sync.ts`
- `src/lib/meta/sync.test.ts`
- `src/lib/meta/__fixtures__/account-success.json`
- `src/lib/meta/__fixtures__/media-success.json`
- `src/lib/meta/__fixtures__/comments-success.json`
- `src/lib/meta/__fixtures__/meta-error-token.json`
- `src/lib/meta/__fixtures__/meta-error-permission.json`
- `src/lib/meta/__fixtures__/comments-partial-error.json`
- `reports/estado-da-nacao-005.md`

## Como testar

```bash
npm run lint
npm run build
npm run test
npm run check:rls
npm run verify
```

Também é possível abrir:

- `/operacao`
- `/operacao/sync/[id]`
- `/configuracoes`
- `/api/health`

## Resultado esperado dos testes

- Cliente Meta deve retornar sucesso com fixture válida.
- Cliente Meta deve retornar erro amigável quando token ou conta estiverem ausentes.
- Erros 400, 401 e permissão devem retornar mensagem segura.
- `fake-secret-token` não deve aparecer em retorno, `meta_sync_runs`, `audit_logs` nem `console.error`.
- Sync de mídias deve inserir novos posts e atualizar existentes.
- Sync de comentários deve criar pessoas/interações e não duplicar `external_id`.
- Erro parcial de comentário sem username deve ser ignorado sem derrubar toda a sincronização.
- Toda sync testada deve criar `meta_sync_runs` e `audit_logs`.

## Como validar RLS

Rodar:

```bash
npm run check:rls
```

Com Supabase configurado, a anon key deve ser bloqueada para escrita direta em:

- `ig_people`
- `ig_posts`
- `ig_interactions`
- `audit_logs`
- `meta_sync_runs`
- `contacts`

Se as variáveis não estiverem presentes, o script informa que pulou a validação local e não quebra o build.

## Como usar `/operacao`

- Abrir `/operacao` após login interno.
- Ver as últimas sincronizações Meta, status, tipo, início/fim, contagens e ator.
- Clicar em `Abrir` para acessar `/operacao/sync/[id]`.
- Conferir metadata e audit logs relacionados.
- Erros exibidos já devem estar redigidos.

## Riscos corrigidos

- Token da Meta agora é redigido também antes de persistir erro em run/audit.
- Rotas de operação foram protegidas.
- Há teste automatizado contra vazamento de token.
- Há teste de deduplicação por `external_id`.
- Há script para detectar escrita anon indevida em tabelas sensíveis.
- Há tela operacional para identificar runs presos, falhas e volume sincronizado.

## Pendências

- Aplicar e validar RLS no Supabase real com usuário autenticado.
- Adicionar testes E2E para `/operacao` e `/integracoes/meta`.
- Adicionar alerta visual para runs `started` muito antigos.
- Criar limpeza ou correção operacional para runs presos se o processo for interrompido pelo runtime.
- Revisar políticas RLS finais com perfis internos caso haja múltiplos níveis de acesso.

## Próximo tijolo recomendado

Criar observabilidade mais ativa: alertas para sincronizações presas, tela de reprocessamento manual seguro, testes E2E autenticados e validação RLS com usuário real antes de considerar webhooks.
