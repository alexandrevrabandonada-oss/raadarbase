# Documento de Congelamento de Funcionalidades (Feature Freeze) - Piloto de 7 Dias

Este documento estabelece as regras e o escopo para o período de piloto do Radar de Base, garantindo que a equipe foque na operação e estabilidade em vez de novas implementações.

## 1. Período do Piloto
- **Início:** 08 de Maio de 2026
- **Término:** 15 de Maio de 2026
- **Duração:** 7 dias corridos.

## 2. Escopo do Congelamento

### O que NÃO pode mudar (Freeze Total)
- Estrutura do Banco de Dados (Schema).
- Lógica de integração com Meta/Instagram.
- Fluxos de autenticação e permissões (RBAC).
- Automações de mensagens (proibido por princípio).
- Design de componentes core (Radar Design System).

### O que PODE mudar (Ajustes Permitidos)
- Correções de bugs críticos que impeçam a operação.
- Melhorias de microcopy para clareza extrema.
- Ajustes de performance em consultas lentas.
- Atualização de templates de mensagens (via interface).

## 3. Gestão de Qualidade

### Reporte de Bugs
- Bugs devem ser reportados via canal oficial de suporte (Operação -> Coordenação).
- Devem incluir: Rota, Ação realizada, Erro observado e Print (se possível).

### Registro de Feedback
- Feedbacks de usabilidade e sugestões para o Pós-Piloto devem ser registrados no "Diário de Bordo" (aba Retrospectiva em /relatorios).

## 4. Rotinas da Equipe

### Diária do Operador
1. **Abertura (09:00):** Verificar "Minha Fila" e assumir novas pessoas prioritárias.
2. **Operação:** Abordar pessoas seguindo o fluxo: Copiar -> Instagram -> Manual -> Registrar.
3. **Encaminhamento:** Direcionar interessados para eventos ou missões.
4. **Resgate:** Verificar pessoas paradas no Kanban (/abordagem).

### Diária do Coordenador (Fechamento)
1. **Check:** Verificar se há tarefas sem responsável no dashboard.
2. **Gargalos:** Identificar onde o fluxo está travado (ex: muitas respostas sem encaminhamento).
3. **Fechamento (20:00):** Gerar o "Resumo do Dia" em /relatorios e compartilhar com o comitê estratégico.

## 5. Guardrails Inegociáveis
- **Manualidade:** Nenhuma mensagem deve ser enviada automaticamente.
- **Ética:** Não registrar dados sensíveis ou opiniões pessoais pejorativas.
- **Não Abordar:** Respeitar imediatamente qualquer pedido de fim de contato.
- **Foco:** O sistema é uma ferramenta de relacionamento, não de disparo de massa.
