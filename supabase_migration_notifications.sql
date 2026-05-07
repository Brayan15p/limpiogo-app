-- ============================================================
-- Migration: Notifications table
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('booking', 'message', 'offer', 'review', 'system')),
  title       text not null,
  body        text not null,
  read        boolean not null default false,
  booking_id  uuid references public.jobs(id) on delete set null,
  chat_id     uuid references public.jobs(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read    on public.notifications(user_id, read);

alter table public.notifications enable row level security;

-- Cada usuario solo ve sus propias notificaciones
create policy "user_select_own_notifs" on public.notifications
  for select using (auth.uid() = user_id);

-- Solo el sistema (service role) inserta notificaciones
create policy "service_insert_notifs" on public.notifications
  for insert with check (auth.uid() = user_id);

-- Usuario puede marcar como leído (solo su campo read)
create policy "user_update_own_notifs" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Habilitar Realtime para notificaciones en tiempo real
alter publication supabase_realtime add table public.notifications;

-- Función para crear notificación (llamada desde triggers o Edge Functions)
create or replace function public.create_notification(
  p_user_id    uuid,
  p_type       text,
  p_title      text,
  p_body       text,
  p_booking_id uuid default null,
  p_chat_id    uuid default null
) returns void language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, type, title, body, booking_id, chat_id)
  values (p_user_id, p_type, p_title, p_body, p_booking_id, p_chat_id);
end;
$$;

-- Trigger: notificar al cliente cuando un pro envía oferta
create or replace function public.notify_new_offer() returns trigger language plpgsql security definer as $$
declare
  v_client_id uuid;
  v_job_type  text;
begin
  select client_id, type into v_client_id, v_job_type from public.jobs where id = NEW.job_id;
  perform public.create_notification(
    v_client_id, 'offer',
    'Nueva oferta recibida',
    'Un profesional hizo una oferta por tu servicio de ' || v_job_type,
    NEW.job_id
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_new_offer on public.applications;
create trigger trg_notify_new_offer
  after insert on public.applications
  for each row execute function public.notify_new_offer();

-- Trigger: notificar al pro cuando su oferta es aceptada
create or replace function public.notify_offer_accepted() returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'accepted' and OLD.status = 'pending' then
    perform public.create_notification(
      NEW.pro_id, 'booking',
      '¡Oferta aceptada!',
      'Tu oferta fue aceptada. Coordina con el cliente por el chat.',
      NEW.job_id
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_offer_accepted on public.applications;
create trigger trg_notify_offer_accepted
  after update on public.applications
  for each row execute function public.notify_offer_accepted();

-- Trigger: notificar cuando llega un mensaje nuevo
create or replace function public.notify_new_message() returns trigger language plpgsql security definer as $$
declare
  v_recipient uuid;
  v_sender_name text;
begin
  -- Buscar el otro participante del job
  select case
    when j.client_id = NEW.sender_id then j.pro_id
    else j.client_id
  end into v_recipient
  from public.jobs j where j.id = NEW.job_id;

  select full_name into v_sender_name from public.profiles where id = NEW.sender_id;

  if v_recipient is not null then
    perform public.create_notification(
      v_recipient, 'message',
      'Mensaje de ' || coalesce(v_sender_name, 'Usuario'),
      'Tienes un mensaje nuevo',
      null, NEW.job_id
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();
