-- F41: Predicción "Ya es hora"
alter table profiles add column if not exists avg_booking_interval_days numeric;
alter table profiles add column if not exists last_push_prediction timestamptz;

-- F23: IA Matching
alter table jobs add column if not exists matched_pro_ids uuid[];
alter table jobs add column if not exists match_scores jsonb;

-- Vista para calcular intervalo promedio por cliente
create or replace view client_booking_stats as
select
  client_id,
  count(*)                                               as total_bookings,
  round(avg(
    extract(epoch from (scheduled_at - lag(scheduled_at) over (partition by client_id order by scheduled_at)))
    / 86400
  )::numeric, 1)                                         as avg_interval_days,
  max(scheduled_at)                                      as last_booking_at
from jobs
where status = 'completed'
  and scheduled_at is not null
group by client_id;
