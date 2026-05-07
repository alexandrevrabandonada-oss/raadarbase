# Estado da Nacao Radar de Base 00 - Diagnostico

## Resumo do projeto

O repositório já é um app operacional amplo, não um MVP vazio. Hoje ele cobre escuta pública, pessoas/interações do Instagram, abordagem manual, modelos de mensagem, relatórios, memória estratégica, incidentes, integração Meta, webhooks em quarentena, agenda de campo, voluntários, retenção e revisão periódica.

Para o objetivo descrito de "saber quem abordar hoje, por que abordar, qual mensagem mandar, registrar resposta e encaminhar para evento, grupo, Missão ÉLuta ou missão de mobilização", a base mais próxima já existe em:

- `/pessoas`
- `/pessoas/[id]`
- `/abordagem`
- `/mensagens`
- `/campo`
- `/voluntarios`

O trabalho recomendado não é abrir um módulo paralelo. É encaixar o MVP Radar de Base em cima desses fluxos existentes.

## Stack

- Framework: Next.js `16.2.4`
- Router: Next.js App Router (`src/app`)
- Linguagem: TypeScript
- UI: React `19`, Tailwind CSS `4`, shadcn/ui, Base UI, Lucide icons
- Gráficos: Recharts
- Backend app-side: Route Handlers + Server Actions
- Banco/Auth: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- Testes unitários: Vitest
- E2E: Playwright
- Deploy: Vercel

## Estrutura principal

- `src/app`: páginas e APIs App Router
- `src/components`: shell, cabeçalhos, gráficos e primitives de UI
- `src/lib/data`: camada de acesso a dados por domínio
- `src/lib/meta`: cliente Meta, sync, webhook, segurança e fixtures
- `src/lib/supabase`: clientes, auth e types
- `scripts`: checks operacionais, staging, production, smoke e readiness
- `supabase/migrations`: schema e evolução do banco
- `e2e`: testes browser/end-to-end
- `reports`: artefatos de operação, staging e produção

## Router

O projeto usa **Next.js App Router**, não Pages Router, React Router nem outro router.

Evidências:

- existe `src/app`
- não existe `pages/`
- há `layout.tsx`, `page.tsx` e `route.ts`
- o guia local do Next em `node_modules/next/dist/docs/01-app/index.md` descreve o App Router como base do projeto

## Rotas existentes

### Páginas principais

- `/login`
- `/dashboard`
- `/pessoas`
- `/pessoas/[id]`
- `/abordagem`
- `/mensagens`
- `/integracoes/meta`
- `/integracoes/meta/webhooks`
- `/integracoes/meta/webhooks/[id]`
- `/operacao`
- `/operacao/incidentes`
- `/operacao/meta-reconciliacao`
- `/operacao/meta-reconciliacao/evidencias/[id]`
- `/operacao/sync/[id]`
- `/temas`
- `/temas/revisao`
- `/temas/[slug]`
- `/relatorios`
- `/relatorios/novo`
- `/relatorios/[id]`
- `/relatorios/[id]/devolutiva`
- `/execucao`
- `/memoria`
- `/memoria/nova`
- `/memoria/sugestoes`
- `/memoria/[id]`
- `/radar/silencios`
- `/radar/silencios/acoes`
- `/radar/silencios/acoes/[id]`
- `/radar/silencios/impacto`
- `/escuta/bairro`
- `/escuta/bairro/admin`
- `/recibo/escuta`
- `/recibo/escuta/distribuicao`
- `/campo`
- `/campo/novo`
- `/campo/[id]`
- `/campo/[id]/resultado`
- `/voluntarios`
- `/voluntarios/novo`
- `/voluntarios/[id]`
- `/voluntarios/[id]/editar`
- `/voluntarios/squads`
- `/voluntarios/squads/[id]`
- `/voluntarios/quero-ajudar`
- `/voluntarios/quero-ajudar/sucesso`
- `/voluntarios/inscricoes`
- `/voluntarios/inscricoes/[id]`
- `/voluntarios/inscricoes/retencao`
- `/voluntarios/revisao-periodica`
- `/configuracoes`
- `/governanca`
- `/posts`
- `/posts/[id]`

### APIs/exports

- `/api/health`
- `/api/internal/diagnostics`
- `/api/meta/webhook`
- `/api/meta/webhook/diagnostics`
- `/api/meta/reconciliation/evidence/[id]/export`
- `/api/contacts/export`
- `/api/campo/export`
- `/api/escuta/bairro/export`
- `/api/escuta/bairro/snapshots/[id]/export`
- `/api/radar/silencios/acoes/export`
- `/api/radar/silencios/impacto/export`
- `/api/radar/silencios/impacto/time-series/export`
- `/api/recibo/escuta/export`
- `/api/recibo/escuta/distribuicao/export`
- `/api/reports/[id]/devolutiva`
- `/api/reports/[id]/export`
- `/api/strategic-memory/[id]/export`
- `/api/voluntarios/export`
- `/api/voluntarios/inscricoes/export`
- `/api/voluntarios/revisao-periodica/export`
- `/api/action-plans/[id]/execution-export`
- `/api/audit/test`

## Supabase

Supabase está configurado e espalhado em uma camada explícita.

Arquivos centrais:

- [src/lib/supabase/admin.ts](</C:/Projetos/Radar de Base/src/lib/supabase/admin.ts>)
- [src/lib/supabase/client.ts](</C:/Projetos/Radar de Base/src/lib/supabase/client.ts>)
- [src/lib/supabase/server.ts](</C:/Projetos/Radar de Base/src/lib/supabase/server.ts>)
- [src/lib/supabase/auth.ts](</C:/Projetos/Radar de Base/src/lib/supabase/auth.ts>)
- [src/lib/supabase/database.types.ts](</C:/Projetos/Radar de Base/src/lib/supabase/database.types.ts>)
- [src/lib/config.ts](</C:/Projetos/Radar de Base/src/lib/config.ts>)

Estado atual:

- cliente browser e server usam `NEXT_PUBLIC_SUPABASE_URL` + publishable key com fallback legado
- cliente admin usa `SUPABASE_SECRET_KEY` com fallback para `SUPABASE_SERVICE_ROLE_KEY`
- os types do banco estão versionados no repo
- há migrations de `001` a `030`

## Integrações existentes

### Meta / Instagram

Já existe uma integração relativamente madura, mas manual e guardrailed:

- cliente Graph API em [src/lib/meta/client.ts](</C:/Projetos/Radar de Base/src/lib/meta/client.ts>)
- sync em [src/lib/meta/sync.ts](</C:/Projetos/Radar de Base/src/lib/meta/sync.ts>)
- segurança de webhook em [src/lib/meta/webhook-security.ts](</C:/Projetos/Radar de Base/src/lib/meta/webhook-security.ts>)
- processamento/quarentena em [src/lib/meta/webhook-processing.ts](</C:/Projetos/Radar de Base/src/lib/meta/webhook-processing.ts>)
- painel em `/integracoes/meta`
- reconciliação em `/operacao/meta-reconciliacao`
- fila de webhooks em `/integracoes/meta/webhooks`
- endpoint em `/api/meta/webhook`

Guardrails já observáveis:

- sem DM automática
- webhook com quarentena
- processamento manual
- rejeição de payload sem assinatura
- redaction de payload
- audit logs e incidentes

### Fluxos úteis para o Radar de Base

- `ig_people`, `ig_interactions`, `contacts`, `outreach_tasks`, `message_templates`
- Kanban manual de abordagem
- templates para copiar/colar
- agenda de campo
- módulos de voluntários e inscrições públicas consentidas

### Integrações ausentes ou não materializadas

- não vi integração operacional específica com app Missão ÉLuta além de menções textuais em recibo/distribuição
- não há fluxo explícito de "encaminhar para missão" como entidade de domínio hoje

## Scripts disponíveis

### Base

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run test`
- `npm run test:watch`

### Verificação e smoke

- `npm run check:rls`
- `npm run check:health`
- `npm run e2e`
- `npm run e2e:ci`
- `npm run e2e:ui`
- `npm run verify`
- `npm run test:webhook:local`

### Staging / Meta

- `staging:webhook:dry-run`
- `staging:webhook:config-check`
- `staging:check-url`
- `staging:db-check`
- `staging:webhook:evidence`
- `staging:webhook:observation`
- `staging:webhook:go-no-go`
- `staging:devolution-db-check`
- `staging:meta-api-check`
- `staging:meta-api-smoke`
- `staging:webhook:report`

### Production / readiness

- `production:webhook:preflight`
- `production:shadow-check`
- `production:shadow-report`
- `production:route-audit`
- `production:rls-audit`
- `production:role-audit`
- `production:access-audit-report`
- `production:final-decision:validate`
- `production:final-decision-pack`
- `production:activation-check`
- `production:webhook-smoke`
- `production:go-no-go`
- `production:decision-pack`
- `production:decision:validate`
- `readiness`

### Observação importante

Não existe script dedicado `typecheck`. A checagem de TypeScript hoje entra via `next build`.

## Padrão visual atual

O padrão visual é de painel operacional interno:

- sidebar fixa com navegação densa
- uso consistente de `Card`, `Badge`, `Table`, `Button`
- tipografia Geist
- paleta clara, neutra e quente
- acentos em amarelo/âmbar, azul e cinza
- aparência de ferramenta de operação, não de site público/marketing

Isso combina bem com o produto descrito. O MVP Radar de Base deve seguir esse padrão, não abrir uma experiência visual paralela.

## Riscos técnicos atuais

1. Escopo maior que o objetivo do produto.
O app já tem muitos módulos. Há risco de o Radar de Base virar mais um bloco lateral em vez de organizar o fluxo central de mobilização.

2. Autorização distribuída.
Parte da proteção está no `middleware`, parte em `requireInternalPageSession`. Funciona, mas é fácil criar página nova sem passar pelos dois mecanismos certos.

3. Leitura por client admin no server.
Boa parte da camada `src/lib/data` lê via admin client. Isso simplifica entrega, mas aumenta blast radius se um uso indevido escapar da superfície de rota protegida.

4. README e documentação operam com nomenclatura parcialmente defasada.
O código já aceita `publishable/secret` com fallback legado, mas a documentação principal ainda descreve o par antigo `anon/service_role`.

5. Verify local não cobre tudo por padrão.
`npm run verify` roda `e2e` condicional; sem `E2E_RUN=true`, o browser local é pulado. O CI cobre melhor que o fluxo local padrão.

6. Kanban de abordagem parece parcialmente client-side.
O quadro em `/abordagem` move cards localmente no client, mas esse trecho não mostra persistência da mudança de coluna. Isso é risco direto para o fluxo "quem abordar hoje".

7. Objetivo central ainda não está explicitado em um único fluxo.
Hoje "pessoas", "abordagem", "mensagens", "campo" e "voluntários" existem, mas não há uma trilha única e simples para um operador não técnico seguir do sinal até a conversão.

8. Dependência forte de schema Supabase amplo.
Há muitas migrations e muitos domínios. Mudanças no núcleo `ig_people/contacts/outreach_tasks` precisam ser cirúrgicas para não regressar módulos adjacentes.

## Onde o MVP Radar de Base deve entrar

### Entradas seguras

1. `/pessoas`
- melhor ponto para ranking de prioridade
- já lista interações, status, temas e ordenação
- aqui cabe "quem abordar hoje" e "por que abordar"

2. `/pessoas/[id]`
- melhor ponto para explicar contexto, histórico e próxima ação
- aqui cabe recomendação de mensagem, hipótese de abordagem, registro de resposta e encaminhamento

3. `/abordagem`
- melhor ponto para fila operacional diária
- aqui cabe o trabalho manual do time em colunas claras

4. `/mensagens`
- melhor ponto para biblioteca de mensagens-base contextuais
- aqui cabe vincular template por tema, estágio e CTA permitido

5. `/campo`
- melhor ponto para encaminhar para atividade presencial

6. `/voluntarios` e `/voluntarios/quero-ajudar`
- melhor ponto para conversão consentida em voluntariado
- deve continuar separado do engajamento Instagram até revisão humana

### Entradas que eu evitaria no MVP inicial

- mexer no pipeline Meta/webhook agora
- abrir módulo novo paralelo sem reaproveitar `pessoas`/`abordagem`
- colocar lógica de abordagem dentro de `dashboard`
- misturar isso com `radar/silencios` logo no primeiro corte

## Plano recomendado de implementação

1. Consolidar o núcleo Radar de Base em `pessoas -> pessoa -> abordagem -> mensagens -> campo/voluntários`.

2. Criar uma camada explícita de priorização operacional, não política.
Exemplo de critérios permitidos:
- volume de interação pública
- recência
- recorrência
- resposta prévia
- consentimento disponível
- presença de demanda concreta

3. Exibir razão da prioridade em linguagem humana.
Exemplo:
- comentou 4 vezes nos últimos 7 dias
- respondeu sobre transporte
- já pediu retorno
- ainda sem encaminhamento

4. Registrar próximo passo operacional manual.
- responder comentário
- mandar DM manual
- convidar para grupo
- convidar para evento
- encaminhar para formulário ou inscrição de voluntariado
- respeitar não-contato

5. Persistir o quadro de abordagem de verdade.
Hoje isso parece o principal gap operacional do fluxo.

6. Só depois disso, conectar encaminhamentos.
- evento de campo
- grupo
- inscrição de voluntário
- missão de mobilização

## Próximos tijolos sugeridos

1. **RB01 — Diagnóstico de priorização**
- revisar `ig_people`, `ig_interactions`, `contacts` e `outreach_tasks`
- definir campos suficientes para "quem abordar hoje"

2. **RB02 — Fila de prioridade em `/pessoas`**
- adicionar ranking operacional, filtros e justificativas

3. **RB03 — Detalhe de pessoa orientado a ação**
- motivo da abordagem
- mensagem sugerida
- próximo passo
- registro de resposta

4. **RB04 — Persistência real do quadro `/abordagem`**
- mover coluna no banco
- trilha auditada

5. **RB05 — Encaminhamentos**
- evento
- grupo
- voluntariado consentido
- missão de mobilização

6. **RB06 — Simplificação de UX**
- reduzir ruído para operador não técnico na trilha principal

## Comandos de diagnóstico executados

- inspeção estrutural de `src/app`, `src/lib`, `src/components`, `scripts` e `supabase/migrations`
- leitura dos pontos centrais de auth, Supabase, Meta e UI shell
- `npm run verify`: passou

### Resultado do verify

- `lint`: passou com 26 warnings antigos
- `build`: passou
- `test`: passou, 199 testes
- `check:rls`: passou
- `check:health`: passou
- `e2e`: pulado localmente porque `E2E_RUN=true` não está ativo
