# Estado da Nação 055

Data: 2026-05-05

## Resumo executivo

O acompanhamento diário da janela territorial foi implementado para o relatório `f64c9551-6c9c-4767-a816-489dc701ac6b`. A janela está aberta no staging, o primeiro snapshot agregado diário foi gerado e o painel admin passou a expor apenas contagens e históricos agregados, sem relatos brutos nem dados pessoais por padrão.

## Fatos confirmados

- Janela territorial ativa: sim
- Início da janela: 2026-05-05T00:35:42.497+00:00
- Fim previsto: 2026-05-12T00:35:42.497+00:00
- Snapshot diário criado: sim
- Snapshot mais recente: 2026-05-05
- Status do snapshot: attention
- Produção ativada: não
- Guardrails preservados: sim

## Métricas agregadas do snapshot

- Total de relatos: 0
- Com consentimento: 0
- Sem consentimento: 0
- Bairros citados: 0
- Pautas citadas: 0
- Pendentes de revisão: 0
- Revisados: 0
- Encaminhados: 0
- Arquivados: 0

## Painel e exportação

- O painel em `/escuta/bairro/admin` agora mostra:
  - status da janela
  - dias restantes
  - total de relatos
  - consentimento explícito
  - pendências de revisão
  - encaminhamentos
  - bairros citados
  - pautas citadas
  - histórico de snapshots
- A exportação segura do snapshot foi criada em `/api/escuta/bairro/snapshots/[id]/export` com saída em markdown e HTML imprimível.
- O rodapé da exportação informa que o snapshot é agregado e não contém dados pessoais nem relatos brutos.

## Evidência operacional

- O item do plano `Monitorar escuta por bairro por 7 dias` permanece em `doing`.
- O item recebeu metadado de snapshot diário com `latest_snapshot_id`, `latest_snapshot_date`, `latest_snapshot_status` e `latest_snapshot_at`.
- O snapshot foi gravado em `territorial_listening_daily_snapshots`.
- O plano segue vinculado à resposta pública do Instagram.

## Guardrails preservados

- Sem DM automática.
- Sem resposta automática.
- Sem criação automática de contato.
- Sem score político individual.
- Sem microtargeting.
- Contato não é exibido por padrão.
- Relatos brutos não entram na exportação do snapshot.

## Situação de produção

- Produção segue bloqueada.
- Webhooks seguem em `GO_STAGING`.
- O fluxo permanece restrito a uso interno e staging.

## Próximo tijolo recomendado

Gerar o próximo snapshot diário quando houver novos relatos, e ao final da janela consolidar a síntese territorial de 7 dias com apenas dados agregados e consentidos.
