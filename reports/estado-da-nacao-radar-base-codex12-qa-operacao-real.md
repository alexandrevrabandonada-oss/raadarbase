# Estado da Nação - CODEX12 - QA de operação real

Data: 2026-05-14

## Escopo

Rodada de QA autenticado e controlado, sem feature nova e sem mudança de banco, focada em:

- `/dashboard`
- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/ritmo`
- `/relatorios/territorios`
- `/campo`
- `/memoria`
- `/mensagens`
- `/voluntarios`

Viewports exercitados:

- `390x844`
- `768x1024`
- `1024x768`
- `1366x768`
- `1440x900`

## Validação executada

- `npm run verify`: passou
- `npm run check:rls`: passou
- `npm run check:health`: passou

Resultado técnico final:

- lint sem erros, com `88` warnings antigos/adjacentes
- build verde
- `42` arquivos de teste e `256` testes passaram
- `e2e` local segue pulado sem `E2E_RUN=true`

## Evidências geradas

QA visual:

- [C:\Projetos\Radar de Base\test-results\codex12\summary.json](</C:/Projetos/Radar de Base/test-results/codex12/summary.json>)
- pasta de screenshots: [C:\Projetos\Radar de Base\test-results\codex12](</C:/Projetos/Radar de Base/test-results/codex12>)

QA funcional pontual:

- guardrail de pessoa bloqueada: [C:\Projetos\Radar de Base\test-results\codex12\pessoa-nao-abordar-1366.png](</C:/Projetos/Radar de Base/test-results/codex12/pessoa-nao-abordar-1366.png>)
- jornada após assumir missões: [C:\Projetos\Radar de Base\test-results\codex12-functional\minha-fila-depois-assumir.png](</C:/Projetos/Radar de Base/test-results/codex12-functional/minha-fila-depois-assumir.png>)
- ritmo com próxima decisão: [C:\Projetos\Radar de Base\test-results\codex12-functional\ritmo-proxima-decisao.png](</C:/Projetos/Radar de Base/test-results/codex12-functional/ritmo-proxima-decisao.png>)
- campo com resultado e CTA de memória: [C:\Projetos\Radar de Base\test-results\codex12-functional\campo-after-result-debug.png](</C:/Projetos/Radar de Base/test-results/codex12-functional/campo-after-result-debug.png>)

## Problemas encontrados

1. Ficha completa de pessoa não respeitava `Não Abordar`
- botão de Instagram seguia acessível
- copiar mensagem ainda aparecia como ação prática
- ações de confirmação/DM já estavam parcialmente bloqueadas, mas a tela ainda passava mensagem contraditória

2. Microcopy ética inconsistente em Mensagens
- `/mensagens` ainda expunha `Foco: Conversão`
- card pequeno também mostrava `Total de DMs`

3. Mensagem sugerida com `@@username`
- o renderer de template podia duplicar `@` quando o template já trazia o prefixo

4. Campo em modo mock quebrava o fluxo de QA
- criar evento em `/campo/novo` redirecionava para uma página inválida durante o uso local com mocks
- leitura de `/campo/[id]` e `/campo/[id]/resultado` ainda usava `params` de forma síncrona para a versão atual do Next

5. Leitura de espera/bloqueio confundia operação
- estados `EM_ESPERA` ainda eram tratados em alguns componentes como se fossem bloqueio duro

## Correções feitas

### 1. Guardrail completo em `/pessoas/[id]`

Arquivo:

- [C:\Projetos\Radar de Base\src\app\pessoas\[id]\person-actions.tsx](</C:/Projetos/Radar de Base/src/app/pessoas/[id]/person-actions.tsx>)

Correções:

- desabilitei Instagram no topo e em ações rápidas quando `Não Abordar` está ativo
- desabilitei `Copiar DM` e `Copiar Texto`
- mantive só ações administrativas seguras
- deixei copy explícita de respeito ao bloqueio

### 2. Microcopy ética de Mensagens

Arquivo:

- [C:\Projetos\Radar de Base\src\app\mensagens\messages-client.tsx](</C:/Projetos/Radar de Base/src/app/mensagens/messages-client.tsx>)

Correções:

- `Foco: Conversão` -> `Foco: Continuidade`
- `Total de DMs` -> `Modelos totais`

### 3. Normalização de username em mensagem sugerida

Arquivos:

- [C:\Projetos\Radar de Base\src\lib\data\people-priority.ts](</C:/Projetos/Radar de Base/src/lib/data/people-priority.ts>)
- [C:\Projetos\Radar de Base\src\lib\data\people-priority.test.ts](</C:/Projetos/Radar de Base/src/lib/data/people-priority.test.ts>)

Correções:

- removi duplicação de `@`
- mantive compatibilidade com templates que já incluem o prefixo

### 4. Correção de leitura operacional em espera/bloqueio

Arquivos:

- [C:\Projetos\Radar de Base\src\lib\missions\priority-person-mission-adapter.ts](</C:/Projetos/Radar de Base/src/lib/missions/priority-person-mission-adapter.ts>)
- [C:\Projetos\Radar de Base\src\components\radar\mission-card.tsx](</C:/Projetos/Radar de Base/src/components/radar/mission-card.tsx>)
- [C:\Projetos\Radar de Base\src\components\radar\person-priority-card.tsx](</C:/Projetos/Radar de Base/src/components/radar/person-priority-card.tsx>)

Correções:

- `EM_ESPERA` deixou de cair no mesmo tratamento de `BLOQUEADA`
- labels passaram a distinguir `Caminho livre`, `Em espera` e `Bloqueio ativo`

### 5. Fluxo de Campo no modo mock

Arquivos:

- [C:\Projetos\Radar de Base\src\lib\data\field-agenda.ts](</C:/Projetos/Radar de Base/src/lib/data/field-agenda.ts>)
- [C:\Projetos\Radar de Base\src\lib\data\field-agenda.test.ts](</C:/Projetos/Radar de Base/src/lib/data/field-agenda.test.ts>)
- [C:\Projetos\Radar de Base\src\app\campo\[id]\page.tsx](</C:/Projetos/Radar de Base/src/app/campo/[id]/page.tsx>)
- [C:\Projetos\Radar de Base\src\app\campo\[id]\resultado\page.tsx](</C:/Projetos/Radar de Base/src/app/campo/[id]/resultado/page.tsx>)

Correções:

- persistência do mock de Campo em arquivo local para sobreviver entre requests no QA
- ajuste de `params` assíncrono para compatibilidade com Next atual
- fluxo local confirmado até:
  - criar missão
  - marcar concluída
  - registrar resultado
  - exibir CTA `Criar memória deste resultado`
  - abrir formulário assistido de memória

## Problemas adiados

1. Submissão final do formulário assistido de memória não ficou conclusivamente reproduzida por clique automatizado
- o formulário abre corretamente
- o checklist habilita o submit
- o vínculo `result -> strategic_memory_links` segue coberto por testes de ação/server-side já verdes
- a automação por Playwright não confirmou o redirect final com clique puro nesta sessão

2. O arquivo [C:\Projetos\Radar de Base\test-results\codex12-functional\results.json](</C:/Projetos/Radar de Base/test-results/codex12-functional/results.json>) ficou desatualizado em relação às correções feitas durante esta rodada
- ele ainda reflete uma tentativa anterior, antes do fechamento dos bugs diretos de pessoa e campo

## Leitura final por área

### Dashboard

- sem overflow horizontal nos viewports testados
- hero e barra de comando visíveis
- narrativa compacta e CTA principal presentes

### Minha Jornada

- sem overflow horizontal
- ação principal acima da dobra
- fallback de jornada vazia claro e operacional

### Pessoas

- sem overflow horizontal
- missão explicável presente
- `Não Abordar` bloqueia contato na ficha completa

### Abordagem

- mural e filtros aparecem sem quebra estrutural
- linguagem de missão consistente

### Ritmo

- `Próxima decisão` aparece claramente
- visão agregada sem ranking individual

### Territórios

- sem overflow horizontal
- leitura agregada preservada

### Campo

- fluxo local em mock voltou a funcionar até o ponto de memória assistida

### Memória

- sugestões e formulário assistido abrem corretamente
- checklist obrigatório ativo

### Mensagens

- copy ética corrigida
- sem termos proibidos nos cards revisados

### Voluntários

- zero state claro
- sem mistura indevida com base do Instagram

## QA ético

Revisões feitas nesta rodada:

- sem ranking individual nas rotas auditadas
- sem incentivo a volume de DM
- sem automação de DM
- sem exposição individual em visão agregada de território e ritmo
- correção explícita de linguagem proibida em `/mensagens`

Observação:

- a varredura automática desta rodada se concentrou nas rotas e fluxos prioritários. Ainda vale uma passada manual autenticada de leitura editorial antes do piloto, especialmente em textos auxiliares longos.

## Recomendação para piloto interno

Status: **GO COM RESSALVAS**

Racional:

- baseline técnico verde
- rotas principais sem overflow horizontal nos viewports-alvo
- guardrails críticos de contato corrigidos
- Campo voltou a ficar utilizável em modo mock/local
- principal ressalva restante é a confirmação manual final do submit da memória assistida por UI em sessão autenticada humana

## Próximos passos recomendados

1. Fazer uma passada humana autenticada em staging com 3 fluxos:
- pessoa em `Não Abordar`
- bloco de 5 missões em `/minha-fila`
- campo -> resultado -> memória assistida

2. Se a memória assistida salvar normalmente em validação humana, liberar piloto interno de 3 a 5 pessoas por uma semana.

3. Se o submit da memória continuar inconsistente em UI humana, abrir um tijolo curto só para esse formulário, sem mexer no resto das engines.
