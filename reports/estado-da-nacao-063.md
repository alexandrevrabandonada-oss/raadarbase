# Estado da Nacao 063 - Dashboard de Impacto Agregado do Radar de Silencios

Data: 2026-05-05

## Escopo

Implementar um dashboard de impacto agregado das acoes corretivas do Radar de Silencios, incluindo pagina dedicada, cards, tabela com classificacao de impacto, filtros, detalhe por acao, exportacao segura, healthcheck e testes.

Producao continua bloqueada.

## Dashboard Criado

Nova rota criada:

- /radar/silencios/impacto

A pagina traz:

- totais de acoes por status;
- totais de impacto positivo, estavel, atencao e sem dados suficientes;
- cards agregados de criacao/conclusao, relatos antes/depois, interacoes antes/depois, pautas com melhoria e bairros ainda silenciosos;
- tabela de impacto por acao com baseline, atual, delta absoluto, delta percentual, datas, vinculo de plano e status de impacto.

## Cards Implementados

Cards agregados incluidos no dashboard:

- Acoes criadas
- Acoes concluidas
- Relatos antes/depois
- Interacoes antes/depois
- Pautas com melhoria
- Bairros ainda silenciosos

## Tabela de Impacto

A tabela por acao inclui:

- tipo da acao;
- alvo (target label + target type);
- status da acao;
- baseline;
- valor atual;
- delta absoluto;
- delta percentual (quando baseline > 0);
- data de criacao;
- data de conclusao;
- item de plano vinculado;
- status de impacto (melhoria, estavel, atencao, sem dados suficientes).

Nao inclui PII e nao exibe relatos brutos.

## Filtros

Filtros entregues:

- tipo de acao;
- target_type;
- status;
- periodo (de/ate);
- impacto;
- janela territorial ativa, historica ou especifica.

## Camada de Dados

Arquivo criado:

- src/lib/data/silence-radar-impact.ts

Funcoes implementadas:

- getSilenceRadarImpactDashboard(filters)
- getCorrectiveActionsImpactSummary(filters)
- classifyCorrectiveActionImpact(delta)
- getStillSilentTargets(filters)

Classificacao aplicada:

- melhoria: delta > 0
- estavel: delta = 0 com baseline > 0
- atencao: baseline = 0 e atual = 0
- sem_dados_suficientes: sem comparabilidade/baseline/atual

## Detalhe de Acao

Nova rota:

- /radar/silencios/acoes/[id]

Entrega no detalhe:

- dados da acao;
- baseline e impacto atual;
- historico de status;
- audit logs relacionados (acao e item de plano);
- botao concluir;
- botao arquivar;
- link para item do plano.

A listagem em /radar/silencios/acoes agora linka cada acao para seu detalhe.

## Exportacao Segura

Novo endpoint:

- /api/radar/silencios/impacto/export

Formatos:

- CSV (padrao)
- Markdown (format=markdown)

Campos exportados:

- tipo;
- alvo;
- baseline;
- valor atual;
- delta;
- status de impacto;
- periodo.

Sem PII.

## Healthcheck

Campos seguros adicionados em /api/health:

- silence_corrective_actions_count
- silence_corrective_actions_done_count
- silence_positive_impact_count
- silence_attention_impact_count

## Testes

Criado/atualizado:

- src/lib/data/silence-radar-impact.test.ts
- e2e/silence-radar-impact.spec.ts
- e2e/health.spec.ts (novas assercoes de health)

Cobertura esperada:

- renderizacao da pagina de impacto;
- calculo de delta;
- classificacao de impacto;
- exportacao sem PII;
- resiliencia com banco vazio;
- ausencia de token/comment/username na tela/export.

## Guardrails Preservados

Mantido:

- sem score individual;
- sem classificacao de pessoa;
- sem DM automatica;
- sem automatizacao de abordagem;
- sem criacao automatica de contato;
- sem microtargeting;
- sem PII;
- sem relato bruto;
- analise apenas agregada por acao, alvo, pauta, bairro, post e periodo.

## Status de Producao

- Producao permanece bloqueada.

## Proximo Tijolo Recomendado

Adicionar serie temporal agregada por acao (antes/depois por dia) no dashboard de impacto, com comparacao entre janela ativa e historica, mantendo exportacao segura e sem qualquer granularidade individual.
