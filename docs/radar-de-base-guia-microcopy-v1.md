# Guia de Microcopy e Linguagem Humana - Radar de Base (v1)

Este guia define o padrão de comunicação para o Radar de Base, focando em clareza, empatia e eficiência operacional para equipes não técnicas.

## Princípios de Linguagem
1. **Evitar tecnicismos**: Substituir termos de programação ou marketing (ex: "stale", "telemetria", "webhook") por termos cotidianos.
2. **Focar na Ação**: O texto deve dizer claramente o que o usuário deve fazer em seguida.
3. **Respeito e Ética**: Reforçar sempre o uso responsável dos dados e o foco em pautas coletivas.
4. **Tradução Contextual**: Não apenas traduzir do inglês, mas adaptar para o contexto de mobilização territorial.

## Glossário de Substituições

| Termo Técnico/Inglês | Termo Operacional Humano | Contexto |
| :--- | :--- | :--- |
| **Stale** | Parado / Sem resposta | Tarefas no Kanban sem movimento há dias. |
| **Telemetria** | Ritmo de Trabalho / Uso | Dashboard de estatísticas de uso da equipe. |
| **Observabilidade** | Visão da Operação | Seção de relatórios e monitoramento. |
| **Priorizado** | Pessoa para hoje / Próxima ação | Alguém identificado pelo Radar como importante. |
| **Snapshot** | Resumo dos Dados | Dados consolidados de um relatório. |
| **Tags** | Marcações | Categorias atribuídas a um comentário ou pessoa. |
| **Draft / Active / Done** | Rascunho / Em andamento / Concluído | Status de planos e tarefas. |
| **Squads** | Grupos de Trabalho | Divisão interna da equipe de voluntários. |
| **Taxonomia** | Categorias de Assunto | Organização dos temas de interesse. |
| **Vínculo** | Conversa / Relacionamento | A conexão entre o operador e o cidadão. |

## Estrutura de Telas (Padrão de 3 Perguntas)

Toda tela principal deve responder:
1. **O que é isso?** (Título claro e eyebrow contextual)
2. **Por que importa?** (Descrição curta explicando o valor daquela tela)
3. **O que fazer agora?** (CTA primário destacado)

### Exemplo: Dashboard
- **O que é**: Resumo da Operação.
- **Por que importa**: Para saber onde focar o esforço do dia e identificar gargalos.
- **O que fazer**: "Ver Pessoas Prioritárias" ou "Acompanhar meu trabalho".

## Padrão de CTAs

- **Primário**: Cor de destaque (Indigo), texto com verbo de ação claro (ex: "Registrar Resposta", "Assumir Tarefa").
- **Secundário**: Outline, para ações de apoio (ex: "Ver Histórico", "Exportar Dados").
- **Destrutivo**: Vermelho, apenas para ações irreversíveis (ex: "Arquivar", "Remover").

## Alertas e Mensagens de Erro
- **Erro**: Nunca mostrar apenas o código do erro. Explicar o que aconteceu de forma simples.
  - *Ruim*: "Error 500: Internal Server Error"
  - *Bom*: "Não conseguimos carregar os dados agora. Por favor, tente atualizar a página."
- **Orientações**: Usar `OperationalAlert` para dar dicas de "como trabalhar melhor".
