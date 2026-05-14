# Estado da Nação - CODEX11 - Memória Assistida de Campo

Data: 2026-05-14

## Objetivo

Fechar o passo assistido entre resultado de campo e memória estratégica, mantendo revisão humana obrigatória antes do salvamento e sem expor pessoas.

## O que foi implementado

### 1. Draft assistido a partir do resultado de campo

Arquivo principal:
- `C:/Projetos/Radar de Base/src/lib/field-memory/assisted-memory.ts`

Entrega:
- geração de URL assistida para `/memoria/nova` com `source=result`, `eventId` e `resultId`;
- pré-preenchimento determinístico com:
  - tipo `Registro de Campo`;
  - território agregado;
  - tema, quando mapeável;
  - datas;
  - resumo seguro;
  - próximos campos do formulário assistido.

### 2. Criação + vínculo ao resultado na mesma operação

Arquivo principal:
- `C:/Projetos/Radar de Base/src/app/memoria/actions.ts`

Entrega:
- refatoração conservadora da criação de memória para extrair rotina compartilhada;
- nova server action `createStrategicMemoryFromFieldResultAction`;
- criação da memória em `strategic_memories`;
- vínculo em `strategic_memory_links` com:
  - `entity_type = "result"`
  - `entity_id = resultId`
- revalidação de `/memoria`, `/campo`, `/campo/[id]` e `/ritmo`.

### 3. Formulário assistido com revisão humana obrigatória

Arquivo principal:
- `C:/Projetos/Radar de Base/src/app/memoria/nova/memory-form.tsx`

Entrega:
- formulário ampliado com:
  - tipo de memória;
  - o que aconteceu;
  - o que aprendemos;
  - como usar no próximo ciclo;
  - cuidado ético;
  - próximo passo sugerido;
- checklist obrigatório antes de salvar;
- bloqueio local para sinais óbvios de exposição:
  - `@`
  - email
  - telefone
  - endereço
- persistência dos campos assistidos em `metadata`;
- síntese consolidada salva em `summary`.

### 4. CTA em Campo

Arquivo principal:
- `C:/Projetos/Radar de Base/src/app/campo/[id]/page.tsx`

Entrega:
- quando o evento já tem resultado e ainda não tem memória vinculada:
  - exibe `Criar memória deste resultado`;
- quando já existe memória vinculada:
  - não oferece CTA duplicado;
  - mostra estado de vínculo existente.

### 5. CTA em Memória / sugestões da engine

Arquivos principais:
- `C:/Projetos/Radar de Base/src/app/memoria/page.tsx`
- `C:/Projetos/Radar de Base/src/app/memoria/memory-engine-suggestion-card.tsx`
- `C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.ts`

Entrega:
- sugestões `REGISTRO_DE_CAMPO` agora apontam para o fluxo assistido;
- cada sugestão mostra origem;
- cada sugestão permite `Adiar` localmente sem escrita automática;
- o loop continua deixando de sugerir quando já existe vínculo `result -> memory`.

## Guardrails mantidos

- nenhuma memória é criada automaticamente;
- nenhuma presença vira voluntariado;
- nenhum nome, `@`, telefone, email ou endereço entra por padrão no draft;
- o checklist de revisão humana é obrigatório;
- o vínculo com o resultado fecha o loop sem expor cidadãos;
- o fluxo continua dependente de ação manual do operador.

## Testes criados/atualizados

- `C:/Projetos/Radar de Base/src/app/memoria/actions.test.ts`
- `C:/Projetos/Radar de Base/src/lib/field-memory/assisted-memory.test.ts`
- `C:/Projetos/Radar de Base/src/lib/field-memory/field-memory-loop.test.ts`

Cobertura adicionada:
- create + link do resultado à memória;
- draft assistido seguro;
- checklist obrigatório;
- detecção de sinais óbvios de dado sensível;
- suppress de sugestão duplicada quando já existe memória vinculada.

## Validação executada

- `npm run verify`: passou
- `npm run check:rls`: passou
- `npm run check:health`: passou

Resumo:
- lint sem erros, com 88 warnings antigos/adjacentes;
- build verde;
- 42 arquivos de teste e 258 testes passaram;
- `e2e` local continua pulado sem `E2E_RUN=true`.

## Riscos restantes

1. O browser local da sessão bloqueou navegação para `127.0.0.1:3000` com `ERR_BLOCKED_BY_CLIENT`, então a checagem visual autenticada não foi refeita por Browser nesta rodada.
2. O checklist impede avanço sem confirmação humana, mas a verificação de "nome de cidadão" ainda depende principalmente de revisão manual, não de heurística forte.
3. O botão assistido entrou na página de detalhe do campo; a listagem geral de `/campo` não ganhou CTA próprio nesta rodada.

## Leitura final

O loop de CODEX06 agora pode ser fechado no produto:
- resultado de campo gera sugestão;
- sugestão abre formulário assistido;
- humano revisa;
- memória é salva;
- vínculo ao resultado impede nova sugestão duplicada.
