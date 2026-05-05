-- Migration: add real-time location tracking to profiles
alter table public.profiles
  add column if not exists lat  double precision,
  add column if not exists lng  double precision,
  add column if not exists is_online boolean default false;

-- Enable realtime for profiles (location tracking)
alter publication supabase_realtime add table profiles;
