# Estado da Nação 056

Data: 2026-05-05

## Resumo executivo

O reforço da chamada territorial foi registrado em staging com dois logs operacionais compartilhados e a janela ganhou o segundo snapshot diário. A janela territorial continua aberta e os guardrails seguem preservados: sem DM automática, sem criação automática de contato, sem score político individual e sem exposição de dados pessoais no snapshot.

## Fatos confirmados

- Janela territorial ativa: sim
- Janela territorial: `116d07a6-c9c3-4443-ae21-52f4d6194cbd`
- Relatório-base: `f64c9551-6c9c-4767-a816-489dc701ac6b`
- Snapshots diários existentes: 2
- Snapshot mais recente: `2026-05-06`
- Status do snapshot mais recente: `attention`
- Produção ativada: não
- Guardrails preservados: sim

## Reforço da chamada

Foram criados dois logs de reforço compartilhado na janela territorial:

- `85408a22-18dd-46e2-bb86-e1bacefcb5a5` — `instagram_story` — `shared`
- `1bfe888f-a018-4cef-865a-769dd364d72c` — `whatsapp` — `shared`

O reforço público do Instagram apontou para:

- `https://www.instagram.com/vr_abandonada/`

## Snapshot diário 2

- Snapshot criado: sim
- Snapshot ID: `0af46add-9f9d-4736-b8d5-d1d1b1401cea`
- Data do snapshot: `2026-05-06`
- Gerado em: `2026-05-05T01:13:16.018+00:00`
- Status: `attention`

### Métricas agregadas do snapshot

- Total de relatos: 0
- Com consentimento: 0
- Sem consentimento: 0
- Bairros citados: 0
- Pautas citadas: 0
- Pendentes de revisão: 0
- Revisados: 0
- Encaminhados: 0
- Arquivados: 0

## Plano de ação e evidência

Os itens do plano vinculados à escuta territorial foram alinhados ao novo estado:

- `Monitorar escuta por bairro por 7 dias` passou a carregar `latest_snapshot_id`, `latest_snapshot_date`, `latest_snapshot_status` e `latest_snapshot_at` do snapshot mais recente.
- `Compartilhar chamada em grupos` passou para `done` com metadata de reforço territorial e referência aos dois logs compartilhados.

## Evidência operacional

- `territorial_listening_outreach_logs`: 2 novos registros compartilhados.
- `territorial_listening_daily_snapshots`: segundo snapshot persistido.
- `audit_logs`: trilha atualizada para reforço da chamada, snapshot gerado e alinhamento do plano.

## Guardrails preservados

- Sem DM automática.
- Sem resposta automática.
- Sem criação automática de contato.
- Sem score político individual.
- Sem microtargeting.
- Contato não é exibido por padrão.
- Relatos brutos não entram no snapshot.

## Situação de produção

- Produção segue bloqueada.
- Webhooks seguem em `GO_STAGING`.
- O fluxo permanece restrito a uso interno e staging.

## Próximo tijolo recomendado

Continuar monitorando a janela com reforços públicos manuais e gerar o próximo snapshot diário quando houver novos relatos, mantendo apenas dados agregados e consentidos.