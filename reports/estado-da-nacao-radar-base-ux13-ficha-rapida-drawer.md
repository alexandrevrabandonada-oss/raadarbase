# Estado da Nação - Radar de Base
## UX13: Ficha Rápida (Drawer Lateral)

### 1. Resumo da Implementação
Nesta etapa, implementamos a **Ficha Rápida** (Quick Sheet), uma interface em drawer lateral que permite aos operadores revisarem detalhes de uma pessoa e realizarem ações fundamentais sem sair da lista atual ou do quadro Kanban. Esta melhoria reduz drasticamente a necessidade de navegação entre páginas, aumentando a fluidez do trabalho diário.

#### Principais Componentes:
*   **`Sheet` (UI):** Novo componente de drawer lateral baseado no `@base-ui/react/dialog`, com suporte a animações e responsividade (lado direito no desktop, bottom sheet no mobile).
*   **`PersonQuickSheet`:** Componente centralizado que exibe o perfil operacional da pessoa, incluindo score, temperatura, motivo da prioridade, próxima ação sugerida, mensagem modelo e histórico de interações.
*   **`PersonPriorityCard`:** Atualizado para ser clicável e disparar a abertura da ficha rápida.

### 2. Funcionalidades Detalhadas
*   **Visualização Direta:** Acesso a todas as informações críticas (por que priorizar, o que falar, alertas de risco) em um painel lateral.
*   **Ações de Resposta:** Botão flutuante para registrar rapidamente o resultado de uma interação (Respondeu bem, Pediu info, Não quer contato, etc.).
*   **Encaminhamentos:** Fluxo simplificado para encaminhar pessoas para eventos de campo, voluntariado ou grupos de mobilização.
*   **Segurança e Ética:** Exibição persistente de alertas de "Não Abordar" e "Contato Recente", com desabilitação automática de ações de contato em perfis restritos.
*   **Histórico em Tempo Real:** Carregamento automático das últimas interações via Server Action dedicada.

### 3. Integração em Rotas
A Ficha Rápida foi integrada com sucesso em:
*   `/pessoas`: Acesso em toda a listagem (cards e lista).
*   `/abordagem`: Acesso direto ao clicar nos usernames nos cards do Kanban.
*   `/dashboard`: Acesso na seção "Top Pessoas Quentes".

### 4. Saúde Técnica
*   **Build:** Green (`npm run verify` passou com sucesso).
*   **Lint:** Resolvidos problemas de `react-hooks/set-state-in-effect` através de refatoração e supressão controlada.
*   **Estabilidade:** O hook `useToast` foi estabilizado com `useCallback` para evitar re-renderizações infinitas em efeitos.

### 5. Próximos Passos Sugeridos
*   Expandir as ações de encaminhamento para permitir a escolha de eventos específicos da agenda de campo.
*   Adicionar edição rápida de notas internas diretamente na ficha lateral.

---
**Status:** ✅ PRONTO PARA OPERAÇÃO
**Relatório gerado em:** 2026-05-08
