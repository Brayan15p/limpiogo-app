-- F21: Disputas y Reportes
create table if not exists disputes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references jobs(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete cascade,
  reason text not null,
  evidence_urls text[] default '{}',
  description text,
  status text default 'open' check (status in ('open','reviewing','resolved','closed')),
  resolution text,
  created_at timestamptz default now()
);

alter table disputes enable row level security;
create policy "reporter sees own disputes" on disputes for all using (auth.uid() = reporter_id);

-- F22: Botón SOS
create table if not exists sos_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  booking_id uuid references jobs(id) on delete cascade,
  lat numeric,
  lng numeric,
  resolved_at timestamptz,
  created_at timestamptz default now()
);

alter table sos_alerts enable row level security;
create policy "user sees own sos" on sos_alerts for all using (auth.uid() = user_id);
