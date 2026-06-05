create table if not exists public.roblox_game_snapshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  roblox_universe_id text not null,
  roblox_place_id text,
  title text,
  active_players integer default 0,
  visits bigint default 0,
  favorites bigint default 0,
  upvotes bigint default 0,
  downvotes bigint default 0,
  like_ratio numeric default 0,
  genre text,
  subgenre text,
  created_at_roblox timestamp,
  updated_at_roblox timestamp,
  captured_at timestamp default now()
);

create index if not exists roblox_game_snapshots_game_id_captured_at_idx
  on public.roblox_game_snapshots(game_id, captured_at desc);

create index if not exists roblox_game_snapshots_universe_captured_at_idx
  on public.roblox_game_snapshots(roblox_universe_id, captured_at desc);

create table if not exists public.roblox_game_metrics (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade unique,
  avg_session_1d numeric null,
  avg_session_7d numeric null,
  avg_session_14d numeric null,
  avg_ccu_1d numeric null,
  avg_ccu_7d numeric null,
  avg_ccu_14d numeric null,
  momentum_1d numeric null,
  momentum_7d numeric null,
  momentum_14d numeric null,
  visit_growth_1d bigint default 0,
  visit_growth_7d bigint default 0,
  visit_growth_14d bigint default 0,
  favorite_growth_1d bigint default 0,
  favorite_growth_7d bigint default 0,
  rating_movement_1d numeric null,
  rating_movement_7d numeric null,
  update_freshness_score integer default 0,
  global_rank integer null,
  rank_shift_1d integer null,
  rank_shift_7d integer null,
  genre_rank integer null,
  confidence_level text default 'low',
  calculated_at timestamp default now()
);

create table if not exists public.tracked_games (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade unique,
  roblox_universe_id text not null unique,
  roblox_place_id text,
  tracking_enabled boolean default true,
  tracking_interval_minutes integer default 15,
  last_snapshot_at timestamp null,
  next_snapshot_at timestamp null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table public.games add column if not exists genre text null;
alter table public.games add column if not exists subgenre text null;
alter table public.games add column if not exists is_real_data boolean default false;
alter table public.games add column if not exists data_source text default 'manual_import';
alter table public.games add column if not exists global_rank integer null;
alter table public.games add column if not exists genre_rank integer null;

alter table public.roblox_game_snapshots enable row level security;
alter table public.roblox_game_metrics enable row level security;
alter table public.tracked_games enable row level security;

drop policy if exists "Public tracking snapshot read" on public.roblox_game_snapshots;
create policy "Public tracking snapshot read"
  on public.roblox_game_snapshots for select using (true);

drop policy if exists "Public roblox metrics read" on public.roblox_game_metrics;
create policy "Public roblox metrics read"
  on public.roblox_game_metrics for select using (true);

drop policy if exists "Public tracked games read" on public.tracked_games;
create policy "Public tracked games read"
  on public.tracked_games for select using (true);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.roblox_game_snapshots to anon, authenticated;
grant select on public.roblox_game_metrics to anon, authenticated;
grant select on public.tracked_games to anon, authenticated;
grant select, insert, update, delete on public.roblox_game_snapshots to service_role;
grant select, insert, update, delete on public.roblox_game_metrics to service_role;
grant select, insert, update, delete on public.tracked_games to service_role;
