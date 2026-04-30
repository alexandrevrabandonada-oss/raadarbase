# Estado da Nacao 024

Data: 2026-04-30
Escopo: validacao do novo host publico informado pelo usuario para staging dos webhooks Meta/Instagram.

## Resumo executivo

O novo host `https://raadarbase.vercel.app` representa um avanço sobre o host anterior porque publica uma aplicacao real por HTTPS.

Resultado deste ciclo: **NO_GO_STAGING** para o host informado, com producao ainda bloqueada.

Motivos comprovados:

1. O host responde `200` em `/` e `200` em `/api/health`, entao existe deployment vivo.
2. A rota `/api/meta/webhook` responde `404`, logo o deploy publicado nao contem a superficie critica de webhook exigida para o staging.
3. O healthcheck publicado informa `environment=production` e `meta_configured=false`, o que reforca que este host nao representa um staging pronto para webhook Meta.
4. O Supabase staging continua sem exposure/schema cache funcional para `meta_webhook_events` e `meta_webhook_event_links`.

## Comparacao com o host anterior

- Host anterior: `https://radar-base-staging.vercel.app`
  - falha de plataforma: `DEPLOYMENT_NOT_FOUND`
- Host atual: `https://raadarbase.vercel.app`
  - app publicada e healthcheck funcional
  - rota de webhook ausente (`404`)

Conclusao: saimos de um host inexistente para um host vivo, mas ainda nao chegamos a um staging valido para os webhooks.

## Resultado HTTP do host atual

- GET `/`: `200`
- GET `/api/health`: `200`
- GET `/api/meta/webhook`: `404`
- GET `/integracoes/meta/webhooks`: `200`

Leitura tecnica:

- a app publicada inclui pelo menos parte das rotas e da UI mais recentes;
- a superficie publica de webhook nao foi publicada nesse deploy;
- como o build local contem `/api/meta/webhook`, o problema agora e externo ao codigo local validado: branch errada, deployment antigo, alias apontando para revisao incompleta ou projeto Vercel diferente.

## Dry-run externo

Fonte: `reports/staging-webhook-dry-run.json`

- Status: `NO_GO_STAGING`
- GET verification: `404`
- POST assinado: `404`
- POST sem assinatura: `404`
- DM proibida: `404`
- objeto invalido: `404`
- healthcheck safe: `200`

Interpretacao:

- o host e real;
- o healthcheck e seguro;
- a rota de webhook nao existe no deploy validado;
- portanto o dry-run nao consegue comprovar verificacao, rejeicao de unsigned nem quarentena operacional.

## Evidencias SQL redigidas

Fonte: `reports/staging-webhook-evidence.json`

- Status: `PENDING_EXTERNAL_VALIDATION`
- Razao: `Tabelas de webhook indisponiveis na API de staging (schema cache/route exposure).`
- eventos recebidos: `0`
- quarentenados: `0`
- ignorados: `0`
- processados: `0`
- audit logs webhook: `0`
- incidentes webhook: `0`

## Resultado go/no-go

Fonte: `reports/staging-webhook-go-no-go.json`

- Decisao do script: `NO_GO_STAGING`
- Sinais OK:
  - `appUrlConfigured`
  - `healthOk`
  - `healthSecretsSafe`
  - `dryRunExecuted`
  - `noDmAutomatic`
  - `noAutoContact`
  - `noPoliticalScore`
- Sinais ausentes:
  - `signedEventSeen`
  - `unsignedRejectionSeen`
  - `operatorIgnoredSeen`
  - `operatorProcessedSeen`
  - `auditLogsFound`
  - `incidentsFound`

## Decisao final

- **NO_GO_STAGING** para `https://raadarbase.vercel.app`.

Racional:

- este host nao atende o requisito minimo de expor `/api/meta/webhook`;
- o Supabase staging continua sem exposure funcional das tabelas de webhook pela API;
- nao houve evidencia operacional real de recebimento, rejeicao, quarantena, ignore/process, audit logs ou incidentes;
- producao continua bloqueada.

## Recomendacao operacional

- Ativar `META_WEBHOOK_ENABLED=true` neste host? **Nao**.
- Promover para producao? **Nao**.

## Pendencias reais

1. Confirmar no Vercel qual deployment/branch esta servindo `https://raadarbase.vercel.app`.
2. Publicar um deployment que inclua `/api/meta/webhook`.
3. Configurar `APP_URL` no deploy alvo com o host publico correto.
4. Corrigir o schema cache/exposure do Supabase staging e executar `NOTIFY pgrst, 'reload schema';`.
5. Repetir dry-run externo real.
6. Executar a operacao manual obrigatoria de ignorar 1 evento e processar 1 evento permitido.

## Verificacao executada neste ciclo

- `APP_URL=https://raadarbase.vercel.app npm run staging:check-url`
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:dry-run`
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:evidence`
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:go-no-go`
- `APP_URL=https://raadarbase.vercel.app npm run staging:webhook:report`