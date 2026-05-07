# Runbook de Webhook em Producao (Pre-Homologacao)

## Objetivo da ativacao em producao

Estabelecer um procedimento formal, auditavel e seguro para uma futura decisao humana sobre ativacao dos webhooks Meta/Instagram em producao, sem executar ativacao automatica neste tijolo.

## Pre-requisitos

1. Staging em GO_STAGING e observacao STAGING_STABLE.
2. Guardrails preservados: sem DM automatica, sem contato automatico, sem score politico individual.
3. Quarentena obrigatoria e processamento manual confirmados.
4. Equipe operacional treinada e checklist de treinamento concluida.
5. Decisores formais de go/no-go disponiveis.
6. Plano de rollback validado e conhecido pela operacao.

## Envs necessarias (sem valores)

1. NEXT_PUBLIC_SUPABASE_URL
2. NEXT_PUBLIC_SUPABASE_ANON_KEY
3. SUPABASE_SERVICE_ROLE_KEY
4. META_WEBHOOK_VERIFY_TOKEN
5. META_APP_SECRET
6. META_WEBHOOK_ENABLED
7. META_WEBHOOK_ALLOWED_OBJECTS
8. META_WEBHOOK_MAX_PAYLOAD_BYTES
9. APP_URL

## Passo a passo de ativacao (somente decisao humana futura)

1. Confirmar artefatos mais recentes de staging (evidence, go-no-go, observation, preflight).
2. Validar que `production_ready_recommendation` esta em `READY_FOR_HUMAN_REVIEW`.
3. Reunir decisores formais para deliberacao registrada.
4. Registrar ata de go/no-go com responsavel, horario e motivacao.
5. Somente apos aprovacao formal: aplicar configuracao de producao manualmente.
6. Nao executar qualquer automacao de ativacao.

## Como testar GET verification

1. Enviar requisicao GET ao endpoint de webhook com `hub.mode`, `hub.verify_token` e `hub.challenge`.
2. Confirmar resposta 200 com challenge quando token for valido.
3. Confirmar resposta de negacao para token invalido.
4. Registrar o resultado em log operacional sem incluir tokens.

## Como testar POST assinado

1. Enviar payload de teste com assinatura HMAC valida.
2. Confirmar recebimento sem expor payload bruto em relatorios.
3. Confirmar classificacao para quarentena obrigatoria.
4. Confirmar audit log de recebimento/processo manual.

## Como testar rejeicao de unsigned

1. Enviar payload sem assinatura.
2. Confirmar rejeicao tecnica.
3. Confirmar incidente/audit log de assinatura invalida.
4. Confirmar que nenhum fluxo automatico foi disparado.

## Como monitorar quarentena

1. Acompanhar contagem de eventos `quarantined` e eventos envelhecidos.
2. Tratar picos de quarentena como sinal de alerta.
3. Verificar dashboard, incidentes e artefato de observacao.

## Como processar manualmente

1. Abrir evento em quarentena no painel interno.
2. Revisar tipo de evento e contexto permitido.
3. Processar somente eventos aderentes a regra de governanca.
4. Registrar audit log e, quando necessario, nota operacional.

## Como ignorar eventos proibidos

1. Identificar evento proibido ou fora de escopo.
2. Marcar como ignorado no fluxo manual.
3. Registrar motivo objetivo da decisao.
4. Escalar para incidente caso haja recorrencia ou risco.

## Como identificar incidente

1. Assinatura invalida recorrente.
2. Falha de processamento recorrente.
3. Crescimento anormal de quarentena.
4. Qualquer indicio de automacao proibida.
5. Qualquer exposicao de dado sensivel.

## Como fazer rollback

1. Bloquear imediatamente novas entradas de webhook em producao por configuracao manual.
2. Manter trilha de auditoria e preservar evidencias.
3. Suspender processamento manual enquanto risco estiver ativo.
4. Reverter para estado operacional seguro conhecido.
5. Revalidar health, readiness e guardrails.
6. Reabrir somente apos nova decisao formal humana.

## Quem pode decidir go/no-go

1. Responsavel tecnico do produto/plataforma.
2. Responsavel de operacao interna.
3. Responsavel de governanca/compliance.

A decisao deve ser conjunta, registrada e assinada internamente.