# Radar de Base: Piloto Operacional 7 Dias

Este documento descreve a rotina do primeiro piloto controlado de operação do Radar de Base. O piloto ocorrerá por 7 dias seguidos e envolverá a equipe interna operando ativamente a plataforma.

## Objetivo do Piloto
Validar se o fluxo do Radar de Base suporta uma operação diária orgânica, permitindo que a equipe capture, distribua e acompanhe pessoas de interesse através das redes, transformando simples interações em conversas significativas e encaminhamentos efetivos, sem spam.

## Participantes
- **Coordenação**: Seleciona e importa os dados diários (ou garante o webhook) e mede o progresso.
- **Operadores (Mobilizadores)**: Entram todos os dias para "Assumir" tarefas e responder contatos orgânicos.

## Rotina Diária

Cada pessoa da operação deve cumprir a seguinte rotina, preferencialmente sempre no mesmo horário do dia:

1. **Escolher e Importar (Coordenação)**
   - Extrair do Instagram oficial as 10 interações mais quentes do dia (pessoas que comentaram denúncias, responderam stories com dúvidas ou querem ajudar).
   - Usar `/pessoas/importar` para carregar esses usuários de forma segura.

2. **Ver 10 Pessoas do Dia**
   - Abrir o app e navegar para a aba `/pessoas`. 
   - Ler os cards de prioridade e entender a dor/motivo da prioridade.

3. **Distribuir Responsáveis**
   - Para as pessoas listadas na aba `/pessoas` ou em `/abordagem`, o operador deve clicar em **"Assumir"** nos vínculos que conseguir dar conta no dia. 
   - Apenas o responsável lida com aquele cidadão para manter o vínculo humano.

4. **Mandar Mensagens Manuais**
   - Acessar o Kanban em `/abordagem`.
   - Copiar a **Mensagem Sugerida** do sistema.
   - Abrir o Instagram manualmente no app ou web e colar a mensagem. 
   - *Nunca* mandar mensagem genérica, adapte a sugestão para a realidade.

5. **Registrar Respostas**
   - Assim que a pessoa responder, ou no dia seguinte, voltar ao quadro `/abordagem`.
   - Mover o card da coluna para "Respondeu bem" ou qualquer outro status de resposta pertinente.

6. **Encaminhar Interessados**
   - Na aba da pessoa `/pessoas/[id]`, se a resposta for positiva, preencher a seção **"Encaminhar Para"** (ex: Voluntariado, Evento de Campo, etc).

7. **Marcar "Não Abordar" Quando Necessário**
   - Se a pessoa disser que não quer falar ou for hostil, usar a resposta "Não quer contato". O sistema moverá a pessoa para a coluna "Não Abordar" garantindo privacidade permanente.

8. **Fechar Pendências (Fim do Dia)**
   - O coordenador olha `/relatorios` para ver as Estatísticas do Piloto: se sobraram pessoas "Sem responsável" ou se faltou bater meta diária de mensagens.

## Gestão de Equipe e Responsáveis
Para garantir que o piloto flua sem gargalos, a coordenação deve utilizar o painel de **Gestão de Equipe** em `/abordagem`:
- **Balanceamento**: Use a função "Balancear Tarefas" para distribuir automaticamente as tarefas órfãs entre os operadores logados.
- **Limite por Operador**: Recomendamos no máximo **10 tarefas ativas** por operador simultaneamente. Isso garante que cada conversa receba a atenção necessária.
- **Prevenção de Conflitos**: Sempre verifique se o card tem um responsável antes de iniciar uma conversa no Instagram. Se o card estiver em "Minhas Tarefas", ele é seu.

## Como Fechar o Dia (Coordenador)
Ao final de cada turno, o coordenador deve acessar `/relatorios` -> **Painel do Piloto**:
1.  **Verificar Pendências**: Olhar o alerta de "Pendência de Encaminhamento". Ninguém deve terminar o dia em status "Respondeu" sem um encaminhamento ou nota de "Revisar Depois".
2.  **Monitorar Tarefas Paradas**: Se houver tarefas paradas há mais de 48h, redistribuí-las para outros operadores ou marcar como "Não Abordar" se a pessoa parou de responder.
3.  **Indicadores de Sucesso**:
    - **Taxa de Conversão**: (Encaminhados / Responderam). O esperado é acima de 30%.
    - **Carga de Trabalho**: Garantir que nenhum operador tenha mais de 10 tarefas abertas simultaneamente.
4.  **Export de Segurança**: Baixar o CSV diário e arquivar no drive da coordenação como evidência operacional.

## Retrospectiva Diária
A cada 24h, faça uma reunião de 15 min com os operadores:
- O que as pessoas mais estão perguntando? (Ajustar templates).
- Algum tema novo surgiu nas conversas? (Criar novas tags).
- Algum operador está com dificuldade técnica no Instagram? (Suporte).

## Diretrizes e Microcopy (Atenção!)
- *“A pessoa precisa sentir que foi escutada, não capturada.”*
- *“Contato manual, humano e contextual.”*
- *“Sem pedido de voto na pré-campanha.”*
- *“Respeite não contato.”*

## Critérios de Sucesso do Piloto
A validação de que a tecnologia funciona e pode ser escalada se dará caso os seguintes indicadores sejam batidos ao final de 7 dias:

- [ ] A equipe utilizou o sistema ativamente em pelo menos **5 dos 7 dias**.
- [ ] Pelo menos **50 pessoas** únicas foram revisadas na aba de Pessoas.
- [ ] Pelo menos **25 mensagens** manuais de primeira abordagem foram enviadas e documentadas no Kanban.
- [ ] Pelo menos **10 respostas** da população foram registradas ativamente no sistema.
- [ ] Pelo menos **5 encaminhamentos** (referrals) para ações de campo ou missões online foram gerados.
- [ ] **Zero pessoas** marcadas como "Não Abordar" foram re-abordadas erroneamente.
