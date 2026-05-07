# Estado da Nacao RB04 - Abordagem Persistente

Data: 2026-05-07

## Como Ficou A Persistência

O quadro `/abordagem` deixou de depender apenas de estado local do cliente.

Agora, quando a equipe:
- avança um card;
- volta um card;
- troca o status pelo seletor;
- registra uma resposta pela ação rápida;

o estado é salvo no banco.

### Persistência usada

- `outreach_tasks.column_key`
- `outreach_tasks.updated_at`
- `ig_people.status`
- `ig_people.do_not_contact_reason`
- `audit_logs`

### Comportamento

1. a UI faz atualização otimista do card;
2. chama server action;
3. se salvar, mantém o novo estado;
4. se falhar, reverte visualmente e mostra erro;
5. ao recarregar a página, o quadro volta no estado salvo.

## Tabelas Usadas

- `outreach_tasks`
- `ig_people`
- `audit_logs`

Não foi necessária migration neste tijolo.

## APIs / Actions Criadas Ou Alteradas

### Alteradas

- `src/app/actions.ts`
  - `recordPersonResponse(...)` agora grava colunas canônicas do quadro;
  - `recordPersonReferral(...)` agora grava etapa operacional compatível com o novo quadro;
  - `createOutreachTask(...)` normaliza coluna antes de persistir.

### Criada

- `updateOutreachTaskStatus(taskId, nextColumn)`

Essa action:
- exige `admin` ou `operador`;
- atualiza `outreach_tasks.column_key`;
- sincroniza `ig_people.status` com a etapa operacional;
- registra auditoria com:
  - `previousColumn`
  - `nextColumn`
  - `personId`

## Status Do Quadro

O quadro agora opera com colunas canônicas:
- `Para abordar`
- `Mensagem enviada`
- `Esperando resposta`
- `Respondeu`
- `Precisa encaminhar`
- `Convidado`
- `Entrou na base`
- `Primeira ação feita`
- `Não insistir`
- `Não abordar`

Colunas legadas continuam sendo lidas e normalizadas para manter compatibilidade:
- `novo`
- `responder_comentario`
- `mandar_dm_manual`
- `aguardando_resposta`
- `convidar_grupo`
- `contato_confirmado`
- `nao_abordar`

## UI Entregue

Cada card agora mostra:
- pessoa;
- motivo;
- próxima ação;
- responsável;
- última interação;
- botão abrir Instagram;
- botão copiar mensagem;
- botão registrar resposta.

Também há:
- botões `Voltar` e `Avançar`;
- seletor de status persistente;
- destaque visual para `Não abordar`.

## Riscos Restantes

1. `outreach_tasks` ainda não tem campo estruturado de responsável.
2. Ainda não existe vínculo explícito pessoa -> evento específico.
3. Ainda não existe vínculo explícito pessoa -> inscrição específica de voluntariado.
4. A sincronização entre status da pessoa e etapa da tarefa continua sendo uma heurística operacional, não um workflow formal separado.

## Como Testar Manualmente

1. Abrir `/abordagem`.
2. Escolher um card em `Para abordar`.
3. Clicar em `Avançar`.
4. Recarregar a página.
5. Confirmar que o card permaneceu na nova coluna.
6. Abrir a pessoa pelo botão `Ver pessoa`.
7. Confirmar que o status e a próxima ação ficaram coerentes.
8. Voltar ao quadro e trocar o status pelo seletor.
9. Recarregar novamente.
10. Confirmar persistência.
11. Em um card, usar `Registrar resposta`.
12. Verificar se o card muda para a etapa esperada.
13. Testar um card em `Não abordar` e confirmar destaque visual e bloqueio de insistência operacional.
