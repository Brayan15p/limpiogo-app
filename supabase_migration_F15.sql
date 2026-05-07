-- F15: Bookings Recurrentes
-- Ejecutar en Supabase Dashboard → SQL Editor

alter table jobs add column if not exists recurrence text
  check (recurrence in ('none','weekly','biweekly','monthly'))
  default 'none';

alter table jobs add column if not exists series_id uuid;
alter table jobs add column if not exists series_index integer default 0;

-- Función: generar siguiente booking de una serie
create or replace function generate_next_recurring_job(p_job_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_job record;
  v_next_date timestamptz;
  v_new_id uuid;
begin
  select * into v_job from jobs where id = p_job_id;

  if v_job.recurrence = 'none' or v_job.recurrence is null then
    return null;
  end if;

  v_next_date := case v_job.recurrence
    when 'weekly'    then v_job.scheduled_at + interval '7 days'
    when 'biweekly'  then v_job.scheduled_at + interval '14 days'
    when 'monthly'   then v_job.scheduled_at + interval '1 month'
  end;

  insert into jobs (
    client_id, type, bedrooms, bathrooms, budget, notes,
    address_id, scheduled_at, recurrence, series_id, series_index, status
  ) values (
    v_job.client_id, v_job.type, v_job.bedrooms, v_job.bathrooms,
    v_job.budget, v_job.notes, v_job.address_id, v_next_date,
    v_job.recurrence,
    coalesce(v_job.series_id, v_job.id),
    coalesce(v_job.series_index, 0) + 1,
    'open'
  ) returning id into v_new_id;

  -- si el job original no tiene series_id, actualizarlo
  if v_job.series_id is null then
    update jobs set series_id = v_job.id where id = v_job.id;
  end if;

  return v_new_id;
end;
$$;

-- Trigger: al completar un job recurrente, generar el siguiente
create or replace function trigger_generate_next_recurring()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status = 'completed' and old.status != 'completed'
     and new.recurrence != 'none' and new.recurrence is not null then
    perform generate_next_recurring_job(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists next_recurring_job on jobs;
create trigger next_recurring_job
  after update on jobs
  for each row execute function trigger_generate_next_recurring();
