# Radar de Base - Estado da Nacao 003

Data: 2026-04-27

## O que foi alterado

- Foi criado `src/lib/supabase/database.types.ts` com tipagem forte do schema publico.
- Os clients Supabase agora usam `createClient<Database>()`.
- Foi adicionado `src/lib/config.ts` para centralizar ambiente, modo mock e regras de runtime.
- O modo mock deixou de ser fallback silencioso e virou modo explicito via `NEXT_PUBLIC_USE_MOCKS=true`.
- Foi criado `src/lib/audit/write-audit-log.ts` para padronizar auditoria.
- `src/app/actions.ts` foi refeito com:
  - autenticacao obrigatoria
  - validacao de entrada
  - retorno padronizado
  - auditoria padronizada
  - nova acao de anonimizar contato
- Foi adicionada migration `002_operational_hardening.sql` para endurecer `audit_logs` e `contacts`.
- A exportacao CSV passou a:
  - registrar `audit_log`
  - excluir `nao_abordar`
  - exportar apenas campos operacionais
- A pagina de pessoa agora mostra ultimo registro de abordagem e bloqueia convite/DM quando a pessoa estiver em `nao_abordar`.
- A pagina de configuracoes ganhou a secao `Seguranca operacional`.
- Foi criado script `npm run supabase:types`.
- Foi criado script `npm run verify`.

## Arquivos criados ou editados

- `src/lib/config.ts`
- `src/lib/supabase/database.types.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/auth.ts`
- `src/lib/audit/write-audit-log.ts`
- `src/lib/types.ts`
- `src/lib/data/people.ts`
- `src/lib/data/posts.ts`
- `src/lib/data/interactions.ts`
- `src/lib/data/outreach.ts`
- `src/lib/data/messages.ts`
- `src/lib/data/audit.ts`
- `src/lib/data/utils.ts`
- `src/lib/mock-data.ts`
- `src/app/actions.ts`
- `src/app/api/contacts/export/route.ts`
- `src/app/api/audit/test/route.ts`
- `src/app/dashboard/page.tsx`
- `src/app/pessoas/page.tsx`
- `src/app/pessoas/[id]/page.tsx`
- `src/app/pessoas/[id]/person-actions.tsx`
- `src/app/abordagem/page.tsx`
- `src/app/abordagem/kanban-client.tsx`
- `src/app/mensagens/page.tsx`
- `src/app/mensagens/messages-client.tsx`
- `src/app/configuracoes/page.tsx`
- `src/app/configuracoes/settings-client.tsx`
- `src/components/app-shell.tsx`
- `src/components/runtime-alert.tsx`
- `package.json`
- `supabase/migrations/002_operational_hardening.sql`
- `.env.example`
- `README.md`

## Como testar

1. Rodar `npm install`.
2. Configurar `.env.local`.
3. Rodar `npm run lint`.
4. Rodar `npm run build`.
5. Rodar `npm run verify`.
6. Subir com `npm run dev`.
7. Entrar em `/login`.
8. Validar:
   - dashboard
   - pessoas
   - pessoa individual
   - abordagem
   - mensagens
   - configuracoes
9. Em `/configuracoes`, testar:
   - exportacao CSV
   - escrita de `audit_logs`
   - anonimizar/remover contato

## Riscos corrigidos

- Fallback silencioso para mock em erro de Supabase.
- Escrita em audit sem formato padrao.
- Actions sem retorno consistente.
- Dependencia de casts frouxos na camada de dados.
- Falta de indicacao visual de modo mock.
- Exportacao sem trilha de auditoria.

## Pendencias

- Gerar e sincronizar `database.types.ts` diretamente do projeto Supabase sempre que o schema mudar.
- Revisar o schema para suportar historico mais rico de contatos por pessoa, caso o produto precise de multiplos canais por contato.
- A integracao com a API oficial da Meta ainda nao foi iniciada.
- Parte da interface ainda usa mock visual para graficos e cards agregados, mesmo com dados reais por baixo.

## Proximo tijolo recomendado

Criar ingestao autenticada e auditavel da API oficial da Meta para popular `ig_posts`, `ig_people` e `ig_interactions`, incluindo jobs manuais de sincronizacao e travas para evitar coleta fora do escopo autorizado.
