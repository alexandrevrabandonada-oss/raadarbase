# Estado da Nação 074

## Migration
- Criada `supabase/migrations/028_volunteer_public_applications.sql`.
- Nova tabela `campaign_volunteer_applications` com consentimento obrigatório, status de revisão e vínculo opcional ao voluntário convertido.
- RLS bloqueia leitura pública, permite apenas inserção pública `pending` com consentimento e restringe revisão a perfis internos autorizados.

## Página pública
- Criada `/voluntarios/quero-ajudar`.
- Formulário público simples, consentido, com contato opcional e avisos contra dados sensíveis e automação de abordagem.
- Envio sem `consent_to_store_data` é bloqueado.
- Contato preenchido exige `consent_to_contact`.

## Tela de sucesso
- Criada `/voluntarios/quero-ajudar/sucesso`.
- Confirma recebimento sem prometer retorno imediato.
- Inclui links para `/recibo/escuta` e `/escuta/bairro`.

## Fila interna
- Criada `/voluntarios/inscricoes`.
- Mostra inscrições por status, filtros por bairro/habilidade/interesse e contato redigido na lista.

## Detalhe e revisão
- Criada `/voluntarios/inscricoes/[id]`.
- Ações humanas: aprovar, rejeitar, arquivar e atualizar nota.
- Aprovação cria `campaign_volunteers` somente após revisão, com status inicial `novo` ou `ativo`.
- Rejeição não cria voluntário.

## Server actions e auditoria
- Criadas actions para submissão, aprovação, rejeição, arquivamento e notas.
- Audit logs previstos:
  - `volunteer_application.submitted`
  - `volunteer_application.approved`
  - `volunteer_application.rejected`
  - `volunteer_application.archived`
  - `volunteer_application.converted_to_volunteer`
  - `volunteer_application.review_notes_updated`

## Anti-abuso
- Honeypot `website`.
- Rate limit leve por IP em memória.
- Limites de tamanho, saneamento de texto e remoção de HTML/script.
- Sem fingerprint invasivo.

## Integração
- `/recibo/escuta` ganhou link “Quero ajudar na organização”.
- `/campo` ganhou link “Convidar voluntários consentidos”.
- `/voluntarios` ganhou link “Ver inscrições”.

## Exportação segura
- `/api/voluntarios/export` permanece sem inscrições públicas por padrão.
- Criado `/api/voluntarios/inscricoes/export`.
- Contatos só entram com `include_contact=true`, perfil admin e consentimento.
- Exportação gera audit log.

## Healthcheck
- Adicionados campos seguros:
  - `volunteer_applications_count`
  - `volunteer_applications_pending_count`
  - `volunteer_applications_approved_count`
  - `volunteer_applications_rejected_count`

## Testes
- Criado `src/lib/data/volunteer-applications.test.ts`.
- Criado `e2e/volunteer-applications.spec.ts`.
- Cobertura inclui consentimento, honeypot, não conversão automática, lista/export sem contato e banco vazio.

## Guardrails preservados
- Produção permanece bloqueada.
- Nada importa `ig_people`.
- Não há DM automática, contato automático, score político individual ou classificação apoiador/opositor/persuadível.
- Operador humano revisa antes de aceitar.

## Próximo tijolo recomendado
- Criar rotina interna de retenção/expurgo para inscrições rejeitadas ou arquivadas, com prazo explícito e auditoria.
