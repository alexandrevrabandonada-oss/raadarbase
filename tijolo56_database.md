# Tijolo 56 — Banco de dados

Migration: `supabase/migrations/20260710003558_tijolo56_source_hub_enrichment.sql`.

## Tabelas

- `radar_entities`: registro canônico e score territorial.
- `radar_entity_identifiers`: usernames, URLs e identificadores oficiais normalizados.
- `radar_source_evidence`: valor, fonte, referência, data, confiança, trecho mínimo e hash.
- `radar_entity_relationships`: grafo tipado com confiança e evidência opcional.
- `radar_enrichment_jobs` e `radar_enrichment_queue`: processamento incremental, locks, tentativas, backoff e logs de erro.
- `radar_merge_suggestions`: revisão humana de possíveis duplicidades.
- `radar_source_connectors`: configuração não secreta e saúde de conectores.
- `radar_entity_history` e `radar_entity_notes`: snapshots e observações auditáveis.

## Consultas e escala

Há índices B-tree para nome, tipo, categoria, território, score, fontes, fila e ambos os lados das relações; GIN/trigram para nome/descrição; GIN para tags. As RPCs `search_radar_entities`, `get_radar_entity_kpis` e `get_radar_entity_facets` mantêm filtros, paginação e agregações no servidor. A API limita páginas a 100 itens.

## RLS e grants

Todas as dez tabelas têm RLS. `anon` não recebe grant. Usuários `authenticated` possuem apenas `SELECT`, condicionado a `is_current_internal_user()`. Não há policy de escrita para o client. Mutação ocorre no servidor via `service_role`; este papel possui os grants necessários. Funções têm `EXECUTE` revogado de `public` e concedido explicitamente a `authenticated` e `service_role`.

## Seed

`supabase/seed.sql` contém somente entidades fictícias: professora, associação, imprensa, comércio e perfil digital. Todas usam fonte `seed` e IDs determinísticos.

## Aplicação

O dry-run confirmou que as migrations 55 e 56 estão prontas para push, sem aplicá-las automaticamente:

```text
npx supabase db push --linked --dry-run
Would push 20260709234757_tijolo55_influence_radar.sql
Would push 20260710003558_tijolo56_source_hub_enrichment.sql
```
