# Estado da Nação RB09 - Produção Controlada

Data: 2026-05-07

## Resumo das Entregas

O projeto Radar de Base foi preparado para a transição do ambiente de *mocks* (dados simulados locais) para a **Produção Controlada**, conectando-se a um banco de dados real no Supabase. O foco deste ciclo foi garantir que o aplicativo reaja graciosamente à ausência de dados reais (empty states) e fornecer ferramentas para a equipe validar o ambiente de forma segura.

### Checklist de Ambiente Implementado
- **Documentação**: Criada em `docs/radar-de-base-producao-controlada.md`, detalhando variáveis de ambiente necessárias e procedimentos.
- **Script de Prontidão**: Desenvolvido `scripts/radar-production-readiness.mjs` para checar `USE_MOCKS`, presença de chaves do Supabase, conectividade e RLS de forma segura (somente leitura/teste básico).
- **Seed de Templates**: Criado `scripts/seed-radar-message-templates.mjs` para injetar os templates-base sem duplicação no banco real.
- **Empty States Tolerantes**: 
  - `/pessoas` agora avisa: "Nenhuma pessoa real encontrada. Importe ou sincronize dados..."
  - `/abordagem` avisa: "Nenhuma tarefa aberta".
  - `/mensagens` avisa caso os templates estejam vazios, recomendando rodar o seed.
  - `/campo` e `/voluntarios` mantiveram seu fluxo normal e robusto.

## Verificações Técnicas
- **Build & Lint**: 100% OK (`npm run verify` com Exit Code 0).
- **Testes**: 100% OK (Testes de integração e RLS adaptados para mock continuam passando).
- **Readiness Script**: Durante o teste do script de prontidão com as chaves fornecidas no ticket, o script interceptou corretamente uma falha de conexão (`Legacy API keys are disabled`). Isso atesta o sucesso da ferramenta de diagnóstico em prevenir que a aplicação quebre "silenciosamente" em produção.

## Riscos Identificados e Mitigações
- **Chaves Legacy do Supabase**: O diagnóstico apontou que as chaves JWT fornecidas retornaram um erro de "Legacy API keys disabled". Será necessário revisar a geração das chaves de API do Supabase (Anon Key e Service Role Key) no painel do projeto (`blimjnitngthldhazvwh`) antes de rodar a aplicação em produção.
- **Limpeza de Fila**: Se `USE_MOCKS` for desativado sem rodar a sincronização (Meta API), o app abrirá vazio. Os novos *empty states* mitigarão a confusão da equipe, explicando exatamente o porquê.

## Pendências para Próxima Fase (RB10)
- Configurar corretamente as chaves API do Supabase no ambiente de hospedagem (ex: Vercel).
- Rodar o script `scripts/seed-radar-message-templates.mjs` no ambiente de produção.
- Realizar a primeira carga de dados reais via Meta API para testar o painel "Rotina do Dia".

## Recomendação de Go/No-Go
**GO (🟢) para Piloto Controlado**. O código fonte está pronto para rodar em produção. O impedimento atual é apenas de infraestrutura/configuração do Supabase (API Keys), que o novo script de readiness ajudará a validar assim que corrigidas pela equipe de DevOps.
