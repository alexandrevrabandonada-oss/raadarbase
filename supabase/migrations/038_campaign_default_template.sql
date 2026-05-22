-- Adiciona coluna is_campaign_default na tabela message_templates
alter table message_templates add column if not exists is_campaign_default boolean default false;

-- Cria indice parcial exclusivo para garantir no maximo uma mensagem padrao de campanha ativa por vez
create unique index if not exists message_templates_campaign_default_idx
on message_templates (is_campaign_default)
where (is_campaign_default = true);
