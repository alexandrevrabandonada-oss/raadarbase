# Pacote de Decisao de Producao — Webhooks Meta/Instagram

> Gerado em: 2026-05-01T13:23:25.749Z
> AVISO: Este documento NAO autoriza ativacao automatica de producao.
> A ativacao exige decisao humana conjunta, registrada e assinada pelos responsaveis formais.

---

## Resumo Executivo

- staging_go_status: **GO_STAGING**
- staging_observation_status: **STAGING_STABLE**
- production_preflight_recommendation: **READY_FOR_HUMAN_REVIEW**
- production_go_no_go_recommendation: **READY_FOR_HUMAN_DECISION**
- guardrails_ok: **true**
- docs_ready: **true**
- human_decision_status: **BLOCKED_DRAFT**
- production_activation_allowed_by_decision: **false**

---

## Status Staging

- Go/No-Go: GO_STAGING
- Observacao: STAGING_STABLE
- Incidentes abertos (webhook): 0
- Incidentes criticos (webhook): 0
- Eventos em quarentena envelhecidos: 0
- Falhas de processamento: 0

---

## Status Preflight

- production:webhook:preflight: READY_FOR_HUMAN_REVIEW
- noDmAutomatic: true
- noAutoContact: true
- noPoliticalScore: true
- docs_present: true

---

## Status da Decisao Humana

- decision_file_path: docs/decisions/production-webhook-decision-DRAFT.md
- decision_validation_status: BLOCKED_DRAFT
- decision: UNKNOWN
- decision_file_found: true
- decision_is_draft: true
- participants_present: false
- roles_present: true
- training_completed: false
- rollback_present: false
- signatures_present: false
- production_authorized: false

---

## Riscos

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

---

## Checklist de Treinamento Operacional

# Checklist de Treinamento Operacional de Webhooks

## Objetivo

Garantir que o operador esta apto a atuar no fluxo manual de webhooks sem violar guardrails.

## Identificacao

- Operador: ___________________________
- Data: ___________________________
- Instrutor/Responsavel: ___________________________

## Itens treinados

1. [ ] Operador entende o conceito de quarentena obrigatoria.
2. [ ] Operador sabe diferenciar claramente quando processar e quando ignorar.
3. [ ] Operador sabe que DM automatica e proibida.
4. [ ] Operador sabe que contato automatico e proibido.
5. [ ] Operador sabe que score politico individual e proibido.
6. [ ] Operador sabe registrar nota de incidente com linguagem objetiva.
7. [ ] Operador sabe quando escalar para incidente critico.
8. [ ] Operador sabe onde consultar audit logs relacionados ao evento.

## Confirmacoes

- [ ] Entende quarentena: o operador sabe que todo evento entra em quarentena antes de qualquer acao.
- [ ] Entende processamento manual: o operador sabe que nenhum evento e processado automaticamente.
- [ ] Entende proibicao de DM automatica: o operador sabe que DM automatica e absolutamente proibida.
- [ ] Entende proibicao de contato automatico: o operador sabe que contato automatico e proibido.
- [ ] Entende proibicao de score politico: o operador sabe que score politico individual e proibido.
- [ ] Entende como registrar incidente: o operador sabe abrir incidente com nota objetiva no painel.
- [ ] Entende rollback/escalonamento: o operador sabe quando e como escalar e acionar rollback.

## Evidencia minima de conclusao

1. Simulacao de triagem de evento em quarentena.
2. Simulacao de ignorar evento proibido com justificativa.
3. Simulacao de abertura/atualizacao de incidente com nota operacional.
4. Confirmacao de leitura do runbook e da matriz de risco.

## Assinatura / Aceite

- Operador: ___________________________ Data: ___________
- Instrutor/Responsavel: ___________________________ Data: ___________

## Regra de governanca

Somente operadores com checklist concluido e assinado devem atuar no fluxo manual.

---

## Pendencias

1. Reuniao formal de go/no-go com os tres responsaveis (tecnico, operacao, compliance).
2. Preenchimento e assinatura da ata: docs/production-go-no-go-meeting-template.md
3. Registro da decisao em: docs/decisions/
4. Conclusao do checklist de treinamento com evidencias reais dos operadores.

---

## Documentos de Apoio

- Template de ata: docs/production-go-no-go-meeting-template.md (presente: true)
- Exemplo de decisao: docs/decisions/production-webhook-decision-example.md (presente: true)
- Runbook: docs/production-webhook-runbook.md
- Matriz de risco: docs/production-webhook-risk-matrix.md

---

## Decisao Humana Necessaria

- human_decision_required: **true**
- automatic_activation_allowed: **false**

A producao so pode ser ativada apos:
1. Reuniao com os tres responsaveis.
2. Ata preenchida, assinada e arquivada.
3. Decisao registrada como GO_PRODUCTION.
4. Configuracao manual de producao aplicada pelo responsavel tecnico.

---

> AVISO: Este documento NAO autoriza ativacao automatica de producao.
