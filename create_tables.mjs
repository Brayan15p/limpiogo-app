import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.aruvnrxxblleralfmamp:Mikealphaxray.1@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- PROFILES
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null,
  phone         text,
  avatar_url    text,
  role          text not null check (role in ('client','pro')) default 'client',
  country_code  text default 'MX',
  bio           text,
  rating        numeric(3,2) default 0,
  total_reviews integer default 0,
  is_verified   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table public.profiles enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_select') then
    create policy profiles_select on profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_insert') then
    create policy profiles_insert on profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles_update') then
    create policy profiles_update on profiles for update using (auth.uid() = id);
  end if;
end $$;

-- ADDRESSES
create table if not exists public.addresses (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  label      text not null,
  street     text not null,
  detail     text,
  city       text not null,
  zip        text,
  lat        double precision,
  lng        double precision,
  is_default boolean default false,
  created_at timestamptz default now()
);
alter table public.addresses enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='addresses' and policyname='addresses_own') then
    create policy addresses_own on addresses using (auth.uid() = user_id);
  end if;
end $$;

-- JOBS
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid references profiles(id) on delete cascade,
  pro_id        uuid references profiles(id),
  address_id    uuid references addresses(id),
  type          text not null check (type in ('basic','deep','move','office','custom')),
  bedrooms      integer default 1,
  bathrooms     integer default 1,
  notes         text,
  budget        numeric(10,2),
  agreed_price  numeric(10,2),
  status        text not null check (status in ('draft','open','in_progress','completed','cancelled')) default 'draft',
  scheduled_at  timestamptz,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now()
);
alter table public.jobs enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='jobs' and policyname='jobs_client') then
    create policy jobs_client on jobs for select using (auth.uid() = client_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='jobs' and policyname='jobs_open') then
    create policy jobs_open on jobs for select using (status = 'open' or auth.uid() = pro_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='jobs' and policyname='jobs_insert') then
    create policy jobs_insert on jobs for insert with check (auth.uid() = client_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='jobs' and policyname='jobs_update') then
    create policy jobs_update on jobs for update using (auth.uid() = client_id or auth.uid() = pro_id);
  end if;
end $$;

-- APPLICATIONS
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
do $$ begin
  if not exists (select 1 from pg_policies where tablename='applications' and policyname='apps_pro') then
    create policy apps_pro on applications for select using (auth.uid() = pro_id);
  end if;
  if not exists (select 1 from pg_policies where tablename='applications' and policyname='apps_client') then
    create policy apps_client on applications for select
      using (exists (select 1 from jobs where jobs.id = applications.job_id and jobs.client_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename='applications' and policyname='apps_insert') then
    create policy apps_insert on applications for insert with check (auth.uid() = pro_id);
  end if;
end $$;

-- MESSAGES
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete cascade,
  sender_id  uuid references profiles(id) on delete cascade,
  content    text not null,
  read_at    timestamptz,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='msgs_select') then
    create policy msgs_select on messages for select using (
      exists (select 1 from jobs where jobs.id = messages.job_id
        and (jobs.client_id = auth.uid() or jobs.pro_id = auth.uid()))
    );
  end if;
  if not exists (select 1 from pg_policies where tablename='messages' and policyname='msgs_insert') then
    create policy msgs_insert on messages for insert with check (
      auth.uid() = sender_id and exists (
        select 1 from jobs where jobs.id = messages.job_id
        and (jobs.client_id = auth.uid() or jobs.pro_id = auth.uid())
      )
    );
  end if;
end $$;

-- REVIEWS
create table if not exists public.reviews (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid references jobs(id) on delete cascade unique,
  reviewer_id  uuid references profiles(id) on delete cascade,
  reviewed_id  uuid references profiles(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text,
  created_at   timestamptz default now()
);
alter table public.reviews enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='reviews_public') then
    create policy reviews_public on reviews for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename='reviews' and policyname='reviews_insert') then
    create policy reviews_insert on reviews for insert with check (auth.uid() = reviewer_id);
  end if;
end $$;

-- FAVORITES
create table if not exists public.favorites (
  user_id    uuid references profiles(id) on delete cascade,
  pro_id     uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, pro_id)
);
alter table public.favorites enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='favorites' and policyname='favs_own') then
    create policy favs_own on favorites using (auth.uid() = user_id);
  end if;
end $$;
`;

async function run() {
  try {
    await client.connect();
    console.log('✅ Conectado a Supabase');
    await client.query(SQL);
    console.log('✅ Tablas creadas: profiles, addresses, jobs, applications, messages, reviews, favorites');

    // Verify tables
    const res = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log('📋 Tablas en DB:', res.rows.map(r => r.tablename).join(', '));
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
