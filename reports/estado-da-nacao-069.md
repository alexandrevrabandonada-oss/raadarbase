# Estado da Nação - Tijolo 069
**Data**: 06 de Maio de 2026
**Módulo**: Ciclo Piloto de Distribuição 24h — Recibo da Escuta

## O que foi feito

### 1. Migrations Aplicadas no Banco Remoto
As migrations 024 e 025, que estavam presentes no repositório mas não haviam sido aplicadas no banco remoto, foram executadas via Management API:
- `024_public_receipt_distribution_logs` — tabela de logs de distribuição manual.
- `025_public_receipt_distribution_cycles` — tabela de ciclos de distribuição com FK em logs.

Verificado que todas as colunas (incluindo `cycle_id`) estão presentes.

### 2. Ciclo Piloto 24h Criado
**ID**: `b3d045f9-fae4-4133-afcc-b636b2cb8e31`
**Título**: Ciclo piloto 24h — Recibo da Escuta
**Status**: `active`
**Início**: 06/05/2026 às 11:54 (BRT)
**Fim previsto**: 07/05/2026 às 11:54 (BRT)

### 3. Canais Planejados e Compartilhados
| Canal | Formato | Status |
|-------|---------|--------|
| instagram_story | link | planned |
| whatsapp | texto | **shared** (lista de transmissão bairro Centro) |
| instagram_feed | 1x1 | planned |

WhatsApp marcado como compartilhado manualmente às 11:54 (BRT).

### 4. Snapshots — Baseline
Janela territorial ativa: `116d07a6-c9c3-4443-ae21-52f4d6194cbd`

Snapshots existentes (baseline antes do ciclo):
| Data | Relatos | Bairros | Pautas | Status |
|------|---------|---------|--------|--------|
| 2026-05-09 | 0 | 0 | 0 | attention |
| 2026-05-08 | 0 | 0 | 0 | attention |
| 2026-05-07 | 0 | 0 | 0 | attention |

**Status de impacto atual**: `sem_retorno_ainda` — ciclo ativo aguardando retorno.

### 5. Calibração da Lógica de Impacto
Atualizado `src/lib/data/public-receipt-distribution-impact.ts` com critérios definitivos:

| Status | Critério |
|--------|---------|
| `gerou_retorno` | `delta.reportCount > 0` durante o ciclo |
| `sem_retorno_ainda` | ciclo `active` com delta = 0 |
| `precisa_reforco` | ciclo `closed` com delta = 0 |
| `sem_dados_suficientes` | sem `starts_at` ou estado indefinido |

Integração com Radar de Silêncios: dashboard sugere ação corretiva "Reforçar chamada da escuta" quando ciclo fecha com `precisa_reforco`.

### 6. Reconciliação de Artefatos Webhook

**Divergência identificada e resolvida**:
- `go-no-go` marcava `unsignedRejectionSeen: true` porque usava o artefato do `dry-run` que continha evidência de rejeição de evento não-assinado.
- `evidence` marcava `unsignedRejectionSeen: false` porque buscava apenas eventos na tabela `meta_webhook_events` com `signature_valid = false`, sem encontrar nenhum.

**Causa raiz**: os eventos com assinatura inválida são registrados como incidentes (`meta.webhook_invalid_signature`) mas não necessariamente salvos como linhas individuais na tabela de eventos.

**Resolução**: `scripts/staging-webhook-evidence.mjs` atualizado para considerar `invalidSignatureIncidentSeen` como prova de rejeição, alinhando os dois artefatos. Agora ambos reportam `unsignedRejectionSeen: true`.

**Resolução**: ✅ SIM — sem regressão real.

### 7. Exportação Segura
Endpoint disponível em:
```
GET /api/recibo/escuta/distribuicao/export?cycleId=b3d045f9-fae4-4133-afcc-b636b2cb8e31
```
Retorna relatório em Markdown com deltas agregados. Não expõe nome, username, telefone, email, comentário ou relato bruto.

### 8. Staging Devolution-DB-Check
Agora verifica 6 tabelas (incluindo as novas):
- public_receipt_distribution_logs: ✅ ok
- public_receipt_distribution_cycles: ✅ ok

### 9. Verificação Completa

| Check | Resultado |
|-------|-----------|
| lint | ✅ 0 errors |
| build | ✅ OK |
| test (165 testes) | ✅ 165 passed |
| check:rls | ✅ OK |
| check:health | ✅ sem segredos |
| e2e:ci (68 testes) | ✅ 68 passed |
| readiness | ✅ GO |
| staging:devolution-db-check | ✅ OK |
| staging:webhook:evidence | ✅ OK |
| staging:webhook:go-no-go | ✅ GO_STAGING |

## Guardrails Preservados
- ✅ Sem postagem automática
- ✅ Sem DM automática
- ✅ Sem contato automático
- ✅ Sem score político individual
- ✅ Sem microtargeting
- ✅ Sem PII — análise de impacto apenas agregada
- ✅ Sem relato bruto ou comentário exposto

## Produção
🔒 Permanece bloqueada — `GO_STAGING` ativo.

## Próximo Passo Recomendado
- **Tijolo 070**: Após encerramento do ciclo piloto (07/05 às 11:54), fechar o ciclo via `closeReceiptDistributionCycleAction`, gerar snapshot final e exportar o relatório completo de impacto. Se `delta = 0`, criar ação corretiva de "Reforço de Chamada da Escuta" no Radar de Silêncios.
