# Estado da Nação 054

Data: 2026-05-05

## Resumo executivo

A devolutiva do relatório `f64c9551-6c9c-4767-a816-489dc701ac6b` foi registrada como `published` no Supabase staging após receber uma URL externa real. A janela territorial de 7 dias foi aberta imediatamente depois da publicação, como previsto pelo fluxo controlado.

## Fatos confirmados

- URL real recebida: sim
- Devolutiva marcada como reviewed: sim
- Devolutiva marcada como published: sim
- URL publicada: https://www.instagram.com/vr_abandonada/
- URL do post no Instagram: https://www.instagram.com/vr_abandonada/
- Janela territorial aberta: sim
- Janela territorial ativa no admin: sim
- Painel ` /escuta/bairro/admin ` validado: sim
- Produção ativada: não
- Guardrails preservados: sim

## Evidência operacional

- Publicação em `public_devolution_publications` atualizada para `status = published`.
- Metadados gravados: `reviewed_at`, `reviewed_by = staging-admin@example.com`, `published_at` e `published_by = staging-admin@example.com`.
- Audit log criado: `devolution.reviewed`.
- Audit log criado: `devolution.published`.
- Audit log criado: `territorial_listening_window.opened`.
- Linha criada em `territorial_listening_windows` com duração de 7 dias.
- O painel territorial mostra:
  - janela aberta
  - zero relatos
  - uma janela registrada
  - contato redigido por padrão

## Situação do plano

- Plano vinculado: `Resposta pública às pautas mais recorrentes do Instagram`
- Status do plano: active
- Item público de publicação foi concluído com URL externa real.
- A etapa territorial de 7 dias foi aberta e começou em 2026-05-05.

## Validação de interface

- A tela da devolutiva em `/relatorios/f64c9551-6c9c-4767-a816-489dc701ac6b/devolutiva` mostrou status `published` após o refresh.
- O painel em `/escuta/bairro/admin` confirmou janela ativa, duração de 7 dias e ausência de relatos.

## Pendências reais

- Acompanhar a janela territorial até 2026-05-12.
- Recolher os relatos por bairro com consentimento explícito durante a janela aberta.
