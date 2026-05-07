# Estado da Nação 075

## Migration
- Criada `supabase/migrations/029_volunteer_application_retention.sql`.
- A tabela `campaign_volunteer_applications` ganhou campos de retenção, agendamento e anonimização.

## Política de Retenção
- `pending` sem revisão por mais de 90 dias entra como recomendação de revisão ou arquivamento.
- `rejected` e `archived` com mais de 30 dias ficam elegíveis para anonimização.
- `approved` com `converted_volunteer_id` não é anonimizada automaticamente.
- `retained` exige justificativa operacional registrada.

## Página Interna
- Criada `/voluntarios/inscricoes/retencao`.
- Mostra pendentes antigas, rejeitadas elegíveis, arquivadas elegíveis, retidas, anonimizadas e agendadas.

## Ações
- Criadas ações para agendar anonimização, anonimizar agora, marcar como retida e executar operações em massa.
- Admin pode executar tudo.
- Operador pode agendar e marcar como retida.
- Comunicação/leitura ficam sem execução de ações de retenção.

## Anonimização
- Remove contato, preferência de contato, nome de exibição, notas de revisão sensíveis e metadata potencialmente sensível.
- Mantém status, datas, decisão, `converted_volunteer_id` e trilha de auditoria.
- Não apaga voluntários ativos nem audit logs.

## Exportação Segura
- Exportação de inscrições inclui `retention_status`.
- Inscrições `redacted` nunca exportam PII.
- Export com contato continua restrito a admin e consentimento.

## Healthcheck
- Adicionados campos seguros:
  - `volunteer_applications_eligible_for_redaction_count`
  - `volunteer_applications_redacted_count`
  - `volunteer_applications_scheduled_redaction_count`
  - `volunteer_applications_retained_count`

## Testes
- Criado `src/lib/data/volunteer-application-retention.test.ts`.
- Criado `e2e/volunteer-application-retention.spec.ts`.
- Testes cobrem elegibilidade, proteção de aprovadas convertidas, redaction, retained com motivo, bulk e health.

## Guardrails Preservados
- Produção permanece bloqueada.
- Sem importação de `ig_people`.
- Sem DM automática.
- Sem contato automático.
- Sem score político individual.
- Sem classificação apoiador/opositor/persuadível.
- Sem exposição de PII em exportações redigidas.

## Próximo Tijolo Recomendado
- Criar painel de revisão periódica com alertas internos para inscrições pendentes há mais de 90 dias, sem automação de contato.
