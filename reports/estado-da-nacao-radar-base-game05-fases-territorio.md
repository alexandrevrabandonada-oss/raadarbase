# Estado da Nação - Radar de Base (GAME05)
## Fases Territoriais: Maturidade e Planejamento Estratégico

### 1. Camada de Progresso Territorial
Implementamos as "Fases Territoriais", uma nova camada analítica que organiza os bairros em 5 estágios de maturidade: **Observação, Escuta, Mobilização, Campo e Continuidade**. Esta visualização permite que a coordenação identifique instantaneamente onde agir e como priorizar recursos.

### 2. Motor de Inteligência Territorial
- **`TerritoryMapper`:** Desenvolvemos uma lógica que calcula automaticamente a fase do bairro com base em sinais (escuta digital), engajamento (pessoas prioritárias) e histórico (ações de campo e tarefas abertas).
- **Sem Input Manual:** A fase reflete o estado real dos dados, garantindo que o painel esteja sempre atualizado sem esforço extra da equipe.

### 3. Visualização e Ação
- **`TerritoryStageBadge`:** Um novo componente visual integrado ao Ranking e aos Cards de Detalhe.
- **Justificativa Dinâmica:** O sistema explica *por que* o bairro está naquela fase (ex: "Alto volume de pessoas engajadas aguardando direcionamento").
- **Próximo Passo Recomendado:** Cada fase sugere uma ação prática e fornece o link direto para executá-la (ex: "Criar ação de campo baseada nas pautas").

### 4. Guardrails Éticos e de Privacidade
- **Dados Agregados:** As fases representam o pulso do bairro e não comportamentos individuais.
- **Microcopy de Proteção:** Reforço visual constante: *"Fases territoriais são agregadas. Não representam vigilância individual."*

### 5. Verificação Técnica
- Build estável.
- Type safety mantido.
- Testes de integridade aprovados (`npm run verify`).

---
**Assinado:** Antigravity (AI Assistant)
**Data:** 12/05/2026
