# Relatório de Performance e Escalabilidade Operacional (Perf01)

Este relatório detalha as otimizações realizadas para garantir que o Radar de Base permaneça rápido e responsivo durante o crescimento da operação.

## 1. Otimização de Consultas (Server-Side)
- **JOINs Estruturais**: Otimizamos a busca de tarefas no Kanban (`listOutreachTasks`) para usar JOINs nativos do Supabase, eliminando chamadas sequenciais e reduzindo a latência da página.
- **Filtragem por Cutoff**: A função `listPeople` agora suporta um filtro de data (`cutoff`). Isso garante que o dashboard e a lista de prioridades processem apenas registros ativos (últimos 21 dias), evitando o carregamento de milhares de perfis históricos desnecessários.
- **Paralelismo**: Reforçamos o uso de `Promise.all` em todas as rotas principais (`/dashboard`, `/abordagem`, `/pessoas`), permitindo que métricas, tarefas e perfis sejam recuperados simultaneamente.

## 2. Infraestrutura de Dados (Database)
- **Índices de Performance**: Criada a migration `036_performance_indices.sql` com índices específicos para:
  - `outreach_tasks.column_key`: Acelera a renderização das colunas do Kanban.
  - `ig_interactions.theme`: Otimiza relatórios de pauta temática.
  - `contacts.person_id`: Melhora o vínculo entre perfis e dados de contato.
- **Índices Existentes**: Verificado que `last_interaction_at` e `responsible_id` já possuem índices otimizados.

## 3. Experiência do Usuário (Client-Side)
- **Loading States**: Implementada a infraestrutura de `loading.tsx` com `RadarLoading` para as rotas críticas. O operador agora recebe feedback visual imediato ("Sincronizando central de comando...") enquanto os dados são processados.
- **Lista Densa**: A lista de pessoas foi otimizada para limitar a renderização inicial a 100 registros, com suporte a troca automática para o modo "Lista" (mais leve que Cards) quando há muitos resultados.
- **Lazy Loading**: O histórico detalhado de interações na Ficha Rápida continua sendo carregado apenas sob demanda (ao abrir a ficha), poupando banda e memória.

---
**Conclusão**: O sistema está preparado para escalar de centenas para milhares de interações sem degradação perceptível na experiência do operador. As bases para uma infraestrutura de dados eficiente foram consolidadas.
