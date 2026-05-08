-- ============================================================
-- Sprint 6: F48 Niveles del Hogar · F31 LimpioCoins · F40 Score · F50 Mi Pro de Confianza
-- ============================================================

-- F31: LimpioCoins
alter table profiles add column if not exists limpio_coins integer default 0;

create table if not exists coins_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  amount     integer not null,
  reason     text not null, -- 'booking_completed', 'referral', 'review_left', 'birthday', 'redemption'
  booking_id uuid references jobs(id),
  created_at timestamptz default now()
);

alter table coins_transactions enable row level security;
create policy "own coins" on coins_transactions for all using (user_id = auth.uid());

-- F40: LimpioGO Score
alter table profiles add column if not exists limpio_score integer default 0;
alter table profiles add column if not exists limpio_score_tier text default 'standard';
-- tiers: standard | plus | gold | platinum

-- Función que recalcula el score de un cliente (llamar desde Edge Function o trigger)
create or replace function recalculate_limpio_score(p_id uuid)
returns void language plpgsql security definer as $$
declare
  v_completed  integer;
  v_on_time    integer;
  v_avg_rating numeric;
  v_months     numeric;
  v_score      integer;
  v_tier       text;
begin
  select
    count(*) filter (where status = 'completed'),
    count(*) filter (where status = 'completed'
      and scheduled_at is not null
      and updated_at <= scheduled_at + interval '30 minutes'),
    coalesce(avg(nullif(client_rating,0)), 5)
  into v_completed, v_on_time, v_avg_rating
  from jobs where client_id = p_id;

  select greatest(0, extract(epoch from (now() - created_at)) / 2592000)
  into v_months from profiles where id = p_id;

  v_score := least(1000,
    (v_completed * 20)            -- 40% peso: bookings completados
    + (v_on_time * 12)            -- 25% peso: puntualidad
    + (v_avg_rating * 40)::int    -- 20% peso: rating recibido
    + (v_months * 5)::int         -- 15% peso: antigüedad en meses
  );

  v_tier := case
    when v_score >= 850 then 'platinum'
    when v_score >= 600 then 'gold'
    when v_score >= 300 then 'plus'
    else 'standard'
  end;

  update profiles set limpio_score = v_score, limpio_score_tier = v_tier where id = p_id;
end;
$$;

-- F48: Niveles del Hogar (vista calculada)
create or replace view client_home_level as
select
  p.id,
  count(j.id) filter (where j.status = 'completed') as bookings_completed,
  case
    when count(j.id) filter (where j.status = 'completed') >= 30 then 'legendario'
    when count(j.id) filter (where j.status = 'completed') >= 15 then 'elite'
    when count(j.id) filter (where j.status = 'completed') >= 8  then 'premium'
    when count(j.id) filter (where j.status = 'completed') >= 3  then 'cuidado'
    else 'basico'
  end as level_name,
  case
    when count(j.id) filter (where j.status = 'completed') >= 30 then 30
    when count(j.id) filter (where j.status = 'completed') >= 15 then 15
    when count(j.id) filter (where j.status = 'completed') >= 8  then 8
    when count(j.id) filter (where j.status = 'completed') >= 3  then 3
    else 0
  end as level_threshold,
  case
    when count(j.id) filter (where j.status = 'completed') >= 30 then 30
    when count(j.id) filter (where j.status = 'completed') >= 15 then 30
    when count(j.id) filter (where j.status = 'completed') >= 8  then 15
    when count(j.id) filter (where j.status = 'completed') >= 3  then 8
    else 3
  end as next_threshold
from profiles p
left join jobs j on j.client_id = p.id
where p.role = 'client'
group by p.id;

-- F50: Mi Pro de Confianza
create table if not exists preferred_pros (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid references profiles(id) on delete cascade,
  pro_id            uuid references profiles(id) on delete cascade,
  bookings_together integer default 0,
  activated_at      timestamptz default now(),
  unique(client_id, pro_id)
);

alter table preferred_pros enable row level security;
create policy "own preferred" on preferred_pros for all using (client_id = auth.uid());

-- Trigger: al completar booking, actualizar preferred_pros y acreditar LimpioCoins
create or replace function handle_booking_completed()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'completed' and OLD.status <> 'completed' then
    -- LimpioCoins al cliente
    insert into coins_transactions(user_id, amount, reason, booking_id)
    values (NEW.client_id, 100, 'booking_completed', NEW.id);
    update profiles set limpio_coins = limpio_coins + 100 where id = NEW.client_id;

    -- LimpioCoins al pro (50 coins por servicio completado)
    insert into coins_transactions(user_id, amount, reason, booking_id)
    values (NEW.pro_id, 50, 'booking_completed', NEW.id);
    update profiles set limpio_coins = limpio_coins + 50 where id = NEW.pro_id;

    -- preferred_pros: incrementar contador
    if NEW.pro_id is not null then
      insert into preferred_pros(client_id, pro_id, bookings_together)
      values (NEW.client_id, NEW.pro_id, 1)
      on conflict (client_id, pro_id)
      do update set bookings_together = preferred_pros.bookings_together + 1,
                    activated_at = case when preferred_pros.bookings_together + 1 = 3
                                        then now() else preferred_pros.activated_at end;
    end if;

    -- Recalcular score del cliente
    perform recalculate_limpio_score(NEW.client_id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_booking_completed on jobs;
create trigger trg_booking_completed
  after update on jobs
  for each row execute function handle_booking_completed();

-- LimpioCoins al dejar reseña
create or replace function handle_review_coins()
returns trigger language plpgsql security definer as $$
begin
  if NEW.rating is not null and OLD.rating is null then
    insert into coins_transactions(user_id, amount, reason, booking_id)
    values (NEW.client_id, 50, 'review_left', NEW.id);
    update profiles set limpio_coins = limpio_coins + 50 where id = NEW.client_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_review_coins on jobs;
create trigger trg_review_coins
  after update of rating on jobs
  for each row execute function handle_review_coins();
