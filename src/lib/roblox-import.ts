import { generateIdeas } from "./idea-generator";
import {
  fetchRobloxGameByUniverseId,
  fetchRobloxGameIcon,
  fetchRobloxGameVotes,
  normalizeRobloxGameData,
} from "./roblox";
import { scoreGame } from "./scoring";
import { createSupabaseAdminClient } from "./supabase/admin";
import { analyzeTrendFormula } from "./trend-analysis";
import { calculateMetricsForGame, enableTrackingForGame } from "./tracking";
import { upsertTrendClusters } from "./trend-clustering";
import type { Game } from "./types";

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

export async function importRobloxUniverse(input: {
  universeId: string;
  placeId?: string | null;
  sourceKeyword?: string | null;
  discoverySource?: string | null;
  discoveryRank?: number | null;
  enableTracking?: boolean;
}) {
  const admin = createSupabaseAdminClient();
  const [raw, icon, votes] = await Promise.all([
    fetchRobloxGameByUniverseId(input.universeId),
    fetchRobloxGameIcon(input.universeId),
    fetchRobloxGameVotes(input.universeId),
  ]);
  const game = normalizeRobloxGameData(
    { ...raw, rootPlaceId: raw.rootPlaceId ?? input.placeId },
    icon,
    votes,
  );
  const trend = analyzeTrendFormula(game);
  game.score = scoreGame(game);
  game.ideas = generateIdeas(game);
  const nowIso = new Date().toISOString();

  const { data: savedGame, error: gameError } = await admin
    .from("games")
    .upsert(
      {
        roblox_universe_id: game.robloxUniverseId,
        roblox_place_id: game.robloxPlaceId || input.placeId,
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
        data_source: input.discoverySource ?? "manual_import",
        discovery_source: input.discoverySource,
        discovery_rank: input.discoveryRank,
        discovered_at: input.discoverySource ? nowIso : null,
        source_keyword: input.sourceKeyword,
        is_archived: false,
        raw_data: { ...raw, votes },
      },
      { onConflict: "roblox_universe_id" },
    )
    .select("*")
    .single();
  if (gameError || !savedGame) throw gameError ?? new Error("Game was not saved.");

  await admin.from("keyword_signals").delete().eq("game_id", savedGame.id);
  if (trend.detectedKeywords.length) {
    await admin.from("keyword_signals").insert(
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
  }

  await admin.from("game_snapshots").insert(snapshotRow(savedGame.id, game, nowIso));
  await admin.from("roblox_game_snapshots").insert({
    ...snapshotRow(savedGame.id, game, nowIso),
    roblox_universe_id: game.robloxUniverseId,
    roblox_place_id: game.robloxPlaceId || input.placeId,
    title: game.title,
    genre: game.genre,
    subgenre: game.subgenre,
    created_at_roblox: game.createdAtRoblox,
    updated_at_roblox: game.updatedAtRoblox,
  });

  await admin.from("game_scores").upsert(
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

  if (input.enableTracking !== false) {
    await enableTrackingForGame(savedGame.id, { lastSnapshotAt: nowIso });
  }
  await calculateMetricsForGame(savedGame.id).catch(() => null);
  await upsertTrendClusters().catch(() => null);
  return { id: savedGame.id, title: game.title, universeId: game.robloxUniverseId, game };
}
