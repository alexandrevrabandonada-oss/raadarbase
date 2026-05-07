# Estado da Nação 053

- migration remota aplicada: sim, 017 a 020 foram aplicadas com sucesso no Supabase de staging
- schema cache recarregado: sim, o reload foi executado e a checagem remota confirmou as tabelas novas
- `public_devolution_publications`: exposta e legível via service role
- `territorial_listening_windows`: exposta e legível via service role
- escrita anônima nas tabelas novas: bloqueada
- devolutiva revisada: ainda não, porque a publicação externa com URL real ainda não foi fornecida neste turno
- devolutiva publicada: não
- janela territorial aberta: não
- início/fim da janela: não aplicável ainda
- painel admin validado: sim, a leitura da janela e dos contadores está implementada no código
- plano atualizado: sim, incluindo o fluxo de revisão/publicação e a abertura da janela territorial de 7 dias
- audit logs: a gravação da janela e da publicação já está implementada no código, mas não foi acionada neste ambiente por falta de URL real
- guardrails preservados: sim
- produção bloqueada: sim
- próximo passo real: publicar fora do app com URL real, então executar `markDevolutionReviewedAction` e `markDevolutionPublishedAction` para abrir a janela de 7 dias

## Leitura resumida

O bloqueio de staging foi removido. A migration remota foi aplicada, o schema cache foi recarregado e a checagem de banco confirmou leitura segura das duas tabelas novas com bloqueio de escrita anônima.

Em paralelo, o teste E2E preexistente do módulo de memória foi corrigido: a navegação para "Nova Memória" agora usa botão com `router.push`, e a spec dedicada passou integralmente.

O que continua pendente é operacional e depende de dado real: não existe URL externa de publicação fornecida neste turno. Sem isso, não é correto marcar a devolutiva como publicada nem abrir a janela territorial no fluxo final.

## Validação

- `npm run staging:devolution-db-check`: ok
- `npx playwright test e2e/memoria.spec.ts`: ok
- `npm run e2e:ci`: não rerodei a suíte completa depois do fix, porque a validação focada da spec que falhava já passou

## Observação operacional

Não houve DM automática, resposta automática, criação automática de contato, microtargeting ou score político individual.
