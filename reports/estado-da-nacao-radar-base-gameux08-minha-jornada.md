# Estado da Nacao - Radar de Base GAMEUX08

Data: 2026-05-13

## Objetivo

Transformar `/minha-fila` na principal superficie do operador, com leitura de trilha de missao, proximo passo claro e ritmo sustentavel para um dia inteiro de trabalho.

## Mudancas implementadas

- Renomeacao visual de `Minha Fila` para `Minha Jornada`.
- Hero do operador redesenhado com:
  - missao de hoje
  - fase atual
  - progresso do dia
  - carga saudavel
  - CTA `Continuar Jornada`
- Criado bloco dedicado de `Próxima Missão` com:
  - pessoa
  - motivo
  - fase atual
  - bloqueios
  - mensagem sugerida
  - CTA principal
- Trilha das proximas missoes redesenhada como caminho visual de cinco pontos, em vez de lista neutra.
- Integracao de bem-estar operacional com:
  - sugestao de trabalhar em bloco de 5
  - sugestao de pausa quando a carga sobe
  - CTA de redistribuicao para coordenacao em cenarios de sobrecarga
- Mantido completion moment calmo no card principal, com feedback leve e botao `Próxima missão`.

## Arquivos alterados

- `src/app/minha-fila/page.tsx`
- `src/app/minha-fila/loading.tsx`
- `src/app/minha-fila/queue-client.tsx`
- `src/app/minha-fila/queue-list.tsx`

## Decisoes

- Preservei `QueueCard` como superficie de execucao da missao porque ele ja concentrava a acao principal do operador.
- O redesign foi feito ao redor do card principal: hero, proxima missao, trilha curta e bloco de bem-estar.
- A trilha mostra apenas as proximas cinco missoes para reforcar foco e evitar sensacao de CRM infinito.

## Riscos restantes

- A redistribuicao continua entrando pelo mural de missoes; nao foi criado um fluxo novo de coordenacao.
- O estado de conclusao ainda depende do card principal e do toast global; se a equipe quiser um ritual mais forte, isso deve virar uma iteracao propria de motion e feedback.

## Resultado

`/minha-fila` agora funciona como `Minha Jornada`: uma trilha de missao com hero operacional, proxima missao explicita, caminho visual curto e cuidado com o ritmo do operador. A sensacao geral fica muito menos de CRM e muito mais de jornada guiada de trabalho cooperativo.
