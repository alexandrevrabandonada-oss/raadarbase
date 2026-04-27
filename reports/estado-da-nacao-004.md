# Estado da Nação 004 - Integração Meta somente leitura

Data: 2026-04-27

## O que foi implementado

- Criada a primeira integração oficial Meta/Instagram, somente leitura e acionada manualmente.
- Adicionado cliente server-side da Meta Graph API com tratamento padronizado de erro e sem exposição de token.
- Criado fluxo de sincronização para:
  - dados básicos da própria conta;
  - últimos posts/mídias da própria conta;
  - comentários dos posts próprios, quando autorizados.
- Criada página `/integracoes/meta` com status de configuração, última sincronização, último erro e botões manuais.
- Criados registros de execução em `meta_sync_runs`.
- Audit logs padronizados para sincronizações Meta.
- Dashboard passou a mostrar status e números da sincronização Meta.
- Pessoas ganhou filtro de origem e marcação visual para quem comentou no Instagram.
- Perfil da pessoa mostra post de origem quando a interação tiver post associado.
- Configurações ganhou checklist operacional antes de campanha.

## Arquivos criados/editados

- `.env.example`
- `README.md`
- `src/app/dashboard/page.tsx`
- `src/app/integracoes/meta/actions.ts`
- `src/app/integracoes/meta/meta-sync-client.tsx`
- `src/app/integracoes/meta/page.tsx`
- `src/app/pessoas/people-client.tsx`
- `src/app/pessoas/[id]/page.tsx`
- `src/app/configuracoes/settings-client.tsx`
- `src/components/app-shell.tsx`
- `src/lib/meta/client.ts`
- `src/lib/meta/sync.ts`
- `src/lib/supabase/database.types.ts`
- `src/lib/types.ts`
- `supabase/migrations/003_meta_ingestion.sql`
- `reports/estado-da-nacao-004.md`

## Migrations criadas

- `supabase/migrations/003_meta_ingestion.sql`

A migration adiciona campos de ingestão Meta em `ig_posts`, `ig_people` e `ig_interactions`, cria `meta_account_snapshots`, cria `meta_sync_runs` e habilita leitura autenticada via RLS nas novas tabelas.

## Como testar

1. Aplicar migrations no Supabase.
2. Preencher no servidor:
   - `META_GRAPH_VERSION=v23.0`
   - `META_ACCESS_TOKEN`
   - `INSTAGRAM_BUSINESS_ACCOUNT_ID`
   - `META_SYNC_MAX_MEDIA=25`
   - `META_SYNC_MAX_COMMENTS_PER_MEDIA=50`
3. Entrar no painel com usuário interno.
4. Abrir `/integracoes/meta`.
5. Rodar manualmente:
   - `Sincronizar dados da conta`
   - `Sincronizar últimos posts`
   - `Sincronizar comentários dos posts recentes`
6. Conferir:
   - `meta_sync_runs`
   - `audit_logs`
   - `ig_posts`
   - `ig_people`
   - `ig_interactions`

Sem token ou sem ID da conta, a página deve mostrar integração não configurada e não deve tentar sincronizar.

## Quais dados a integração busca

- Dados básicos da própria conta conectada: username, nome, total de seguidores e total de mídia, quando autorizados.
- Posts/mídias da própria conta: id, legenda, tipo, URL de mídia, permalink, data, curtidas e comentários.
- Comentários dos próprios posts: id externo, texto, username e data.

## Quais dados ela NÃO busca

- Inbox ou DMs.
- Seguidores em massa.
- Contatos pessoais vindos do Instagram.
- Dados de público de terceiros.
- Dados fora da API oficial/autorizada.
- Qualquer classificação de voto, ideologia, religião, saúde, renda, raça, orientação sexual ou perfil psicológico.

## Riscos e travas de segurança

- Token Meta fica apenas no servidor e não é renderizado no frontend.
- Erros da Meta são redigidos para não vazar token.
- Cada sincronização cria `meta_sync_runs`.
- Cada sincronização escreve `audit_logs`.
- Botões usam estado de loading para evitar clique duplicado.
- O backend impede nova sincronização do mesmo tipo se já houver execução em andamento.
- Não há envio automático de mensagem, scraping, webhook, agendamento ou DM.

## Pendências

- Aplicar a migration `003_meta_ingestion.sql` no Supabase real.
- Testar com token Meta válido e permissões corretas.
- Rever políticas RLS finais para produção após definir perfis internos.
- Criar testes automatizados para os fluxos de sync com mocks de Meta API.
- Melhorar reconciliação de temas para preservar taxonomia interna quando houver alto volume de comentários.

## Próximo tijolo recomendado

Implementar suíte de testes para sincronização Meta com respostas mockadas, validar permissões/RLS em ambiente real e criar tela de observabilidade operacional para execuções, falhas e volume importado antes de avançar para webhooks.
