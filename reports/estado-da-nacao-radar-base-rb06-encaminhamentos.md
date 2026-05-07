# Estado da Nação RB06 - Camada de Encaminhamentos

Data: 2026-05-07

## Objetivo Concluído

Implementada a camada de encaminhamentos do Radar de Base, permitindo que a equipe direcione pessoas que responderam positivamente para ações de campo, voluntariado, grupos externos e o ecossistema Missão ÉLuta.

## Estruturas Reaproveitadas e Criadas

### 1. Banco de Dados e Dados Estruturados
- **Nova Tabela `ig_person_referrals`**: Criada para rastrear encaminhamentos individuais com status específicos (convidado, confirmado, compareceu, etc.).
- **Integração com `field_agenda_events`**: Vinculação direta de encaminhamentos a eventos reais da agenda de campo.
- **Sistema de Etiquetas (Themes)**: Uso de etiquetas automáticas como `quer_evento_campo`, `quer_voluntariado` e `quer_missao_eluta` no perfil da pessoa para facilitar filtragem global.
- **Reuso de `outreach_tasks`**: Encaminhamentos continuam gerando tarefas na coluna "Precisa Encaminhar" do quadro de abordagem para garantir que nada se perca.

### 2. Interface do Usuário (UI/UX)
- **Ficha da Pessoa (`/pessoas/[id]`)**:
    - Novo bloco "Encaminhar para" com seletor de destino e seletor de eventos reais.
    - Seção de "Encaminhamentos Ativos" para gestão de status (ex: marcar que a pessoa confirmou presença).
    - Status específicos para Missão ÉLuta (Recebeu link, Acessou, Fez primeira missão, etc.).
- **Lista de Pessoas (`/pessoas`)**:
    - Novos filtros rápidos: "Quer evento", "Quer voluntariado", "Quer ÉLuta".
- **Quadro de Abordagem (`/abordagem`)**:
    - Badges visuais nos cartões indicando o tipo de interesse (EVENTO, VOLUNTARIADO, ÉLUTA).

## Gaps e Integração Missão ÉLuta

Atualmente, o registro de progresso na Missão ÉLuta é **manual**.
- **Gap**: Não há webhook ou API de retorno do app Missão ÉLuta para atualizar automaticamente se a pessoa acessou ou concluiu uma missão.
- **Próximo Passo**: Implementar uma rota de API (webhook) que receba eventos do app ÉLuta e atualize o status em `ig_person_referrals` automaticamente.

## Guardrails e Ética
- **Privacidade**: Não houve criação automática de registro de voluntário. A pessoa permanece como "Interessada" até que haja consentimento formal e revisão humana.
- **Conformidade**: Mantida a proibição de registro de dados sensíveis e pedidos de voto.
- **Escuta Ativa**: O fluxo prioriza o desejo da pessoa manifestado na interação (ex: "tenho interesse em ajudar no bairro").

## Verificação Realizada
- **Build & TypeScript**: 100% OK.
- **Lint**: OK.
- **Segurança (RLS)**: Tabelas protegidas e acessíveis apenas por usuários autorizados.
