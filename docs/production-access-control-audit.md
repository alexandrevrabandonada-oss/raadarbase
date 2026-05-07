# Production Access Control Audit

## Rotas públicas

- `/recibo/escuta`
- `/escuta/bairro`
- `/voluntarios/quero-ajudar`

Essas rotas devem responder `200`, não podem expor PII e não podem conter nomes, marcadores ou valores sensíveis.

## Rotas internas

- `/dashboard`
- `/integracoes/meta`
- `/operacao`
- `/operacao/meta-reconciliacao`
- `/radar/silencios`
- `/radar/silencios/acoes`
- `/radar/silencios/impacto`
- `/campo`
- `/voluntarios`
- `/voluntarios/inscricoes`
- `/voluntarios/revisao-periodica`

Essas rotas devem exigir autenticação interna e redirecionar para `/login` ou responder `401/403` quando acessadas sem sessão.

## Tabelas sensíveis

- `ig_people`
- `ig_interactions`
- `meta_webhook_events`
- `meta_webhook_event_links`
- `public_devolution_publications`
- `territorial_listening_windows`
- `territorial_listening_daily_snapshots`
- `territorial_listening_outreach_logs`
- `campaign_volunteers`
- `campaign_volunteer_applications`
- `campaign_squads`
- `campaign_squad_members`
- `field_agenda_events`
- `field_agenda_event_results`
- `silence_radar_corrective_actions`
- `public_receipt_distribution_logs`
- `public_receipt_distribution_cycles`

Política esperada:

- `anon` não lê dados internos.
- `anon` não escreve nessas tabelas.
- `service_role` mantém leitura técnica para verificação operacional.
- exportações com contato exigem autenticação e controle de papel.

## Matriz de papéis

- `admin`: exporta contato consentido, aprova/rejeita voluntários, gera evidências, processa webhooks, arquiva incidentes.
- `operador`: revisa temas, gera ações, revisa voluntários, cria agenda de campo, gera snapshots, sem export irrestrito de contato.
- `comunicacao`: vê relatórios, gera kit, registra distribuição, sem acesso amplo a contato.
- `leitura`: visualiza painéis internos permitidos, sem gestão operacional.

## Exportações sensíveis

- `/api/voluntarios/export?include_contact=true`
- `/api/voluntarios/inscricoes/export?include_contact=true`
- `/api/contacts/export`

Essas rotas não podem ficar públicas. Contato só sai com autenticação e regra de papel apropriada.

## Checklist de bloqueios

- sem DM automática
- sem contato automático
- sem score político individual
- sem PII em health
- sem rotas internas públicas
- sem afrouxar RLS
- `META_WEBHOOK_ENABLED=false` em production shadow
