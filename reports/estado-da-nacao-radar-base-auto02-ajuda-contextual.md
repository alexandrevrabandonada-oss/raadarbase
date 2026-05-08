# Relatório de Ajuda Contextual e Orientação Prática (Auto02)

Este relatório detalha a implementação da camada de orientação guiada no Radar de Base, tornando a interface autoexplicativa e ergonômica para novos operadores.

## 1. Novo Componente: ContextHelpCard

Criamos o componente `ContextHelpCard` (`src/components/radar/context-help-card.tsx`), que fornece uma estrutura padronizada de ajuda em três pontos:
- **O que é esta tela**: Definição clara do propósito da funcionalidade.
- **Por que importa**: Valor estratégico da tela para a operação/campanha.
- **O que fazer agora**: Instrução prática e imediata para o operador.

O card é recolhível por padrão para economizar espaço vertical após a primeira leitura, mantendo a interface limpa.

## 2. Implementação por Rota

A ajuda contextual foi integrada nas seguintes páginas:

- **Dashboard**: Orientação sobre a central de comando e identificação de urgências.
- **Minha Fila**: Foco no contato humano um-a-um e uso da Ficha Rápida.
- **Prioridades da Equipe**: Como usar os filtros de status e identificar quem precisa de "dono".
- **Gestão de Conversas (Kanban)**: Explicação sobre o fluxo de evolução do relacionamento.
- **Biblioteca de Mensagens**: Uso ético e personalização dos modelos de DM.
- **Acompanhamento do Trabalho**: Como a coordenação deve ler os dados agregados.
- **Base de Voluntários**: Mobilização por bairro e habilidade para ações práticas.
- **Mapa de Assuntos**: Análise de tendências e dores do território.

## 3. Empty States Práticos

Os estados vazios (`EmptyState`) foram transformados de simples mensagens de "sem dados" em guias de ação:
- Sugestões de como "destravar" a tela (ex: assumir tarefas, mudar filtros).
- Linguagem mais acolhedora e orientadora.
- Links diretos para as ações primárias de configuração ou operação.

## 4. Validação Técnica
- Build verificado com `npm run verify` (Passou).
- Responsividade mobile mantida: os cards de ajuda adaptam-se bem a telas menores.
- Tipagem TypeScript rigorosa implementada no novo componente.

---
Com esta camada, o Radar de Base atinge um novo patamar de "explainability", reduzindo a curva de aprendizado da equipe e garantindo que a operação siga os princípios éticos e estratégicos estabelecidos.
