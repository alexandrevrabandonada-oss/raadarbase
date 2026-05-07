# Estado da Nação 046

## Evidência operacional Meta

- Migration `017_meta_reconciliation_evidence.sql` criada para registrar evidência operacional agregada.
- Captura assinada implementada em `src/lib/data/meta-reconciliation-evidence.ts`.
- Server action adicionada em `src/app/operacao/meta-reconciliacao/actions.ts` para `admin` e `operador`.
- Página `/operacao/meta-reconciliacao` atualizada com botão de geração e lista das últimas evidências.
- Exportação segura implementada em `src/app/api/meta/reconciliation/evidence/[id]/export/route.ts` com Markdown e HTML imprimível.
- Healthcheck passou a expor somente contagens seguras de evidência, status e timestamp.
- Audit logs incluíram `meta.reconciliation_evidence_generated` e `meta.reconciliation_evidence_exported`.

## Contagens registradas

- Posts: 26
- Interações/comentários: 542
- Pessoas: 451
- `meta_sync_runs`: 27
- `audit_logs` Meta: 56

## Hash gerado

- A evidência grava `report_hash` calculado apenas com contagens agregadas, status operacional e timestamp de geração.
- O hash não usa payload bruto, usernames, comentários ou tokens.

## Testes

- Cobertura adicionada para hash estável, ausência de PII no insert, renderização da página, exportação segura e healthcheck com novos campos.

## Guardrails preservados

- Produção continua bloqueada.
- Sem DM automática.
- Sem abordagem automática.
- Sem contato automático.
- Sem score político individual.
- Sem scraping.
- Sem coleta massiva de seguidores.

## Próximo tijolo recomendado

- Consolidar um pequeno painel histórico de evidências com comparação entre últimas runs finalizadas e evidências assinadas, mantendo apenas agregados.
