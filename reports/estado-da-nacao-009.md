# Relatório de Estado: Tijolo 09 — Taxonomia de Temas

**Data:** 28 de Abril de 2026
**Status:** Concluído ✅
**Objetivo:** Criar uma camada de taxonomia de temas para organizar posts e interações por pauta pública, sem perfilamento político individual.

## 1. Visão Geral
Implementamos um sistema de classificação de conteúdo baseado em pautas (saúde, transporte, educação, etc.). O sistema utiliza regras simples de palavras-chave para sugerir temas, que devem ser confirmados por um operador humano. Foram estabelecidas travas técnicas e éticas rigorosas para impedir o uso da taxonomia para perfilamento político ou segmentação individual.

## 2. Mudanças Técnicas

### Banco de Dados (Supabase)
- **Migration 010**: Criação das tabelas `topic_categories`, `interaction_topic_tags` e `post_topic_tags`. Adicionadas políticas RLS e seeds iniciais de temas públicos.

### Lógica de Sugestão
- **`src/lib/topics/rules.ts`**: Motor de sugestão por palavras-chave com scores de confiança.
- **Não-Perfilamento**: Função `isForbiddenLabel` impede o uso de termos de segmentação política ou dados sensíveis.

### Interface (UI/UX)
- **Página de Temas (`/temas`)**: Visão geral das pautas e volume de mobilização.
- **Fila de Revisão (`/temas/revisao`)**: Interface para operadores confirmarem ou ajustarem sugestões automáticas.
- **Página de Tema (`/temas/[slug]`)**: Detalhes de uma pauta com aviso explícito de governança.
- **Página de Pessoa**: Atualizada para exibir os temas das interações públicas, reforçando que os temas descrevem o conteúdo, não o perfil da pessoa.
- **Dashboard**: Bloco "Pautas que mais mobilizaram" adicionado.

## 3. Segurança e Governança
- **RLS**: Proteção em todas as novas tabelas, garantindo que apenas operadores e admins gerenciem as tags.
- **Audit Logs**: Ações de confirmação, remoção e criação de temas são registradas para auditoria.
- **Incidentes**: O sistema está preparado para gerar alertas caso haja tentativa de burlar as regras de taxonomia.

## 4. Verificação
- **Testes Unitários**: 8 testes passando para as regras de sugestão.
- **Testes E2E**: Fluxo de navegação e avisos de governança validados.
- **Healthcheck**: Expandido para monitorar a saúde da taxonomia.

## Próximos Passos
O sistema de escuta pública está pronto. Recomenda-se o próximo tijolo focado em:
- **Relatórios de Mobilização**: Geração de PDFs ou sínteses de pautas para reuniões de planejamento.
- **Filtros por Tema**: Melhorar a busca de pessoas/posts filtrando por pauta pública confirmada.

---
*Relatório gerado automaticamente por Antigravity (AI Coding Assistant).*
