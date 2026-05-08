# Estado da Nação - Radar de Base
## UX15: Jornada Guiada do Piloto

### 1. Resumo da Implementação
Para o piloto de 7 dias, criamos uma camada de orientação direta na interface para reduzir a curva de aprendizado da equipe e garantir que as ações sigam o fluxo operacional correto.

#### Componentes de Orientação:
*   **`GuidedOnboarding`**: Card fixo "Hoje, faça nesta ordem" que detalha os 7 passos fundamentais (Assumir -> Abrir -> Copiar DM -> Instagram -> Registrar -> Encaminhar -> Próximo).
*   **`OperationalAlarms`**: Sistema de alertas com links diretos para filtros específicos (Tarefas órfãs, respostas sem encaminhamento, tarefas paradas).
*   **`PilotChecklist`**: Monitoramento individual de progresso (Tarefas, DMs enviadas, registros, etc).

### 2. Guardrails Éticos e Anti-Spam
Integramos a documentação de boas práticas diretamente na UI:
*   **Bloco "Como trabalhar sem parecer spam"**: Orientações sobre personalização, respeito ao silêncio, registro obrigatório e proibição de pedidos de voto.
*   **Monitoramento de Bloqueios**: O checklist agora reforça o respeito aos contatos que pediram para "Não Abordar".

### 3. Integração em Rotas
*   **`/dashboard`**: Central completa com Alertas, Onboarding e Checklist.
*   **`/pessoas` & `/abordagem`**: Versão compacta do guia de ordem para manter o foco durante a operação de listas e quadros.

### 4. Saúde Técnica
*   **Build**: Green (`Exit Code: 0`).
*   **Lint**: Limpo (0 erros).
*   **Estabilidade**: Componentes modulares e reutilizáveis localizados em `src/components/radar/onboarding/`.

---
**Status:** ✅ SISTEMA PRONTO PARA O PILOTO (JORNADA GUIADA ATIVA)
**Relatório gerado em:** 2026-05-08
