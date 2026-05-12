# Jornada Operacional: Gamificação Ética no Radar de Base

A Jornada Operacional é uma camada conceitual que transforma o trabalho técnico e político em uma sequência clara de fases, progressos e conclusões. Ao contrário da gamificação tradicional, ela foca na **autocompletude e clareza**, não em competição ou volume.

## 1. Princípios da Gamificação Ética
- **Satisfação pela Tarefa:** O "prêmio" é ver a fila limpa e o território engajado.
- **Ritmo Humano:** Respeitar tempos de resposta e não incentivar "maratona de cliques".
- **Sem Vigilância Punitiva:** Fases servem para orientar o operador, não para vigiar cada segundo de inatividade.
- **Qualidade Democrática:** O progresso é medido por vínculos estabelecidos e dúvidas sanadas, não por número bruto de DMs.

## 2. O Que Evitar (Anti-Padrões)
- **Rankings de Operadores:** Nunca colocar quem enviou mais DMs no topo.
- **Moedas ou Pontos:** Evitar a abstração do trabalho político em "pontos" que podem ser acumulados.
- **Incentivo ao Spam:** Impedir que o progresso seja alcançado enviando mensagens sem sentido.
- **Prazos Artificiais:** Não usar cronômetros regressivos que induzam ansiedade.

## 3. Modelo de Fases

### A. Fases do Operador (Ciclo de Vínculo)
1. **Preparar:** Revisão do perfil, análise do histórico e escolha do roteiro.
2. **Conversar:** Envio da DM manual e aguardo responsável de resposta.
3. **Registrar:** Anotação da resposta, tags e temas identificados.
4. **Encaminhar:** Direcionamento para ação de campo, grupo ou voluntariado.
5. **Concluir:** Fechamento do ciclo e registro de sucesso no vínculo.

### B. Fases da Coordenação (Ciclo Tático)
1. **Preparar o Dia:** Distribuição de tarefas e análise de novos sinais.
2. **Acompanhar:** Suporte aos operadores em casos complexos e bloqueios.
3. **Fechar o Dia:** Revisão de métricas e garantia de que ninguém ficou sobrecarregado.
4. **Aprender:** Identificação de novos temas emergentes para ajuste de estratégia.

### C. Fases do Território (Ciclo Geográfico)
1. **Observação:** Detecção inicial de sinais e postagens no bairro.
2. **Escuta:** Primeiras interações e mapeamento de demandas locais.
3. **Mobilização:** Convocação para eventos e grupos locais.
4. **Campo:** Realização de ações presenciais e coleta de novos vínculos.
5. **Continuidade:** Manutenção do engajamento e devolução de resultados.

## 4. Exemplos de Progresso e Conclusão

- **Progresso:** "Você conversou com 5 pessoas hoje no bairro X. 3 já estão na fase de Registro."
- **Conclusão:** "Ciclo Completo! @username foi encaminhado com sucesso para a Plenária de Sábado."
- **Marcos de Território:** "O bairro Centro atingiu a fase de Mobilização. 50+ pessoas engajadas."

## 5. Planejamento de Componentes (UI)

- **JourneyProgress:** Barra sutil de 5 etapas no topo da Ficha Rápida.
- **TaskPhaseBadge:** Badge colorido (ex: "Conversar" em azul, "Concluir" em verde) no card da pessoa.
- **DailyMissionCard:** Widget no dashboard com "Objetivos de Hoje" (ex: "Revisar 3 encaminhamentos pendentes").
- **TerritoryStageBadge:** Badge na visualização de mapa indicando a maturação do bairro.
- **CompletionToast:** Notificação discreta mas gratificante: "Tarefa concluída com sucesso. Vínculo fortalecido!"

## 6. Guardrails
- O status **Não Abordar** encerra a jornada imediatamente para aquele perfil.
- Nenhuma fase de progresso pode ser avançada automaticamente por robôs.
- A conclusão de uma fase de "Conversar" exige confirmação humana de envio manual.
