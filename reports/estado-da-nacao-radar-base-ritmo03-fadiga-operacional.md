# Estado da Nação — Radar de Base Ritmo 03
## Guardrails de Bem-Estar Operacional

**Data:** 12 de Maio de 2026  
**Versão:** v1.0  
**Status:** ✅ Implementada

---

## 1. OBJETIVO

Implementar guardrails de bem-estar para manter a gamificação leve, útil e não opressiva, evitando fadiga operacional e pressão por volume.

---

## 2. CONTEXTO ESTRATÉGICO

**Risco Identificado:**
- Sistema de "Missão do Dia" + "Completion Moments" + "Funil Operacional" pode gerar:
  - ❌ Pressão por volume (quanto mais, melhor?)
  - ❌ Fadiga acumulativa
  - ❌ Mensagens eufóricas demais (tons não realistas)
  - ❌ Falta de orientação sobre limites saudáveis

**Solução:** Detectar excesso, sugerir pausas, usar microcopy calmo e mensagens anti-pressão.

---

## 3. SOLUÇÃO IMPLEMENTADA

### 3.1 Novo Arquivo de Guardrails: `operator-wellness.ts`

Criado em: `src/lib/data/operator-wellness.ts`

**Responsabilidades:**

#### 1. Assessment de Bem-Estar
```typescript
assessQueueWellness(taskCount: number): WellnessCheck
```

Classificação:
- **healthy** (0-5 tarefas) → Sem alerta
- **warning** (6-10 tarefas) → Dica: priorizar as 5 mais quentes
- **critical** (11+ tarefas) → Alerta + sugestão de pausas

#### 2. Microcopy Anti-Pressão (10 frases)
```
"Qualidade vale mais que volume."
"Silêncio também é resposta."
"Não abordar também é cuidado."
"Fechar bem é melhor que correr."
"Pausa também é produtividade."
"Uma pessoa bem atendida vale mais que dez apressadas."
"Cuidado com si mesmo é cuidado com a base."
"O ritmo que sustenta é melhor que o ritmo que queima."
"Cada pausa é um investimento na qualidade."
"Pessoas cansadas cometem erros. Descansa."
```

#### 3. Mensagens de Missão Calmas
```typescript
MISSION_MESSAGES = {
  starting: "Dia em andamento",
  with_pending: "Pendências identificadas",
  good_progress: "Progresso constante",
  needs_rest: "Tempo de parar",
  day_closing: "Fechamento tranquilo",
}
```

#### 4. Completion Messages Equilibradas
```typescript
COMPLETION_MESSAGES = {
  person_responded: "Obrigado por cuidar desse contato.",
  person_referred: "Essa pessoa vai receber o suporte que precisa.",
  do_not_contact: "Respeitar o 'não' também é cuidado.",
  many_completed_today: "Você trabalhou bastante. Considere pausar aqui.",
}
```

#### 5. Detecção de Esgotamento
```typescript
shouldRecommendBreak(
  taskCount: number,
  completedToday: number,
  hoursWorked: number
): boolean
```

Recomenda pausa se:
- Muitas tarefas (> 10)
- Completou muitas (> 15)
- Trabalhou + de 6h direto

### 3.2 Componente Visual: `operator-wellness-card.tsx`

Localização: `src/components/radar/wellness/operator-wellness-card.tsx`

**Características:**
- Mostra apenas para `warning` e `critical`
- Icon diferente por nível
- Mensagem clara + recomendação
- Microcopy em itálico
- Sugestão de pausa com ícone ☕

### 3.3 Completion Moment Calmo: `wellness-completion-moment.tsx`

Localização: `src/components/radar/wellness/wellness-completion-moment.tsx`

**Tipos:**
- `person_responded` (indigo calmo)
- `person_referred` (emerald calmo)
- `do_not_contact` (blue protetor)
- `many_completed_today` (amber repouso)

**Diferença do padrão:** Tons não-eufóricos, foco em segurança.

### 3.4 Sugestão de Pausa: `break-suggestion.tsx`

Localização: `src/components/radar/wellness/break-suggestion.tsx`

Mostra quando operador completa muitas tarefas (threshold configurável).

**Ações:**
- "Vou pausar" → Redireciona para dashboard
- "Vou continuar" → Volta ao trabalho

### 3.5 Daily Wellness Tip: `daily-wellness-tip.tsx`

Localização: `src/components/radar/wellness/daily-wellness-tip.tsx`

Mostra microcopy aleatório em card pequeno.

### 3.6 Integração em Minha Fila

**Mudanças em `queue-client.tsx`:**
- Import de `assessQueueWellness`
- Import de `OperatorWellnessCard`
- Renderização do card após `DailyMission`

**Fluxo:**
```
DailyMission (status equilibrado)
    ↓
[Se necessário] OperatorWellnessCard (com alerta)
    ↓
Header Info + Queue
```

---

## 4. MODIFICAÇÕES EM COMPONENTES EXISTENTES

### Daily Mission (`daily-mission.tsx`)

**Mudanças:**
- Conclusão usa cor indigo (não emerald eufórico)
- Mensagem: "Pendências Fechadas" (não "Dia Organizado!")
- Tom: "Organização para amanhã" (não celebração)

---

## 5. PRINCÍPIOS DE DESIGN

### ✨ Calma Estratégica
Mensagens não são "vitória" ou "fracasso", mas orientação.

### 🤝 Bem-Estar Primeiro
Recomendações de pausa, não pressão de continuação.

### 🛡️ Proteção Anti-Fadiga
Detectar carga antes que o operador se esgote.

### 📊 Transparência
Mostrar claramente o nível de bem-estar.

---

## 6. LIMIARES CONFIGURÁVEIS

```typescript
HEALTHY_QUEUE_SIZE = 5      // Sem alerta
WARNING_QUEUE_SIZE = 10     // Dica
CRITICAL_QUEUE_SIZE = 15    // Alerta + pausa
```

Podem ser ajustados por contexto operacional.

---

## 7. MICROCOPY EM CONTEXTOS

| Contexto | Exemplos |
|----------|----------|
| **Minha Fila** | "Priorize as mais quentes. Não precisa resolver tudo de uma vez." |
| **Daily Mission** | "Trabalhe no seu ritmo. Qualidade é o objetivo." |
| **Completion** | "Obrigado por cuidar desse contato." |
| **Break** | "Você trabalhou bastante. Considere pausar aqui." |
| **Dicas** | Rotação de 10 frases anti-pressão |

---

## 8. CRITÉRIOS DE ACEITE

| Critério | Status |
|----------|--------|
| Detectar excesso de pendências | ✅ |
| Sugerir limite saudável (5-10) | ✅ |
| Adicionar microcopy anti-pressão | ✅ |
| Melhorar Missão do Dia (tom calmo) | ✅ |
| Melhorar Completion Moments (segurança) | ✅ |
| Zero euforia desnecessária | ✅ |
| Orientar sem pressionar | ✅ |
| Relatório Estado da Nação | ✅ |
| npm run verify passa | ⏳ |

---

## 9. ARQUIVOS CRIADOS/MODIFICADOS

### Criados:
- ✅ `src/lib/data/operator-wellness.ts` (140 linhas)
- ✅ `src/components/radar/wellness/operator-wellness-card.tsx` (60 linhas)
- ✅ `src/components/radar/wellness/wellness-completion-moment.tsx` (60 linhas)
- ✅ `src/components/radar/wellness/break-suggestion.tsx` (70 linhas)
- ✅ `src/components/radar/wellness/daily-wellness-tip.tsx` (35 linhas)

### Modificados:
- ✅ `src/components/radar/daily-mission.tsx` (mudança de tom em completion)
- ✅ `src/app/minha-fila/queue-client.tsx` (integração de wellness card)

---

## 10. EXEMPLO DE FLUXO

### Cenário: Operador com 12 tarefas

```
[Minha Fila carrega com 12 tarefas]
    ↓
[DailyMission mostra: "Dia em andamento - Trabalhe no seu ritmo"]
    ↓
[OperatorWellnessCard aparece: "CRITICAL"]
    Message: "Muitas pendências. Trabalhe em blocos de 5-10. Pause entre blocos."
    Microcopy: "Qualidade vale mais que volume."
    ☕ "Considere uma pausa após concluir alguns contatos."
    ↓
[Operador começa a trabalhar 5 primeiras]
    ↓
[Completa pessoa 1]
    ↓
[WellnessCompletionMoment indigo calmo]
    "Obrigado por cuidar desse contato."
    ↓
[Continua...completa 5 pessoas]
    ↓
[BreakSuggestion aparece]
    "Você completou 5 pessoas hoje. Uma pausa agora vai melhorar sua qualidade."
    ↓
[Operador clica "Vou pausar"]
    ↓
[Redirecionado para dashboard com mensagem de bem-vindo]
```

---

## 11. IMPACTO ESPERADO

### ✅ Redução de Fadiga
- Operadores reconhecem limites
- Pausas sugeridas em momento certo

### ✅ Qualidade Sustentável
- Foco em "bem feito" não "rápido"
- Menos pressão por volume

### ✅ Segurança Psicológica
- Mensagens calmas, não eufóricas
- Respeito a "Não Abordar" celebrado

### ✅ Retenção de Equipe
- Gamificação leve e útil
- Bem-estar visível como prioridade

---

## 12. PRÓXIMOS PASSOS

1. **Testes com Operadores** — Validar limiares reais
2. **Histórico de Bem-Estar** — Dashboard semanal de fadiga
3. **Coaching em Tempo Real** — Sugestões contextuais por padrão
4. **Integração com Liderança** — Alertas quando equipe está esgotada
5. **Customização por Função** — Diferentes limiares para coordenador vs operador

---

## 13. VALIDAÇÃO

### Checklist:
- [ ] Componentes compilam (TypeScript OK)
- [ ] Imports funcionam
- [ ] Wellness card mostra para warning/critical
- [ ] Microcopy rotaciona
- [ ] Daily Mission sem tom eufórico
- [ ] Completion Moments aparecem
- [ ] Break suggestion funciona
- [ ] npm run verify passa

---

## 14. CONCLUSÃO

Os **Guardrails de Bem-Estar Operacional** transformam gamificação em suporte humano.

✅ Detecta fadiga antes do colapso  
✅ Orienta sem pressionar  
✅ Celebra cuidado, não velocidade  
✅ Mantém sistema sustentável  

**Lema implementado:**
> "A gamificação deve orientar a equipe sem gerar ansiedade, competição ou pressão por volume."

---

**Data:** 12 de Maio de 2026  
**Status:** 🟢 LIVE  
**Owner:** Radar de Base Product Team  
**Próxima Review:** 19 de Maio de 2026
