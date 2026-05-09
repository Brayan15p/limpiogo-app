-- Batch 2: Chat fotos · Reviews fotos · Avatar · Multi-idioma · Seguro
-- Ejecutar en Supabase Dashboard → SQL Editor

-- ─── Reviews con foto
alter table reviews add column if not exists photo_url text;

-- ─── Mensajes con imagen
alter table messages add column if not exists image_url text;

-- ─── Avatar storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "usuarios pueden subir su propio avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "avatar público"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "usuario puede actualizar su avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── Seguro: tabla de incidentes (InsuranceScreen usa DisputeScreen vía navigate)
-- No se necesita tabla extra — usa la tabla disputes existente

-- ─── Precio dinámico: índice para pros online rápido
create index if not exists idx_profiles_pro_online on profiles(role, is_online)
  where role = 'pro' and is_online = true;

-- ─── Pro onboarding: columna para saber si ya vio el tutorial
-- (Se guarda en SecureStore local, no necesita DB)

-- ─── i18n: campo de idioma en profiles (opcional, para sincronizar entre dispositivos)
alter table profiles add column if not exists preferred_language text default 'es'
  check (preferred_language in ('es', 'en'));
