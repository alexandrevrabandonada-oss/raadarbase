# Radar de Base - Estado da Nação 002

Data: 2026-04-27

## O que foi alterado

- A base saiu de mock puro e ganhou uma camada real de Supabase para leitura e escrita.
- Foi adicionada autenticação interna com `/login`, proteção de rotas e logout no layout.
- A camada de dados foi separada em módulos por domínio:
  - pessoas
  - posts
  - interações
  - abordagem
  - mensagens
  - auditoria
- Foram adicionadas ações reais para:
  - atualizar status
  - registrar DM manual
  - marcar respondeu
  - marcar contato confirmado
  - marcar não abordar
  - atualizar notas
  - atualizar/criar/remover modelos de mensagem
- A página de configurações passou a expor:
  - status da conexão Supabase
  - usuário logado
  - exportação CSV
  - teste de escrita em `audit_logs`
- Foram adicionados endpoints para exportação de contatos confirmados e teste de auditoria.
- O README foi ampliado com setup Supabase, login interno, alternância mock/real e checklist LGPD/campanha.

## Arquivos criados ou editados

- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/supabase/auth.ts`
- `src/lib/data/shared.ts`
- `src/lib/data/people.ts`
- `src/lib/data/posts.ts`
- `src/lib/data/interactions.ts`
- `src/lib/data/outreach.ts`
- `src/lib/data/messages.ts`
- `src/lib/data/audit.ts`
- `src/app/actions.ts`
- `middleware.ts`
- `src/app/login/page.tsx`
- `src/app/login/login-form.tsx`
- `src/app/api/contacts/export/route.ts`
- `src/app/api/audit/test/route.ts`
- `src/app/dashboard/page.tsx`
- `src/app/pessoas/page.tsx`
- `src/app/pessoas/[id]/page.tsx`
- `src/app/pessoas/[id]/person-actions.tsx`
- `src/app/abordagem/page.tsx`
- `src/app/mensagens/page.tsx`
- `src/app/mensagens/messages-client.tsx`
- `src/app/configuracoes/page.tsx`
- `src/app/configuracoes/settings-client.tsx`
- `src/components/app-shell.tsx`
- `src/components/logout-button.tsx`
- `README.md`
- `.env.example`
- `.env.local`

## Como testar

1. Rodar `npm install` se necessário.
2. Subir o app com `npm run dev`.
3. Abrir `/login` e autenticar com um usuário interno do Supabase Auth.
4. Navegar por:
   - `/dashboard`
   - `/pessoas`
   - `/pessoas/[id]`
   - `/abordagem`
   - `/mensagens`
   - `/configuracoes`
5. Na página de pessoa, testar:
   - salvar notas
   - registrar DM manual
   - marcar respondeu
   - marcar contato confirmado
   - marcar não abordar
6. Em `/mensagens`, criar e remover modelo.
7. Em `/configuracoes`, testar:
   - exportação CSV
   - escrita de `audit_logs`
8. Conferir no Supabase se as tabelas receberam alterações.

## Pendências

- O app ainda não está usando tipos gerados do banco Supabase, então parte da tipagem do acesso ao banco segue mais permissiva do que o ideal.
- A integração com dados reais da Meta ainda não foi feita.
- O fluxo de auditoria e exportação ainda pode ser enriquecido com melhor detalhamento por entidade e por usuário interno.
- Ainda há fallback para mock quando a conexão Supabase falha, para não quebrar o build nem o uso local.

## Próximo tijolo recomendado

Implementar os tipos gerados do Supabase e amarrar a persistência completa de pessoas, interações, contatos e mensagens ao esquema real, reduzindo os trechos de fallback e padronizando os registros de auditoria.
