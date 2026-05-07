-- F45: Garantía 24h
alter table profiles add column if not exists first_booking_celebrated boolean default false;

create table if not exists guarantee_claims (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references jobs(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade,
  reason text not null,
  status text default 'pending' check (status in ('pending','accepted','resolved')),
  new_booking_id uuid references jobs(id),
  created_at timestamptz default now()
);

alter table guarantee_claims enable row level security;
create policy "client sees own claims" on guarantee_claims for all using (auth.uid() = client_id);
