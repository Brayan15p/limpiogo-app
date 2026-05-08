-- F38: Certificaciones de salud para pros
alter table profiles
  add column if not exists health_certifications text[] default '{}';

-- Índice para filtrar por certificación desde SearchScreen
create index if not exists idx_profiles_health_certs
  on profiles using gin(health_certifications);

-- RLS: el pro puede actualizar sus propias certificaciones
-- (ya cubierta por la policy existente de profiles)
