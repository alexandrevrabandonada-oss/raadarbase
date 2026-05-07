# Radar de Base: Ambiente de Produção Controlada

Este documento define os procedimentos operacionais para executar o Radar de Base em modo de Produção Controlada (sem mocks, utilizando banco de dados real Supabase).

## 1. Variáveis de Ambiente Necessárias

Para rodar em ambiente real, o arquivo `.env.local` deve conter obrigatoriamente:

```env
# Desativa o modo Mock e força a conexão com banco real
NEXT_PUBLIC_USE_MOCKS="false"

# Credenciais do Supabase (Client-side)
NEXT_PUBLIC_SUPABASE_URL="https://[SUA_URL_SUPABASE].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[SUA_ANON_KEY]"

# Credenciais do Supabase (Server-side/Service Role)
SUPABASE_SERVICE_ROLE_KEY="[SUA_SERVICE_ROLE_KEY]"
SUPABASE_ACCESS_TOKEN="[SEU_ACCESS_TOKEN_PARA_MIGRATIONS]"
```

## 2. Como Ligar/Desligar o Ambiente Mock

O ambiente Mock é útil para demonstrações e testes de UI sem afetar dados reais.
- Para **Ligar Mocks**: Altere para `NEXT_PUBLIC_USE_MOCKS="true"`.
- Para **Ligar Produção**: Altere para `NEXT_PUBLIC_USE_MOCKS="false"`.

**Importante:** A transição deve ser feita antes de iniciar a aplicação. Se a variável for alterada em tempo de execução, reinicie o servidor.

## 3. Scripts de Validação

Antes de iniciar a operação, execute o script de diagnóstico para garantir que o ambiente está configurado corretamente:

```bash
node scripts/radar-production-readiness.mjs
```

O script validará:
- Se `USE_MOCKS` está false.
- Se a conexão com Supabase está estabelecida.
- Se as tabelas necessárias existem (`ig_people`, `outreach_tasks`, etc.).
- Se o RLS está bloqueando acessos indevidos.

## 4. Validação de Telas e Funcionalidades

Com o sistema rodando com banco real, as telas principais reagirão da seguinte forma:

- **/pessoas**: Exibirá a lista vazia com a mensagem "Nenhuma pessoa real encontrada. Importe ou sincronize dados antes de operar." se não houver registros.
- **/pessoas/[id]**: Mostra o perfil completo e deve permitir registrar resposta ou encaminhamento (verifique se os logs de auditoria são criados).
- **/abordagem**: Exibirá "Nenhuma tarefa de abordagem aberta" caso a tabela `outreach_tasks` esteja vazia.
- **/mensagens**: Se os templates de base (Mock) sumirem, execute o script de seed (`node scripts/seed-radar-message-templates.mjs`) para criar os modelos iniciais no banco real.
- **/campo**: Mantém o fluxo normal, listando apenas os eventos criados no banco.
- **/voluntarios**: Mantém o fluxo normal para gerenciar as inscrições confirmadas.

## 5. Cuidados Operacionais
- Não rode *migrations* destrutivas em produção. Use sempre arquivos `up` aditivos.
- Nenhuma rotina de disparo em massa (DM automatizada) existe no sistema. A equipe *deve* fazer o processo manualmente clicando em "Abrir Instagram".
- Os acessos de leitura e gravação no lado cliente (Client Components) são bloqueados por **RLS (Row Level Security)** para dados operacionais. Todo fluxo sensível é processado via Server Actions autenticadas.
