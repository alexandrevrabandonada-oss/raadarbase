-- pg_trgm é relocável; mantê-la fora do schema exposto reduz a superfície da
-- Data API. Índices já existentes mantêm as referências internas à extensão.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;
