# Tijolo 55 — Banco de dados

## Migration

`supabase/migrations/20260709234757_tijolo55_influence_radar.sql`

## Tabelas

- `instagram_profiles`: registro atual e score.
- `influence_score_config`: pesos configuráveis do score.
- `instagram_profile_history`: snapshots e campos alterados.
- `instagram_profile_classifications`: trilha de classificação.
- `instagram_profile_notes`: observações internas.
- `instagram_imports`: execução e métricas de importação.
- `instagram_update_jobs`: lotes incrementais.
- `instagram_update_queue`: fila, lock, tentativas e backoff.
- `instagram_processing_logs`: telemetria de processamento.

## Performance

- Unique por `username` normalizado.
- B-tree para score/seguidores, categoria+score, localização+score e stale date.
- GIN trigram para username, nome e bio.
- Índices compostos para claim da fila, histórico, classificações, notas, jobs e logs.
- Paginação server-side limitada a 100 registros por tela e renderização virtualizada no cliente.
- RPC `get_instagram_influence_kpis()` evita transportar 100.000 linhas para agregações.

## RLS e grants

Todas as tabelas têm RLS. Usuários internos ativos recebem leitura; notas têm políticas específicas; score config só pode ser alterada por admin. Mutações de importação/fila usam `service_role` no servidor. `anon` não recebe acesso.

## Seed

`supabase/seed.sql` contém três perfis estritamente fictícios e idempotentes, marcados com `source = 'seed'`.

