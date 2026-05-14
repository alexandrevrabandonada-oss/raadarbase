# Estado da Nação: CODEX05 Narrative Engine

Data: 2026-05-14  
Base: `ecdf489` + mudanças locais desta rodada

## Objetivo

Criar uma camada determinística de narrativa operacional para transformar agregados do sistema em sentido de ciclo no `/dashboard`, sem mexer em banco, Meta/Instagram ou automação.

## Entregas

### Camada nova

Arquivos criados em [src/lib/narrative](</C:/Projetos/Radar de Base/src/lib/narrative>):

- [daily-narrative.ts](</C:/Projetos/Radar de Base/src/lib/narrative/daily-narrative.ts>)
- [weekly-narrative.ts](</C:/Projetos/Radar de Base/src/lib/narrative/weekly-narrative.ts>)
- [season-narrative.ts](</C:/Projetos/Radar de Base/src/lib/narrative/season-narrative.ts>)
- [narrative-copy.ts](</C:/Projetos/Radar de Base/src/lib/narrative/narrative-copy.ts>)
- [narrative-types.ts](</C:/Projetos/Radar de Base/src/lib/narrative/narrative-types.ts>)
- [narrative-engine.test.ts](</C:/Projetos/Radar de Base/src/lib/narrative/narrative-engine.test.ts>)

### Aplicação inicial

Arquivos atualizados:

- [src/app/dashboard/page.tsx](</C:/Projetos/Radar de Base/src/app/dashboard/page.tsx>)
- [src/app/dashboard/dashboard-client.tsx](</C:/Projetos/Radar de Base/src/app/dashboard/dashboard-client.tsx>)

## Como a engine decide

### Missão do Dia

Prioridade determinística:

1. `DIA_DE_CUIDADO`
2. `DIA_DE_RETORNO`
3. `DIA_DE_ENCAMINHAMENTO`
4. `DIA_DE_CAMPO`
5. `DIA_DE_MEMORIA`
6. `DIA_DE_ESCUTA`

Sinais usados:

- retornos pendentes
- sinais novos
- cuidados urgentes
- encaminhamentos abertos
- campo sem fechamento
- memória pendente
- vínculos recorrentes

### Capítulo Semanal

A leitura semanal escolhe entre:

- organização
- escuta
- encaminhamento
- campo
- memória

Com base em:

- missões sem responsável
- retornos pendentes
- encaminhamentos abertos
- campo sem fechamento
- memória pendente
- territórios prontos
- tarefas paradas
- cuidados urgentes

### Temporada Atual

A leitura de temporada usa:

- volume de missões ativas
- vínculos recorrentes
- encaminhamentos abertos
- campo/memória pendentes
- distribuição territorial por fase
- urgência de cuidado

## Uso no dashboard

O hero continua compacto. A mudança foi de sentido, não de altura:

- descrição principal agora vem da narrativa de temporada;
- card escuro virou leitura de `Hoje`;
- card claro virou leitura de `Semana`, com `Temporada` resumida;
- bloco `Começar Jornada` passou a mostrar headline e próximo passo da narrativa diária;
- CTAs existentes foram preservados.

## Guardrails

- sem IA externa;
- sem texto aleatório;
- sem referência a voto, conversão, lead, eleitor, persuadir ou disparo;
- sem incentivo a volume de DM;
- narrativa focada em cuidado, ritmo, encaminhamento e fechamento de ciclo.

## Testes

Cobertura criada em [narrative-engine.test.ts](</C:/Projetos/Radar de Base/src/lib/narrative/narrative-engine.test.ts>) para:

- muitos retornos pendentes
- muitos sinais novos
- cuidados urgentes
- campo sem fechamento
- temporada de escuta e vínculo
- bloqueio de palavras proibidas

## Validação

Executado nesta rodada:

- `npx vitest run src/lib/narrative/narrative-engine.test.ts`
- `npx eslint src/lib/narrative src/app/dashboard/page.tsx src/app/dashboard/dashboard-client.tsx`
- `npm run verify`

## Riscos restantes

- a heurística de `sinais novos` e `vínculos recorrentes` ainda depende dos agregados já expostos por `PriorityPerson`, não de uma engine narrativa por pessoa;
- a leitura de temporada ainda é uma síntese operacional simples, não um histórico longitudinal;
- ainda vale uma checagem visual autenticada do `/dashboard` com dados reais para calibrar densidade de texto do hero.

## Recomendação

**GO**

A camada é isolada, determinística, testada e aplicada só no dashboard. O próximo passo seguro é reaproveitar a mesma narrativa em `/ritmo` e no topo da `Minha Jornada`, sem duplicar copy local.
