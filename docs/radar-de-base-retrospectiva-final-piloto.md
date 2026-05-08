# Retrospectiva Final: Piloto Radar de Base (7 Dias)

Este documento consolida os aprendizados, métricas e percepções da equipe após a primeira semana de operação real.

## 📊 1. Consolidação Quantitativa

| Métrica | Valor (Piloto) | Observação |
| :--- | :--- | :--- |
| **Total de Pessoas Priorizadas** | 451 | Base real inicial do Instagram. |
| **Tarefas Assumidas** | 184 | ~40% da base prioritária teve um responsável. |
| **DMs Registradas** | 126 | Interações manuais documentadas no sistema. |
| **Respostas Recebidas** | 72 | Pessoas que evoluíram para "Respondeu". |
| **Encaminhamentos Realizados** | 34 | Conversão real para eventos, grupos ou missão. |
| **"Não Abordar" (Proteção)** | 12 | Pessoas que pediram privacidade e foram protegidas. |
| **Tarefas Paradas (>48h)** | 42 | Principal gargalo: acompanhamento após primeiro envio. |

### Funil de Conversão do Piloto
1. **Priorização**: 451
2. **Abordagem (DM)**: 126 (28%)
3. **Engajamento (Resposta)**: 72 (16% do total / 57% das abordagens)
4. **Conversão (Encaminhamento)**: 34 (7.5% do total / 47% das respostas)

---

## 🗣️ 2. Voz da Equipe (Qualitativo)

### O que foi fácil?
- **Ficha Rápida**: A "colinha" de pautas facilitou muito o início das conversas.
- **Copia e Cola de Convites**: Economizou tempo e evitou erros de digitação de links.
- **Quadro Kanban**: Visualizar o progresso deu sensação de "trabalho andando".

### O que confundiu?
- **Troca de Status**: Às vezes o operador mandava a DM mas esquecia de mover o card no Kanban.
- **Duplicidade**: Algumas pessoas comentaram em vários posts e apareceram "várias vezes" (precisa de melhor deduplicação visual).
- **Notificações**: Senti falta de saber quando alguém respondeu no Instagram sem ter que abrir o app da Meta.

### Onde a equipe travou?
- **Momento do Encaminhamento**: Dúvida sobre "para qual grupo mandar" quando a pessoa tem múltiplos interesses.
- **Fechamento do Dia**: A telemetria agregada é boa, mas o operador quer ver seu "próprio placar" com mais destaque.

---

## 💡 3. Plano de Evolução (Pós-Piloto)

### 🔴 Melhorias Urgentes (Bugs e Bloqueios)
- [ ] **Deduplicação de Visualização**: Garantir que uma pessoa com 10 interações apareça como um único card potente.
- [ ] **Alerta de Inatividade**: Melhorar o destaque visual de cards parados há mais de 24h (cor mais vibrante).
- [ ] **Auto-Move**: Explorar se podemos mover o card para "Esperando Resposta" automaticamente após clicar em "Copiar DM".

### 🟡 Melhorias Importantes (UX e Processo)
- [ ] **Placar Individual**: Widget na "Minha Fila" com "Minhas Conversões da Semana".
- [ ] **Busca Global**: Facilitar achar uma pessoa específica pelo username em qualquer tela.
- [ ] **Templates por Território**: Ajustar mensagens baseadas no bairro detectado.

### 🔵 Melhorias Futuras (Escalabilidade)
- [ ] **IA de Sugestão de Tema**: Usar LLM local para sugerir a classificação do comentário (hoje é manual/regex).
- [ ] **Agenda Integrada**: Ver os eventos de campo diretamente no mapa da cidade.

### ⚖️ Decisões Éticas e Políticas
- **Manutenção do Contato Manual**: Decidido manter 100% manual. O atrito do "copy-paste" é um guardrail saudável contra spam.
- **Dados Sensíveis**: Reforçar que o campo "Notas" não deve conter orientações de voto ou religião.

---
**Conclusão**: O piloto provou que o Radar de Base transforma o "caos do Instagram" em uma lista de trabalho organizada. O foco agora é **reduzir o atrito de registro** para que o sistema reflita a realidade em tempo real.
