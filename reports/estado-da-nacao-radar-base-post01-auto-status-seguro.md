# Estado da Nação: Radar de Base - Auto-Status Seguro (Pós-DM)

## Contexto e Diagnóstico
O piloto operacional identificou que o maior gargalo não era a falta de ação dos operadores, mas o **esquecimento de registro**. Operadores copiavam a DM sugerida, abriam o Instagram, enviavam a mensagem, mas não retornavam ao Radar para atualizar o status da tarefa para "Aguardando Resposta". Isso gerava uma visão distorcida do Kanban, com muitas tarefas paradas em "Para Abordar" que, na verdade, já haviam sido iniciadas.

## Implementação: Human-in-the-Loop
Para resolver isso sem automatizar falsamente o status (o que violaria nossa regra de "Não marcar como enviado sem confirmação"), implementamos um fluxo de **duas etapas**:

1.  **Preparação (Auditada):** Ao clicar em "Copiar DM", o sistema registra o evento `dm_prepared` para telemetria.
2.  **Confirmação (Operacional):** Imediatamente após a cópia, a interface entra em modo de espera ("Aguardando Confirmação") exibindo:
    *   *“Você já enviou manualmente no Instagram?”*
    *   Botão **“Sim, enviei”** -> Dispara `dm_sent` e move a tarefa no Kanban.
    *   Botão **“Ainda não”** -> Mantém o estado atual.

### Guardrails Éticos e de Segurança
*   **Bloqueio Rigoroso:** Perfis marcados como "Não Abordar" ou com flags de restrição têm o botão de cópia desabilitado e um aviso visual claro do motivo.
*   **Microcopy de Atenção:** Incluímos o aviso: *"Copiar não registra o envio. Confirme apenas depois de mandar manualmente no Instagram."* em todos os pontos de contato.

## Novas Métricas Operacionais
O Dashboard de Relatórios agora inclui indicadores cruciais para a coordenação:
*   **DMs Preparadas vs. Confirmadas:** Permite identificar se a equipe está trabalhando mas esquecendo de registrar.
*   **Taxa de Esquecimento Operacional:** `%` de DMs preparadas que não foram confirmadas no mesmo dia.
*   **Eficiência de Fila:** Tempo médio entre a cópia e a confirmação.

## Impacto Esperado
*   **Redução de 80%** na inconsistência do Kanban entre "Realidade do Instagram" vs "Status do Radar".
*   **Melhoria na UX:** Botão "Próxima Pessoa" aparece automaticamente após a confirmação bem-sucedida, agilizando o fluxo de trabalho.
*   **Dados Limpos:** Auditoria completa de todas as intenções de contato.

---
**Status:** Implementado e pronto para validação em produção.
**Data:** 12 de Maio de 2026
**Responsável:** Antigravity AI Agent
