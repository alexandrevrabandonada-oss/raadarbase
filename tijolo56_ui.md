# Tijolo 56 — Interface

## Rotas

- `/dashboard/inteligencia`: cinco KPIs, recortes rápidos, busca, filtros, ranking paginado, distribuições por tipo/cidade/fonte e exportações.
- `/dashboard/inteligencia/fontes`: conectores, estado, modo, saúde, última sincronização, contagem por fonte, importação e sincronização T55.
- `/dashboard/inteligencia/entidades/[id]`: score detalhado, localização e confiança, identificadores, evidências, relações, vínculo Instagram, notas, histórico, revisão e enriquecimento.
- `/dashboard/inteligencia/grafo`: SVG leve, filtros, profundidade de 1 a 3, confiança e indicação da evidência/fonte.

A navegação lateral ganhou “Hub de Inteligência” e preserva “Radar de Influência”. Foram reutilizados AppShell, PageHeader e componentes shadcn existentes, respeitando o tema visual e dark mode do projeto.

## Responsividade e acessibilidade

O dashboard não produz overflow horizontal global em 390 px; tabelas e o SVG têm rolagem local quando necessário. Formulários possuem labels, o grafo tem papel e nome acessível, estados assíncronos usam `role=status` e ações possuem nomes claros.

## Fluxos

Importação e sincronização retornam resumo de processados/novos/atualizados. A ficha permite recalcular score, solicitar revisão de identidade, registrar nota e decidir sugestões pendentes. Aprovar merge cria uma equivalência explícita e preserva histórico; não apaga a entidade secundária.
