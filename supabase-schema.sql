-- PROJECT VIGIL — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Politician profiles cache
create table if not exists politician_profiles (
  id bigint generated always as identity primary key,
  profile_url text unique not null,
  name text not null,
  party text,
  constituency text,
  profile_data jsonb not null,
  cached_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Index for fast lookups by URL
create index if not exists idx_profiles_url on politician_profiles (profile_url);

-- Index for browsing by name
create index if not exists idx_profiles_name on politician_profiles (name);

-- 2. Search results cache
create table if not exists search_cache (
  id bigint generated always as identity primary key,
  query text unique not null,
  results jsonb not null,
  result_count integer not null default 0,
  cached_at timestamptz not null default now()
);

create index if not exists idx_search_query on search_cache (query);

-- 3. Row Level Security (RLS)
-- Enable RLS on both tables
alter table politician_profiles enable row level security;
alter table search_cache enable row level security;

-- Allow anonymous reads (public data)
create policy "Anyone can read profiles"
  on politician_profiles for select
  using (true);

create policy "Anyone can read search cache"
  on search_cache for select
  using (true);

-- Allow anonymous inserts/updates (app writes via anon key)
create policy "App can insert profiles"
  on politician_profiles for insert
  with check (true);

create policy "App can update profiles"
  on politician_profiles for update
  using (true);

create policy "App can insert search cache"
  on search_cache for insert
  with check (true);

create policy "App can update search cache"
  on search_cache for update
  using (true);

-- 4. Auto-cleanup: delete cached data older than 7 days (optional cron)
-- You can set this up as a Supabase Edge Function or pg_cron job:
--
-- select cron.schedule(
--   'cleanup-stale-cache',
--   '0 3 * * *',  -- daily at 3am UTC
--   $$
--     delete from politician_profiles where cached_at < now() - interval '7 days';
--     delete from search_cache where cached_at < now() - interval '1 day';
--   $$
-- );
