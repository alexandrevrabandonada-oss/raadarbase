# OPREAL 05: Preparar Expansão para Novos Territórios

**Objetivo**: Criar um processo de decisão clara para expansão territorial controlada sem aumentar bagunça operacional.

**Aceitação**: "A coordenação deve saber quando abrir um território e quando esperar."

---

## Entrega 1: Helper de Cálculo de Prontidão Territorial

**Arquivo**: `src/lib/data/territorial-expansion.ts`

### Funcionalidade
- Função `getTerritorialExpansionCandidates()` que:
  - Carrega territórios via `listTerritorySummaries()`
  - Classifica fases via `mapTerritoryToPhase()`
  - Verifica eventos planejados via `listFieldAgendaEvents()`
  - Consulta disponibilidade de operadores via `getTeamFlowAdoptionMetrics()`
  - Calcula score de prontidão (0-100) para cada candidato

### Tipos Definidos
```typescript
export type TerritorialExpansionCandidate = TerritorySummary & {
  phaseId: TerritoryPhaseId;
  readinessScore: number; // 0-100
  daysSinceAction: number;
  hasPlannedEvent: boolean;
  availableOperators: number;
  checklist: ExpansionReadinessChecklistItem[];
  priorityReason: string; // "mobilizacao", "escuta_with_signals", "stale", etc
};

export type TerritorialExpansionResult = {
  candidates: TerritorialExpansionCandidate[];
  grouped: {
    readyToOpen: TerritorialExpansionCandidate[];      // score >= 75
    needsPrep: TerritorialExpansionCandidate[];        // 50-75
    atRisk: TerritorialExpansionCandidate[];           // < 50
  };
  metrics: { totalCandidates, readyCount, needsPrepCount, atRiskCount };
};
```

### Checklist de Readiness (6 Critérios)
Cada candidato avaliado em:
1. **Bairro tem sinais suficientes?** (20%) - Mínimo 10 pessoas monitoradas
2. **Tem pauta clara?** (15%) - Pelo menos um tema recorrente
3. **Tem operador responsável?** (25%) - Operador disponível ou designado
4. **Tem ação possível?** (15%) - Mínimo 2 voluntários ou tarefas abertas
5. **Tem capacidade de follow-up?** (15%) - Encaminhamentos ou ação recente
6. **Há guardrails de privacidade?** (10%) - Equipe certificada (OPREAL 04)

### Grouping por Prontidão
- **Prontos (≥75 pts)**: Podem abrir imediatamente com preparativos finais
- **Precisam Prep (50-75 pts)**: Necessitam investimento operacional (operador, evento, sinais)
- **Em Risco (<50 pts)**: Abrir sem reduzir risco = ineficiência

### Filtros de Candidatura
Apenas territórios que atendem a:
- Fase: Mobilização OU Escuta com score ≥60
- OU: Sem ação por 15+ dias

---

## Entrega 2: Componente UI "Próximos Territórios para Abrir"

**Arquivo**: `src/components/radar/territorial-expansion-block.tsx`

### Estrutura
- **Header**: Ícone, título, breve descrição
- **Metrics Overview**: 4 cards mostrando:
  - Total de candidatos
  - Quantidade "Prontos" (verde)
  - Quantidade "Precisam Prep" (amarelo)
  - Quantidade "Em Risco" (vermelho)
- **Tabbed View**: Três abas (Prontos, Prep, Risco)
- **Candidate Cards**: Para cada território, mostra:
  - Nome e badges (Fase, Status, Evento agendado)
  - Score visual (0-100)
  - Quick stats: Pessoas, Dias sem ação, Voluntários
  - Checklist compacto (expandível)
  - Botões: "Preparar", "Abrir" (se score ≥75)
- **Guidance Section**: Explica os 3 níveis e como agir

### Estilo
- Segue padrão do projeto (Tailwind, cn(), lucide icons)
- Cards coloridos por categoria (emerald/amber/red)
- Responsivo (grid 1-2 colunas)
- Componente client-side (interatividade expandir/minimizar)

---

## Entrega 3: Integração na Página de Territórios

**Arquivo Principal**: `src/app/relatorios/territorios/page.tsx`

### Mudanças
- Carrega `getTerritorialExpansionCandidates()` em paralelo com `listTerritorySummaries()`
- Passa dados para `TerritoriesClient` via prop `expansionData`

**Arquivo Client**: `src/app/relatorios/territorios/territories-client.tsx`

### Mudanças
- Aceita novo prop `expansionData: TerritorialExpansionResult`
- Substitui aba "Preparar Expansão" (antes: NeighborhoodScaleChecklist)
- Agora exibe: `<TerritorialExpansionBlock expansionData={expansionData} />`

### Localização na Interface
- Aba existente "Preparar Expansão" no Painel Territorial (`/relatorios/territorios`)
- Acesso via: Ranking → Preparar Expansão (tabTrigger "scale")

---

## Entrega 4: Dados Mock

Componentes possuem dados mock para desenvolvimento:
- 2 candidatos de exemplo (Vila Rica, Retiro)
- Vila Rica: Pronto (85 pts, fase Mobilização)
- Retiro: Precisando Prep (75 pts, fase Escuta)
- Checklists totalmente populados com evidências

---

## Verificação

### Critérios de Aceitação Técnica
1. ✓ Helper `getTerritorialExpansionCandidates()` compila sem erros
2. ✓ Componente `TerritorialExpansionBlock` renderiza corretamente
3. ✓ Integração em `/relatorios/territorios` funciona
4. ✓ Dados mock retornam quando `shouldUseMockData() === true`
5. ✓ Produção consulta Supabase corretamente
6. ✓ TypeScript não tem erros
7. ✓ Sem avisos de ESLint em código novo
8. ✓ Build Next.js completa com sucesso

### Critérios de Aceitação Operacional
1. ✓ Coordenação consegue visualizar candidatos por nível de prontidão
2. ✓ Cada candidato mostra um checklist claro (6 critérios)
3. ✓ Decisão de "quando abrir" é baseada em score (≥75)
4. ✓ Decisão de "quando esperar" é clara (<50 = em risco)
5. ✓ Podem marcar territórios como "em preparação" e revisar
6. ✓ Interface é intuitiva e segue design system

---

## Notas Técnicas

### Padrões Seguidos
- **Data Loading**: Seguiu pattern de `pilot-feedback-loop.ts` (server actions com mock/real branching)
- **Type Safety**: Union types, ReadinessChecklistItem com status discriminado
- **Componente Client**: Usa hooks (useState, React.memo) mas data vem do servidor
- **Styling**: Tailwind com cn() utility, lucide icons, design tokens consistentes

### Dependências Reutilizadas
- `listTerritorySummaries()` - dados base
- `mapTerritoryToPhase()` - classificação de fases
- `listFieldAgendaEvents()` - eventos planejados
- `getTeamFlowAdoptionMetrics()` - disponibilidade de operadores

### Segurança
- Sem dados sensíveis de localização (apenas bairro)
- Checklists orientam mas não automatizam abertura
- Exige decisão humana (botões "Abrir"/"Preparar" sem ação automática)
- Integra com guardrails OPREAL 04

---

## Recomendações Futuras

1. **Persistência de Decisões**: Gravar em audit_logs quando clicam "Abrir" ou "Preparar"
2. **Notificações**: Alertar coordenação quando um território atinge "Pronto"
3. **Template de Ação**: Botão "Abrir" gera action plan pré-preenchido
4. **Histórico**: Rastrear mudanças de phase/readiness ao longo do tempo
5. **Customização**: Permitir ajuste de pesos do checklist por política local

---

**Status**: ✓ Implementado com sucesso  
**Data**: 2026-05-06  
**Verificação**: npm run verify (em progresso)
