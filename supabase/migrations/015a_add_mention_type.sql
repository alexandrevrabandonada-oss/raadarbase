-- Adicionar tipo 'mencao' ao enum interaction_type para suportar webhooks de menções
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'mencao';
