-- F41: Vista client_booking_stats para recordatorio inteligente
-- Ejecutar en Supabase Dashboard → SQL Editor

-- Columnas necesarias en profiles
alter table profiles add column if not exists avg_booking_interval_days numeric;
alter table profiles add column if not exists last_push_prediction timestamptz;

-- Vista materializable: estadísticas de booking por cliente
create or replace view client_booking_stats as
select
  client_id,
  count(*) as total_bookings,
  max(completed_at) as last_booking_at,
  round(
    extract(epoch from (max(completed_at) - min(completed_at))) /
    nullif(count(*) - 1, 0) / 86400.0,
    1
  ) as avg_interval_days
from jobs
where status = 'completed'
  and completed_at is not null
group by client_id
having count(*) >= 2;

-- Dar acceso de lectura al service role (para la edge function)
grant select on client_booking_stats to service_role;

-- F13: Índice para referral_code lookup rápido
create index if not exists idx_profiles_referral_code on profiles(referral_code)
  where referral_code is not null;

-- Asegurar referred_by en profiles
alter table profiles add column if not exists referred_by text;
