# BloxSearch

BloxSearch is a full-stack MVP for Roblox game market research. It tracks public experience signals, detects outliers, scores opportunities, and turns trends into original, buildable game ideas.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The app runs with realistic mock data by default, so Supabase is optional for the demo.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL, anon key, service role key, and comma-separated admin emails.
5. Set `MOCK_ROBLOX_MODE=false` only when you are ready to use Roblox public endpoints.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code. RLS allows public reads for games, snapshots, and scores, while saved games, saved ideas, and profiles are user-owned.

## Mock data and admin tools

Visit `/admin` in local development. The mock dataset includes 25 fictional Roblox-style experiences with varied age, demand, ratings, niches, and monetization signals. The admin API surface includes:

- `POST /api/admin/seed`
- `POST /api/admin/fetch-game` with `{ "universeId": "..." }`
- `POST /api/admin/score-games`
- `GET /api/games`
- `GET /api/games/[id]`
- Saved game and saved idea create/delete placeholders

The Roblox service lives in `src/lib/roblox.ts`, includes retry handling and caching, and keeps endpoint changes isolated.

## What is included

- Landing page, login screen, responsive dashboard shell
- Outlier Finder with search, niche, active player, and sorting filters
- Detailed game analysis with score breakdown, risks, trends, similar games, and generated ideas
- Saved ideas and admin/data collection screens
- Deterministic opportunity scoring and idea generation
- Supabase schema, RLS policies, auth-aware proxy, and environment template
- Mock-first operation for development and Vercel-compatible deployment

## Next additions

- Persist admin imports, scoring, saved games, and saved ideas through Supabase
- Daily cron job for snapshots and historical trend charts
- Real AI integration and an MCP connector for Claude, Cursor, and Codex
- Similar game clustering and thumbnail similarity search
- Discord alerts, Chrome extension, team accounts, and paid subscriptions

Use these signals for inspiration. Do not clone assets, names, maps, UI, or copyrighted material from other games.
