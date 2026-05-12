# Manual de Operação Contínua - Radar de Base

Este manual define os processos e ritos para a operação estável do sistema pós-piloto. O objetivo é garantir que toda a equipe tenha autonomia e clareza sobre suas responsabilidades diárias, semanais e mensais.

## 1. Rotina Diária (Operador)
O foco do operador é o vínculo e a movimentação da fila.

- **Abrir Minha Fila:** Iniciar o dia revisando perfis atribuídos a você em `/minha-fila`.
- **Copiar DM:** Utilizar o botão "Copiar DM" para preparar a abordagem.
- **Confirmar Envio:** Registrar o envio manual somente *após* enviar no Instagram.
- **Registrar Resposta:** Assim que o contato responder, atualizar o status na ficha rápida.
- **Encaminhar:** Se houver interesse em eventos ou voluntariado, registrar o encaminhamento imediato.
- **Respeitar Régua de Espera:** Não abordar novamente perfis em "Aguardando Resposta" antes do prazo ético (3-7 dias).
- **Fechar o Dia:** Garantir que todos os envios manuais do dia foram registrados para evitar duplicidade de trabalho.

## 2. Rotina da Coordenação
O foco da coordenação é o suporte tático e a visão territorial.

- **Distribuir Tarefas:** Alocar novos perfis para operadores disponíveis.
- **Ver Painel Territorial:** Acompanhar o heatmap e ranking por bairro em `/relatorios/territorios`.
- **Acompanhar Relatórios:** Revisar o progresso de conversão e adesão.
- **Revisar Feedbacks:** Tratar incidentes operacionais e técnicos reportados.
- **Fechar o Dia:** Validar a saúde da operação e responder a bloqueios críticos.

## 3. Rotina Semanal (Técnico/Coordenação)
Rito de higiene e planejamento.

- **Higiene da Base:** Executar limpeza de duplicatas e perfis sem interação.
- **Revisar Temas:** Validar se as sugestões automáticas de temas estão corretas.
- **Revisar Aguardando 7+ Dias:** Identificar perfis que não responderam e decidir por novo follow-up ou arquivamento.
- **Planejar Ações de Campo:** Utilizar dados de territórios para definir locais de eventos.
- **Retrospectiva:** Reunião rápida sobre o que funcionou e gargalos operacionais.

## 4. Rotina Mensal (Governança)
Rito de conformidade e resultados.

- **Revisão de Privacidade:** Auditar a lista "Não Abordar" e apagar dados de quem solicitou remoção.
- **Revisão de Operadores:** Auditar acessos e logs de exportação.
- **Revisão de Dados Antigos:** Anonimizar perfis inativos há mais de 180 dias.
- **Relatório de Resultados:** Gerar o "Estado da Nação" mensal para prestação de contas.

## 5. Guardrails Éticos (Imutáveis)
1. **Sem automação de DM:** Toda interação deve ser humana e manual no Instagram.
2. **Sem pedido de voto:** O Radar é para vínculo e escuta, não para propaganda eleitoral direta.
3. **Sem dados sensíveis:** Proibido anotar religião, orientação sexual, saúde ou voto em campos de notas.
4. **Não Abordar é absoluto:** Se o status for `nao_abordar`, qualquer tentativa de contato é uma falha grave.
5. **Voluntariado exige consentimento:** Só mover para "Voluntário" se houver confirmação explícita.

## 6. Checklists de Processos

### Novo Território
- [ ] Definir bairros prioritários.
- [ ] Mapear lideranças locais (se houver).
- [ ] Configurar monitoramento de webhooks/hashtags.

### Novo Operador
- [ ] Criar acesso no Supabase.
- [ ] Treinar no fluxo `/treinamento`.
- [ ] Revisar manual de ética.

### Nova Ação de Campo
- [ ] Criar evento em `/agenda-campo`.
- [ ] Definir temas da ação.
- [ ] Mobilizar voluntários do bairro.

### Fechamento de Evento
- [ ] Registrar presença.
- [ ] Registrar novas escutas coletadas.
- [ ] Atualizar status dos participantes para "Engajado".

## 7. Links Úteis do Sistema
- [Minha Fila](/minha-fila) - Operação diária.
- [Pessoas Prioritárias](/pessoas) - Busca e filtragem.
- [Agenda de Campo](/agenda-campo) - Gestão de eventos.
- [Territórios](/relatorios/territorios) - Visão geográfica.
- [Relatórios](/relatorios) - Métricas de conversão.
- [Ética e Dados](/governanca) - Dashboard de governança.
