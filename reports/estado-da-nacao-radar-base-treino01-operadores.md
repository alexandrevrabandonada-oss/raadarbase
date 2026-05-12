# Estado da Nação: Radar de Base - Modo Treinamento Operacional (Treino01)

## Contexto e Objetivo
Para sustentar o crescimento territorial, identificamos a necessidade de uma porta de entrada segura para novos operadores. O objetivo foi criar um ambiente de simulação que ensine os fluxos críticos e os guardrails éticos sem expor a base de dados real.

## Implementação Técnica
*   **Rota Isolada:** Criada a rota `/treinamento`.
*   **Simulação State-Only:** O módulo de treinamento utiliza um estado local para simular mudanças de status (`persona`, `steps`), interceptando as chamadas que normalmente iriam para o Supabase.
*   **Componentes Reutilizados:** O componente `PersonQuickSheet` foi adaptado com a prop `isTraining`, garantindo que o operador aprenda na interface exata que usará no dia a dia, mas com handlers de mock.
*   **Cenários Práticos:** Implementamos 4 cenários baseados nos maiores atritos operacionais detectados no piloto (DM confirmada, encaminhamentos e Não Abordar).

## Diferenciais Éticos
*   **Checklist de Responsabilidade:** O treinamento só é concluído após o operador confirmar explicitamente que entende a proibição de pedidos de voto e a obrigatoriedade do contato manual.
*   **Reforço de Privacidade:** O Cenário 4 foca especificamente em como lidar com pedidos de cessar contato, reforçando a cultura de respeito ao cidadão.

## Próximos Passos
*   Integrar o link de treinamento no onboarding de novos usuários.
*   Monitorar a taxa de conclusão do treinamento antes da liberação de acesso às filas reais.

---
**Status:** Implementado e validado.
**Data:** 12 de Maio de 2026
**Responsável:** Antigravity AI Agent
