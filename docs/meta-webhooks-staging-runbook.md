# Runbook de Staging - Webhooks Meta/Instagram

Este runbook descreve a operacao controlada para validar webhooks no staging com APP_URL real, mantendo producao bloqueada.

## Variaveis necessarias no staging

Listar e configurar somente no ambiente correto. Nao registrar valores em logs, telas ou relatorios.

- APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- META_APP_SECRET
- META_WEBHOOK_VERIFY_TOKEN
- META_WEBHOOK_ENABLED=false (inicialmente)
- META_WEBHOOK_ALLOWED_OBJECTS=instagram
- META_WEBHOOK_MAX_PAYLOAD_BYTES=262144

Checklist minimo antes de validar externamente:

- migrations aplicadas no Supabase staging
- service role configurada apenas no servidor
- app secret configurado apenas no servidor
- verify token configurado apenas no servidor
- healthcheck acessivel
- CI verde antes do teste

## Fase A - Preparacao

1. Aplicar migrations no Supabase de staging.
2. Regenerar tipos Supabase, quando aplicavel.
3. Configurar envs no ambiente de staging.
4. Manter `META_WEBHOOK_ENABLED=false` inicialmente.
5. Conferir deploy da URL de staging.
6. Rodar healthcheck.

Comandos recomendados:

```bash
npm run ci
npm run readiness
npm run check:health
npm run check:rls
```

## Fase B - Dry-run com APP_URL

1. Rodar `npm run staging:webhook:dry-run` com APP_URL real.
2. Validar GET verification.
3. Validar POST assinado.
4. Validar POST sem assinatura rejeitado.
5. Validar objeto invalido.
6. Validar DM proibida.
7. Validar healthcheck sem segredos.

Comando:

```bash
APP_URL=https://staging.exemplo.com npm run staging:webhook:dry-run
```

Resultado esperado:

- Artefato `reports/staging-webhook-dry-run.json` gerado.
- Sem exposicao de secrets.

## Fase C - Persistencia

1. Conferir tabela `meta_webhook_events`.
2. Conferir `meta_webhook_event_links` quando houver processamento permitido.
3. Conferir `audit_logs`.
4. Conferir `operational_incidents`.
5. Conferir que payload exibido esta redigido.

Comando:

```bash
npm run staging:webhook:evidence
```

Resultado esperado:

- Artefato `reports/staging-webhook-evidence.json` gerado.
- Somente contagens e metadados redigidos.

## Fase D - Interface

1. Acessar `/integracoes/meta/webhooks`.
2. Abrir detalhe de evento.
3. Ignorar um evento.
4. Processar um evento permitido.
5. Verificar links criados.
6. Verificar auditoria.

Resultado esperado:

- Quarentena obrigatoria mantida.
- Nenhum processamento sem assinatura valida.

## Fase E - Decisao

1. Preencher matriz go/no-go.
2. Se tudo OK, permitir `META_WEBHOOK_ENABLED=true` em staging.
3. Producao continua bloqueada.

Comandos:

```bash
npm run staging:webhook:go-no-go
npm run staging:webhook:report
```

Resultados esperados:

- `GO_STAGING`, `NO_GO_STAGING` ou `PENDING_EXTERNAL_VALIDATION`.
- Relatorio final em `reports/staging-webhook-validation.md`.

## Matriz de decisao (resumo)

- GO em staging somente quando:
  - APP_URL configurado.
  - Healthcheck sem segredos.
  - Dry-run externo executado.
  - Evento assinado entrou em quarentena.
  - Evento sem assinatura foi rejeitado.
  - Operador ignorou pelo menos 1 evento.
  - Operador processou pelo menos 1 evento permitido.
  - Audit logs existentes.
  - Incidentes para caso invalido existentes.
  - Nenhuma DM automatica.
  - Nenhum contato automatico criado.
  - Nenhum score politico individual.

## Avisos de seguranca

- Nao expor tokens, secrets, emails, telefones ou CPFs em telas, logs, healthcheck, relatorios ou exportacoes.
- Nao habilitar producao neste tijolo.
