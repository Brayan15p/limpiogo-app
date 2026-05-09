-- Bugfix: agregar status 'completed' al check constraint de applications
-- Ejecutar en Supabase Dashboard → SQL Editor

alter table applications
  drop constraint if exists applications_status_check;

alter table applications
  add constraint applications_status_check
  check (status in ('pending', 'accepted', 'rejected', 'completed'));

-- Actualizar applications existentes que ya tengan job completado
update applications a
set status = 'completed'
from jobs j
where a.job_id = j.id
  and j.status = 'completed'
  and a.status = 'accepted';
