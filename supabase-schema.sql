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

-- 3. Scrape requests (user-submitted)
create table if not exists scrape_requests (
  id bigint generated always as identity primary key,
  politician_name text not null,
  constituency text,
  state text,
  status text not null default 'pending',  -- pending | processing | completed | failed
  result_profile_url text,                 -- filled when scrape succeeds
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_scrape_status on scrape_requests (status);

-- 4. Row Level Security (RLS)
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

alter table scrape_requests enable row level security;

create policy "Anyone can read scrape requests"
  on scrape_requests for select
  using (true);

create policy "Anyone can submit scrape requests"
  on scrape_requests for insert
  with check (true);

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

-- 5. Politicians index (master list for search/browse)
-- Enable pg_trgm for fuzzy text search
create extension if not exists pg_trgm;

create table if not exists politicians (
  id bigint generated always as identity primary key,
  name text not null,
  constituency text not null,
  party text not null,
  state text not null default '',
  election_type text not null default '',
  election text not null default '',
  profile_url text unique not null,
  criminal_cases integer,
  total_assets text,
  education text,
  created_at timestamptz not null default now()
);

-- GIN trigram indexes for fuzzy search
create index if not exists idx_politicians_name_trgm on politicians using gin (name gin_trgm_ops);
create index if not exists idx_politicians_constituency_trgm on politicians using gin (constituency gin_trgm_ops);
create index if not exists idx_politicians_party_trgm on politicians using gin (party gin_trgm_ops);
create index if not exists idx_politicians_profile_url on politicians (profile_url);

alter table politicians enable row level security;

create policy "Anyone can read politicians" on politicians for select using (true);
create policy "App can insert politicians" on politicians for insert with check (true);
create policy "App can update politicians" on politicians for update using (true);

-- Fuzzy search RPC function
create or replace function search_politicians(
  search_query text,
  result_limit integer default 15
)
returns table (
  name text,
  constituency text,
  party text,
  state text,
  election_type text,
  election text,
  profile_url text,
  criminal_cases integer,
  total_assets text,
  education text,
  rank real
)
language sql stable
as $$
  select
    p.name,
    p.constituency,
    p.party,
    p.state,
    p.election_type,
    p.election,
    p.profile_url,
    p.criminal_cases,
    p.total_assets,
    p.education,
    greatest(
      similarity(p.name, search_query),
      similarity(p.constituency, search_query),
      similarity(p.party, search_query)
    ) as rank
  from politicians p
  where
    p.name % search_query
    or p.constituency % search_query
    or p.party % search_query
    or p.name ilike '%' || search_query || '%'
    or p.constituency ilike '%' || search_query || '%'
  order by rank desc, p.name asc
  limit result_limit;
$$;

-- 6. Auto-cleanup: delete cached data older than 7 days (optional cron)
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
