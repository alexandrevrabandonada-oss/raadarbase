-- Dados demonstrativos do Radar de Influencia. Nunca representam perfis reais.
insert into public.instagram_profiles
  (username, nome, bio, categoria, cidade, estado, seguidores, seguindo, posts,
   conta_verificada, criador, empresa, influence_score, location_confidence,
   location_evidence, source, data_ultima_atualizacao)
values
  ('radar_empresa_demo', 'Empresa Demo Sul Fluminense', 'Empresa demonstrativa de Volta Redonda/RJ', 'empresa', 'Volta Redonda', 'RJ', 18500, 780, 420, false, false, true, 46.67, 0.98, '["bio: Volta Redonda/RJ"]', 'seed', now()),
  ('radar_imprensa_demo', 'Jornal Demo Regional', 'Notícias demonstrativas de Barra Mansa - RJ', 'jornalista', 'Barra Mansa', 'RJ', 42100, 510, 2300, true, true, false, 61.24, 0.98, '["bio: Barra Mansa - RJ"]', 'seed', now()),
  ('radar_prof_demo', 'Professora Demo', 'Perfil fictício de professora em Resende RJ', 'professor', 'Resende', 'RJ', 7300, 920, 690, false, true, false, 41.63, 0.95, '["bio: Resende RJ"]', 'seed', now())
on conflict (username) do nothing;

-- TIJOLO 56: entidades estritamente fictícias do Hub de Fontes.
insert into public.radar_entities
  (id, entity_type, display_name, normalized_name, description, primary_city, primary_state,
   primary_region, location_confidence, main_category, tags, influence_score,
   influence_score_breakdown, confidence_score, last_enriched_at)
values
  ('56000000-0000-4000-8000-000000000001', 'person', 'Professora Aurora Demo', 'professora aurora demo', 'Docente fictícia de educação pública.', 'Volta Redonda', 'RJ', 'Sul Fluminense', 0.98, 'professor', array['seed','educacao'], 71.2, '{"total":71.2,"digital_reach":12,"regional_relevance":20,"institutional_relevance":14,"network":8,"engagement":7,"data_quality":10.2,"explanation":["Fixture fictícia"]}', 0.94, now()),
  ('56000000-0000-4000-8000-000000000002', 'association', 'Associação Horizonte Demo', 'associacao horizonte demo', 'Associação comunitária fictícia.', 'Barra Mansa', 'RJ', 'Sul Fluminense', 0.98, 'associacao', array['seed','comunidade'], 66.5, '{"total":66.5,"digital_reach":8,"regional_relevance":20,"institutional_relevance":15,"network":10,"engagement":6,"data_quality":7.5,"explanation":["Fixture fictícia"]}', 0.92, now()),
  ('56000000-0000-4000-8000-000000000003', 'media', 'Jornal Serra Demo', 'jornal serra demo', 'Veículo de imprensa regional fictício.', 'Resende', 'RJ', 'Sul Fluminense', 0.99, 'veiculo_de_imprensa', array['seed','imprensa'], 78.4, '{"total":78.4,"digital_reach":24,"regional_relevance":20,"institutional_relevance":15,"network":7,"engagement":4,"data_quality":8.4,"explanation":["Fixture fictícia"]}', 0.96, now()),
  ('56000000-0000-4000-8000-000000000004', 'company', 'Comércio Costa Demo', 'comercio costa demo', 'Comércio fictício sem dados reais.', 'Angra dos Reis', 'RJ', 'Costa Verde', 0.97, 'comercio', array['seed','comercio'], 58.1, '{"total":58.1,"digital_reach":15,"regional_relevance":18,"institutional_relevance":12,"network":4,"engagement":3,"data_quality":6.1,"explanation":["Fixture fictícia"]}', 0.89, now()),
  ('56000000-0000-4000-8000-000000000005', 'digital_profile', 'Perfil Digital Ponte Demo', 'perfil digital ponte demo', 'Perfil digital fictício vinculado ao seed Instagram.', 'Volta Redonda', 'RJ', 'Sul Fluminense', 0.95, 'influenciador', array['seed','instagram'], 63.7, '{"total":63.7,"digital_reach":25,"regional_relevance":18,"institutional_relevance":3,"network":5,"engagement":4,"data_quality":8.7,"explanation":["Fixture fictícia"]}', 0.91, now())
on conflict (id) do nothing;

insert into public.radar_entity_identifiers
  (entity_id, source_type, identifier_type, identifier_value, normalized_identifier, username, normalized_username, is_primary, confidence)
values
  ('56000000-0000-4000-8000-000000000001', 'seed', 'seed_id', 'professora-aurora-demo', 'professora-aurora-demo', null, null, true, 1),
  ('56000000-0000-4000-8000-000000000002', 'seed', 'seed_id', 'associacao-horizonte-demo', 'associacao-horizonte-demo', null, null, true, 1),
  ('56000000-0000-4000-8000-000000000003', 'seed', 'seed_id', 'jornal-serra-demo', 'jornal-serra-demo', null, null, true, 1),
  ('56000000-0000-4000-8000-000000000004', 'seed', 'seed_id', 'comercio-costa-demo', 'comercio-costa-demo', null, null, true, 1),
  ('56000000-0000-4000-8000-000000000005', 'instagram', 'username', 'radar_empresa_demo', 'radar_empresa_demo', 'radar_empresa_demo', 'radar_empresa_demo', true, 0.99)
on conflict (source_type, identifier_type, normalized_identifier) do nothing;

insert into public.radar_entity_relationships
  (subject_entity_id, predicate, object_entity_id, relationship_label, confidence)
values
  ('56000000-0000-4000-8000-000000000001', 'member_of', '56000000-0000-4000-8000-000000000002', 'Participação comunitária fictícia', 0.9),
  ('56000000-0000-4000-8000-000000000003', 'mentions', '56000000-0000-4000-8000-000000000002', 'Menção fictícia em pauta regional', 0.85)
on conflict (subject_entity_id, predicate, object_entity_id) do nothing;
