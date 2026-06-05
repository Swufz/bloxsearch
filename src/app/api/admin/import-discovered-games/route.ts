import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { generateIdeas } from "@/lib/idea-generator";
import { isMockMode } from "@/lib/mode";
import {
  fetchRobloxGameByUniverseId,
  fetchRobloxGameIcon,
  fetchRobloxGameVotes,
  normalizeRobloxGameData,
} from "@/lib/roblox";
import { scoreGame } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { analyzeTrendFormula } from "@/lib/trend-analysis";
import { calculateMetricsForGame, enableTrackingForGame } from "@/lib/tracking";
import type { Game } from "@/lib/types";

type DiscoveredGameRow = {
  id: string;
  discovery_run_id: string;
  roblox_universe_id: string | null;
  roblox_place_id: string | null;
  source_keyword: string | null;
  discovery_runs?: { keyword: string | null } | null;
  active_players?: number | null;
};

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rateLimited(error: unknown) {
  return (
    error instanceof Error && error.message.toLowerCase().includes("rate limited")
  );
}

async function importOneGame(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  row: DiscoveredGameRow,
  enableTracking: boolean,
) {
  if (!row.roblox_universe_id) throw new Error("Missing Roblox universe ID.");
  const sourceKeyword = row.source_keyword ?? row.discovery_runs?.keyword ?? null;
  const [raw, icon, votes] = await Promise.all([
    fetchRobloxGameByUniverseId(row.roblox_universe_id),
    fetchRobloxGameIcon(row.roblox_universe_id),
    fetchRobloxGameVotes(row.roblox_universe_id),
  ]);
  const game = normalizeRobloxGameData(
    { ...raw, rootPlaceId: raw.rootPlaceId ?? row.roblox_place_id },
    icon,
    votes,
  );
  const trend = analyzeTrendFormula(game);
  const { data: competitionRows } = await admin
    .from("games")
    .select("id, title, active_players, tags, niche, mechanics, monetization_tags, description")
    .neq("roblox_universe_id", row.roblox_universe_id);
  const similarActivePlayers = (competitionRows ?? [])
    .filter((candidate) => {
      const candidateTrend = analyzeTrendFormula({
        title: String(candidate.title ?? ""),
        description: String(candidate.description ?? ""),
        tags: Array.isArray(candidate.tags) ? candidate.tags : [],
        niche: String(candidate.niche ?? "Roblox"),
        mechanics: Array.isArray(candidate.mechanics) ? candidate.mechanics : [],
        monetizationTags: Array.isArray(candidate.monetization_tags)
          ? candidate.monetization_tags
          : [],
      });
      return (
        candidateTrend.growthMechanic === trend.growthMechanic ||
        candidateTrend.goalFormat === trend.goalFormat ||
        candidateTrend.theme === trend.theme
      );
    })
    .map((candidate) => Number(candidate.active_players ?? 0));
  game.score = scoreGame(game, Math.max(similarActivePlayers.length, 1), similarActivePlayers);
  game.ideas = generateIdeas(game);

  const nowIso = new Date().toISOString();
  const { data: savedGame, error: gameError } = await admin
    .from("games")
    .upsert(
      {
        roblox_universe_id: game.robloxUniverseId,
        roblox_place_id: game.robloxPlaceId || row.roblox_place_id,
        title: game.title,
        description: game.description,
        creator_name: game.creatorName,
        creator_id: game.creatorId,
        creator_type: game.creatorType,
        thumbnail_url: game.thumbnailUrl,
        game_url: game.gameUrl,
        active_players: game.activePlayers,
        visits: game.visits,
        favorites: game.favorites,
        upvotes: game.upvotes,
        downvotes: game.downvotes,
        like_ratio: game.likeRatio,
        max_players: game.maxPlayers,
        created_at_roblox: game.createdAtRoblox,
        updated_at_roblox: game.updatedAtRoblox,
        last_fetched_at: nowIso,
        tags: game.tags,
        niche: game.niche,
        genre: game.genre,
        subgenre: game.subgenre,
        mechanics: game.mechanics,
        monetization_tags: game.monetizationTags,
        is_real_data: true,
        data_source: "discovery_import",
        source_keyword: sourceKeyword,
        raw_data: { ...raw, votes },
      },
      { onConflict: "roblox_universe_id" },
    )
    .select("*")
    .single();
  if (gameError || !savedGame) throw gameError ?? new Error("Game was not saved.");

  await admin.from("keyword_signals").delete().eq("game_id", savedGame.id);
  if (trend.detectedKeywords.length) {
    const { error: keywordError } = await admin
      .from("keyword_signals")
      .insert(
        trend.detectedKeywords.map((signal) => ({
          keyword: signal.keyword,
          category: signal.category,
          game_id: savedGame.id,
          active_players: game.activePlayers,
          visits: game.visits,
          like_ratio: game.likeRatio,
          created_at_roblox: game.createdAtRoblox,
          updated_at_roblox: game.updatedAtRoblox,
        })),
      );
    if (keywordError) throw keywordError;
  }

  await admin.from("game_snapshots").insert(snapshotRow(savedGame.id, game, nowIso));
  await admin.from("roblox_game_snapshots").insert({
    ...snapshotRow(savedGame.id, game, nowIso),
    roblox_universe_id: game.robloxUniverseId,
    roblox_place_id: game.robloxPlaceId || row.roblox_place_id,
    title: game.title,
    genre: game.genre,
    subgenre: game.subgenre,
    created_at_roblox: game.createdAtRoblox,
    updated_at_roblox: game.updatedAtRoblox,
  });

  const { error: scoreError } = await admin.from("game_scores").upsert(
    {
      game_id: savedGame.id,
      opportunity_score: game.score.opportunity,
      demand_score: game.score.demand,
      growth_score: game.score.growth,
      competition_score: game.score.competition,
      freshness_score: game.score.freshness,
      buildability_score: game.score.buildability,
      monetization_score: game.score.monetization,
      outlier_reason: game.score.outlierReason,
      risks: game.score.risks,
      generated_ideas: game.ideas,
      calculated_at: nowIso,
    },
    { onConflict: "game_id" },
  );
  if (scoreError) throw scoreError;

  if (enableTracking) {
    await enableTrackingForGame(savedGame.id, { lastSnapshotAt: nowIso });
  }
  await calculateMetricsForGame(savedGame.id).catch(() => null);
  await admin
    .from("discovered_games")
    .update({ already_imported: true })
    .eq("id", row.id);
  return { id: savedGame.id, title: game.title, universeId: game.robloxUniverseId };
}

function snapshotRow(gameId: string, game: Game, capturedAt: string) {
  return {
    game_id: gameId,
    active_players: game.activePlayers,
    visits: game.visits,
    favorites: game.favorites,
    upvotes: game.upvotes,
    downvotes: game.downvotes,
    like_ratio: game.likeRatio,
    captured_at: capturedAt,
  };
}

export async function POST(request: Request) {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase service role is required to import discovered games." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    discoveryRunId?: string;
    gameIds?: string[];
    enableTracking?: boolean;
    minCcu?: number;
    allowBelowThreshold?: boolean;
  };
  if (!body.discoveryRunId || !Array.isArray(body.gameIds) || !body.gameIds.length) {
    return NextResponse.json(
      { error: "discoveryRunId and gameIds are required" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { getDatasetSettings } = await import("@/lib/dataset-settings");
  const settings = await getDatasetSettings();
  const minCcu = Number.isFinite(Number(body.minCcu))
    ? Number(body.minCcu)
    : settings.minImportCcu;
  const { data, error } = await admin
    .from("discovered_games")
    .select("id, discovery_run_id, roblox_universe_id, roblox_place_id, source_keyword, active_players, discovery_runs(keyword)")
    .eq("discovery_run_id", body.discoveryRunId)
    .in("id", body.gameIds);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const failures: Array<{ id: string; error: string }> = [];
  const skippedBelowCcu: Array<{ id: string; activePlayers: number }> = [];
  const imported = [];
  for (const row of (data ?? []) as unknown as DiscoveredGameRow[]) {
    if (!body.allowBelowThreshold && Number(row.active_players ?? 0) < minCcu) {
      skippedBelowCcu.push({
        id: row.id,
        activePlayers: Number(row.active_players ?? 0),
      });
      continue;
    }
    try {
      imported.push(await importOneGame(admin, row, body.enableTracking !== false));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      failures.push({ id: row.id, error: message });
      if (rateLimited(error)) break;
    }
    await pause(750);
  }

  await admin
    .from("discovery_runs")
    .update({
      imported_count: imported.length,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.discoveryRunId);

  const status = failures.some((failure) =>
    failure.error.toLowerCase().includes("rate limited"),
  )
    ? 429
    : 200;
  return NextResponse.json(
    {
      importedCount: imported.length,
      imported,
      skippedBelowCcu,
      failures,
    },
    { status },
  );
}
