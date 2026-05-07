# Checklist de Produção Shadow

Produção shadow é leitura e validação técnica. Não autoriza campanha ativa, webhook produtivo, disparos, automações ou contato.

- [ ] Domínio resolve para o deploy correto.
- [ ] SSL OK.
- [ ] Login interno OK.
- [ ] Healthcheck OK.
- [ ] `mock_mode=false`.
- [ ] Webhook production disabled (`META_WEBHOOK_ENABLED=false`).
- [ ] Páginas públicas OK.
- [ ] Páginas internas protegidas.
- [ ] Exportações seguras e sem PII indevida.
- [ ] RLS básico OK.
- [ ] Rollback definido: promover o deployment Production anterior no Vercel ou reverter a última promoção.
- [ ] Operadores informados de que a fase é shadow e não autoriza contato.

Guardrails obrigatórios:
- Sem DM automática.
- Sem WhatsApp automático.
- Sem e-mail automático.
- Sem criação automática de contato.
- Sem score político individual.
- Sem classificação apoiador/opositor/persuadível.
- Sem importação automática de `ig_people`.
- Sem remoção de quarentena ou processamento manual.
