# Relatório de Canal de Feedback e Monitoramento de Atrito (Piloto02)

Este relatório detalha a implementação do canal de escuta ativa para a equipe durante o piloto de 7 dias do Radar de Base.

## 1. Canal de Voz da Equipe
- **Localização**: Adicionada aba dedicada "💬 Voz da Equipe" na página de Relatórios (`/relatorios`).
- **Objetivo**: Capturar em tempo real dificuldades de uso, bugs visuais, dúvidas éticas e sugestões, sem fragmentar a comunicação em canais externos.

## 2. Experiência do Operador
- **Formulário de Atrito**: Projetado para ser preenchido em menos de 1 minuto.
- **Categorização**: Problemas divididos por tipos (UX, Bug, Ética, Instagram, etc.) e urgência.
- **Contexto Automático**: O sistema registra automaticamente a rota onde o operador está e o autor do feedback, facilitando o diagnóstico posterior.

## 3. Gestão pela Coordenação
- **Painel de Monitoramento**: Visualização centralizada de todos os feedbacks enviados.
- **Filtros Inteligentes**: Permite filtrar por tipo de problema para identificar gargalos sistêmicos.
- **Exportação Estratégica**: Funcionalidade de exportação em Markdown para alimentar as reuniões de retrospectiva e o planejamento pós-piloto.

## 4. Segurança e Ética
- **Guardrails de Dados**: O formulário inclui lembretes explícitos para não registrar conteúdos de DMs ou dados sensíveis de cidadãos.
- **Persistência Segura**: Os feedbacks são armazenados no log de auditoria (`audit_logs`) com o tipo `pilot_feedback`, garantindo rastreabilidade total sem alterar o esquema do banco de dados.

---
**Conclusão**: O sistema agora possui um ciclo de feedback fechado, garantindo que a equipe de campo tenha voz direta no refinamento da ferramenta durante o período crítico de piloto.
