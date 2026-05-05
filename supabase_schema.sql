-- ============================================
-- LimpioGO — Supabase Schema v1
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- PROFILES (extiende auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  phone       text,
  avatar_url  text,
  role        text not null check (role in ('client', 'pro')) default 'client',
  country_code text default 'MX',
  bio         text,
  rating      numeric(3,2) default 0,
  total_reviews integer default 0,
  is_verified boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
create policy "Users can view all profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- ADDRESSES
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  label       text not null,
  street      text not null,
  detail      text,
  city        text not null,
  zip         text,
  lat         double precision,
  lng         double precision,
  is_default  boolean default false,
  created_at  timestamptz default now()
);
alter table public.addresses enable row level security;
create policy "Users own addresses" on addresses using (auth.uid() = user_id);

-- JOBS (servicios publicados por clientes)
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid references profiles(id) on delete cascade,
  pro_id       uuid references profiles(id),
  address_id   uuid references addresses(id),
  type         text not null check (type in ('basic','deep','move','office','custom')),
  bedrooms     integer default 1,
  bathrooms    integer default 1,
  notes        text,
  budget       numeric(10,2),
  agreed_price numeric(10,2),
  status       text not null check (status in ('draft','open','in_progress','completed','cancelled')) default 'draft',
  scheduled_at timestamptz,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz default now()
);
alter table public.jobs enable row level security;
create policy "Clients see own jobs" on jobs for select using (auth.uid() = client_id);
create policy "Pros see open jobs" on jobs for select using (status = 'open' or auth.uid() = pro_id);
create policy "Clients insert jobs" on jobs for insert with check (auth.uid() = client_id);
create policy "Participants update jobs" on jobs for update using (auth.uid() = client_id or auth.uid() = pro_id);

-- APPLICATIONS (postulaciones de pros a jobs)
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  job_id        uuid references jobs(id) on delete cascade,
  pro_id        uuid references profiles(id) on delete cascade,
  offered_price numeric(10,2) not null,
  message       text,
  status        text check (status in ('pending','accepted','rejected')) default 'pending',
  created_at    timestamptz default now(),
  unique(job_id, pro_id)
);
alter table public.applications enable row level security;
create policy "Pros see own applications" on applications for select using (auth.uid() = pro_id);
create policy "Clients see applications to their jobs" on applications for select
  using (exists (select 1 from jobs where jobs.id = applications.job_id and jobs.client_id = auth.uid()));
create policy "Pros insert applications" on applications for insert with check (auth.uid() = pro_id);

-- MESSAGES (chat)
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  sender_id  uuid references profiles(id) on delete cascade,
  content    text not null,
  read_at    timestamptz,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "Participants see messages" on messages for select
  using (exists (
    select 1 from jobs
    where jobs.id = messages.job_id
    and (jobs.client_id = auth.uid() or jobs.pro_id = auth.uid())
  ));
create policy "Participants insert messages" on messages for insert
  with check (auth.uid() = sender_id and exists (
    select 1 from jobs
    where jobs.id = messages.job_id
    and (jobs.client_id = auth.uid() or jobs.pro_id = auth.uid())
  ));

-- REVIEWS
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade unique,
  reviewer_id uuid references profiles(id) on delete cascade,
  reviewed_id uuid references profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
create policy "Reviews are public" on reviews for select using (true);
create policy "Reviewer inserts" on reviews for insert with check (auth.uid() = reviewer_id);

-- FAVORITES
create table if not exists public.favorites (
  user_id uuid references profiles(id) on delete cascade,
  pro_id  uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, pro_id)
);
alter table public.favorites enable row level security;
create policy "Users own favorites" on favorites using (auth.uid() = user_id);

-- Realtime: habilitar para mensajes y jobs
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table jobs;
