# Estado da Nação 051

- checklist de publicação criado: sim
- status da devolutiva: draft/reviewed/published/archived controlado por registro interno
- painel admin da escuta: sim, em `/escuta/bairro/admin`
- total de relatos: 0 registrados no ambiente validado
- consentimentos de contato: 0 com consentimento, 0 sem consentimento registrados
- integração com plano: sim
- exportação segura: sim, CSV agregado em `/api/escuta/bairro/export`
- guardrails preservados: sim
- produção bloqueada: sim
- próximo tijolo recomendado: publicar a devolutiva controlada quando houver URLs reais e abrir a janela de monitoramento territorial por 7 dias antes da síntese territorial

## Leitura resumida

A devolutiva pública passou a ter checklist explícito de publicação, status rastreável e ações controladas para revisão, publicação e arquivamento. O painel interno da escuta territorial foi criado para mostrar apenas agregados por bairro, pauta e status, com contato redigido por padrão.

A base de dados foi estendida com `public_devolution_publications` e com os novos campos operacionais da escuta por bairro, incluindo `status`, `consent_to_contact`, `contact_redacted`, `reviewed_at` e `reviewed_by`. O plano de ação do relatório passou a refletir os itens pedidos: publicar a devolutiva no Instagram, compartilhar a chamada em grupos, monitorar a escuta por bairro por 7 dias e gerar síntese territorial após 7 dias.

## O que foi entregue

- checklist de publicação na rota da devolutiva
- registro interno de publicação controlada com status `draft`, `reviewed`, `published` e `archived`
- ações server-side para revisar, publicar e arquivar a devolutiva
- painel interno `/escuta/bairro/admin` com agregados e sem contato por padrão
- exportação segura agregada da escuta territorial
- novos campos de status e consentimento nos relatos de bairro
- integração do plano de ação com os quatro itens solicitados

## Validação

- `npm run lint`: ok, sem erros
- `npm run build`: ok
- `npm run test`: ok
- `npm run e2e:ci`: ok, 50 testes passaram
- `npm run check:health`: ok
- `npm run readiness`: ok, com avisos esperados de credenciais ausentes no terminal local
- `npm run staging:webhook:evidence`: ok
- `npm run staging:webhook:go-no-go`: ok, decisão `GO_STAGING`
- `npm run verify`: ok, com E2E local pulado conforme a flag do projeto

## Observação operacional

O ambiente validado não tinha relatos de bairro já persistidos, então o painel ficou preparado para monitoramento inicial sem expor contato por padrão. A exportação segura ficou limitada a bairro, pauta, quantidade e status, sem nomes, contatos ou texto sensível bruto.

## Próximo tijolo recomendado

Iniciar a publicação controlada da devolutiva usando uma URL real de Instagram e marcar a revisão/publicação no registro interno, depois abrir a janela de monitoramento territorial por 7 dias e só então gerar a síntese territorial agregada.
