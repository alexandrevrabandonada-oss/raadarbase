# Janela de Observacao de Webhooks em Staging

## Objetivo

Validar estabilidade operacional dos webhooks Meta/Instagram em staging apos atingir GO_STAGING tecnico, mantendo quarentena obrigatoria e processamento manual.

## Duracao sugerida

- Minimo: 24h
- Recomendado: 48h
- Maximo nesta fase: 72h

## O que observar

1. Novos eventos recebidos (`meta_webhook_events`).
2. Eventos em quarentena (`status=quarantined`).
3. Eventos ignorados (`status=ignored`).
4. Eventos processados (`status=processed`).
5. Incidentes de assinatura invalida (`meta.webhook_invalid_signature`).
6. Falhas de processamento (`status=failed`).
7. Volume e qualidade de audit logs relacionados a webhook.
8. Ausencia de vazamento de segredo em healthcheck, logs e relatorios.
9. Ausencia de criacao automatica indevida:
   - DM automatica
   - contato automatico
   - score politico individual

## Criterios de sucesso

1. Sinais de go/no-go permanecem consistentes com GO_STAGING.
2. `operatorProcessedSeen=true` e `operatorIgnoredSeen=true` preservados.
3. `totalFailed=0` durante a janela observada.
4. `staleQuarantineEvents=0` (sem eventos envelhecidos em quarentena).
5. Guardrails mantidos:
   - `noDmAutomatic=true`
   - `noAutoContact=true`
   - `noPoliticalScore=true`

## Criterios de bloqueio

1. Qualquer vazamento de segredo em resposta publica ou artefato.
2. Qualquer automatismo proibido (DM, contato automatico, score politico).
3. `totalFailed>0` de forma recorrente sem mitigacao.
4. Eventos envelhecidos em quarentena sem acao operacional.
5. Incidentes criticos sem revisao operacional.

## Resultado esperado desta fase

- Manter staging ativo e monitorado.
- Nao liberar producao nesta etapa.
- Registrar decisao humana formal em tijolo posterior.
