# Production Activation Observation

- Inicio da observacao: 2026-05-07 14:02:30 BRT
- Dominio: `https://raadarbase.vercel.app`
- Deploy ID: `dpl_22X6bvzrvUkUfi3zRzv2eHLCzFep`
- Responsavel tecnico: Alexandre Fonseca
- Responsavel operacao: Mauricio Fonseca
- Responsavel governanca: Paulo Victor
- Rollback owner: Alexandre Fonseca, Mauricio Fonseca e Paulo Victor
- Webhook producao enabled: `true`
- Quarentena obrigatoria: `sim`
- Processamento manual: `sim`

## Checklist 0-2h

- [x] `/api/health` responde sem markers sensiveis, sem secret e sem PII.
- [x] `mock_mode=false`.
- [x] `meta_webhook_enabled=true`.
- [x] `webhook_runtime_ready=true`.
- [x] Rotas publicas criticas responderam.
- [x] Rotas internas seguem protegidas sem sessao.
- [x] Exportacoes sensiveis seguem protegidas.
- [x] RLS basico continua bloqueando escrita anon.
- [x] Smoke do webhook: GET verification OK.
- [x] Smoke do webhook: POST assinado aceito e evento em quarentena.
- [x] Smoke do webhook: POST sem assinatura rejeitado.
- [x] Smoke do webhook: incidente para assinatura invalida observado.

## Checklist 24h

- [ ] Revisar `/operacao/incidentes`.
- [ ] Revisar `/integracoes/meta/webhooks`.
- [ ] Revisar `/voluntarios/inscricoes`.
- [ ] Revisar `/escuta/bairro/admin`.
- [ ] Revisar logs Vercel e Supabase.
- [ ] Confirmar ausencia de 5xx persistente em rota critica.
- [ ] Confirmar ausencia de exposicao de PII em paginas publicas e exports.

## Checklist 72h

- [ ] Revalidar health e activation check.
- [ ] Revalidar access audit.
- [ ] Revisar fila de quarentena e incidentes resolvidos.
- [ ] Revisar submissões publicas e exports sensiveis.
- [ ] Confirmar que guardrails operacionais permanecem intactos.

## Criterios de rollback

- Vazamento de secret.
- PII publica.
- Falha critica de RLS.
- Webhook fora da quarentena.
- DM automatica.
- Contato automatico.
- Score politico individual.
- Erro 5xx persistente em rota critica.
- Exportacao sensivel sem autorizacao.
