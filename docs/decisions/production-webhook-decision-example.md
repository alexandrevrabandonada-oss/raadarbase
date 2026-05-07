# Exemplo de Registro de Decisao de Producao (EXEMPLO NAO REAL)

> AVISO: Este arquivo e um EXEMPLO PREENCHIVEL. Nao representa uma decisao real. Nenhum GO_PRODUCTION foi aprovado.

---

## 1. Dados da reuniao

- Data/hora: [PREENCHER]
- Local/canal: [PREENCHER]
- Duracao: [PREENCHER]

## 2. Participantes

| Nome | Papel | Confirmacao |
| --- | --- | --- |
| [NOME] | Responsavel tecnico | [sim/nao] |
| [NOME] | Responsavel de operacao | [sim/nao] |
| [NOME] | Responsavel de governanca/compliance | [sim/nao] |

## 3. Estado no momento da reuniao

- staging_go_status: [GO_STAGING / NO_GO_STAGING]
- staging_observation_status: [STAGING_STABLE / STAGING_ATTENTION / STAGING_BLOCKED]
- production_preflight_recommendation: [READY_FOR_HUMAN_REVIEW / BLOCKED / NOT_READY]
- open_webhook_incidents: [NUMERO]
- critical_webhook_incidents: [NUMERO]

## 4. Evidencias revisadas

- [ ] staging:webhook:go-no-go — decision: [GO_STAGING]
- [ ] staging:webhook:observation — status: [STAGING_STABLE]
- [ ] production:webhook:preflight — recommendation: [READY_FOR_HUMAN_REVIEW]
- [ ] Incidentes abertos: [0 ou lista]
- [ ] Audit logs conferidos: [sim/nao]
- [ ] Treinamento operacional concluido: [sim/nao]
- [ ] Matriz de risco revisada: [sim/nao]
- [ ] Runbook revisado: [sim/nao]

## 5. Riscos aceitos

- [DESCREVER]

## 6. Riscos nao aceitos

- [DESCREVER]

## 7. Decisao

> ESTA DECISAO E FICTICIA PARA FINS DE EXEMPLO.

- [ ] GO_PRODUCTION
- [ ] NO_GO_PRODUCTION
- [ ] POSTPONE

## 8. Justificativa

[PREENCHER]

## 9. Rollback aceito

- Responsavel: [NOME]
- Procedimento: conforme docs/production-webhook-runbook.md, secao "Como fazer rollback".

## 10. Assinaturas

| Nome | Papel | Data | Aceite |
| --- | --- | --- | --- |
| [NOME] | Responsavel tecnico | [DATA] | [sim/nao] |
| [NOME] | Responsavel de operacao | [DATA] | [sim/nao] |
| [NOME] | Responsavel de governanca/compliance | [DATA] | [sim/nao] |

---

> Este documento so tem validade apos preenchimento completo e aceite dos tres responsaveis acima em reuniao real.
