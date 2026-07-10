# Tijolo 55 — Interface

## Rotas

- `/dashboard/influencia`: painel, KPIs, rankings, busca, filtros, relatórios, importação e atualização.
- `/dashboard/influencia/[id]`: dados, score, evidências, histórico, classificação e observações.

## Componentes

- Componentes shadcn existentes: `Button`, `Card`, `Badge`, `Input`, `Textarea`.
- `Field` foi adicionado pelo CLI oficial do shadcn para composição acessível dos formulários.
- `VirtualizedProfileTable` calcula a janela visível com overscan e mantém paginação server-side.
- Tokens semânticos do tema preservam o dark mode existente.

## Rankings rápidos

Top 100, Volta Redonda, Barra Mansa, Resende, Sul Fluminense, Empresas, Imprensa, Política, Sindicatos, Professores, Médicos e Comércio.

## Relatórios visuais

Distribuição por categoria, cidade e faixa de seguidores; o ranking geral e os filtros formam os relatórios Top Influenciadores, Top Regional e Ranking Geral.

## Estados

- Loading dedicado.
- Estado vazio para filtros sem resultado.
- Erro de runtime com mensagem operacional existente.
- Feedback de importação e fila em região `role=status`.
- Layout verificado em Desktop Chrome e Mobile Chrome.

