alter table public.games add column if not exists discovery_source text null;
alter table public.games add column if not exists discovery_rank integer null;
alter table public.games add column if not exists discovered_at timestamptz null;
alter table public.games add column if not exists source_keyword text null;
alter table public.games add column if not exists archived_at timestamptz null;
alter table public.games add column if not exists archive_reason text null;
alter table public.games add column if not exists is_archived boolean default false;
alter table public.games add column if not exists low_ccu_streak integer default 0;

create table if not exists public.dataset_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.dataset_settings (key, value)
values
  ('min_import_ccu', '100'::jsonb),
  ('min_track_ccu', '50'::jsonb),
  ('auto_archive_enabled', 'true'::jsonb),
  ('low_ccu_archive_threshold', '25'::jsonb),
  ('low_ccu_snapshot_streak', '6'::jsonb),
  ('low_ccu_days_threshold', '2'::jsonb),
  ('max_top_games_per_run', '100'::jsonb),
  ('max_keyword_results_per_run', '50'::jsonb)
on conflict (key) do nothing;

create table if not exists public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  source_name text not null unique,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.discovery_sources (source_name)
values ('top_games'), ('trending'), ('popular'), ('keyword'), ('manual')
on conflict (source_name) do nothing;

create table if not exists public.trend_clusters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  formula_summary text,
  primary_keyword text,
  growth_mechanic text,
  goal_format text,
  theme text,
  input_hook text,
  games_count integer default 0,
  total_active_players integer default 0,
  total_visits bigint default 0,
  avg_like_ratio numeric default 0,
  avg_session numeric null,
  avg_ccu numeric null,
  momentum numeric null,
  confidence_level text default 'low',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.trend_cluster_games (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid references public.trend_clusters(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  similarity_score numeric default 0,
  matched_keywords text[] default '{}',
  created_at timestamptz default now(),
  unique(cluster_id, game_id)
);

create index if not exists games_archived_idx on public.games(is_archived);
create index if not exists games_discovery_source_idx on public.games(discovery_source);
create index if not exists games_active_archived_idx on public.games(is_archived, active_players desc);
create index if not exists trend_clusters_active_idx on public.trend_clusters(total_active_players desc);
create unique index if not exists trend_clusters_formula_unique_idx on public.trend_clusters(formula_summary);
create index if not exists trend_cluster_games_cluster_idx on public.trend_cluster_games(cluster_id);
create index if not exists trend_cluster_games_game_idx on public.trend_cluster_games(game_id);

alter table public.dataset_settings enable row level security;
alter table public.discovery_sources enable row level security;
alter table public.trend_clusters enable row level security;
alter table public.trend_cluster_games enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'dataset_settings'
      and policyname = 'Public dataset settings read'
  ) then
    create policy "Public dataset settings read"
      on public.dataset_settings for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'discovery_sources'
      and policyname = 'Public discovery sources read'
  ) then
    create policy "Public discovery sources read"
      on public.discovery_sources for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trend_clusters'
      and policyname = 'Public trend clusters read'
  ) then
    create policy "Public trend clusters read"
      on public.trend_clusters for select using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'trend_cluster_games'
      and policyname = 'Public trend cluster games read'
  ) then
    create policy "Public trend cluster games read"
      on public.trend_cluster_games for select using (true);
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.dataset_settings to anon, authenticated;
grant select on public.discovery_sources to anon, authenticated;
grant select on public.trend_clusters to anon, authenticated;
grant select on public.trend_cluster_games to anon, authenticated;
grant select, insert, update, delete on public.dataset_settings to service_role;
grant select, insert, update, delete on public.discovery_sources to service_role;
grant select, insert, update, delete on public.trend_clusters to service_role;
grant select, insert, update, delete on public.trend_cluster_games to service_role;
