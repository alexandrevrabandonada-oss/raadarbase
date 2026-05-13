# Estado da Nacao - Radar Base GameUX03

## Escopo

Redesign da jornada do operador para que `/minha-fila`, `/pessoas`, `Ficha Rapida` e `/abordagem` funcionem como uma trilha guiada de missoes, e nao como superfícies de CRM.

## Entregas

- `/minha-fila` reposicionada como tela principal do operador com hero operacional, missao atual, progresso do dia, alerta de bem-estar, proxima missao e fila das proximas 5 missoes.
- Cards da fila reestilizados como missoes ativas com faixa de fase, contexto, acao principal, estado de espera/bloqueio, progresso de jornada e CTA forte para iniciar etapa.
- Cards e lista de `/pessoas` reescritos como cards de missao, reduzindo sinais de ranking e score individual na interface do operador.
- `Ficha Rapida` convertida para leitura de painel de missao, com foco em fase atual, contexto, objetivo e acao, registro, encaminhamento e conclusao.
- `/abordagem` reestruturada como `Mural de Missoes`, agrupando o fluxo real em cinco colunas visuais: `Preparar`, `Conversar`, `Registrar`, `Encaminhar` e `Concluir`.
- Completion moments ajustados para linguagem de fechamento de ciclo e CTA claro para proxima missao.

## Arquivos principais

- `src/app/minha-fila/page.tsx`
- `src/app/minha-fila/loading.tsx`
- `src/app/minha-fila/queue-client.tsx`
- `src/app/minha-fila/queue-card.tsx`
- `src/app/minha-fila/queue-list.tsx`
- `src/app/pessoas/page.tsx`
- `src/components/radar/person-priority-card.tsx`
- `src/components/radar/person-operational-list.tsx`
- `src/components/radar/person-quick-sheet.tsx`
- `src/app/abordagem/page.tsx`
- `src/app/abordagem/loading.tsx`
- `src/app/abordagem/kanban-client.tsx`

## Direcao aplicada

- O operador sempre enxerga o proximo passo.
- A fase atual da jornada fica visivel na fila, nos cards e na ficha.
- O sistema usa linguagem cooperativa de missoes, jornada, trilha, mural, ciclo e encaminhamento.
- O fluxo foi reorganizado para parecer campanha em andamento, sem infantilizar nem gamificar por pontuacao individual.
- Guardrails eticos permanecem explicitos em pontos de decisao e envio manual.

## Risco residual

- O fluxo de conclusao visual depende dos toasts e estados locais ja existentes; ha ganho claro de narrativa, mas futuras iteracoes podem aprofundar animacoes dedicadas e continuidade entre rotas.
