-- Criar índices compostos na tabela ig_people para otimizar as consultas e cálculos da fila de prioridades
create index if not exists ig_people_status_responsible_idx on public.ig_people (status, responsible_id);
create index if not exists ig_people_responsible_status_idx on public.ig_people (responsible_id, status);
