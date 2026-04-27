# Radar de Base - Estado Atual do Projeto

Data: 2026-04-26

## Resumo

O projeto foi iniciado do zero e já está com uma base funcional em Next.js App Router, TypeScript, Tailwind CSS e shadcn/ui. As telas principais do painel foram criadas, os dados mockados estão disponíveis para teste local e a estrutura de banco para Supabase já foi preparada em SQL.

## O que já foi entregue

### Estrutura base

- App Next.js com App Router.
- TypeScript configurado.
- Tailwind CSS configurado.
- shadcn/ui inicializado.
- Dependências principais instaladas: `@supabase/supabase-js`, `lucide-react`, `recharts`, `clsx`, `tailwind-merge`.

### Páginas criadas

- `/dashboard`
- `/pessoas`
- `/pessoas/[id]`
- `/abordagem`
- `/mensagens`
- `/configuracoes`

### Layout e UI

- Navegação lateral persistente.
- Identidade visual clara, com fundo off-white, preto, amarelo, ferrugem e vermelho discreto.
- Cards, tabela, alertas, badges e botões grandes.
- Linguagem da interface alinhada ao pedido: Pessoas, Responder, Convidar, Contato confirmado, Não abordar.

### Funcionalidades implementadas

- Dashboard com cards de métricas.
- Gráfico simples de interações por dia.
- Lista de posts mais ativos.
- Página de pessoas com busca, filtro e ordenação.
- Página de perfil com timeline, notas internas, tags e ações.
- Kanban de abordagem com colunas e movimentação local.
- CRUD local de mensagens-base.
- Tela de configurações com texto de conformidade, finalidade da base, link de política, exportação CSV e ação de anonimizar/remover contato.

### Banco Supabase

- Migration SQL criada em `supabase/migrations/001_initial_schema.sql`.
- Tabelas criadas:
  - `ig_posts`
  - `ig_people`
  - `ig_interactions`
  - `contacts`
  - `outreach_tasks`
  - `message_templates`
  - `audit_logs`
- Tipos enum criados para status e tipo de interação.
- RLS habilitado com políticas de leitura para usuários autenticados.

### Conformidade e ambiente

- Variáveis de ambiente documentadas em `.env.example`.
- Tokens da Meta e service role do Supabase não são expostos no frontend.
- README criado com instruções de setup e visão geral.

## Dados mockados

Os dados de teste estão em `src/lib/mock-data.ts` e incluem:

- Posts.
- Pessoas.
- Interações.
- Tarefas de abordagem.
- Modelos de mensagem.
- Série simples de interações por dia.

## Verificações já feitas

- `npm run lint` concluído com sucesso.
- `npm run build` concluído com sucesso.
- Servidor local respondeu em `http://127.0.0.1:3000/dashboard`.
- Capturas de tela feitas com Playwright para:
  - Dashboard desktop
  - Pessoas mobile
  - Abordagem desktop

## Ajustes feitos após a primeira validação visual

- O gráfico do dashboard foi trocado para barras para melhorar leitura e estabilidade visual.
- O Kanban foi ajustado para rolagem horizontal com largura mínima, evitando corte de botões e conteúdo.

## Estado atual

O projeto está funcional e navegável com mock data. O que ainda falta para produção é a integração real com a API oficial da Meta, a persistência das telas em Supabase e a implementação das mutações reais para consentimento, exportação e anonimização.

## Próximos passos recomendados

1. Ligar os dados mockados aos endpoints/Server Actions reais.
2. Implementar autenticação e autorização interna.
3. Criar leitura real da API oficial do Instagram/Meta, sem scraping.
4. Persistir ações de consentimento, DM registrada e status no Supabase.
5. Adicionar auditoria das mudanças de status e exportações.
