# Estado da Nacao 021

Data: 2026-04-30
Escopo: resolver infraestrutura minima de staging e concluir validacao externa real de webhooks.

## Resultado executivo

A infraestrutura de banco em staging ficou parcialmente validada, mas a validacao externa real do endpoint de webhook nao concluiu por bloqueio de conectividade de APP_URL e indisponibilidade das tabelas de webhook na API de staging (schema cache/exposure).

Decisao final: PENDING_EXTERNAL_VALIDATION.

## Diagnostico de conectividade

- APP_URL final testado: configurado (host local/loopback identificado).
- Resultado de conectividade: PENDING.
- Referencia tecnica: [reports/staging-url-diagnosis.md](reports/staging-url-diagnosis.md).
- Causa principal: APP_URL atual nao aponta para endpoint publico real de staging; dry-run externo continua em `fetch failed`.

## Staging DB check

- Status geral: READY.
- Tabelas requeridas detectadas:
  - meta_webhook_events
  - meta_webhook_event_links
  - audit_logs
  - operational_incidents
  - ig_posts
  - ig_people
  - ig_interactions
- RLS basica: OK para bloqueio de leitura anonima.
- Observacao: resposta anonima ainda indica schema cache sem tabelas de webhook na API, consistente com bloqueio observado na coleta de evidencias.

## Dry-run externo

- Status: PENDING_EXTERNAL_VALIDATION.
- Resultado: `executedWithAppUrl=false`.
- Motivo: `fetch failed`.

## Operacao manual obrigatoria (ignorar/processar)

- Nao executada no staging real.
- Motivo: sem eventos reais disponiveis devido bloqueio do dry-run externo e indisponibilidade da rota/API externa.

## Evidencias SQL reais

- eventos recebidos: 0
- eventos em quarentena: 0
- eventos ignorados: 0
- eventos processados: 0
- audit logs relacionados: 0
- incidentes relacionados: 0

## Controles de seguranca

- healthcheck sem segredos: nao (nao foi possivel validar endpoint remoto acessivel)
- noDmAutomatic: sim
- noAutoContact: sim
- noPoliticalScore: sim
- quarentena obrigatoria: preservada
- processamento sem assinatura valida: continua bloqueado

## Decisao final

- PENDING_EXTERNAL_VALIDATION

## Recomendacao

- ativar `META_WEBHOOK_ENABLED=true` em staging? nao.
- ativar producao? nao.

## Pendencias reais

1. Configurar APP_URL para dominio publico real de staging (nao localhost/127.0.0.1).
2. Garantir deploy online e rota `/api/meta/webhook` acessivel externamente.
3. Garantir `/api/health` acessivel externamente sem vazamento de segredos.
4. Corrigir exposure/schema cache das tabelas de webhook na API de staging.
5. Reexecutar cadeia obrigatoria:
   - `npm run staging:check-url`
   - `npm run staging:db-check`
   - `APP_URL=https://URL-REAL-DE-STAGING npm run staging:webhook:dry-run`
   - `npm run staging:webhook:evidence`
   - `npm run staging:webhook:go-no-go`
   - `npm run staging:webhook:report`
6. Executar operacao manual real em staging:
   - ignorar 1 evento
   - processar 1 evento permitido

## Proximo tijolo recomendado

Tijolo 022: fechamento de validacao externa real (conectividade publica + eventos reais + operacao manual + decisao final GO_STAGING ou NO_GO_STAGING).
