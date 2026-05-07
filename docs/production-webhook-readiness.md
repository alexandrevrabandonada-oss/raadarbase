# Criterios Formais para Futura Decisao de Producao (Webhooks)

## Escopo

Este documento define criterios minimos para uma decisao futura de producao.

Importante:

- Este tijolo nao ativa producao.
- Producao exige decisao formal posterior, com aprovacao humana registrada.

## Criterios minimos

1. GO_STAGING mantido durante janela de observacao.
2. Zero vazamento de segredo em endpoints, logs e relatorios.
3. Zero DM automatica.
4. Zero criacao automatica de contato.
5. Zero score politico individual.
6. Incidentes criticos revisados e tratados operacionalmente.
7. Operadores treinados no fluxo de quarentena e processamento manual.
8. Runbook atualizado para operacao e resposta a incidentes.
9. Rollback definido e validado.
10. Logs e trilha de auditoria conferidos.
11. Decisao humana registrada por responsavel interno.

## Condicoes de bloqueio

1. Qualquer quebra de guardrail etico ou de seguranca.
2. Incidentes criticos sem plano de mitigacao.
3. Falhas de processamento recorrentes sem estabilizacao.
4. Sinais de go/no-go incompletos.

## Politica desta fase

- Manter `META_WEBHOOK_ENABLED=true` apenas em staging validado.
- Manter producao bloqueada ate deliberacao formal.
