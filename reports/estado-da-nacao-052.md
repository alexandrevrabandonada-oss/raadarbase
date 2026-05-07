# Estado da Nação 052

- checklist revisado: sim
- status da devolutiva: preparada para publicação controlada, mas ainda não publicada no ambiente validado
- URL publicada: não
- janela territorial aberta: não
- início/fim da janela: não aplicável
- total de relatos: 0 no ambiente validado
- plano atualizado: sim, no código e no plano vinculado ao relatório
- audit logs criados: nenhum no ambiente validado, porque a publicação externa e a gravação da janela não foram executadas
- guardrails preservados: sim
- produção bloqueada: sim
- próximo tijolo recomendado: aplicar a migration remota para expor `public_devolution_publications` e `territorial_listening_windows` no Supabase de staging, ou disponibilizar o token de API da Supabase para executar a migration; depois disso, executar `markDevolutionReviewedAction`, publicar fora do app com URL real e então executar `markDevolutionPublishedAction` para abrir a janela de 7 dias

## Leitura resumida

A camada de aplicação ficou pronta para a publicação controlada: o fluxo de revisão/publicação/arquivamento está implementado, a janela territorial de 7 dias foi adicionada ao código, o painel admin passou a saber como mostrar janela ativa e dias restantes, e a devolutiva mostra o estado da publicação e da janela quando os registros existem.

O bloqueio agora é operacional no ambiente validado: a consulta direta ao Supabase retornou erro de schema cache para `public_devolution_publications` e `territorial_listening_windows`, e não há `SUPABASE_ACCESS_TOKEN` disponível no processo atual para aplicar a migration remota via API de projetos da Supabase. Sem isso, não existe como persistir a URL real da publicação nem abrir a janela no banco remoto sem inventar dados.

## O que já ficou pronto

- checklist de publicação visível na devolutiva
- ações server-side para revisar, publicar e arquivar a devolutiva
- gravação de janela territorial de 7 dias integrada ao caminho de publicação
- painel interno da escuta com leitura de janela ativa e dias restantes
- exportação agregada da escuta por bairro preservada
- plano de ação alinhado ao fluxo de publicação e monitoramento territorial

## Validação

- `npm run lint`: ok, somente warnings existentes no repositório
- `npm run build`: ok
- `npm run test`: ok
- `npm run e2e:ci`: 49 testes passaram; 1 falha pré-existente no módulo de memória estratégica
- `npm run check:health`: ok
- `npm run readiness`: ok, com avisos esperados de `META_ACCESS_TOKEN` e `INSTAGRAM_BUSINESS_ACCOUNT_ID` ausentes
- `npm run staging:webhook:evidence`: ok
- `npm run staging:webhook:go-no-go`: ok, decisão `GO_STAGING`
- `npm run verify`: ok; E2E local foi pulado porque `E2E_RUN=true` está ausente

## Observação operacional

Não houve ativação de produção. Não houve DM automática, resposta automática, criação automática de contato, microtargeting ou score político individual.

## Próximo passo real

Aplicar a migration 020 no Supabase remoto e revalidar o schema exposto. Depois disso, executar a revisão/publicação com uma URL real já publicada fora do app e registrar a janela operacional de 7 dias no banco.
