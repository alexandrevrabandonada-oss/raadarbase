# Estado da Nação: Radar de Base - Heatmap Territorial por Bairros (Geo02)

## Contexto e Objetivo
A operação territorial do Radar de Base escalou para múltiplos bairros. A coordenação precisava de uma forma de identificar rapidamente onde a mobilização está "fria" ou "quente" sem expor dados de localização privada dos cidadãos.

## Implementação Técnica
*   **Heatmap Baseado em Bairro:** Implementamos uma visualização de grade onde a intensidade da cor (escala de Indigo) é determinada pelo `priorityScore` de cada bairro.
*   **Ranking Lateral:** Mantivemos um ranking de foco para permitir uma leitura rápida das top 10 prioridades territoriais.
*   **Métricas Agregadas:** Cada bairro exibe agora sinais totais, voluntários ativos e principais temas de demanda, permitindo planejamento de campo baseado em evidências.
*   **Navegação Fluida:** O usuário pode alternar entre Ranking, Mapa de Calor e Visão em Grade para diferentes profundidades de análise.

## Compromisso Ético e Privacidade
*   **Anonimato Geográfico:** Reforçamos que a menor unidade geográfica visível é o bairro. Não há plotagem de pontos individuais ou endereços.
*   **Guardrail Visual:** Adicionamos um banner permanente no painel territorial: *"Este painel orienta ações coletivas. Não exibe localização individual."*
*   **Uso Coletivo:** As ações sugeridas (Banca de Escuta, Mutirão) são sempre focadas no espaço público do bairro.

## Próximos Passos
*   Integrar o Mapa de Calor com o calendário de eventos para prever impacto de futuras ações.
*   Permitir filtragem por temas (ex: heatmap de bairros com problemas de saúde).

---
**Status:** Implementado e validado.
**Data:** 12 de Maio de 2026
**Responsável:** Antigravity AI Agent
