# Estado da Nação - Radar de Base UX01: Diagnóstico Visual

## Visão Geral
Auditoria realizada em 07/05/2026 cobrindo as rotas principais: `/dashboard`, `/pessoas`, `/abordagem`, `/mensagens`, `/relatorios`, `/voluntarios` e `/campo`. O sistema encontra-se em estado funcional ("Green Build"), mas com alto potencial de refinamento estético e ergonômico.

## Diagnóstico por Página

### 1. Dashboard (Resultados)
- **Pontos Positivos:** Dados em tempo real e funil de conversão claros.
- **Críticas:** Ocupação ineficiente do espaço vertical; botões de ação ("Exportar", "Atualizar") com pesos visuais inconsistentes.

### 2. Pessoas (Rotina do Dia)
- **Pontos Positivos:** Foco claro no checklist de 7 dias.
- **Críticas:** Os filtros superiores são muitos e competem por espaço com a lista; o checklist é estático (não persistente como tarefa concluída).

### 3. Perfil da Pessoa (`/pessoas/[id]`)
- **Pontos Positivos:** Ação principal em destaque.
- **Críticas:** Informações de "Responsável" e "Tags" poderiam ser mais compactas para focar no histórico de interações.

### 4. Quadro de Vínculos (`/abordagem`)
- **Pontos Positivos:** Visual Kanban moderno.
- **Críticas:** Utiliza uma paleta de cores (Sky Blue) que não se repete no resto do sistema, que é predominantemente cinza e preto.

### 5. Biblioteca de DMs (`/mensagens`)
- **Pontos Positivos:** Visualização de templates eficiente.
- **Críticas:** Ocupa uma rota inteira para algo que poderia ser um componente lateral ou modal acessível de dentro do perfil da pessoa.

## Análise de Responsividade (Mobile)
- **Navegação:** O uso de tabs horizontais que requerem scroll no topo é o maior ponto de fricção.
- **Espaçamento:** Banners de governança e alertas amarelos são muito altos, empurrando o conteúdo principal para baixo da dobra (above the fold).

## Conclusão de Prontidão
O sistema está **apto para operação real**, porém o redesign proposto no documento `docs/radar-de-base-redesign-ux-v1.md` é recomendado para evitar erros operacionais por cansaço visual e melhorar a retenção de operadores na plataforma.

---
**Auditado por:** Antigravity AI
**Data:** 07 de Maio de 2026
**Status:** Plano de Redesign em aprovação.
