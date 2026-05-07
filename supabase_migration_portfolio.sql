-- ============================================================
-- Migration: Portfolio Photos + Storage bucket
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tabla portfolio_photos
create table if not exists public.portfolio_photos (
  id           uuid primary key default gen_random_uuid(),
  pro_id       uuid not null references public.profiles(id) on delete cascade,
  url          text not null,
  storage_path text not null,
  caption      text,
  created_at   timestamptz not null default now()
);

-- Índice para consultas por pro
create index if not exists idx_portfolio_photos_pro_id on public.portfolio_photos(pro_id);

-- 2. RLS policies para portfolio_photos
alter table public.portfolio_photos enable row level security;

-- Pro solo ve sus propias fotos
create policy "pro_select_own_photos" on public.portfolio_photos
  for select using (auth.uid() = pro_id);

-- Clientes pueden ver fotos de cualquier pro (para ProPublicProfile)
create policy "client_select_pro_photos" on public.portfolio_photos
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'client'
    )
  );

-- Pro solo inserta sus propias fotos
create policy "pro_insert_own_photos" on public.portfolio_photos
  for insert with check (auth.uid() = pro_id);

-- Pro solo elimina sus propias fotos
create policy "pro_delete_own_photos" on public.portfolio_photos
  for delete using (auth.uid() = pro_id);

-- 3. Storage bucket 'portfolio'
-- Ejecutar desde Dashboard → Storage → New Bucket:
--   Name: portfolio
--   Public: true  (URLs públicas para mostrar en perfiles)
--   Allowed MIME types: image/jpeg, image/png, image/webp
--   Max file size: 5242880 (5 MB)
--
-- O via SQL (requiere extensión storage):
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio',
  'portfolio',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 4. Storage RLS policies
-- Pro puede subir a su carpeta: portfolio/{pro_id}/...
create policy "pro_upload_portfolio" on storage.objects
  for insert with check (
    bucket_id = 'portfolio'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Pro puede eliminar sus propios archivos
create policy "pro_delete_portfolio" on storage.objects
  for delete using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- Lectura pública (bucket es public, pero por si acaso)
create policy "public_read_portfolio" on storage.objects
  for select using (bucket_id = 'portfolio');
