# Estado da Nação - Radar de Base - RB13 - Webhook Missão ÉLuta

## Status Geral: PRONTO PARA INTEGRAÇÃO (GREEN BUILD)

O Radar de Base agora possui uma ponte de dados segura com o ecossistema Missão ÉLuta. O ciclo RB13 foi concluído com sucesso, implementando a infraestrutura de webhooks necessária para automação do funil de mobilização.

## O que foi implementado

### 1. Camada de Dados (Migration 034)
- **Tabela `webhook_events`**: Implementada para garantir idempotência e rastreabilidade (audit log) de todos os sinais recebidos.
- **Extensão de `ig_person_referrals`**: Adicionados campos de integração (`external_id`, `last_event_at`, `last_event_source`, `metadata`).
- **Segurança (RLS)**: Tabelas protegidas e acessíveis apenas via Service Role/Server Actions.

### 2. API de Integração (`/api/integrations/missao-eluta/events`)
- **Segurança**: Autenticação via Bearer Token utilizando a chave `MISSAO_ELUTA_WEBHOOK_SECRET`.
- **Inteligência de Matching**: Localização de pessoas por UUID de encaminhamento, ID externo ou handle do Instagram (normalizado).
- **Mapeamento de Status**: Conversão automática de eventos do Missão ÉLuta para o funil interno do Radar de Base:
  - `accessed` -> `acessou`
  - `first_mission_done` -> `fez_primeira_missao`
  - `collaborator` -> `colaborador`
  - Etcetera.
- **Idempotência**: Proteção contra processamento duplicado de eventos (via `event_id`).

### 3. Interface (UI)
- **Ficha da Pessoa**: Adicionado bloco informativo nos "Encaminhamentos Ativos" que mostra o último evento recebido, data, origem (Webhook vs Manual) e slug da missão.
- **Transparência**: Diferenciação clara entre ações humanas e atualizações automáticas.

## Verificação Técnica

- **Build**: PASSOU (`npm run build`).
- **Lint**: PASSOU (`npm run lint`).
- **RLS Check**: PASSOU (`check:rls` validado).
- **Tipagem**: PASSOU (resolvidos conflitos entre `Json` e tipos de interface).

## Próximos Pasos

1. **Ativação em Produção**: Configurar a variável `MISSAO_ELUTA_WEBHOOK_SECRET` no ambiente de produção.
2. **Homologação**: Enviar o token para a equipe do Missão ÉLuta e monitorar os primeiros eventos reais.
3. **Métricas**: Evoluir os relatórios para mostrar a conversão específica vinda dos webhooks.

---
**Guardrails Éticos Mantidos**:
- Nenhuma automação de DM foi criada.
- Nenhuma inferência política ou pedido de voto incluído.
- Privacidade respeitada (matching seguro).
