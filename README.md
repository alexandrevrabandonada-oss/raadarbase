# Radar de Base

App interno para analise de metricas e interacoes do Instagram da pagina VR Abandonada, com foco em organizacao comunitaria, escuta popular e gestao etica de contatos.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Postgres
- Vercel

## Principios

- Sem envio automatico de mensagens.
- Sem scraping.
- Sem coleta de dados fora da API oficial.
- Sem classificacao de voto provavel ou perfil psicologico.
- Sem inferencia de ideologia, religiao, saude, renda, raca ou voto.
- Tokens da Meta e `SUPABASE_SERVICE_ROLE_KEY` ficam somente no servidor.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000/login`.

O login agora suporta cadastro interno direto pela própria tela `/login`.

## Variaveis de ambiente

```bash
META_APP_ID=
META_APP_SECRET=
META_GRAPH_VERSION=v23.0
META_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
META_SYNC_MAX_MEDIA=25
META_SYNC_MAX_COMMENTS_PER_MEDIA=50
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_ID=
SUPABASE_ACCESS_TOKEN=
NEXT_PUBLIC_USE_MOCKS=false
```

## Supabase

1. Rode as migrations:

```bash
supabase db push
```

2. Crie um usuario interno em Supabase Auth com email e senha.
3. Preencha `.env.local`.
4. Gere tipos quando necessario:

```bash
npm run supabase:types
```

O script espera `SUPABASE_ACCESS_TOKEN` e usa `SUPABASE_PROJECT_ID` ou o id padrao do projeto atual.

### Liberação de acesso interno

O cadastro pela tela `/login` cria o usuário no Supabase Auth e um registro em `public.internal_users` com status inicial `pending`.

Para liberar acesso ao painel, marque o usuário como `active` no Supabase:

```sql
update public.internal_users
set
   status = 'active',
   approved_at = now()
where email = 'usuario@example.com';
```

Se você já tinha usuários criados antes da migration de acesso interno, aplique também a migration `005_backfill_internal_users.sql` para popular `public.internal_users` com base em `auth.users`.

## Mock e ambientes

- `NEXT_PUBLIC_USE_MOCKS=true`: modo demonstracao explicito com dados ficticios e banner visual.
- `NEXT_PUBLIC_USE_MOCKS=false`: usa Supabase real.
- Em `development`, o modo mock so entra quando a flag estiver ativa.
- Em `production`, nao existe fallback silencioso para mock. Falhas de Supabase aparecem como erro claro na interface.

## Páginas

- `/login`
- `/dashboard`
- `/pessoas`
- `/pessoas/[id]`
- `/abordagem`
- `/mensagens`
- `/configuracoes`
- `/integracoes/meta`
- `/operacao`
- `/operacao/sync/[id]`
- `/api/health`

## Integração Meta/Instagram

A integração atual é somente leitura, manual e limitada à conta profissional/criador conectada ao projeto. Ela não faz scraping, não lê inbox/DM, não coleta seguidores em massa e não envia mensagens.

### Como configurar

1. Crie ou use um app Meta com permissões oficiais para Instagram profissional/criador.
2. Gere um token autorizado para a conta do projeto.
3. Preencha no ambiente do servidor:

```bash
META_GRAPH_VERSION=v23.0
META_ACCESS_TOKEN=
INSTAGRAM_BUSINESS_ACCOUNT_ID=
META_SYNC_MAX_MEDIA=25
META_SYNC_MAX_COMMENTS_PER_MEDIA=50
```

O `META_ACCESS_TOKEN` nunca deve ser colocado em variável `NEXT_PUBLIC_*`, renderizado no frontend ou salvo no banco.

### Como testar em desenvolvimento

1. Rode as migrations, incluindo `003_meta_ingestion.sql`.
2. Preencha as variáveis Meta em `.env.local`.
3. Entre no painel.
4. Abra `/integracoes/meta`.
5. Rode manualmente:
   - `Sincronizar dados da conta`
   - `Sincronizar últimos posts`
   - `Sincronizar comentários dos posts recentes`

### Como testar sem token

Deixe `META_ACCESS_TOKEN` ou `INSTAGRAM_BUSINESS_ACCOUNT_ID` vazio. A página `/integracoes/meta` deve mostrar status `não configurado` e bloquear a sincronização com erro amigável.

### Como conferir sincronizações

- `meta_sync_runs`: registra início, fim, status, contagens e erros seguros.
- `audit_logs`: registra eventos como `meta.media_synced`, `meta.comments_synced` e `meta.account_snapshot_synced`.
- `ig_posts`: recebe mídias/posts da própria conta.
- `ig_people`: recebe usernames que comentaram nos próprios posts autorizados.
- `ig_interactions`: recebe comentários com `external_id` para evitar duplicidade.

### Dados buscados

- Mídias/posts da própria conta conectada.
- Métricas básicas autorizadas de post, como curtidas e comentários.
- Comentários dos próprios posts quando a permissão permitir.
- Snapshot básico da própria conta: username, nome, quantidade de seguidores e quantidade de mídia.

### Dados não buscados

- DMs ou inbox.
- Seguidores em massa.
- Contatos pessoais do Instagram.
- Dados de terceiros sem autorização.
- Qualquer inferência de voto, ideologia, religião, saúde, renda, raça, orientação sexual ou perfil psicológico.

## Testes da Meta API com mocks

Os testes usam Vitest e fixtures locais em `src/lib/meta/__fixtures__/`. Eles não chamam a API real da Meta e não usam token verdadeiro.

```bash
npm run test
npm run test:watch
```

Cobertura atual:

- Meta configurada e não configurada.
- Token ausente e `INSTAGRAM_BUSINESS_ACCOUNT_ID` ausente.
- Respostas válidas de conta, posts e comentários.
- Erros 400, 401/token inválido e permissão.
- Erro parcial de comentários.
- Redação de `access_token` em retorno, `meta_sync_runs`, `audit_logs` e `console.error`.
- Criação de `meta_sync_runs`.
- Criação de `audit_logs`.
- Deduplicação por `ig_interactions.external_id`.

Para validar que token não vazou, rode `npm run test` e confira os testes de `src/lib/meta/client.test.ts` e `src/lib/meta/sync.test.ts`.

## RLS e permissões

Rode:

```bash
npm run check:rls
```

O script conecta com a anon key e tenta escrever diretamente em tabelas sensíveis. A expectativa é que anon não consiga escrever em:

- `ig_people`
- `ig_posts`
- `ig_interactions`
- `audit_logs`
- `meta_sync_runs`
- `contacts`

Se `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` não estiverem configuradas, o script avisa e sai com sucesso para não quebrar o ambiente local. Escritas reais devem passar por server actions ou service role no servidor.

### RLS com usuário real

Para validar leitura autenticada e bloqueio de escrita direta com usuário real de teste:

```bash
SUPABASE_TEST_EMAIL=teste@example.com SUPABASE_TEST_PASSWORD=senha npm run check:rls
```

Sem essas variáveis, o script mantém a validação anon e avisa que a validação autenticada foi pulada.

## Operação e healthcheck

Use `/operacao` para acompanhar sincronizações Meta:

- status `started`, `success` ou `error`;
- tipo da rotina;
- início e fim;
- inseridos, atualizados e ignorados;
- ator interno;
- link de detalhe.

Use `/operacao/sync/[id]` para ver metadata formatada, audit logs relacionados, retries e link para a run original quando a execução for reprocessamento.

### Runs presas

Uma run é considerada presa quando `status = started`, `finished_at` está vazio e `started_at` é mais antigo que 15 minutos.

O painel `/operacao` mostra `Atenção operacional` com quantidade de runs presas, última run presa e aviso de erro recorrente nas últimas 24h.

### Marcar falha e reprocessar

Em `/operacao/sync/[id]`, `Marcar como falha` só funciona para run em andamento. A ação define `status = error`, preenche `finished_at`, grava erro redigido e registra `meta.sync_marked_failed`.

`Reprocessar com segurança` cria uma nova `meta_sync_run`, preserva a antiga, grava `metadata.retry_of` e registra `meta.sync_retried`.

Use `/api/health` para diagnóstico sem segredos. O endpoint retorna `stuck_sync_runs_count`, `last_meta_sync_status`, `last_meta_sync_at`, `supabase_configured`, `meta_configured`, `mock_mode`, `environment` e `timestamp`.

Para validar por script:

```bash
HEALTHCHECK_URL=http://localhost:3000/api/health npm run check:health
```

## E2E

Os testes E2E ficam em `e2e/` e usam Playwright. Por padrão, `npm run e2e` pula a execução para não quebrar o ambiente local.

```bash
npm run e2e
E2E_RUN=true npm run e2e
```

O modo autenticado local usa `E2E_BYPASS_AUTH=true` com `NODE_ENV=test`. Como `next dev` roda como `development`, o servidor local de E2E também exige `E2E_TEST_MODE=true`, `NEXT_PUBLIC_USE_MOCKS=true` e ambiente não-produção. Nunca habilite esse bypass em produção.

## Como validar audit_logs

1. Entre no painel.
2. Abra `/configuracoes`.
3. Clique em `Testar escrita de audit_log`.
4. Confira a tabela `audit_logs`.
5. Acoes sensiveis tambem devem registrar eventos como:
   - `contact.dm_registered`
   - `contact.confirmed`
   - `message.updated`
   - `contacts.exported`
   - `contact.anonymized`

## Como testar exportacao CSV

1. Abra `/configuracoes`.
2. Clique em `Exportar contatos confirmados`.
3. O CSV inclui apenas contatos confirmados.
4. Pessoas marcadas como `nao_abordar` ficam de fora.

## Como testar anonimização

1. Abra `/configuracoes`.
2. Use `Anonimizar/remover contato`.
3. Confira a pessoa e o contato no banco.
4. Confira o `audit_logs` com `contact.anonymized`.

## Checklist antes da API Meta

- Tipos do Supabase atualizados com `npm run supabase:types`.
- Migrations aplicadas.
- Usuario interno criado.
- `NEXT_PUBLIC_USE_MOCKS=false` no ambiente real.
- Exportacao CSV validada.
- Auditoria validada.
- Nenhuma automacao de DM implementada.
- Nenhum scraping implementado.

## Checklist de conformidade antes de campanha

- Conta Instagram profissional/criador conectada por fluxo autorizado.
- Token guardado apenas no servidor.
- Sincronização sempre manual.
- Sem scraping.
- Sem envio automático.
- Sem exportar pessoa sem consentimento.
- Pessoas marcadas como `nao_abordar` respeitadas.
- `meta_sync_runs` e `audit_logs` conferidos após testes.

## Checklist antes de avançar para webhooks

- `npm run test` verde.
- `npm run check:rls` bloqueando escrita anon.
- `/operacao` mostrando runs e erros redigidos.
- `/api/health` sem segredos.
- Runs presas tratadas manualmente e auditadas.
- Reprocessamentos com `metadata.retry_of` conferidos.
- E2E executado em modo de teste, se aplicável.
- Migration `003_meta_ingestion.sql` aplicada no banco real.
- Nenhum token apareceu em erro, audit log, console ou interface.
- Sincronização continua manual.
- Nenhuma DM, webhook, scraping ou agendamento implementado.
