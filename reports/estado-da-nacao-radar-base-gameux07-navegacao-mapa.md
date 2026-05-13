# Estado da Nacao - Radar de Base GAMEUX07

Data: 2026-05-13

## Objetivo

Transformar a navegacao lateral e os atalhos principais em uma experiencia de mapa de mundos e sala de comando, sem quebrar rotas existentes.

## Mudancas implementadas

- Sidebar reorganizada por grupos narrativos:
  - Base
  - Jornada
  - Territorio
  - Campo
  - Memoria
  - Comando
  - Sistema
- Renomeacao visual das entradas principais:
  - `/dashboard` -> Base de Operacoes
  - `/minha-fila` -> Minha Jornada
  - `/pessoas` -> Prioridades da Equipe
  - `/abordagem` -> Mural de Missoes
  - `/mensagens` -> Modelos de Mensagem
  - `/relatorios/territorios` -> Mapa da Mobilizacao
  - `/campo` -> Missoes de Campo
  - `/ritmo` -> Central de Ritmo
  - `/memoria` -> Memoria da Equipe
- Estado ativo da sidebar reforcado com:
  - icone em slot proprio
  - fundo e borda fortes
  - microcopy curta por item
  - leitura visual mais proxima de portal/sala de comando do que lista simples
- Menu mobile reestruturado para aparecer como mapa de mundos, com cabecalho proprio e grupos mais legiveis.
- Dashboard alinhado ao mesmo modelo com `Mapa Rapido` em seis portais:
  - Base
  - Jornada
  - Mapa
  - Campo
  - Ritmo
  - Memoria

## Arquivos alterados

- `src/components/sidebar.tsx`
- `src/components/app-shell.tsx`
- `src/app/dashboard/dashboard-client.tsx`

## Decisoes

- Mantive as rotas existentes e alterei apenas a camada visual e a arquitetura de navegacao.
- Usei `/relatorios/territorios` como entrada visual principal do mapa territorial, preservando o alias existente quando necessario.
- Agrupei superficies nao citadas explicitamente em `Comando` e `Sistema` para evitar uma sidebar longa e sem narrativa.

## Riscos restantes

- O menu lateral ainda convive com algumas paginas legadas que usam nomenclaturas internas antigas dentro do conteudo da tela; a navegacao ja aponta para o novo mundo, mas nem toda pagina reforca isso no primeiro viewport.
- Ainda existem warnings antigos de lint em areas nao tocadas por esta tarefa.

## Resultado

A equipe passa a ler o produto como areas conectadas da operacao. A sidebar deixa de ser uma lista solta de telas e vira um mapa de mundos com linguagem consistente com Base de Operacoes, Jornada, Territorio, Campo, Ritmo e Memoria.
