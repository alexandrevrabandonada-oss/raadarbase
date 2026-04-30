# Staging Checklist - Webhooks Meta/Instagram

Checklist para validar webhooks em ambiente de staging antes de ativar em produção.

## Pré-requisitos

- [ ] Migrations aplicadas (`015_meta_webhooks.sql`)
- [ ] Migrations aplicadas (`015a_add_mention_type.sql`)
- [ ] `database.types.ts` atualizado com tipos novos
- [ ] Variáveis de ambiente configuradas
- [ ] CI verde
- [ ] Testes unitários passando
- [ ] Testes E2E passando

## Variáveis de Ambiente

Configure no `.env.local`:

```bash
# Obrigatórias
META_WEBHOOK_VERIFY_TOKEN=token-seguro-minimo-32-chars
META_APP_SECRET=secret-do-app-meta

# Opcional (default: false)
META_WEBHOOK_ENABLED=false

# Opcional (default: instagram)
META_WEBHOOK_ALLOWED_OBJECTS=instagram

# Opcional (default: 262144 = 256KB)
META_WEBHOOK_MAX_PAYLOAD_BYTES=262144
```

## Checklist de Testes

### 1. Verificação (GET)

- [ ] Testar GET com token válido:
  ```bash
  curl "https://staging-url/api/meta/webhook?hub.mode=subscribe&hub.verify_token=SEU_TOKEN&hub.challenge=1234567890"
  ```
  **Esperado**: Retorna `1234567890` com status 200

- [ ] Testar GET com token inválido:
  ```bash
  curl "https://staging-url/api/meta/webhook?hub.mode=subscribe&hub.verify_token=TOKEN_ERRADO&hub.challenge=1234567890"
  ```
  **Esperado**: Status 403

### 2. Recebimento (POST) - Assinatura Válida

- [ ] Preparar payload de teste:
  ```json
  {
    "object": "instagram",
    "entry": [{
      "id": "test-entry-id",
      "changes": [{ "field": "comments" }]
    }]
  }
  ```

- [ ] Gerar assinatura HMAC:
  ```bash
  echo -n '{"object":"instagram",...}' | openssl dgst -sha256 -hmac "SEU_APP_SECRET"
  ```

- [ ] Enviar POST:
  ```bash
  curl -X POST https://staging-url/api/meta/webhook \
    -H "Content-Type: application/json" \
    -H "X-Hub-Signature-256: sha256=ASSINATURA" \
    -d '{"object":"instagram",...}'
  ```
  **Esperado**: Status 200, resposta com `event_id` e `status: "quarantined"`

### 3. Recebimento (POST) - Assinatura Inválida

- [ ] Enviar POST sem assinatura:
  ```bash
  curl -X POST https://staging-url/api/meta/webhook \
    -H "Content-Type: application/json" \
    -d '{"test":"data"}'
  ```
  **Esperado**: Status 401 ou 403

- [ ] Enviar POST com assinatura errada:
  ```bash
  curl -X POST https://staging-url/api/meta/webhook \
    -H "Content-Type: application/json" \
    -H "X-Hub-Signature-256: sha256=assinatura_invalida" \
    -d '{"test":"data"}'
  ```
  **Esperado**: Status 403, incidente criado

### 4. Eventos Proibidos

- [ ] Testar DM (deve ser ignorada):
  ```json
  {
    "object": "instagram",
    "entry": [{ "messaging": [{ "message": { "text": "test" } }] }]
  }
  ```
  **Esperado**: Status 200, `status: "ignored"`

- [ ] Testar followers (deve ser ignorado):
  ```json
  {
    "object": "instagram",
    "entry": [{ "changes": [{ "field": "followers" }] }]
  }
  ```
  **Esperado**: Status 200, `status: "ignored"`

### 5. Interface de Quarentena

- [ ] Acessar `/integracoes/meta/webhooks`
  - [ ] Página carrega sem erro
  - [ ] Lista de eventos aparece
  - [ ] Filtros funcionam

- [ ] Visualizar detalhe de evento:
  - [ ] Payload redigido exibido
  - [ ] Nenhum email/telefone/CPF visível
  - [ ] Botões Processar/Ignorar/Revisar funcionam

- [ ] Testar ações:
  - [ ] Clicar em "Processar" → Evento processado
  - [ ] Clicar em "Ignorar" → Evento ignorado
  - [ ] Clicar em "Revisar" → Status alterado

### 6. Audit Trail

- [ ] Verificar `audit_logs`:
  ```sql
  SELECT * FROM audit_logs 
  WHERE action LIKE 'meta.webhook%' 
  ORDER BY created_at DESC;
  ```
  - [ ] Logs de recebimento presentes
  - [ ] Logs de processamento presentes
  - [ ] Nenhum secret/token exposto

### 7. Incidentes

- [ ] Verificar incidentes de assinatura inválida:
  ```sql
  SELECT * FROM operational_incidents 
  WHERE kind = 'meta.webhook_invalid_signature';
  ```
  - [ ] Incidente criado
  - [ ] Severidade: critical
  - [ ] Dados redigidos

### 8. Healthcheck

- [ ] Verificar `/api/health`:
  ```bash
  curl https://staging-url/api/health
  ```
  - [ ] `meta_webhook_configured` presente
  - [ ] `meta_webhook_enabled` presente
  - [ ] `meta_webhook_quarantine_count` presente
  - [ ] **NENHUM** secret/token no JSON

### 9. Segurança

- [ ] Payload redigido não contém:
  - [ ] `access_token`
  - [ ] `app_secret`
  - [ ] `verify_token`
  - [ ] Emails completos
  - [ ] Telefones completos
  - [ ] CPFs

- [ ] Healthcheck não expõe:
  - [ ] `META_APP_SECRET`
  - [ ] `META_WEBHOOK_VERIFY_TOKEN`
  - [ ] Assinaturas sha256

- [ ] Logs não contêm:
  - [ ] Tokens de acesso
  - [ ] Secrets
  - [ ] Dados PII

### 10. Governança

- [ ] Página `/governanca` mostra:
  - [ ] Seção de webhooks
  - [ ] Regras de proibição
  - [ ] Checklist de conformidade

- [ ] Confirmar que:
  - [ ] DMs são proibidas e ignoradas
  - [ ] Seguidores não são coletados
  - [ ] Score político não é calculado
  - [ ] Quarentena é obrigatória

## Ativação em Produção

Quando todos os itens acima estiverem ✅:

1. **Configurar no painel Meta**:
   - URL: `https://prod-url/api/meta/webhook`
   - Token: Mesmo valor de `META_WEBHOOK_VERIFY_TOKEN`
   - Campos: `comments`, `mentions` apenas

2. **Ativar webhooks**:
   ```bash
   META_WEBHOOK_ENABLED=true
   ```

3. **Monitorar**:
   - Dashboard de webhooks
   - Incidentes operacionais
   - Audit logs

## Rollback

Se necessário, desativar imediatamente:

1. Definir `META_WEBHOOK_ENABLED=false`
2. Remover endpoint no painel Meta
3. Limpar fila de eventos se necessário

## Validação Contínua

Após ativação, monitorar:

- Eventos em quarentena > 24h
- Taxa de assinaturas inválidas
- Incidentes operacionais
- Performance do endpoint

## Sign-off

- [ ] Operador treinado (guia lido)
- [ ] Admin validou segurança
- [ ] CI verde
- [ ] Staging validado
- [ ] Pronto para produção

**Data de validação**: ___/___/______

**Validado por**: _________________

**Assinatura**: _________________
