-- O bucket continua público para servir URLs conhecidas, mas a enumeração de
-- todos os objetos não é necessária pela aplicação e amplia a exposição.
drop policy if exists "public read portfolio objects" on storage.objects;
