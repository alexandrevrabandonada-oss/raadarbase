# Meta Webhooks Readiness

Documentação técnica da implementação de Webhooks Meta/Instagram no Radar de Base.

> [!IMPORTANT]
> Webhooks implementados com quarentena obrigatória e revisão humana. Nenhuma ação automática.

## Princípios Inegociáveis

1. **Nenhuma DM Automática**: Webhooks NUNCA disparam respostas automáticas
2. **Quarentena Obrigatória**: Todo evento entra em quarentena antes do processamento
3. **Revisão Humana**: Processamento manual por operador autorizado
4. **Audit Log Total**: Cada payload recebido é registrado em `audit_logs`
5. **Validação de Assinatura**: Todo evento deve ter assinatura HMAC-SHA256 válida
6. **Nenhum Score Individual**: Não criar perfilamento político de pessoas

## Arquitetura

### Componentes

```
┌─────────────────┐
│   Meta/Instagram │
└────────┬────────┘
         │ POST /api/meta/webhook
         │ X-Hub-Signature-256
         ▼
┌─────────────────┐
│  Route Handler  │──┐ Valida assinatura
│  (Next.js API)  │  │ Cria registro
└────────┬────────┘  │ Retorna 200
         │            │
         ▼            │
┌─────────────────┐   │
│ meta_webhook_   │◄──┘
│ events          │
│ (quarentena)    │
└────────┬────────┘
         │
         │ Revisão humana
         ▼
┌─────────────────┐
│ Server Actions  │──┐ Processa/ignora
│ (admin/operador)│  │ Cria links
└────────┬────────┘  │ Audit log
         │            │
         ▼            │
┌─────────────────┐   │
│  ig_posts       │◄──┘
│  ig_people      │
│  ig_interactions│
└─────────────────┘
```

### Tabelas

- **meta_webhook_events**: Armazena todos os eventos recebidos
  - `status`: received, verified, quarantined, ignored, processed, failed
  - `signature_valid`: boolean
  - `raw_payload`: JSON original
  - `redacted_payload`: JSON sem dados sensíveis

- **meta_webhook_event_links**: Relaciona eventos com entidades criadas

### Endpoint

**GET /api/meta/webhook**
- Verificação do webhook (hub.mode, hub.verify_token, hub.challenge)
- Retorna challenge se token válido
- Retorna 403 se token inválido

**POST /api/meta/webhook**
- Recebe eventos webhook
- Valida assinatura HMAC-SHA256
- Redige payload (remove tokens, emails, telefones)
- Cria registro em quarentena
- Retorna 200 rapidamente

## Configuração

### Variáveis de Ambiente

```bash
# .env.local
META_WEBHOOK_VERIFY_TOKEN=seu-token-de-verificacao
META_APP_SECRET=seu-app-secret-do-meta
META_WEBHOOK_ENABLED=false  # Habilitar apenas em produção
META_WEBHOOK_ALLOWED_OBJECTS=instagram
META_WEBHOOK_MAX_PAYLOAD_BYTES=262144  # 256KB
```

### Configuração no Painel Meta

1. Acesse: Developers Facebook → Seu App → Webhooks
2. Adicione endpoint: `https://seu-dominio.com/api/meta/webhook`
3. Token de verificação: mesmo valor de `META_WEBHOOK_VERIFY_TOKEN`
4. Selecione campos: `comments`, `mentions`, `media`
5. **NUNCA** selecione: `messages`, `messaging_postbacks`, `followers`

## Fluxo de Processamento

### 1. Recebimento (Automático)

```
Meta ──POST──► /api/meta/webhook
              Valida assinatura
              Cria meta_webhook_events
              Status: quarantined
              Retorna 200
```

### 2. Quarentena (Manual)

Operador acessa `/integracoes/meta/webhooks`:
- Visualiza eventos em quarentena
- Revisa payload redigido
- Decide: Processar / Ignorar / Revisar

### 3. Processamento (Manual)

Ao processar:
- Cria/atualiza `ig_posts` (se mídia própria)
- Cria/atualiza `ig_people` (apenas username público)
- Cria `ig_interactions` (comentário/menção)
- Cria links em `meta_webhook_event_links`
- Status: processed

## Eventos

### Permitidos (com quarentena)

| Evento | Ação | Descrição |
|--------|------|-----------|
| `comments` | Processar | Comentários em mídia própria |
| `mentions` | Processar | Menções públicas |
| `media` | Processar | Alterações em mídia própria |

### Proibidos (ignorados automaticamente)

| Evento | Motivo |
|--------|--------|
| `direct_messages` | DM automática proibida |
| `messaging` | Mensagens privadas |
| `followers` | Coleta em massa proibida |
| `user_profile_data` | Dados pessoais sem consentimento |
| `live_videos` | Fora do escopo |

## Segurança

### Validação de Assinatura

```typescript
const signature = request.headers.get("X-Hub-Signature-256");
const expected = crypto
  .createHmac("sha256", process.env.META_APP_SECRET)
  .update(rawBody, "utf8")
  .digest("hex");

// Timing-safe comparison
return crypto.timingSafeEqual(
  Buffer.from(signature.replace("sha256=", "")),
  Buffer.from(expected)
);
```

### Redação de Payload

Antes de persistir, remove:
- `access_token`, `app_secret`, `verify_token`
- Emails (mascarados: `u***@e***.com`)
- Telefones (mascarados: `****9999`)
- CPF, CNPJ, SSN

### Incidentes

Eventos geram incidentes:
- `meta.webhook_invalid_signature`: Assinatura inválida (critical)
- `meta.webhook_payload_too_large`: Payload > 256KB (warning)
- `meta.webhook_stale_quarantine`: Evento > 72h em quarentena (warning)
- `meta.webhook_processing_failed`: Falha no processamento (warning)

## Checklist de Produção

Antes de habilitar webhooks em produção:

- [ ] Migration 015_meta_webhooks.sql aplicada
- [ ] Migration 015a_add_mention_type.sql aplicada
- [ ] `META_APP_SECRET` configurado
- [ ] `META_WEBHOOK_VERIFY_TOKEN` configurado
- [ ] Endpoint `/api/meta/webhook` acessível externamente
- [ ] Testado GET de verificação
- [ ] Testado POST com assinatura válida
- [ ] Testado POST com assinatura inválida (deve falhar)
- [ ] Página de webhooks acessível
- [ ] Governança revisada
- [ ] Healthcheck mostrando métricas corretas
- [ ] Nenhum segredo exposto no healthcheck
- [ ] CI passando
- [ ] Testes E2E passando

## Rollback

Para desabilitar webhooks:

1. Definir `META_WEBHOOK_ENABLED=false`
2. Remover endpoint no painel Meta
3. Limpar fila de eventos pendentes (opcional)

## Troubleshooting

### Eventos não aparecem

- Verificar se `META_WEBHOOK_ENABLED=true`
- Verificar logs de `/api/meta/webhook`
- Verificar se assinatura está sendo validada

### Assinatura inválida

- Verificar se `META_APP_SECRET` está correto
- Verificar se raw body está sendo usado (não parsed)
- Verificar encoding (deve ser utf8)

### Processamento falha

- Verificar permissões do usuário (admin/operador)
- Verificar logs de audit
- Verificar incidentes operacionais
