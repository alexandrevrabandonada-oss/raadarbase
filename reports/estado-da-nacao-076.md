# Estado da Nação 076

## Painel
- Criada rota `/voluntarios/revisao-periodica`.
- O painel mostra alertas internos agregados para pendências por idade, elegibilidade de anonimização, retenção, redaction agendada e lacunas operacionais.
- Nenhum contato é feito automaticamente.

## Checklist
- Adicionado checklist semanal de revisão com itens para pendentes novas/antigas, consentimento incompleto, anonimização, retidas, export agregado e decisão da equipe.

## Migration
- Criada `supabase/migrations/030_volunteer_review_rounds.sql`.
- Nova tabela `volunteer_review_rounds` registra rodadas internas de revisão.
- RLS permite leitura interna e escrita apenas por perfis autorizados.

## Actions
- Criadas actions para criar, concluir e arquivar rodadas de revisão.
- Audit logs:
  - `volunteer_review_round.created`
  - `volunteer_review_round.completed`
  - `volunteer_review_round.archived`

## Exportação Segura
- Criado `/api/voluntarios/revisao-periodica/export`.
- Exporta apenas agregados: pendentes por faixa de idade, elegíveis para anonimização, redacted, retained, status de inscrições e última rodada.
- Não exporta nome, telefone, email, notas sensíveis ou contato.

## Healthcheck
- Adicionados campos seguros:
  - `volunteer_pending_7d_count`
  - `volunteer_pending_30d_count`
  - `volunteer_pending_90d_count`
  - `volunteer_review_rounds_count`
  - `latest_volunteer_review_round_status`

## Integração
- `/voluntarios` ganhou card “Revisão periódica” com pendentes antigas, elegíveis para anonimização, última rodada e link para o painel.

## Testes
- Criado `src/lib/data/volunteer-review-dashboard.test.ts`.
- Criado `e2e/volunteer-review-dashboard.spec.ts`.
- Cobertura inclui painel, banco vazio, pendentes antigas, elegibilidade, export sem contato, checklist, rodada concluída e ausência de PII/tokens.

## Guardrails
- Produção permanece bloqueada.
- Sem importação de `ig_people`.
- Sem DM, WhatsApp ou email automático.
- Sem contato automático.
- Sem score político individual.
- Sem classificação apoiador/opositor/persuadível.
- Alertas são internos, agregados e operacionais.

## Próximo Tijolo Recomendado
- Criar um relatório mensal agregado de saúde do programa de voluntariado, sem PII, para governança interna.
