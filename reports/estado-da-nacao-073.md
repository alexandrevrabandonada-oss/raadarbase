# Estado da Nação 073

## Escopo entregue

- Migration criada: `supabase/migrations/027_volunteers_and_squads.sql`
- Módulo interno de voluntários consentidos criado em `/voluntarios`
- Squads internas criadas em `/voluntarios/squads`
- Integração com Agenda de Campo adicionada em `/campo/[id]`
- Exportação segura criada em `/api/voluntarios/export`
- Audit logs de voluntários adicionados
- Healthcheck ampliado com métricas seguras de voluntários e squads
- Testes unitários e e2e iniciais adicionados

## Migrations criadas

- `campaign_volunteers`
- `campaign_squads`
- `campaign_squad_members`
- `field_agenda_event_volunteers`

### Guardrails aplicados no banco

- voluntário só existe com `consent_to_store_data = true`
- contato preenchido exige `consent_to_contact = true`
- nenhuma policy anônima criada
- leitura limitada a internos ativos autorizados
- escrita limitada a `admin`, `operador`, `comunicacao`
- nenhuma importação automática de `ig_people`

## Páginas criadas

- `/voluntarios`
- `/voluntarios/novo`
- `/voluntarios/[id]`
- `/voluntarios/[id]/editar`
- `/voluntarios/squads`
- `/voluntarios/squads/[id]`

## Voluntários

- cadastro interno com consentimento explícito obrigatório
- contato opcional e protegido
- sem exibição de telefone/email por padrão na listagem
- detalhe com consentimentos, squads e vínculos de campo
- bloqueio de criação sem consentimento de armazenamento
- bloqueio de contato sem consentimento de contato

## Squads

- squads separadas das pessoas vindas do Instagram
- vínculo manual entre voluntário e squad
- remoção segura por mudança de status de vínculo
- contagem de membros e ações ligadas por vínculo operacional

## Integração com campo

- seção “Voluntários da ação” em `/campo/[id]`
- adição manual de voluntário à ação
- atualização manual de status: convidado, confirmado, presente, ausente
- nenhum convite automático enviado

## Exportação segura

- export padrão sem telefone/email
- `include_contact=true` exige admin
- contato exportado só aparece quando houver consentimento
- exportações registram `audit_log`

## Audit logs

- `volunteer.created`
- `volunteer.updated`
- `volunteer.archived`
- `volunteer.assigned_to_squad`
- `volunteer.removed_from_squad`
- `volunteer.assigned_to_field_event`
- `volunteer.event_status_updated`
- `volunteer.exported`
- `volunteer.contact_exported`

## Healthcheck

Campos seguros adicionados:

- `volunteers_count`
- `active_volunteers_count`
- `squads_count`
- `field_event_volunteer_assignments_count`

## Testes

- `src/lib/data/volunteers.test.ts`
- `e2e/volunteers.spec.ts`

Cobertura inicial:

- não cria voluntário sem consentimento de armazenamento
- contato exige consentimento
- lista não expõe contato por padrão
- exportação padrão não contém contato
- `include_contact` exige admin
- entrada derivada do Instagram não se converte automaticamente em voluntário
- banco vazio não quebra exportação segura

## Guardrails preservados

- sem DM automática
- sem contato automático
- sem score político individual
- sem classificação apoiador/opositor/persuadível
- sem microtargeting
- sem PII indevida exposta por padrão
- sem uso de lista de pessoas do Instagram como alvo de campo
- produção continua bloqueada
- webhooks seguem `GO_STAGING`

## Produção

- nenhum passo desta entrega ativa produção
- nenhum guardrail de produção foi afrouxado
- módulo novo fica restrito ao uso interno autenticado

## Próximo tijolo recomendado

Implementar uma entrada pública consentida apenas após decisão formal, com texto jurídico revisado, dupla confirmação de consentimento e fila de revisão interna antes de qualquer criação de voluntário no banco.