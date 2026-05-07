# Estado da Nacao 062

Data: 2026-05-05

## Resumo executivo

Ciclo 062: Rastreabilidade das ações corretivas do Radar de Silêncios. Criação de tabela dedicada para registrar ações corretivas geradas a partir dos achados do radar. Página de acompanhamento /radar/silencios/acoes com ciclo planejado/em andamento/concluído/arquivado. Dedupe de ações por (kind, target_type, target_label) na janela ativa. Cálculo de impacto agregado antes/depois. Exportação segura CSV sem PII. Guardrails preservados. Produção bloqueada.

## Migration criada

Arquivo: supabase/migrations/023_silence_radar_corrective_actions.sql

Tabela: silence_radar_corrective_actions

Campos:
- id: uuid primary key
- action_plan_item_id: uuid null references action_plan_items(id) on delete set null
- kind: reforco_bairro | explicacao_pauta | pergunta_publica | roda_escuta | card_explicativo
- target_type: bairro | pauta | post | janela
- target_label: text (bairro, pauta ou shortcode; sem PII)
- source_metric: text (nome da métrica de origem)
- baseline_value: numeric null
- baseline_snapshot: jsonb default '{}'
- status: planned | doing | done | archived (default planned)
- created_by: uuid null
- created_by_email: text null
- created_at: timestamptz default now()
- completed_at: timestamptz null
- metadata: jsonb default '{}'

RLS:
- SELECT: usuários internos aprovados
- INSERT/UPDATE/DELETE: negado a anon (service_role bypassa RLS para escrita server-side)

Índices:
- idx_srca_target (target_type, target_label, status)
- idx_srca_status (status)
- idx_srca_action_plan_item (action_plan_item_id) where not null

## Camada de dados

Arquivo: src/lib/data/silence-radar-corrective-actions.ts

Funções exportadas:

- listSilenceRadarCorrectiveActions(opts?): lista com filtros opcionais de status e target_type
- getActiveCorrectiveActionKeys(): retorna Set de chaves de dedupe (kind|target_type|target_label normalizado)
- correctiveActionDedupKey(kind, targetType, targetLabel): gera chave de dedupe
- createCorrectiveActionFromRadarFinding(input): cria registro; retorna mock em modo de teste
- completeCorrectiveAction(id): marca como done + completed_at
- archiveCorrectiveAction(id): marca como archived
- getCorrectiveActionImpact(actionId): compara baseline_snapshot x contagens atuais por agregados

Impacto (getCorrectiveActionImpact):
- Para bairro: conta bairro_escuta_submissions com bairro = target_label e created_at >= action.created_at
- Para pauta: conta bairro_escuta_submissions por pauta + comments em ig_posts por topic_category
- Para post: conta interações do post (like_count + comments_count) a partir do shortcode
- Nunca toca registros individuais: apenas contagens agregadas por alvo

## Ações corretivas integradas ao fluxo de criação

Arquivo atualizado: src/app/radar/silencios/actions.ts

Ambas as actions (createNeighborhoodReinforcementItemAction e createTopicExplanationItemAction) agora:

1. Criam o item no plano de ação (comportamento anterior)
2. Criam registro em silence_radar_corrective_actions com o item vinculado
3. Gravam audit log com action: silence_radar.corrective_action_created
4. Passam baseline (baseline_count, baseline_form_count, baseline_comment_count) das hidden inputs do form
5. Revalidam /radar/silencios/acoes além de /radar/silencios e /acoes

Campo kind para pauta é derivado do hidden input (explicacao_pauta por padrão; expansível para pergunta_publica/roda_escuta/card_explicativo).

## Dedupe de ações

Página /radar/silencios atualizada:

- Chama getActiveCorrectiveActionKeys() em paralelo com getSilenceRadarData() e listActionPlans()
- Para cada item dos 4 cards, verifica se a chave (kind, target_type, target_label) já existe
- Se existir: exibe badge "ação planejada" com ícone CheckCircle2 (verde)
- Se não existir: exibe botão "Criar tarefa" com baseline nas hidden inputs
- Evita duplicatas na mesma janela ativa sem bloquear criação para novos achados

## Tela de acompanhamento

Rota: /radar/silencios/acoes

Tipo: server component, dynamic, autenticado (admin/operador)

Mostra:
- Ações agrupadas por status (planejada, em andamento, concluída, arquivada)
- Para cada ação: tipo, alvo (tipo + label), métrica de origem, baseline, data de criação, email criador, data de conclusão, link para plano de ação
- Botão Concluir: chama completeCorrectiveActionServerAction → done + completed_at + audit log
- Botão Arquivar: chama archiveCorrectiveActionServerAction → archived + audit log
- Contadores de ativas e concluídas no cabeçalho
- Link "Exportar CSV seguro" para /api/radar/silencios/acoes/export
- Link "Voltar ao Radar" para /radar/silencios

Arquivo de server actions: src/app/radar/silencios/acoes/actions.ts

Audit logs gerados:
- silence_radar.corrective_action_created (ao criar)
- silence_radar.corrective_action_completed (ao concluir)
- silence_radar.corrective_action_archived (ao arquivar)

## Exportação segura

Endpoint: GET /api/radar/silencios/acoes/export

Arquivo: src/app/api/radar/silencios/acoes/export/route.ts

Exporta CSV com colunas:
- tipo_acao (label em português)
- alvo_tipo (bairro/pauta/post/janela)
- alvo (target_label — bairro ou pauta, sem PII individual)
- metrica_origem
- baseline (valor numérico ou vazio)
- status (label em português)
- data_criacao (dd/mm/yyyy)
- data_conclusao (dd/mm/yyyy ou vazio)
- item_plano_vinculado (sim/não)

Sem PII:
- Não expõe created_by_email nem created_by uuid
- Não expõe baseline_snapshot completo
- Não expõe metadata

Audit log gerado: territorial.snapshot_exported com count e export_format

## Guardrails preservados

- Sem score individual.
- Sem classificação de pessoa.
- Sem DM automática.
- Sem microtargeting.
- Sem exposição de PII ou relato bruto.
- Análise apenas em agregados por pauta, bairro, canal e período.
- Ações criadas e concluídas manualmente por operador humano.
- Exportação segura — sem dados pessoais identificáveis.

## Arquivos criados

- supabase/migrations/023_silence_radar_corrective_actions.sql
- src/lib/data/silence-radar-corrective-actions.ts
- src/app/radar/silencios/acoes/page.tsx
- src/app/radar/silencios/acoes/actions.ts
- src/app/api/radar/silencios/acoes/export/route.ts

## Arquivos modificados

- src/lib/supabase/database.types.ts (tabela silence_radar_corrective_actions adicionada)
- src/lib/types.ts (3 novos AuditAction: silence_radar.corrective_action_created/completed/archived)
- src/app/radar/silencios/actions.ts (cria corrective_action + audit log + revalida nova rota)
- src/app/radar/silencios/page.tsx (dedupe badge + "Ver ações corretivas" + baseline hidden inputs)

## Validações executadas

- npm run lint: 0 erros (14 warnings pré-existentes, inalterados)
- npm run build: compilado; /radar/silencios/acoes e /api/radar/silencios/acoes/export aparecem na lista de rotas (53 rotas total)
- npm run test: 20 arquivos, 156 testes passando
- npm run e2e:ci: 50 testes passando (31.5s)
- npm run check:health: sem segredos
- npm run readiness: avisos esperados de variáveis de produção ausentes
- npm run verify: 0 erros (lint + build + test + check:rls + check:health + e2e)
- npm run staging:devolution-db-check: resultado OK
- npm run staging:webhook:evidence: 3 eventos, 0 quarentenados, 29 audit logs
- npm run staging:webhook:go-no-go: decisão GO_STAGING

## Produção

- Produção permanece bloqueada.
- Webhooks seguem GO_STAGING.
- Operação mantida em staging/internal.

## Próximo tijolo

Com o sistema de rastreamento operacional:

1. Executar pelo menos uma janela de escuta completa usando o Radar de Silêncios + ações corretivas para coletar um ciclo antes/depois real.
2. Implementar dashboard de impacto agregado (/radar/silencios/impacto) usando getCorrectiveActionImpact para visualizar delta de relatos/formulários/interações por pauta e bairro.
3. Considerar adicionar kind pergunta_publica e roda_escuta diretamente no formulário de criação de tarefa para permitir escolha pelo operador sem alterar guardrails.
4. Avaliar integração da janela territorial como filtro de período nas consultas de impacto.
