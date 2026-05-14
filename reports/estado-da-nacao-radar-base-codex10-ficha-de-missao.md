# Estado da Nação — CODEX10 — Ficha de Missão

Data: 2026-05-14  
Projeto: Radar de Base  
Escopo: transformar `PersonQuickSheet` em uma Ficha de Missão explicável, mantendo fluxo atual e fallback quando a Mission Engine não trouxer metadata.

## Objetivo da rodada

Fazer a ficha rápida deixar claro:

- por que a missão existe;
- em que fase ela está;
- qual cuidado precisa ser respeitado;
- qual é o próximo passo;
- quais ações seguem disponíveis;
- o que caracteriza um bom fechamento da missão.

Sem reescrever o fluxo, sem mexer em banco e sem automatizar DM.

## Componente e usos mapeados

### Componente central

- `C:/Projetos/Radar de Base/src/components/radar/person-quick-sheet.tsx`

### Usos encontrados

- `C:/Projetos/Radar de Base/src/app/minha-fila/queue-client.tsx`
- `C:/Projetos/Radar de Base/src/app/pessoas/people-client.tsx`
- `C:/Projetos/Radar de Base/src/app/abordagem/kanban-client.tsx`
- `C:/Projetos/Radar de Base/src/app/dashboard/dashboard-client.tsx`
- `C:/Projetos/Radar de Base/src/components/radar/field-agenda/event-participants.tsx`
- `C:/Projetos/Radar de Base/src/app/treinamento/training-scenario-view.tsx`

Observação: o fluxo de abertura da ficha não foi refeito. A mudança ficou concentrada no componente compartilhado, então todas essas rotas passam a herdar a nova leitura de missão.

## O que mudou

### 1. Ficha de Missão

Foi criado um modelo puro de leitura da missão dentro do componente:

- `buildQuickSheetMissionView(person)`

Ele organiza:

- tipo;
- fase;
- estado;
- motivo;
- sinais;
- guardrail;
- próximo passo;
- ação primária;
- ações secundárias;
- conclusão esperada;
- bloqueio de contato;
- aviso de personalização de mensagem.

### 2. Header e leitura principal

A ficha agora mostra:

- `Ficha de missão` no topo;
- estado da missão no badge principal;
- tipo de missão no subtítulo;
- fase atual pela mesma lógica da Mission Engine quando disponível.

### 3. Bloco operacional da missão

O conteúdo principal passou a mostrar:

- `Motivo da missão`
- `Próximo passo`
- `Tipo / fase / estado`
- `Guardrail`
- `Conclusão esperada`
- `Sinais usados`
- `Modelo de conversa`
- `Ações da missão`
- `Resultado da missão`

### 4. Guardrails de contato

Quando a missão está bloqueada:

- botão de Instagram no footer fica desabilitado;
- copiar DM some/desabilita;
- encaminhar e registrar resposta continuam fora da área de contato;
- o banner ético explica o motivo correto;
- a ficha continua permitindo nota administrativa e revisão segura.

### 5. Modelo de conversa

Quando há mensagem sugerida:

- aparece o aviso: `Use como base. Personalize antes de enviar.`
- copiar continua separado da confirmação de envio;
- copiar não marca envio;
- confirmação manual continua explícita em passo separado.

### 6. Fallback preservado

Quando não há mission metadata:

- a ficha segue com `priorityReason` e `nextAction`;
- a jornada continua usando o mapper atual;
- o bloco novo ainda aparece, mas com leitura operacional legada.

## Arquivos alterados

- `C:/Projetos/Radar de Base/src/components/radar/person-quick-sheet.tsx`

## Testes criados

- `C:/Projetos/Radar de Base/src/components/radar/person-quick-sheet.test.tsx`

Cobertura adicionada:

- ficha interpreta missão `ESCUTA`;
- ficha bloqueia contato em `CUIDADO/BLOQUEADA`;
- ficha mantém fallback quando não há mission metadata;
- copiar mensagem exige confirmação manual separada.

## Validações executadas

Comandos:

- `npm run verify`
- `npm run check:rls`
- `npm run check:health`

Resultado:

- `lint`: sem erros, com 89 warnings antigos/adjacentes;
- `build`: passou;
- `test`: 40 arquivos e 251 testes passaram;
- `check:rls`: passou;
- `check:health`: passou;
- `e2e`: pulado localmente por ausência de `E2E_RUN=true`.

## Riscos restantes

1. A ficha completa de `/pessoas/[id]` ainda não foi alinhada ao mesmo modelo de missão.  
   Esta rodada ficou só no `PersonQuickSheet`.

2. O modal de resposta e o modal de encaminhamento ainda usam linguagem operacional antiga em alguns pontos.  
   O contexto da missão já chegou na ficha, mas os subfluxos podem receber um polimento posterior.

3. Não houve smoke test visual autenticado nesta rodada.  
   A validação foi por build, testes e contrato do componente.

## Leitura final

A `Ficha Rápida` agora virou de fato uma `Ficha de Missão`.  
Ela explica a missão, protege guardrails, mantém a separação entre copiar e confirmar envio, e continua funcionando mesmo quando a engine ainda não tiver missão para aquela pessoa.

## Status

GO

O componente ficou estável, compartilhado e pronto para ser usado como referência nas próximas integrações transversais da Mission Engine.
