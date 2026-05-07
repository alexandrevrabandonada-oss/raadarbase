# Estado da Nação RB05 - Mensagens e Roteiro de Abordagem

Data: 2026-05-07

## Objetivo Concluído

A página `/mensagens` foi transformada em uma biblioteca operacional robusta e um roteiro de abordagem estratégico para a equipe do Radar de Base. O foco foi garantir uma comunicação humana, sem spam e sem pedidos de voto durante a pré-campanha.

## Alterações Realizadas

### 1. Camada de Dados e Tipos
- **Banco de Dados**: Criação da migration `031_message_templates_enhancement.sql` adicionando as colunas `category` e `when_to_use` na tabela `message_templates`.
- **Tipos TypeScript**: Atualização do tipo `MessageTemplate` para incluir os novos campos operacionais.
- **Mock Data**: Atualização dos dados de teste para refletir a nova estrutura.
- **Data Layer**: Ajuste nas funções de listagem e mapeamento em `src/lib/data/messages.ts` e `src/lib/data/people-priority.ts`.
- **Server Actions**: Atualização de `upsertMessageTemplate` para persistir os novos campos.

### 2. Biblioteca de Templates
Foram inseridos 10 templates base cobrindo as principais situações de abordagem:
- Comentou uma denúncia
- Respondeu story
- Apoio silencioso (Sempre curte)
- Como ajudar
- Convite para evento de pré-campanha
- Convite para Missão ÉLuta
- Apoio leve (Pouco tempo)
- Apoio presencial
- Acolhimento de relato
- Respeito ao não contato

### 3. Interface do Usuário (UI/UX)
- **Roteiro Diário**: Adição de um checklist operacional lateral para guiar o fluxo de trabalho da equipe.
- **Guardrails Éticos**: Exposição visível das regras de ouro da pré-campanha (não ao spam, não ao pedido de voto, proteção de dados sensíveis).
- **Cartões de Mensagem**: Redesign completo com badges de categoria, instruções de uso ("Quando usar"), aviso de revisão manual e selo de "Pré-campanha segura".
- **Interatividade**: Botão de cópia rápida e formulário de criação/edição atualizado.

### 4. Inteligência de Sugestão
- A lógica de sugestão de mensagens em `/pessoas/[id]` foi aprimorada para priorizar templates por categoria quando há correspondência de contexto (ex: se o tema for "story", sugere o template de Resposta de Story).

## Guardrails e Segurança
- Mantida a filosofia de **envio manual**: o sistema sugere e facilita a cópia, mas o envio real acontece no Instagram por um humano.
- Avisos constantes de "Revise antes de enviar" para garantir a personalização e o tom humano.
- Etiquetas explícitas de conformidade com a legislação de pré-campanha.

## Verificação Realizada
- **Build**: Passou sem erros (Turbopack).
- **Lint**: Passou com avisos conhecidos, sem erros fatais.
- **RLS e Health**: Verificações de segurança e integridade aprovadas.
- **Manual**: Templates inseridos e mapeados corretamente.

## Próximos Passos
- **RB06**: Consolidar o histórico de encaminhamentos para eventos de campo e voluntariado de forma individualizada.
- Monitorar o uso da biblioteca para identificar novos padrões de abordagem necessários.
