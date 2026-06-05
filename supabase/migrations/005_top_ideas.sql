create table if not exists public.generated_top_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  how_players_play text,
  trend_formula text,
  data_signals jsonb,
  potential_score integer,
  potential_reason text,
  originality_risk text,
  originality_reason text,
  similar_games jsonb,
  difficulty text,
  monetization_options text[],
  risks text[],
  confidence_level text,
  created_at timestamptz default now()
);

alter table public.generated_top_ideas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'generated_top_ideas'
      and policyname = 'Public generated top ideas read'
  ) then
    create policy "Public generated top ideas read"
      on public.generated_top_ideas for select using (true);
  end if;
end $$;

grant usage on schema public to anon, authenticated, service_role;
grant select on public.generated_top_ideas to anon, authenticated;
grant select, insert, update, delete on public.generated_top_ideas to service_role;
