# Radar de Base: Piloto Operacional 7 Dias

Este documento descreve a rotina do primeiro piloto controlado de operação do Radar de Base. O piloto ocorrerá por 7 dias seguidos e envolverá a equipe interna operando ativamente a plataforma usando o **Radar Design System (UX10)**.

## Objetivo do Piloto
Validar se o fluxo do Radar de Base suporta uma operação diária orgânica, permitindo que a equipe capture, distribua e acompanhe pessoas de interesse através das redes, transformando simples interações em conversas significativas e encaminhamentos efetivos, sem spam.

## Participantes
- **Coordenação**: Seleciona e importa os dados diários (ou garante o webhook) e mede o progresso através do **Painel de Monitoramento** (`/relatorios`).
- **Operadores (Mobilizadores)**: Entram todos os dias para "Assumir" tarefas e responder contatos orgânicos via **Quadro de Vínculos** (`/abordagem`).

## Rotina Diária

Cada pessoa da operação deve cumprir a seguinte rotina, preferencialmente sempre no mesmo horário do dia:

1. **Escolher e Importar (Coordenação)**
   - Extrair do Instagram oficial as 10 interações mais quentes do dia (pessoas que comentaram denúncias, responderam stories com dúvidas ou querem ajudar).
   - Usar `/pessoas/importar` para carregar esses usuários de forma segura.

2. **Ver 10 Pessoas do Dia (Top 10)**
   - Abrir o app e navegar para o **Hoje no Radar** (`/dashboard`). 
   - Ler os cards de prioridade (Position #1 a #10) e entender a dor/motivo da prioridade.

3. **Assumir Vínculos**
   - No Dashboard ou no Quadro de Vínculos, o operador deve clicar em **"Assumir"** nos vínculos que conseguir dar conta no dia. 
   - Apenas o responsável lida com aquele cidadão para manter o vínculo humano.

4. **Mandar Mensagens Manuais**
   - Acessar o Quadro em `/abordagem`.
   - Clicar no ícone de **Copiar DM** do card.
   - Clicar no ícone do **Instagram** para abrir o perfil manualmente. 
   - *Nunca* mandar mensagem genérica, adapte a sugestão para a realidade.

5. **Registrar Respostas**
   - Assim que a pessoa responder, ou no dia seguinte, voltar ao quadro `/abordagem`.
   - Selecionar o status da resposta no seletor do card e clicar em **Confirmar Resposta**.

6. **Encaminhar Interessados**
   - Na ficha da pessoa (`/pessoas/[id]`), se a resposta for positiva, preencher a seção **"Encaminhar Para"** (ex: Voluntariado, Evento de Campo, etc).

7. **Marcar "Não Abordar" Quando Necessário**
   - Se a pessoa disser que não quer falar ou for hostil, registrar a resposta "Não quer contato". O sistema aplicará bloqueios visuais permanentes.

8. **Fechar Pendências (Fim do Dia)**
   - O coordenador olha `/relatorios` -> **Painel do Piloto**: se sobraram pessoas "Órfãs" ou se há tarefas paradas há mais de 48h.

## Gestão de Equipe e Responsáveis
Para garantir que o piloto flua sem gargalos, a coordenação deve utilizar o painel de **Balanceamento de Equipe** em `/abordagem`:
- **Balanceamento**: Selecione os operadores ativos e clique em **"Distribuir Agora"**. O sistema dividirá as tarefas sem dono de forma igualitária.
- **Limite por Operador**: Recomendamos no máximo **10 tarefas ativas** por operador simultaneamente.
- **Prevenção de Conflitos**: Cards com o badge **"Órfã"** em vermelho precisam de dono.

## Como Fechar o Dia (Coordenador)
Ao final de cada turno, o coordenador deve acessar `/relatorios` -> **Painel do Piloto**:
1.  **Verificar Pendências**: Olhar o card **"A Encaminhar"**. Ninguém deve terminar o dia sem um destino.
2.  **Monitorar Tarefas Paradas**: Cards parados há mais de 48h terão o alerta 🔴 **CONTATO RECENTE**. Redistribua-os.
3.  **Indicadores de Sucesso**:
     - **Taxa de Conversão**: Visível no Funil de Vínculo. O esperado é acima de 30%.
     - **Carga de Trabalho**: Garantir que nenhum operador esteja sobrecarregado (indicado na tabela por operador).
4.  **Export de Segurança**: Clicar em **"Baixar CSV do Piloto"** para arquivamento externo.

---
*Radar de Base - Tecnologia para a Mobilização Real.*

## Critérios de Sucesso do Piloto
A validação de que a tecnologia funciona e pode ser escalada se dará caso os seguintes indicadores sejam batidos ao final de 7 dias:

- [ ] A equipe utilizou o sistema ativamente em pelo menos **5 dos 7 dias**.
- [ ] Pelo menos **50 pessoas** únicas foram revisadas na aba de Pessoas.
- [ ] Pelo menos **25 mensagens** manuais de primeira abordagem foram enviadas e documentadas no Kanban.
- [ ] Pelo menos **10 respostas** da população foram registradas ativamente no sistema.
- [ ] Pelo menos **5 encaminhamentos** (referrals) para ações de campo ou missões online foram gerados.
- [ ] **Zero pessoas** marcadas como "Não Abordar" foram re-abordadas erroneamente.

