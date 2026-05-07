# Estado da Nacao RB03 - Perfil e Acao

Data: 2026-05-07

## Arquivos Alterados

- `src/app/pessoas/[id]/page.tsx`
- `src/app/pessoas/[id]/person-actions.tsx`
- `src/app/actions.ts`
- `src/lib/data/audit.ts`
- `src/lib/data/outreach.ts`
- `src/lib/data/people-priority.ts`
- `src/lib/data/person-profile.ts`
- `src/lib/data/person-profile.test.ts`
- `src/lib/types.ts`

## O Que Entrou Na Ficha Operacional

### Próxima melhor ação

O topo da ficha agora destaca a ação operacional principal com:
- temperatura;
- status atual;
- pauta principal;
- possibilidade ou não de abordagem;
- última interação;
- status de abordagem.

### Por que está no radar?

A ficha agora explica em linguagem humana:
- interações recentes;
- pauta principal;
- resposta anterior;
- tarefa pendente;
- ausência de encaminhamento;
- presença de relato textual útil.

### Mensagem sugerida

O perfil mostra:
- categoria do template compatível;
- texto sugerido;
- botão de copiar;
- aviso explícito de revisão manual.

Nada envia mensagem automaticamente.

### Histórico de relação

A timeline unificada agora mistura:
- interações do Instagram;
- tarefas de abordagem;
- registros de auditoria da relação.

Isso substitui a visão crua da timeline antiga por uma leitura operacional mais útil.

### Registrar resposta

Foi criada persistência real via server action usando entidades já existentes:
- `ig_people`
- `outreach_tasks`
- `audit_logs`

As respostas disponíveis agora são:
- não respondeu;
- respondeu bem;
- pediu informações;
- quer entrar no grupo;
- quer ir ao evento;
- quer conhecer o app Missão ÉLuta;
- quer ajudar online;
- quer ajudar presencial;
- não quer contato;
- revisar depois.

Cada resposta:
- atualiza o status da pessoa quando faz sentido;
- cria ou atualiza tarefa operacional em `outreach_tasks`;
- registra auditoria.

### Ações rápidas

Entraram na ficha:
- Abrir Instagram;
- Copiar mensagem;
- Criar tarefa de abordagem;
- Registrar DM enviada;
- Marcar contato confirmado;
- Marcar como não abordar;
- Encaminhar para evento/campo;
- Encaminhar para voluntariado;
- abrir `/campo` e `/voluntarios`.

## Lógica Operacional Aplicada

### Base de persistência

Não foi criada rota nova nem tabela nova neste tijolo.

O registro operacional foi encaixado em cima do que já existia:
- `ig_people.status`
- `ig_people.do_not_contact_reason`
- `outreach_tasks.column_key`
- `outreach_tasks.title`
- `outreach_tasks.notes`
- `audit_logs`

### Decisões importantes

1. resposta registrada não vira automação de contato;
2. encaminhamento vira tarefa persistida, não efeito client-side;
3. `convidar_grupo` foi tratado como próximo passo pendente, não como encaminhamento já concluído;
4. pedido de não contato continua bloqueando a relação;
5. a ficha só usa sinais públicos, resposta e contexto operacional.

## Limitações Atuais

1. Ainda não existe vínculo explícito pessoa -> evento específico.
2. Ainda não existe vínculo explícito pessoa -> inscrição de voluntariado específica.
3. `outreach_tasks` continua sem campo estruturado de responsável.
4. A timeline usa `audit_logs` da pessoa e tarefas existentes, mas ainda não há entidade própria de relacionamento completo.
5. Encaminhamento para Missão ÉLuta, grupo ou evento ainda é registrado como tarefa e auditoria, não como entidade dedicada.

## Próximos Passos Recomendados

### RB04

Atuar em `/abordagem` para:
- persistir movimentação de coluna com clareza;
- registrar dono da tarefa;
- registrar prazo e SLA.

### RB05

Atuar em `/campo` e `/voluntarios` para:
- criar vínculo explícito de encaminhamento;
- permitir fechar a jornada pessoa -> evento / voluntariado sem inferência.

### RB06

Opcional depois de RB04/RB05:
- histórico mais rico de encaminhamentos;
- responsável explícito por pessoa;
- recomendação melhor de template por etapa.
