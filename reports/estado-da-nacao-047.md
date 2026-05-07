# Estado da Nação 047

## Histórico de evidências Meta

- A página `/operacao/meta-reconciliacao` agora mostra um histórico agregado das últimas evidências com link para detalhe, hash curto e deltas em relação à evidência anterior.
- Foi criada a rota `/operacao/meta-reconciliacao/evidencias/[id]` com visão por evidência, comparação com a anterior, links de exportação e audit logs relacionados.
- O painel `/operacao` ganhou um card de resumo "Evidências Meta" com total, último timestamp e delta da última comparação.
- O healthcheck passou a expor hash da última evidência e deltas agregados de contagens, sem revelar dados pessoais ou payload bruto.

## Dados e guardrails

- A camada `src/lib/data/meta-reconciliation-evidence.ts` já fornece histórico, comparação entre snapshots, delta por evidência e busca de audit logs relacionados.
- O fluxo continua agregado-only: sem comentários, usernames, tokens, payload bruto ou qualquer dado pessoal na UI pública/operacional.
- A exportação segura por evidência segue disponível em Markdown e HTML.

## Validação

- `npm test -- src/lib/data/meta-reconciliation-evidence.test.ts`
- `npx playwright test e2e/meta-reconciliation-evidence.spec.ts e2e/health.spec.ts --project=chromium`
- `get_errors` nos arquivos tocados retornou sem erros.

## Situação atual

- Produção segue bloqueada.
- Staging webhooks permanecem em GO_STAGING.
- O brick histórico de evidências ficou concluído sem ampliar a superfície de dados expostos.
