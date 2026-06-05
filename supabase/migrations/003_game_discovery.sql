create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  status text default 'pending',
  result_count integer default 0,
  imported_count integer default 0,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.discovered_games (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid references public.discovery_runs(id) on delete cascade,
  roblox_universe_id text,
  roblox_place_id text,
  title text,
  creator_name text,
  active_players integer default 0,
  visits bigint default 0,
  thumbnail_url text,
  source_keyword text,
  already_imported boolean default false,
  raw_data jsonb,
  created_at timestamptz default now()
);

alter table public.games add column if not exists source_keyword text null;

create index if not exists discovery_runs_keyword_idx on public.discovery_runs(keyword);
create index if not exists discovered_games_run_idx on public.discovered_games(discovery_run_id);
create index if not exists discovered_games_universe_idx on public.discovered_games(roblox_universe_id);
create index if not exists discovered_games_keyword_idx on public.discovered_games(source_keyword);

alter table public.discovery_runs enable row level security;
alter table public.discovered_games enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'discovery_runs'
      and policyname = 'Public discovery runs read'
  ) then
    create policy "Public discovery runs read"
      on public.discovery_runs for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'discovered_games'
      and policyname = 'Public discovered games read'
  ) then
    create policy "Public discovered games read"
      on public.discovered_games for select using (true);
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.discovery_runs to anon, authenticated;
grant select on public.discovered_games to anon, authenticated;
grant select, insert, update, delete on public.discovery_runs to service_role;
grant select, insert, update, delete on public.discovered_games to service_role;
