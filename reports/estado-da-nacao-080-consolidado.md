# Relatório de Estado do Projeto: Radar de Base
**Data**: 2026-05-07
**Status Geral**: Estabilizado / Pré-Produção

## 1. Visão Geral
O **Radar de Base** é uma plataforma de inteligência e organização comunitária focada na gestão ética de interações digitais (Instagram). O sistema atua como um CRM especializado que prioriza a soberania de dados, a governança humana e a ausência de perfis individuais automatizados.

### Pilares Éticos (Guardrails)
- **Não-Perfilamento**: Proibição de scores políticos, ideológicos ou psicológicos individuais.
- **Não-Automação**: Sem envio automático de mensagens (DMs) ou disparos em massa.
- **Soberania**: Dados coletados via API oficial, sem scraping, com auditoria total.

---

## 2. Últimas Conquistas e Marcos Recentes

### Gestão de Responsabilidade (Tijolo 080)
- Implementação do sistema de **Responsáveis**, permitindo que membros da equipe assumam a responsabilidade por contatos (`ig_people`), tarefas de abordagem (`outreach_tasks`) e encaminhamentos (`referrals`).
- Atualização da camada de dados com `responsible_id` e índices de performance.

### Revisão Periódica de Voluntários (T076)
- Criação de fluxos de revisão interna para novos voluntários.
- Painéis de pendências por idade de inscrição e elegibilidade de anonimização.
- Exportação segura de dados agregados para governança.

### Agenda de Campo (T072)
- Módulo para planejamento e registro de resultados de ações físicas e territoriais.
- Integração com o "Radar de Silêncios" para sugerir ações em áreas com baixa interação.

### Referências e Encaminhamentos (T032)
- Sistema de encaminhamento de contatos entre operadores, garantindo fluxo de trabalho colaborativo.

---

## 3. Arquitetura e Módulos Core

### Gestão de Contatos (CRM)
- **Pessoas**: Base de usuários do Instagram com histórico de interações e consentimento.
- **Abordagem**: Gestão de modelos de mensagens e registro de contatos manuais.

### Inteligência e Conteúdo
- **Posts & Interações**: Sincronização de mídias e comentários via Meta API.
- **Temas & Taxonomia**: Classificação de *conteúdo* (não de pessoas) para identificar pautas recorrentes.

### Governança e Auditoria
- **Audit Logs**: Registro de todas as ações sensíveis (exportação, anonimização, edição).
- **Incidentes**: Painel de monitoramento de falhas operacionais e sincronizações presas.

### Execução e Memória
- **Ações & Evidências**: Registro do desdobramento prático de planos de ação.
- **Memória Estratégica**: Consolidação de aprendizados para evitar repetição de erros.

---

## 4. Estado Técnico Atual

| Componente | Status | Observações |
| :--- | :--- | :--- |
| **Banco de Dados** | ✅ OK | 33 migrations aplicadas. Schema robusto com RLS. |
| **Integração Meta** | ✅ OK | Sincronização manual estável; Webhooks validados em staging. |
| **Testes (Unitários)** | ✅ 100% | Cobertura extensa em `lib/meta`, `lib/data` e `lib/audit`. |
| **Testes (E2E)** | ✅ OK | Suíte Playwright validada para fluxos críticos. |
| **Healthcheck** | ✅ OK | Endpoint `/api/health` monitorando integridade e guardrails. |

---

## 5. Governança e Próximos Passos

### Próximos Desafios:
1.  **Decisão Formal de Produção**: Ativação dos webhooks em ambiente real após o ciclo de quarentena.
2.  **Relatórios de Saúde Mensais**: Implementação de síntese agregada automática para prestação de contas.
3.  **Refinamento da UI de Operação**: Melhorar a visualização de tarefas pendentes para os responsáveis.

### Auditoria de Segurança:
- **RLS**: Bloqueio de escrita anônima verificado via `npm run check:rls`.
- **PII**: Sanitização de dados pessoais em exportações confirmada.

---
**Responsável Técnico**: Antigravity AI
**Ambiente**: Desenvolvimento / Staging
