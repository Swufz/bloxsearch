create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  roblox_universe_id text unique,
  roblox_place_id text,
  title text not null,
  description text,
  creator_name text,
  creator_id text,
  creator_type text,
  thumbnail_url text,
  game_url text,
  active_players integer default 0,
  visits bigint default 0,
  favorites bigint default 0,
  upvotes bigint default 0,
  downvotes bigint default 0,
  like_ratio numeric default 0,
  max_players integer,
  created_at_roblox timestamptz,
  updated_at_roblox timestamptz,
  first_seen_at timestamptz default now(),
  last_fetched_at timestamptz,
  tags text[] default '{}',
  niche text,
  mechanics text[] default '{}',
  monetization_tags text[] default '{}',
  raw_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.game_snapshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  active_players integer default 0,
  visits bigint default 0,
  favorites bigint default 0,
  upvotes bigint default 0,
  downvotes bigint default 0,
  like_ratio numeric default 0,
  captured_at timestamptz default now()
);

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade unique,
  opportunity_score integer,
  demand_score integer,
  growth_score integer,
  competition_score integer,
  freshness_score integer,
  buildability_score integer,
  monetization_score integer,
  outlier_reason text,
  risks text[],
  generated_ideas jsonb,
  calculated_at timestamptz default now()
);

create table if not exists public.saved_games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, game_id)
);

create table if not exists public.saved_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  title text not null,
  description text,
  niche text,
  difficulty text,
  monetization_options text[],
  opportunity_score integer,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.data_collection_logs (
  id uuid primary key default gen_random_uuid(),
  action text,
  status text,
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.game_snapshots enable row level security;
alter table public.game_scores enable row level security;
alter table public.saved_games enable row level security;
alter table public.saved_ideas enable row level security;
alter table public.data_collection_logs enable row level security;

create policy "Public game read" on public.games for select using (true);
create policy "Public snapshot read" on public.game_snapshots for select using (true);
create policy "Public score read" on public.game_scores for select using (true);
create policy "Users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users read own saved games" on public.saved_games for select using (auth.uid() = user_id);
create policy "Users insert own saved games" on public.saved_games for insert with check (auth.uid() = user_id);
create policy "Users delete own saved games" on public.saved_games for delete using (auth.uid() = user_id);
create policy "Users read own saved ideas" on public.saved_ideas for select using (auth.uid() = user_id);
create policy "Users insert own saved ideas" on public.saved_ideas for insert with check (auth.uid() = user_id);
create policy "Users update own saved ideas" on public.saved_ideas for update using (auth.uid() = user_id);
create policy "Users delete own saved ideas" on public.saved_ideas for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create index if not exists games_active_players_idx on public.games(active_players desc);
create index if not exists games_niche_idx on public.games(niche);
create index if not exists snapshots_game_captured_idx on public.game_snapshots(game_id, captured_at desc);
create index if not exists scores_opportunity_idx on public.game_scores(opportunity_score desc);
