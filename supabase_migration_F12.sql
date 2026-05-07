-- F12: Rating Bidireccional (pro califica al cliente)
-- Ejecutar en Supabase Dashboard → SQL Editor

alter table jobs add column if not exists client_rating numeric(2,1) check (client_rating between 1 and 5);
alter table jobs add column if not exists client_review text;

alter table profiles add column if not exists client_score numeric(3,2) default 5.00;

-- RPC: recalcula client_score del cliente tras cada rating
create or replace function update_client_score(p_client_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_avg numeric;
begin
  select round(avg(client_rating)::numeric, 2)
    into v_avg
    from jobs
   where client_id = p_client_id
     and client_rating is not null;

  if v_avg is not null then
    update profiles set client_score = v_avg where id = p_client_id;
  end if;
end;
$$;
