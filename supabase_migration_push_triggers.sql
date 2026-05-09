-- Push Notifications: triggers automáticos para todos los eventos clave
-- Ejecutar en Supabase Dashboard → SQL Editor
-- Requiere: Edge Function send-push desplegada

-- ─────────────────────────────────────────────
-- Helper: invocar send-push desde trigger PL/pgSQL
-- ─────────────────────────────────────────────
create or replace function invoke_send_push(
  p_user_id uuid,
  p_title   text,
  p_body    text,
  p_type    text,
  p_data    jsonb default '{}'::jsonb
) returns void
language plpgsql security definer as $$
begin
  perform net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object(
      'user_id', p_user_id,
      'title',   p_title,
      'body',    p_body,
      'type',    p_type,
      'data',    p_data
    )
  );
exception when others then
  null; -- push falla silenciosamente, no rompe la transacción
end;
$$;

-- ─────────────────────────────────────────────
-- TRIGGER 1: Nueva aplicación → notificar al CLIENTE
-- ─────────────────────────────────────────────
create or replace function trg_notify_new_application()
returns trigger language plpgsql security definer as $$
declare
  v_client_id uuid;
  v_pro_name  text;
  v_job_type  text;
begin
  select client_id, type into v_client_id, v_job_type from jobs where id = NEW.job_id;
  select full_name into v_pro_name from profiles where id = NEW.pro_id;

  perform invoke_send_push(
    v_client_id,
    '💼 Nueva oferta recibida',
    v_pro_name || ' quiere hacer tu limpieza ' || v_job_type || '. ¡Revisa la oferta!',
    'new_application',
    jsonb_build_object('jobId', NEW.job_id, 'applicationId', NEW.id)
  );
  return NEW;
end;
$$;

drop trigger if exists trg_new_application on applications;
create trigger trg_new_application
  after insert on applications
  for each row execute function trg_notify_new_application();

-- ─────────────────────────────────────────────
-- TRIGGER 2: Aplicación aceptada → notificar al PRO
-- ─────────────────────────────────────────────
create or replace function trg_notify_application_accepted()
returns trigger language plpgsql security definer as $$
declare
  v_client_name text;
  v_job_type    text;
begin
  if NEW.status = 'accepted' and OLD.status <> 'accepted' then
    select j.type, p.full_name
      into v_job_type, v_client_name
      from jobs j
      join profiles p on p.id = j.client_id
     where j.id = NEW.job_id;

    perform invoke_send_push(
      NEW.pro_id,
      '🎉 ¡Oferta aceptada!',
      v_client_name || ' aceptó tu oferta para limpieza ' || v_job_type || '. ¡Empieza a chatear!',
      'application_accepted',
      jsonb_build_object('jobId', NEW.job_id, 'applicationId', NEW.id)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_application_accepted on applications;
create trigger trg_application_accepted
  after update on applications
  for each row execute function trg_notify_application_accepted();

-- ─────────────────────────────────────────────
-- TRIGGER 3: Nuevo mensaje → notificar al receptor
-- ─────────────────────────────────────────────
create or replace function trg_notify_new_message()
returns trigger language plpgsql security definer as $$
declare
  v_sender_name text;
  v_receiver_id uuid;
  v_client_id   uuid;
  v_pro_id      uuid;
begin
  select client_id, pro_id into v_client_id, v_pro_id
    from jobs where id = NEW.job_id;

  -- receptor es el que NO envió el mensaje
  v_receiver_id := case when NEW.sender_id = v_client_id then v_pro_id else v_client_id end;

  select full_name into v_sender_name from profiles where id = NEW.sender_id;

  perform invoke_send_push(
    v_receiver_id,
    '💬 ' || v_sender_name,
    NEW.body,
    'new_message',
    jsonb_build_object('jobId', NEW.job_id, 'senderId', NEW.sender_id)
  );
  return NEW;
end;
$$;

drop trigger if exists trg_new_message on messages;
create trigger trg_new_message
  after insert on messages
  for each row execute function trg_notify_new_message();

-- ─────────────────────────────────────────────
-- TRIGGER 4: Job completado → notificar al CLIENTE
-- ─────────────────────────────────────────────
create or replace function trg_notify_job_completed()
returns trigger language plpgsql security definer as $$
declare
  v_pro_name text;
begin
  if NEW.status = 'completed' and OLD.status <> 'completed' then
    select full_name into v_pro_name from profiles where id = NEW.pro_id;

    perform invoke_send_push(
      NEW.client_id,
      '✅ Servicio completado',
      v_pro_name || ' terminó tu limpieza. ¡Califícalo para que otros puedan encontrarlo!',
      'job_completed',
      jsonb_build_object('jobId', NEW.id, 'proId', NEW.pro_id, 'action', 'review')
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_job_completed on jobs;
create trigger trg_job_completed
  after update on jobs
  for each row execute function trg_notify_job_completed();

-- ─────────────────────────────────────────────
-- TRIGGER 5: Reclamo de garantía → notificar al PRO + equipo
-- ─────────────────────────────────────────────
create or replace function trg_notify_guarantee_claim()
returns trigger language plpgsql security definer as $$
declare
  v_client_name text;
  v_pro_id      uuid;
begin
  select p.full_name, j.pro_id
    into v_client_name, v_pro_id
    from jobs j
    join profiles p on p.id = j.client_id
   where j.id = NEW.booking_id;

  if v_pro_id is not null then
    perform invoke_send_push(
      v_pro_id,
      '⚠️ Reclamo de garantía',
      v_client_name || ' solicitó un reembolso por el servicio. El equipo LimpioGO está revisando.',
      'guarantee_claim',
      jsonb_build_object('jobId', NEW.booking_id, 'claimId', NEW.id)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_guarantee_claim on guarantee_claims;
create trigger trg_guarantee_claim
  after insert on guarantee_claims
  for each row execute function trg_notify_guarantee_claim();

-- ─────────────────────────────────────────────
-- TRIGGER 6: Referido completó primer booking → acreditar wallet a ambos
-- ─────────────────────────────────────────────
create or replace function trg_referral_reward()
returns trigger language plpgsql security definer as $$
declare
  v_referred_user_id uuid;
  v_referrer_code    text;
  v_referrer_id      uuid;
  v_is_first         boolean;
begin
  if NEW.status = 'completed' and OLD.status <> 'completed' then
    -- ¿Es el primer booking completado del cliente?
    select count(*) = 0 into v_is_first
      from jobs
     where client_id = NEW.client_id
       and status = 'completed'
       and id <> NEW.id;

    if not v_is_first then return NEW; end if;

    -- ¿Tiene referred_by?
    select referred_by into v_referrer_code
      from profiles where id = NEW.client_id;

    if v_referrer_code is null then return NEW; end if;

    -- Buscar al referidor
    select id into v_referrer_id from profiles where referral_code = v_referrer_code;

    if v_referrer_id is null then return NEW; end if;

    -- Acreditar $5.000 COP en wallet a referidor
    update profiles set wallet_balance = coalesce(wallet_balance, 0) + 5000 where id = v_referrer_id;
    insert into wallet_transactions(user_id, amount, type, description)
    values (v_referrer_id, 5000, 'referral_reward', 'Recompensa por referido exitoso');

    -- Acreditar $5.000 COP a referido (cliente que acaba de completar)
    update profiles set wallet_balance = coalesce(wallet_balance, 0) + 5000 where id = NEW.client_id;
    insert into wallet_transactions(user_id, amount, type, description)
    values (NEW.client_id, 5000, 'referral_welcome', 'Bono de bienvenida por ser referido');

    -- Registrar en referral_rewards
    insert into referral_rewards(referrer_id, referred_id, reward_amount, credited_at)
    values (v_referrer_id, NEW.client_id, 5000, now())
    on conflict do nothing;

    -- Push al referidor
    perform invoke_send_push(
      v_referrer_id,
      '🎁 ¡Ganaste $5.000 por referido!',
      'Tu referido completó su primer servicio. Ya tienes $5.000 en tu wallet LimpioGO.',
      'referral_reward',
      jsonb_build_object('amount', 5000)
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_referral_reward on jobs;
create trigger trg_referral_reward
  after update on jobs
  for each row execute function trg_referral_reward();
