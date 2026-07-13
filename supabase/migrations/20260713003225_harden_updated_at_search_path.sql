-- O trigger usa apenas now(), mas fixa o search_path para impedir resolução
-- de objetos controláveis por outros papéis durante atualizações de linhas.
alter function public.handle_updated_at() set search_path = public, pg_catalog;
