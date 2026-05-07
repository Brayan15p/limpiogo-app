-- F13: Sistema de Referidos
-- Ejecutar en Supabase Dashboard → SQL Editor

alter table profiles add column if not exists referral_code text unique default substr(md5(random()::text), 1, 8);
alter table profiles add column if not exists referred_by text references profiles(referral_code);

create table if not exists referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references profiles(id) on delete cascade,
  referred_id uuid references profiles(id) on delete cascade,
  reward_amount integer default 5000,
  credited_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table referral_rewards enable row level security;
create policy "users see their own referral rewards"
  on referral_rewards for select
  using (auth.uid() = referrer_id or auth.uid() = referred_id);

-- RPC: acreditar recompensa (llamar desde Edge Function o trigger)
create or replace function credit_referral_reward(p_referred_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_referrer_id uuid;
  v_reward integer := 5000;
begin
  -- buscar referidor por código
  select id into v_referrer_id
    from profiles
   where referral_code = (select referred_by from profiles where id = p_referred_id);

  if v_referrer_id is null then return; end if;

  -- insertar recompensa
  insert into referral_rewards (referrer_id, referred_id, reward_amount, credited_at)
  values (v_referrer_id, p_referred_id, v_reward, now());

  -- acreditar wallet a ambos
  update profiles set wallet_balance = coalesce(wallet_balance, 0) + v_reward
   where id in (v_referrer_id, p_referred_id);
end;
$$;

-- Trigger: al completar primer booking, acreditar referido
create or replace function trigger_referral_on_first_booking()
returns trigger
language plpgsql
security definer
as $$
declare
  v_booking_count integer;
begin
  if new.status = 'completed' and old.status != 'completed' then
    select count(*) into v_booking_count
      from jobs
     where client_id = new.client_id and status = 'completed';

    if v_booking_count = 1 then
      perform credit_referral_reward(new.client_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists referral_first_booking on jobs;
create trigger referral_first_booking
  after update on jobs
  for each row execute function trigger_referral_on_first_booking();
