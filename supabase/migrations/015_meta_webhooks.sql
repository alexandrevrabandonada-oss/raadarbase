-- ============================================================
-- 015_meta_webhooks.sql
-- Recepção passiva e segura de webhooks Meta/Instagram
-- ============================================================

-- 1. Tabela de eventos webhook recebidos
-- Todos os payloads entram primeiro em quarentena para revisão humana
CREATE TABLE IF NOT EXISTS public.meta_webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    external_event_id text NULL,
    object_type text NOT NULL,
    event_type text NULL,
    status text NOT NULL DEFAULT 'received' 
        CHECK (status IN (
            'received',      -- Recebido, aguardando verificação
            'verified',      -- Assinatura verificada
            'quarantined',   -- Em quarentena para revisão humana
            'ignored',       -- Ignorado por política
            'processed',     -- Processado com sucesso
            'failed'         -- Falha no processamento
        )),
    signature_valid boolean NOT NULL DEFAULT false,
    received_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz NULL,
    source text NOT NULL DEFAULT 'meta_webhook',
    raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    redacted_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    error_message text NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- 2. Índice único parcial para external_event_id (idempotência)
CREATE UNIQUE INDEX idx_meta_webhook_events_external_id 
    ON public.meta_webhook_events (external_event_id) 
    WHERE external_event_id IS NOT NULL;

-- 3. Índices para consultas comuns
CREATE INDEX idx_meta_webhook_events_status ON public.meta_webhook_events (status);
CREATE INDEX idx_meta_webhook_events_received_at ON public.meta_webhook_events (received_at DESC);
CREATE INDEX idx_meta_webhook_events_object_type ON public.meta_webhook_events (object_type);
CREATE INDEX idx_meta_webhook_events_signature_valid ON public.meta_webhook_events (signature_valid);
CREATE INDEX idx_meta_webhook_events_quarantine ON public.meta_webhook_events (status, received_at) 
    WHERE status = 'quarantined';

-- 4. Tabela de links entre eventos webhook e entidades processadas
CREATE TABLE IF NOT EXISTS public.meta_webhook_event_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_event_id uuid NOT NULL REFERENCES public.meta_webhook_events(id) ON DELETE CASCADE,
    entity_type text NOT NULL 
        CHECK (entity_type IN (
            'ig_post',
            'ig_person', 
            'ig_interaction',
            'meta_sync_run',
            'incident',
            'topic'
        )),
    entity_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_meta_webhook_event_links_event_id ON public.meta_webhook_event_links (webhook_event_id);
CREATE INDEX idx_meta_webhook_event_links_entity ON public.meta_webhook_event_links (entity_type, entity_id);

-- 5. Row Level Security
ALTER TABLE public.meta_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_webhook_event_links ENABLE ROW LEVEL SECURITY;

-- 6. Políticas para meta_webhook_events
-- Leitura: usuários internos autenticados
CREATE POLICY "Internal users can read webhook events"
    ON public.meta_webhook_events FOR SELECT TO authenticated
    USING (true);

-- Escrita: apenas via service role (nenhuma escrita anônima ou direta)
-- Os webhooks são processados via server actions com service role

-- 7. Políticas para meta_webhook_event_links
-- Leitura: usuários internos autenticados
CREATE POLICY "Internal users can read webhook event links"
    ON public.meta_webhook_event_links FOR SELECT TO authenticated
    USING (true);

-- 8. Comentários de documentação
COMMENT ON TABLE public.meta_webhook_events IS 
    'Eventos webhook recebidos do Meta/Instagram. Todos os payloads passam por quarentena antes do processamento. Nenhum evento gera ação automática.';

COMMENT ON TABLE public.meta_webhook_event_links IS 
    'Relacionamento entre eventos webhook e entidades criadas/atualizadas durante o processamento.';

COMMENT ON COLUMN public.meta_webhook_events.status IS 
    'Status do evento: received->verified->quarantined->processed OU ignored/failed';

COMMENT ON COLUMN public.meta_webhook_events.signature_valid IS 
    'Indica se a assinatura HMAC-SHA256 do X-Hub-Signature-256 foi validada com sucesso';

COMMENT ON COLUMN public.meta_webhook_events.raw_payload IS 
    'Payload original recebido (cuidado: pode conter dados sensíveis, usar redacted_payload para exibição)';

COMMENT ON COLUMN public.meta_webhook_events.redacted_payload IS 
    'Payload com dados sensíveis removidos (tokens, emails, telefones, CPF) para exibição segura';
