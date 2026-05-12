# Estado da Nação - Régua Ética de Espera e Follow-up

**Data:** 09 de Maio de 2026  
**Contexto:** Pós-Piloto (Refinamento de Fluxo)  
**Objetivo:** Implementação de governança temporal no Kanban para evitar spam e manter a saúde da fila.

## ⚖️ A Ética do Silêncio
Identificamos que a coluna "Esperando Resposta" acumulava tarefas sem critério de saída, gerando ansiedade operacional e risco de insistência agressiva. A nova regra estabelece que **o silêncio também é uma resposta possível**.

### 📏 A Régua Temporal
Implementamos indicadores visuais baseados na idade da tarefa na coluna de espera:

1.  **0–24h (Aguardando Normal):** Período de latência natural. Nenhuma ação recomendada.
2.  **24–72h (Acompanhar):** Janela ideal para revisão humana. Sem insistência.
3.  **3–7 dias (Revisar):** Período crítico. Avaliar se o contato ainda é pertinente ou se deve ser pausado.
4.  **7+ dias (Arquivar Sugerido):** Silêncio prolongado. O sistema sugere mover para "Não Insistir" para manter o foco em contatos quentes.

## 🛠️ Mudanças Implementadas

### Kanban e Abordagem
- **Badges de Idade:** Cards agora exibem o status da espera (Normal, Revisar, Evitar Insistência, Arquivar).
- **Filtros de Pendência:** Novos filtros no Kanban permitem isolar tarefas com 3+ ou 7+ dias de espera.
- **Microcopy de Orientação:** Inserimos lembretes na interface sobre a importância de respeitar janelas de tempo.
- **Ações Rápidas:** Botões de um clique para "Manter", "Revisar", "Arquivar" ou "Não Abordar", agilizando a limpeza da coluna.

### Minha Fila (Operador)
- **Separação de Fila:** A fila principal agora foca no fluxo ativo. Pendências com mais de 3 dias são movidas para uma seção secundária, evitando que contatos antigos "poluam" a produtividade imediata.

### Relatórios e Métricas
- **Novos KPIs:** Adicionamos métricas de "Aguardando 3+ Dias", "7+ Dias" e "Arquivados sem Retorno" no fechamento diário. Isso permite aos coordenadores monitorar a "saúde temporal" da base.

## 🚀 Próximos Passos
- Monitorar a taxa de reativação de contatos após o registro de "Resposta Tardia".
- Validar com a equipe se as cores dos badges (Emerald, Blue, Amber, Rose) estão ajudando na priorização visual.

---
*Radar de Base: Inteligência Territorial com Respeito e Ética.*
