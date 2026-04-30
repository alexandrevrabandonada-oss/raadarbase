-- ============================================================
-- 015b_restrict_webhook_grants.sql
-- Fecha grants default em tabelas sensiveis de webhook.
-- ============================================================

REVOKE ALL ON public.meta_webhook_events FROM anon, authenticated;
REVOKE ALL ON public.meta_webhook_event_links FROM anon, authenticated;