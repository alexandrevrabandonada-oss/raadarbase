-- ============================================================
-- 017_meta_reconciliation_evidence.sql
-- Evidência operacional agregada da reconciliação Meta
-- ============================================================

CREATE TABLE IF NOT EXISTS public.meta_reconciliation_evidence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_at timestamptz NOT NULL DEFAULT now(),
    generated_by uuid NULL,
    generated_by_email text NULL,
    posts_count int NOT NULL DEFAULT 0,
    interactions_count int NOT NULL DEFAULT 0,
    people_count int NOT NULL DEFAULT 0,
    meta_sync_runs_count int NOT NULL DEFAULT 0,
    meta_audit_logs_count int NOT NULL DEFAULT 0,
    started_runs_count int NOT NULL DEFAULT 0,
    stuck_runs_count int NOT NULL DEFAULT 0,
    latest_meta_sync_status text NULL,
    latest_meta_sync_at timestamptz NULL,
    report_hash text NOT NULL,
    status text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'attention', 'blocked')),
    notes text NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.meta_reconciliation_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.meta_reconciliation_evidence FROM anon, authenticated;

CREATE POLICY "Internal users can read meta reconciliation evidence"
    ON public.meta_reconciliation_evidence FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Meta reconciliation evidence can be created only by service role"
    ON public.meta_reconciliation_evidence FOR INSERT TO authenticated
    WITH CHECK (false);

COMMENT ON TABLE public.meta_reconciliation_evidence IS
    'Evidência operacional agregada da reconciliação Meta. Não contém payload bruto, comentários, usernames, tokens ou dados pessoais.';
