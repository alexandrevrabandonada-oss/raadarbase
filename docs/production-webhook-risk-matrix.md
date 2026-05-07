# Matriz de Risco - Webhook em Producao (Pre-Homologacao)

## Escopo

Documento para suportar decisao humana formal futura. Nao autoriza ativacao automatica de producao.

| Risco | Severidade | Probabilidade | Mitigacao | Sinal de alerta | Acao de rollback |
| --- | --- | --- | --- | --- | --- |
| Vazamento de secret | Critica | Baixa | Redacao de dados sensiveis, check:health/readiness, revisao de logs | Marcadores sensiveis em endpoint, log ou relatorio | Suspender operacao, remover exposicao, rotacionar segredo e revalidar |
| Webhook recebendo payload inesperado | Alta | Media | Validacao de assinatura, allowlist de objetos/tipos, quarentena obrigatoria | Aumento de eventos fora de padrao | Bloquear processamento, manter quarentena e revisar regras |
| Excesso de eventos em quarentena | Alta | Media | Monitoramento continuo, triagem manual com SLA | Crescimento rapido de `quarantined` e fila envelhecida | Pausar processamento manual e investigar origem do pico |
| Assinatura invalida recorrente | Alta | Media | Rejeicao tecnica de unsigned/invalido, incidentes e auditoria | Incidentes repetidos de assinatura invalida | Congelar operacao, revisar segredo/config e retestar assinatura |
| Processamento manual indevido | Alta | Baixa | Treinamento de operador, dupla checagem e nota operacional | Acao sem justificativa ou fora de playbook | Reverter fluxo, abrir incidente e reforcar treinamento |
| Erro de RLS | Alta | Baixa | Revisao de policies, migracoes auditadas, check:rls | Erros de permissao, recursao ou acesso indevido | Reaplicar policy segura, bloquear fluxo afetado e validar novamente |
| Criacao automatica indevida | Critica | Baixa | Guardrails explicitos, testes e revisao de codigo | Evidencia de acao automatica nao autorizada | Desativar fluxo, abrir incidente critico e corrigir implementacao |
| Interpretacao politica indevida | Critica | Baixa | Proibicao formal de score politico e inferencia sensivel | Campo, log ou acao com inferencia politica/sensivel | Bloquear operacao, remover artefato e abrir incidente de compliance |
| Uso por operador sem treinamento | Media | Media | Checklist de treinamento obrigatorio e reciclagem | Operador sem evidencias de capacitacao | Suspender acesso operacional ate capacitacao concluida |
| Confusao entre staging e producao | Alta | Media | Ambiente e runbook claramente separados, validacao de APP_URL | Acao em ambiente incorreto ou URL divergente | Interromper operacao, corrigir ambiente e reiniciar checklist |

## Politica final desta fase

1. Producao permanece bloqueada.
2. Somente decisao humana formal posterior pode discutir ativacao.