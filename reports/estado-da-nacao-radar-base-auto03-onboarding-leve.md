# Relatório de Onboarding Leve e Orientação Operacional (Auto03)

Este relatório detalha a implementação do sistema de onboarding interativo e persistente no Radar de Base, projetado para capacitar novos operadores sem a necessidade de treinamentos formais extensos.

## 1. Componente: LightweightOnboarding

Desenvolvemos o componente `LightweightOnboarding` (`src/components/radar/onboarding/lightweight-onboarding.tsx`), que oferece:
- **Tours por Tela**: Até 3 destaques (highlights) específicos por funcionalidade.
- **Persistência Local**: Salva o estado de visualização no navegador para não ser intrusivo.
- **Revisibilidade**: Opção "Ver tour de novo" disponível em todas as telas para refrescar a memória.
- **Design de Faixa**: Estética de banner integrada ao topo da página, mantendo a visibilidade sem bloquear o fluxo de trabalho.

## 2. Conteúdo e Orientações por Rota

### Dashboard
- **Foco**: Pulso da operação e identificação de urgências.
- **Guardrail**: Alerta sobre a fragilidade do vínculo se houver atraso na resposta.

### Minha Fila
- **Foco**: Trabalho focado um-a-um e personalização de mensagens.
- **Guardrail**: Proibição de envio de mensagens sem personalização contextual.

### Prioridades da Equipe (Pessoas)
- **Foco**: Distribuição de responsabilidades e uso de filtros operacionais.
- **Guardrail**: Proibição de alteração de status sem contato manual efetivo.

### Gestão de Conversas (Abordagem)
- **Foco**: Evolução visual do relacionamento territorial.
- **Guardrail**: Respeito absoluto ao status "Não Abordar" e ética de consentimento.

### Mapa de Assuntos (Temas)
- **Foco**: Identificação de pautas coletivas e temas quentes.
- **Guardrail**: Foco exclusivo em assuntos públicos, protegendo dados sensíveis.

## 3. Qualidade e Integridade Técnica
- **Build**: Verificado com `npm run verify` (Passou).
- **Estilo**: Padronizado com o Radar Design System, utilizando tons de índigo e ícones do Lucide.
- **Resiliência**: Implementada lógica de hidratação segura para Next.js, evitando erros de SSR com `localStorage`.

---
Com esta implementação, o Radar de Base torna-se um sistema "vivo" que guia o operador em seus primeiros passos, reforçando constantemente as práticas éticas e operacionais necessárias para o sucesso da mobilização.
