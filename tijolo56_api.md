# Tijolo 56 — API

Todas as rotas exigem sessão interna. Mutações exigem admin/operador, possuem rate limit e geram auditoria.

| Método | Rota | Finalidade |
|---|---|---|
| GET | `/api/radar/entities` | Lista, filtros, KPIs, facets e exportações |
| GET | `/api/radar/entities/:id` | Ficha, evidências, relações, histórico, notas, merges e vínculo T55 |
| POST | `/api/radar/entities/import` | Importação CSV, JSON ou lote manual |
| POST | `/api/radar/entities/enrich` | Job `safe`, `configured` ou `manual_review` |
| POST | `/api/radar/entities/:id/notes` | Observação interna auditável |
| GET/POST | `/api/radar/relationships` | Consulta do grafo ou criação de vínculo validado |
| POST | `/api/radar/merge-suggestions/:id/approve` | Aprova equivalência após revisão humana |
| POST | `/api/radar/merge-suggestions/:id/reject` | Rejeita equivalência |
| POST | `/api/radar/sync/instagram` | Sincroniza `instagram_profiles` existentes |

## Filtros e exportação

`GET /api/radar/entities` aceita `q`, `entityType`, `category`, `city`, `state`, `region`, `sourceType`, `minScore`, `maxScore`, `hasRelationship`, `page`, `pageSize`, `sort` e `direction`. `format=csv|excel|json` exporta entidades; `dataset=relationships|evidence` seleciona os demais conjuntos. CSV neutraliza células iniciadas por `=`, `+`, `-` ou `@`.

## Enriquecimento

- `safe`: recalcula apenas com dados internos e evidências existentes;
- `configured`: chama somente endpoint exato da allowlist do servidor;
- `manual_review`: cria sugestões, sem aplicar merge automático.

Falhas da fila registram `last_error`, incrementam tentativas e usam backoff exponencial em `next_run_at`.
