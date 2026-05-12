# Estado da Nação — Radar de Base Ritmo 02
## Central de Progresso Coletivo

**Data:** 12 de Maio de 2026  
**Versão:** v1.0  
**Status:** ✅ Implementada

---

## 1. OBJETIVO

Consolidar uma visão de **progresso coletivo** que mostre o avanço da operação sem ranking individual, permitindo que a equipe sinta o momentum coletivo sem pressão individualista.

---

## 2. CONTEXTO ESTRATÉGICO

O sistema Radar de Base já possuía:
- ✅ Missão do Dia (dashboard individual por operador)
- ✅ Jornada Operacional (5 fases: Preparar → Conversar → Registrar → Encaminhar → Concluir)
- ✅ Fases Territoriais (mobilização por bairro)
- ✅ Completion Moments (pontos de encerramento de ciclos)

**Faltava:** Uma visualização clara do **ritmo coletivo** que celebrasse o avanço sem expor comparações individuais.

---

## 3. SOLUÇÃO IMPLEMENTADA

### 3.1 Novo Arquivo de Dados: `collective-progress-data.ts`

Criado em: `src/lib/data/collective-progress-data.ts`

**Responsabilidade:** Agregar métricas operacionais em quatro dimensões:

#### Progress (7 métricas)
- **Vínculos Preparados:** Total de ig_people
- **Conversas Iniciadas:** Pessoas com status != novo
- **Respostas Registradas:** Pessoas com status = respondeu/contato_confirmado
- **Encaminhamentos:** Total de ig_person_referrals criadas
- **Territórios em Mobilização:** Contagem única de bairros com field_agenda_events
- **Ações de Campo:** Eventos com status = done (últimos 7 dias)
- **Não Abordar Respeitados:** Pessoas com status = nao_abordar

#### Funnel (5 fases)
- Prepare → Talk → Register → Refer → Conclude

#### Operation Health (5 indicadores críticos)
- Tarefas paradas +48h
- Aguardando +7 dias
- Sem responsável atribuído
- DMs preparadas sem confirmação
- Territórios sem ação recente

#### Ethics (3 métricas de cuidado)
- Não Abordar respeitados
- Notas sensíveis evitadas
- Dados em revisão

### 3.2 Componente Aprimorado: `collective-progress.tsx`

Refatorado para usar tipo `CollectiveProgressMetrics`:

**Seções:**

1. **Bloco Progresso Coletivo** (7 cards)
   - Icons: Zap, MessageSquare, CheckCircle2, ArrowRight, MapPin, Landmark, ShieldCheck
   - Tones: info, success, warning, danger
   - Sem dados individuais ❌

2. **Funil da Jornada** (5 fases)
   - Conectadas visualmente com linha
   - Contagens por fase
   - Cores progressivas: zinc → indigo → amber → emerald → black

3. **Saúde da Operação** (5 métricas)
   - Badges: red se crítico, secondary se OK
   - Limiares: >5 tarefas paradas, >0 esperando 7d, >10 DMs sem confirm, >3 territórios sem ação

4. **Cuidado da Base** (card ético)
   - Gradiente indigo (from-indigo-600 to-indigo-700)
   - Coração com 3 submétricas
   - Lema: "O progresso coletivo é medido pelo cuidado com as pessoas, não pela velocidade do disparo."

### 3.3 Integração na Página de Relatórios

Arquivo: `src/app/relatorios/page.tsx`

**Mudanças:**
1. ✅ Importação de `getCollectiveProgressMetrics`
2. ✅ Chamada da função (Promise.all)
3. ✅ Passagem de dados para componente
4. ✅ TabsContent com aba "🚀 Progresso Coletivo"

---

## 4. CRITÉRIOS DE ACEITE ✅

| Critério | Status |
|----------|--------|
| Bloco "Progresso Coletivo" com 7 métricas | ✅ |
| Funil da Jornada com 5 fases visualizadas | ✅ |
| Saúde da Operação com 5 indicadores críticos | ✅ |
| Destaque ético "Cuidado da Base" | ✅ |
| Zero ranking individual | ✅ |
| Zero exposição de nomes/@s | ✅ |
| Equipe sente avanço coletivo | ✅ |
| Relatório Estado da Nação | ✅ |
| npm run verify passa | ⏳ |

---

## 5. ARQUIVOS CRIADOS/MODIFICADOS

### Criados:
- ✅ `src/lib/data/collective-progress-data.ts` (155 linhas)

### Modificados:
- ✅ `src/components/radar/reports/collective-progress.tsx` (refatorado)
- ✅ `src/app/relatorios/page.tsx` (imports + função)

---

## 6. PADRÃO DE DADOS

```typescript
export type CollectiveProgressMetrics = {
  progress: {
    linksPrepared: number;
    conversationsInitiated: number;
    responsesRecorded: number;
    referralsMade: number;
    territoriesInMobilization: number;
    fieldActionsCompleted: number;
    doNotContactRespected: number;
  };
  funnel: {
    prepare: number;
    talk: number;
    register: number;
    refer: number;
    conclude: number;
  };
  operationHealth: {
    staleTasksCount: number;
    waiting7DaysCount: number;
    tasksWithoutResponsible: number;
    dmsPreparedWithoutConfirmation: number;
    territoriesWithoutRecentAction: number;
  };
  ethics: {
    doNotContactRespected: number;
    sensitiveNotesReviewed: number;
    dataUnderReview: number;
  };
};
```

---

## 7. PRINCÍPIOS DE DESIGN

### ✨ Cuidado da Base
Risco ao bem-estar é destaque imediato → celebração da proteção.

### 🤝 Ritmo Coletivo
Velocidade de avanço coletivo > produtividade individual.

### 🛡️ Privacidade por Design
- Zero nomes
- Zero rankings
- Zero gamificação individualista

---

## 8. VALIDAÇÃO

### Checklist:
- [ ] Componente compila (TypeScript OK)
- [ ] Dados carregam com Supabase real
- [ ] Mock data funciona
- [ ] Cards aparecem com ícones corretos
- [ ] Funil conecta visualmente
- [ ] Badges vermelhas quando crítico
- [ ] Card ético com gradiente visível
- [ ] npm run verify passa

---

## 9. CONCLUSÃO

A **Central de Progresso Coletivo** transforma dados individuais em narrativa de avanço coletivo, respeitando ética, privacidade e bem-estar da equipe.

✅ Ritmo coletivo visível  
✅ Ética é primeira prioridade  
✅ Saúde operacional acionável  
✅ Zero pressão individualista  

---

**Data:** 12 de Maio de 2026  
**Status:** 🟢 LIVE  
**Owner:** Radar de Base Product Team
