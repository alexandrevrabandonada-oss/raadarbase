# Radar de Base - Redesign UX v1

Este documento estabelece o plano de redesign visual e operacional do Radar de Base, focado em reduzir a carga cognitiva dos operadores e unificar a linguagem visual do sistema sem alterar a lógica de negócio validada.

## Diagnóstico Visual
O sistema atual é funcional e robusto, mas apresenta uma carga cognitiva elevada devido ao excesso de itens de navegação e inconsistências visuais entre páginas. A hierarquia de ações não é clara o suficiente para novos operadores, e a interface mobile sofre com elementos de navegação pouco intuitivos.

## Problemas Principais
1. **Sidebar/Navegação:** Excesso de itens (11+) causa paralisia de decisão. No mobile, o scroll horizontal de categorias é pouco intuitivo.
2. **Hierarquia de Ações:** Botões de ação principal (ex: "Assumir Vínculo") competem visualmente com botões de informação secundária.
3. **Consistência:** Diferentes estilos de cards, botões e badges entre `/dashboard`, `/pessoas` e `/abordagem`.
4. **Mobile:** Muitos elementos são cortados ou comprimidos excessivamente, especialmente banners de alerta que ocupam muito espaço vertical.

## Princípios do Novo Visual
- **Menos é Mais:** Reduzir o ruído visual e focar exclusivamente na "Próxima Melhor Ação".
- **Semântica de Cores:** Utilizar uma paleta consistente para indicar urgência (Quente/Frio/Atenção) e estados de tarefas.
- **Navegação em Camadas:** Agrupar os itens da sidebar por contexto de uso (Operação Diária, Estratégia/Análise, Base/Cadastro).
- **Foco no Operador:** Minimizar cliques para as ações mais repetitivas (copiar mensagem, marcar envio).

## Proposta de Nova Hierarquia (Sidebar Simplificada)
Agrupamento lógico para reduzir a sidebar de 11+ para 4 blocos claros:

- **Operação (Foco do Dia)**
  - Rotina do Dia (atual `/pessoas`)
  - Quadro de Vínculos (atual `/abordagem`)
  - Biblioteca de DMs (atual `/mensagens`)
- **Estratégia (Análise)**
  - Resultados (Dashboard)
  - Relatórios (Snapshot)
- **Base (Gestão)**
  - Pessoas (Lista completa/Importação)
  - Voluntários
  - Campo
- **Sistema**
  - Configurações
  - Governança

## Proposta de Dashboard Operacional
- **Top Bar:** Indicadores de saúde do dia (Metas de abordagem/respostas).
- **Destaque Central:** "Top Pessoas Quentes" — um feed prioritário de quem interagiu recentemente.
- **Alertas Críticos:** Banners mais compactos e dispensáveis.
- **Score Operacional:** Visualização gráfica da eficiência da semana (não punitiva).

## Proposta de Novo Card de Pessoa
- **Status Proeminente:** Uso de badges com cores semânticas (ex: Verde para "Respondeu", Laranja para "Pendente").
- **Avatar Dinâmico:** Iniciais ou foto do IG maior para humanizar o contato.
- **Contexto Temporal:** "Última interação há X min" em vez de apenas a data completa.
- **Tags de Tema:** Badges compactos no rodapé do card.

## Lista de Melhorias por Prioridade

### P1 (Imediato - Baixo Impacto Técnico)
- [ ] Implementar Sidebar em camadas (agrupamentos).
- [ ] Padronizar Variantes de Buttons e Badges (unificar estilos de `/abordagem` e `/dashboard`).
- [ ] Otimizar banners de alerta mobile (reduzir padding/font-size).

### P2 (Próximo Ciclo)
- [ ] Dashboard com seção de "Top Pessoas Quentes".
- [ ] Checklist de Rotina interativo (checkboxes persistentes por sessão).
- [ ] Padronização de Cores Semânticas (Quente/Frio).

### P3 (Polimento)
- [ ] Estados vazios (Empty States) com ilustrações leves e CTAs claras.
- [ ] Tooltips para termos técnicos de governança.
- [ ] Transições suaves entre colunas do Kanban.
