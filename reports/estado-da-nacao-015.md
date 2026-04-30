# Estado da Nação #015 — Webhooks Meta/Instagram

**Data**: 29 de Abril de 2026  
**Migration**: `015_meta_webhooks.sql`, `015a_add_mention_type.sql`  
**Tema**: Recepção passiva e segura de webhooks Meta/Instagram

## Resumo Executivo

Implementada recepção passiva e segura de webhooks Meta/Instagram com quarentena obrigatória, idempotência, auditoria completa e revisão humana antes de qualquer efeito operacional. O sistema **nunca** responde automaticamente, **nunca** cria contatos sem consentimento, e **nunca** realiza perfilamento político individual.

## O que foi Implementado

### 1. Infraestrutura de Segurança

**Arquivos criados:**
- `src/lib/meta/webhook-security.ts` — Validação de assinatura HMAC-SHA256, redação de payload
- `src/lib/meta/webhook-processing.ts` — Quarentena, classificação e processamento manual
- `src/lib/meta/webhook-security.test.ts` — Testes unitários de segurança
- `src/lib/meta/webhook-processing.test.ts` — Testes unitários de processamento

**Migrations criadas:**
- `supabase/migrations/015_meta_webhooks.sql` — Tabelas `meta_webhook_events` e `meta_webhook_event_links`
- `supabase/migrations/015a_add_mention_type.sql` — Adiciona tipo `mencao` ao enum

### 2. API de Webhooks

**Arquivo criado:**
- `src/app/api/meta/webhook/route.ts` — Route handler GET/POST

**Funcionalidades:**
- GET: Verificação de webhook (hub.challenge)
- POST: Recepção de eventos com validação de assinatura
- Retorno rápido 200 para Meta
- Registro em quarentena para revisão humana

### 3. Interface de Revisão

**Arquivos criados:**
- `src/app/integracoes/meta/webhooks/page.tsx` — Listagem de eventos
- `src/app/integracoes/meta/webhooks/[id]/page.tsx` — Detalhe do evento
- `src/app/integracoes/meta/webhooks/webhooks-list-client.tsx` — Componente de listagem
- `src/app/integracoes/meta/webhooks/[id]/webhook-detail-client.tsx` — Componente de detalhe
- `src/app/integracoes/meta/webhooks/actions.ts` — Server Actions

**Funcionalidades:**
- Visualização de eventos em quarentena
- Visualização de payload redigido
- Botões: Processar / Ignorar / Revisar
- Links para entidades criadas

### 4. Integrações

**Dashboard atualizado:**
- `src/app/dashboard/page.tsx` — Card de webhooks com métricas
- `src/app/dashboard/actions.ts` — Server Action para estatísticas

**Healthcheck atualizado:**
- `src/app/api/health/route.ts` — Métricas de webhook

**Governança atualizada:**
- `src/app/governanca/page.tsx` — Seção "Webhooks e Recepção Passiva"

### 5. Testes E2E

**Arquivo criado:**
- `e2e/meta-webhooks.spec.ts` — Testes end-to-end

## Como Testar

### Testar GET de Verificação

```bash
curl "http://localhost:3000/api/meta/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=1234567890"
```

**Esperado**: Retorna `1234567890` com status 200

### Testar POST com Assinatura

```bash
# Gerar assinatura
PAYLOAD='{"object":"instagram","entry":[{"id":"test"}]}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "SEU_APP_SECRET" | cut -d' ' -f2)

# Enviar
curl -X POST http://localhost:3000/api/meta/webhook \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

**Esperado**: Retorna JSON com `event_id` e `status: quarantined`

### Testar POST sem Assinatura

```bash
curl -X POST http://localhost:3000/api/meta/webhook \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

**Esperado**: Retorna 401 ou 403

### Revisar Eventos em Quarentena

1. Acesse: `/integracoes/meta/webhooks`
2. Verifique eventos em quarentena
3. Clique em "Detalhes"
4. Revise payload redigido
5. Clique em "Processar" ou "Ignorar"

## Como Validar Regras de Governança

### Validar: Não há DM Automática

- Verifique `src/lib/meta/webhook-security.ts`: `PROHIBITED_EVENT_TYPES` inclui `direct_messages`
- Verifique `src/lib/meta/webhook-processing.ts`: Eventos de messaging são ignorados
- Verifique testes: `webhook-processing.test.ts` — "deve ignorar eventos de DMs completamente"

### Validar: Não há Perfilamento Individual

- Verifique que nenhum evento cria `contact` automaticamente
- Verifique que nenhum evento atribui `score_politico`
- Verifique que `ig_people` é criado apenas com `username` público

### Validar: Não há Processamento sem Assinatura

- Verifique `src/app/api/meta/webhook/route.ts`: Retorna 401 se `!signatureValid`
- Verifique `webhook-security.test.ts`: Testes de assinatura inválida

### Validar: Quarentena Obrigatória

- Verifique `webhook-processing.ts`: Todos os eventos permitidos têm `action: "quarantine"`
- Verifique interface: Página de webhooks mostra status "Em Quarentena"
- Verifique que não há processamento automático

## Riscos Corrigidos

| Risco | Mitigação |
|-------|-----------|
| DM automática | Eventos de messaging são proibidos e ignorados |
| Perfilamento individual | Nenhum evento cria score político ou classifica pessoas |
| Coleta de seguidores | Eventos de followers são proibidos |
| Dados sem consentimento | Apenas usernames públicos são coletados |
| Processamento sem revisão | Quarentena obrigatória antes de processar |
| Vazamento de segredos | Tokens e secrets são redigidos do payload exibido |
| Assinatura inválida | Rejeição automática com incidente critical |

## Pendências

1. **Regenerar tipos Supabase**: Execute `npx supabase gen types` para atualizar `database.types.ts` com as novas tabelas
2. **Testar em ambiente de staging**: Validar fluxo completo antes de produção
3. **Configurar webhook no painel Meta**: Adicionar endpoint quando estiver em produção
4. **Documentar para operadores**: Criar guia de uso da interface de webhooks

## Próximo Tijolo Recomendado

**Sugestão**: Implementar filtros avançados na página de webhooks (por tipo de evento, data, status) e notificações para operadores quando houver eventos em quarentena por mais de 24h.

## Arquivos Criados/Modificados

### Criados
- `supabase/migrations/015_meta_webhooks.sql`
- `supabase/migrations/015a_add_mention_type.sql`
- `src/lib/meta/webhook-security.ts`
- `src/lib/meta/webhook-security.test.ts`
- `src/lib/meta/webhook-processing.ts`
- `src/lib/meta/webhook-processing.test.ts`
- `src/app/api/meta/webhook/route.ts`
- `src/app/integracoes/meta/webhooks/page.tsx`
- `src/app/integracoes/meta/webhooks/[id]/page.tsx`
- `src/app/integracoes/meta/webhooks/webhooks-list-client.tsx`
- `src/app/integracoes/meta/webhooks/[id]/webhook-detail-client.tsx`
- `src/app/integracoes/meta/webhooks/actions.ts`
- `src/app/dashboard/actions.ts`
- `e2e/meta-webhooks.spec.ts`
- `docs/meta-webhooks-readiness.md` (atualizado)

### Modificados
- `src/app/api/health/route.ts` — Adicionado métricas de webhook
- `src/app/dashboard/page.tsx` — Adicionado card de webhooks
- `src/app/governanca/page.tsx` — Adicionado seção de webhooks
- `src/lib/utils.ts` — Adicionado `formatDate()`

## Variáveis de Ambiente

Adicionar ao `.env.local`:

```bash
META_WEBHOOK_VERIFY_TOKEN=seu-token-seguro
META_APP_SECRET=seu-app-secret
META_WEBHOOK_ENABLED=false  # true apenas em produção
META_WEBHOOK_ALLOWED_OBJECTS=instagram
META_WEBHOOK_MAX_PAYLOAD_BYTES=262144
```

## Checklist de Verificação

- [x] Migration criada e aplicável
- [x] Verificação de assinatura implementada
- [x] Redação de payload implementada
- [x] Quarentena obrigatória
- [x] Processamento manual apenas
- [x] Interface de revisão criada
- [x] Healthcheck atualizado
- [x] Dashboard atualizado
- [x] Governança atualizada
- [x] Testes unitários criados
- [x] Testes E2E criados
- [x] Documentação técnica atualizada
- [ ] Tipos Supabase regenerados
- [ ] CI passando
- [ ] Testes passando

## Métricas de Implementação

| Métrica | Valor |
|---------|-------|
| Arquivos criados | 16 |
| Arquivos modificados | 4 |
| Linhas de código | ~2.500 |
| Testes unitários | 40+ |
| Testes E2E | 10 |
| Migrations | 2 |
| Componentes UI | 4 |

---

**Radar de Base** — Recepção passiva e segura de sinais públicos com governança total.
