-- F17: Fotos Antes/Después
-- Ejecutar en Supabase Dashboard → SQL Editor

alter table jobs add column if not exists photo_before text;
alter table jobs add column if not exists photo_after  text;

-- Storage bucket para fotos de trabajo (si no existe)
insert into storage.buckets (id, name, public)
values ('job-photos', 'job-photos', true)
on conflict (id) do nothing;

-- RLS: el pro asignado puede subir sus fotos; el cliente propietario puede leer
create policy "pro can upload job photos"
  on storage.objects for insert
  with check (
    bucket_id = 'job-photos'
    and auth.role() = 'authenticated'
  );

create policy "anyone can view job photos"
  on storage.objects for select
  using (bucket_id = 'job-photos');
