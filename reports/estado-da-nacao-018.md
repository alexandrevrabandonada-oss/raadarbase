# Estado da Nação #018 - Fechamento de Estabilizacao (Readiness, CI e Dry-Run)

**Data**: 29 de Abril de 2026  
**Tema**: Validacao final de estabilizacao para staging/producao controlada

## Resumo Executivo

A etapa de estabilizacao foi concluida com sucesso no ambiente local, sem adicionar funcionalidade nova. O projeto ficou com:

- `npm run ci` verde
- `npm run readiness` verde
- `npm run e2e:ci` verde (43/43)
- `npm run verify` verde
- dry-run de staging implementado e executado com fallback seguro quando `APP_URL` nao esta configurado

## Resultado dos comandos solicitados

### 1) npm run readiness

**Status**: ✅ passou  
**Saida-chave**:
- avisos esperados: `META_ACCESS_TOKEN` ausente e `INSTAGRAM_BUSINESS_ACCOUNT_ID` ausente
- resultado: "Producao pronta para validacao final sem expor segredos no healthcheck"

### 2) npm run ci

**Status**: ✅ passou  
**Inclui**:
- lint (sem erros; warnings legados)
- build
- unit tests
- check:health
- e2e:ci

### 3) npm run verify

**Status**: ✅ passou  
**Inclui**:
- lint
- build
- test
- check:rls
- check:health
- e2e (pulado por design sem `E2E_RUN=true`)

### 4) npm run e2e:ci

**Status**: ✅ passou  
**Resultado**: `43 passed`

### 5) npm run staging:webhook:dry-run

**Status**: ✅ executado com fallback seguro  
**Resultado atual**:
- `APP_URL` nao configurado
- marcado como **pendente de staging externo**
- script sai com sucesso sem quebrar ambiente local

## Bateria obrigatoria adicional (executada)

- `npm run lint` -> ✅ sem erros (warnings legados)
- `npm run build` -> ✅
- `npm run test` -> ✅ 141/141
- `npm run check:health` -> ✅
- `npm run check:rls` -> ✅ (roles reais ausentes foram pulados conforme esperado)
- `npm run e2e` -> ✅ comando executado; pulado por design sem `E2E_RUN=true`
- `npm run test:webhook:local` -> ✅ executado com servidor local temporario e envs fake; 4 checks ficaram como "pendente de infraestrutura externa" (sem service role real), sem falha do comando

## Alteracoes feitas em CI

### .github/workflows/ci.yml

- Mantido gatilho em `push` para `main` e `pull_request`
- Mantido `npm ci`
- Pipeline simplificado para executar `npm run ci` em um passo unico
- Adicionadas envs fake seguras de CI (sem depender de secrets reais para PR)
- Continua falhando automaticamente se `e2e:ci` quebrar (pois esta dentro de `npm run ci`)

## Alteracoes feitas no healthcheck/readiness

### scripts/production-readiness.mjs

Reforcos adicionados:
- valida migrations `012`, `013`, `014`, `015`, `015a`
- valida existencia de endpoint `src/app/api/meta/webhook/route.ts`
- valida docs:
  - `docs/meta-webhooks-readiness.md`
  - `docs/meta-webhooks-operator-guide.md`
  - `docs/meta-webhooks-staging-checklist.md`
- valida presenca dos guardrails de quarentena/DM/score no processamento de webhooks
- adiciona verificacao de script `staging:webhook:dry-run`

### /api/health

- Mantido sem exposicao de valores sensiveis
- teste E2E reforcado para barrar marcadores adicionais:
  - `META_APP_SECRET`
  - `META_WEBHOOK_VERIFY_TOKEN`
  - `META_ACCESS_TOKEN`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `access_token`
  - `service_role`
  - `webhook_verify_token`

## Alteracoes feitas no checklist visual

### src/app/integracoes/meta/webhooks/page.tsx

- descricao da pagina atualizada para incluir checklist de staging

### src/app/integracoes/meta/webhooks/actions.ts

- stats agora expõe apenas booleans de configuracao (sem valores):
  - app secret configurado
  - verify token configurado
  - webhook enabled configurado
  - service role configurado

### src/app/integracoes/meta/webhooks/webhooks-list-client.tsx

- novo bloco visual "Checklist de Staging"
- itens solicitados adicionados:
  - Migrations aplicadas
  - Tipos Supabase atualizados
  - Env vars configuradas
  - GET verification testado
  - POST assinado testado
  - POST sem assinatura rejeitado
  - Evento entrou em quarentena
  - Operador consegue visualizar
  - Operador consegue ignorar
  - Operador consegue processar evento permitido
  - Audit logs gerados
  - Incidentes gerados em evento invalido
  - Healthcheck sem segredos
  - CI verde
- exibicao de env apenas como `Configurado`/`Nao configurado`
- removidos nomes literais de variaveis sensiveis da UI para cumprir teste de seguranca

## Dry-run de staging (script)

### scripts/staging-webhook-dry-run.mjs (novo)

Implementado para:
- checar envs sem imprimir valores
- checar `APP_URL`
- se `APP_URL` existir: testar GET verification, POST assinado, POST sem assinatura, DM proibida, objeto invalido e `/api/health`
- validar que `/api/health` nao contem marcadores sensiveis
- imprimir checklist final redigido
- se `APP_URL` nao existir: avisar claramente e marcar pendencia de staging externo sem quebrar local

### package.json

- novo script: `staging:webhook:dry-run`

## README

Adicionada secao:

- "Checklist final antes de ativar webhooks em producao"
- ordem exata de 10 passos solicitada

## Pendencias reais para staging

1. Executar `npm run staging:webhook:dry-run` com `APP_URL` real de staging.
2. Confirmar em staging os itens operacionais que dependem de dados reais:
   - processamento/ignorar por operador
   - audit logs completos
   - incidentes de assinatura invalida no banco
3. Rodar validacao de webhook com persistencia real (service role real no staging).

## Decisao recomendada

**Recomendacao**: ✅ **Pode ativar em staging controlado**, mantendo `META_WEBHOOK_ENABLED=false` ate concluir o dry-run externo com `APP_URL` de staging e checklist operacional completo.

**Para producao**: ❌ **Nao ativar ainda** enquanto as pendencias de staging externo acima nao estiverem concluídas e aprovadas.

## Proximo tijolo recomendado

**Tijolo #019 - Operacao de Staging Controlada**

Escopo sugerido:
1. rodar dry-run com `APP_URL` de staging real;
2. registrar evidencias SQL (eventos, links, incidentes, audit logs);
3. validar fluxo completo de quarentena -> revisao -> processar/ignorar com operador real;
4. emitir go/no-go formal para `META_WEBHOOK_ENABLED=true` em staging.
