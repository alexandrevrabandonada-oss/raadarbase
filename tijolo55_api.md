# Tijolo 55 — API

Todas as rotas exigem sessão interna ativa e retornam JSON de erro no formato `{ "error": "..." }`.

## `GET /api/influencia`

Query params: `q`, `categoria`, `cidade`, `estado`, `regiao=sul-fluminense`, `minScore`, `maxScore`, `minSeguidores`, `maxSeguidores`, `sort`, `direction`, `page`, `pageSize`.

Retorna `items`, `total`, `page`, `pageSize`, `totalPages`, `kpis` e `cities`.

`format=csv|excel|json` gera exportação auditada do recorte atual (até 100 linhas por chamada).

## `GET /api/influencia/:id`

Retorna `profile`, `history`, `classifications` e `notes`. Respostas: `400` UUID inválido, `404` ausente.

## `POST /api/influencia/import`

Aceita `multipart/form-data` com `file` e `format`, ou JSON `{ content, format, filename }`. Formatos: CSV e JSON. Retorna contadores de inseridos, atualizados, duplicados e rejeitados.

## `POST /api/influencia/update`

Cria fila com `{ staleDays, limit, concurrency }` e retorna `202`. Para worker síncrono permitido: `{ processNow: true, jobId }`, com `INFLUENCE_PROFILE_UPDATE_ENDPOINT` configurado.

## Status relevantes

- `200`: consulta/processamento concluído.
- `201`: importação concluída.
- `202`: fila aceita.
- `400`: validação.
- `401`: sem sessão.
- `403`: papel insuficiente.
- `409`: fonte permitida não configurada.
- `429`: rate limit.

