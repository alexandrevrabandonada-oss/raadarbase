# Política de Retenção e Privacidade - Radar de Base

## 1. O que é guardado?
O Radar de Base armazena dados provenientes de interações públicas no Instagram e registros voluntários:
- **Perfis Públicos:** Username, nome de exibição e histórico de interações (comentários/curtidas).
- **Dados de Contato (Consentidos):** Telefone e e-mail, capturados apenas após consentimento explícito.
- **Voluntariado:** Dados fornecidos via formulário de inscrição, incluindo áreas de interesse e disponibilidade.
- **Auditoria:** Log de todas as ações sensíveis (exportação, alteração de status, acesso a dados de contato).

## 2. Por que é guardado?
A guarda dos dados tem propósitos estritamente organizacionais:
- **Planejamento Territorial:** Identificar pautas recorrentes em bairros para guiar ações coletivas.
- **Continuidade da Escuta:** Evitar que demandas da população se percam no volume das redes sociais.
- **Gestão de Voluntários:** Coordenar a força de trabalho da campanha de forma eficiente.
- **Prestação de Contas:** Garantir que cada ação da equipe possa ser auditada.

## 3. Quem acessa?
O acesso é baseado em papéis (RBAC):
- **Administradores:** Acesso total, incluindo exportações e gestão de usuários.
- **Operadores:** Gestão de vínculos e interações, sem acesso a exportações massivas de contatos.
- **Comunicação/Leitura:** Acesso a relatórios agregados e pautas, com restrição de dados pessoais.

## 4. Quando revisar?
- **Mensalmente:** Revisão da lista "Não Abordar" e perfis inativos.
- **Trimestralmente:** Auditoria completa de logs de exportação e acessos internos.
- **Semestralmente:** Limpeza de registros sem interação há mais de 180 dias que não possuam vínculo ativo de voluntariado.

## 5. Quando anonimizar?
- Quando solicitado pelo titular dos dados.
- Quando o dado perde a finalidade operacional (ex: fim de ciclo de mobilização).
- Registros de "Não Abordar" antigos podem ser anonimizados mantendo apenas o ID para evitar re-importação.

## 6. Como respeitar "Não Abordar"?
- O status **"Não Abordar"** é a trava suprema do sistema.
- Perfis com este status são omitidos das filas de abordagem, dashboards operacionais e exportações.
- Tentativas de re-abordagem geram alertas e impedem o envio de DMs preparadas.

## 7. Como lidar com pedido de remoção?
1. **Identificação:** Localizar o perfil pelo username ou ID.
2. **Anonimização:** Executar a função de anonimização (reservada a admins), que remove nome, e-mail, telefone e notas, substituindo por hashes ou valores nulos.
3. **Bloqueio:** O registro permanece na base como "Não Abordar" anonimizado para garantir que o sistema não tente coletar os dados novamente em sincronizações futuras.
