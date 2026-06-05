import { generateIdeas } from "./idea-generator";
import { calculateMetricBundle, type MetricSnapshot } from "./metrics";
import {
  fetchRobloxGameByUniverseId,
  fetchRobloxGameIcon,
  fetchRobloxGameVotes,
  normalizeRobloxGameData,
} from "./roblox";
import { scoreGame } from "./scoring";
import { createSupabaseAdminClient } from "./supabase/admin";
import type { Game, RobloxGameMetrics } from "./types";

type GameRow = {
  id: string;
  roblox_universe_id: string | null;
  roblox_place_id: string | null;
  title: string;
  thumbnail_url: string | null;
  updated_at_roblox: string | null;
};

type TrackingRow = {
  id: string;
  game_id: string;
  roblox_universe_id: string;
  roblox_place_id: string | null;
  tracking_enabled: boolean;
  tracking_interval_minutes: number;
  last_snapshot_at: string | null;
  next_snapshot_at: string | null;
};

function addMinutes(minutes: number, from = new Date()) {
  return new Date(from.getTime() + minutes * 60_000).toISOString();
}

function metricToDb(
  gameId: string,
  metrics: ReturnType<typeof calculateMetricBundle>,
  ranks?: { globalRank?: number | null; genreRank?: number | null },
) {
  return {
    game_id: gameId,
    avg_session_1d: metrics.avgSession1d,
    avg_session_7d: metrics.avgSession7d,
    avg_session_14d: metrics.avgSession14d,
    avg_ccu_1d: metrics.avgCcu1d,
    avg_ccu_7d: metrics.avgCcu7d,
    avg_ccu_14d: metrics.avgCcu14d,
    momentum_1d: metrics.momentum1d,
    momentum_7d: metrics.momentum7d,
    momentum_14d: metrics.momentum14d,
    visit_growth_1d: metrics.visitGrowth1d,
    visit_growth_7d: metrics.visitGrowth7d,
    visit_growth_14d: metrics.visitGrowth14d,
    favorite_growth_1d: metrics.favoriteGrowth1d,
    favorite_growth_7d: metrics.favoriteGrowth7d,
    rating_movement_1d: metrics.ratingMovement1d,
    rating_movement_7d: metrics.ratingMovement7d,
    update_freshness_score: metrics.updateFreshnessScore,
    global_rank: ranks?.globalRank ?? null,
    rank_shift_1d: null,
    rank_shift_7d: null,
    genre_rank: ranks?.genreRank ?? null,
    confidence_level: metrics.confidenceLevel.toLowerCase(),
    calculated_at: new Date().toISOString(),
  };
}

export function mapMetricsRow(row: Record<string, unknown>): RobloxGameMetrics {
  const confidence = String(row.confidence_level ?? "low").toLowerCase();
  return {
    avgSession1d: row.avg_session_1d === null ? null : Number(row.avg_session_1d),
    avgSession7d: row.avg_session_7d === null ? null : Number(row.avg_session_7d),
    avgSession14d: row.avg_session_14d === null ? null : Number(row.avg_session_14d),
    avgCcu1d: row.avg_ccu_1d === null ? null : Number(row.avg_ccu_1d),
    avgCcu7d: row.avg_ccu_7d === null ? null : Number(row.avg_ccu_7d),
    avgCcu14d: row.avg_ccu_14d === null ? null : Number(row.avg_ccu_14d),
    momentum1d: row.momentum_1d === null ? null : Number(row.momentum_1d),
    momentum7d: row.momentum_7d === null ? null : Number(row.momentum_7d),
    momentum14d: row.momentum_14d === null ? null : Number(row.momentum_14d),
    visitGrowth1d: Number(row.visit_growth_1d ?? 0),
    visitGrowth7d: Number(row.visit_growth_7d ?? 0),
    visitGrowth14d: Number(row.visit_growth_14d ?? 0),
    favoriteGrowth1d: Number(row.favorite_growth_1d ?? 0),
    favoriteGrowth7d: Number(row.favorite_growth_7d ?? 0),
    ratingMovement1d:
      row.rating_movement_1d === null ? null : Number(row.rating_movement_1d),
    ratingMovement7d:
      row.rating_movement_7d === null ? null : Number(row.rating_movement_7d),
    updateFreshnessScore: Number(row.update_freshness_score ?? 0),
    globalRank: row.global_rank === null ? null : Number(row.global_rank),
    rankShift1d: row.rank_shift_1d === null ? null : Number(row.rank_shift_1d),
    rankShift7d: row.rank_shift_7d === null ? null : Number(row.rank_shift_7d),
    genreRank: row.genre_rank === null ? null : Number(row.genre_rank),
    confidenceLevel:
      confidence === "high" ? "High" : confidence === "medium" ? "Medium" : "Low",
    calculatedAt: String(row.calculated_at ?? new Date().toISOString()),
  };
}

async function getGameRow(gameId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("games")
    .select("id, roblox_universe_id, roblox_place_id, title, thumbnail_url, updated_at_roblox")
    .eq("id", gameId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.roblox_universe_id)
    throw new Error("Tracking requires a real imported Roblox game.");
  return data as GameRow;
}

export async function enableTrackingForGame(
  gameId: string,
  options: { lastSnapshotAt?: string | null; intervalMinutes?: number } = {},
) {
  const admin = createSupabaseAdminClient();
  const game = await getGameRow(gameId);
  const now = new Date().toISOString();
  const interval = options.intervalMinutes ?? 15;
  const { data, error } = await admin
    .from("tracked_games")
    .upsert(
      {
        game_id: game.id,
        roblox_universe_id: game.roblox_universe_id,
        roblox_place_id: game.roblox_place_id,
        tracking_enabled: true,
        tracking_interval_minutes: interval,
        last_snapshot_at: options.lastSnapshotAt ?? undefined,
        next_snapshot_at: addMinutes(interval),
        updated_at: now,
      },
      { onConflict: "roblox_universe_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as TrackingRow;
}

export async function disableTrackingForGame(gameId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tracked_games")
    .update({ tracking_enabled: false, updated_at: new Date().toISOString() })
    .eq("game_id", gameId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function calculateMetricsForGame(gameId: string) {
  const admin = createSupabaseAdminClient();
  const { data: gameRow, error: gameError } = await admin
    .from("games")
    .select("*, game_scores(*)")
    .eq("id", gameId)
    .maybeSingle();
  if (gameError) throw gameError;
  if (!gameRow) throw new Error("Game not found.");

  const { data: snapshots, error } = await admin
    .from("roblox_game_snapshots")
    .select("active_players, visits, favorites, like_ratio, captured_at")
    .eq("game_id", gameId)
    .order("captured_at", { ascending: true });
  if (error) throw error;

  const metricSnapshots = (snapshots ?? []).map((snapshot) => ({
    active_players: Number(snapshot.active_players ?? 0),
    visits: Number(snapshot.visits ?? 0),
    favorites: Number(snapshot.favorites ?? 0),
    like_ratio: Number(snapshot.like_ratio ?? 0),
    captured_at: String(snapshot.captured_at),
  })) satisfies MetricSnapshot[];

  const metrics = calculateMetricBundle(metricSnapshots, {
    updatedAtRoblox:
      String(gameRow.updated_at_roblox ?? new Date().toISOString()),
  });

  const { data: rankRows } = await admin
    .from("games")
    .select("id, genre, active_players")
    .order("active_players", { ascending: false });
  const globalRank =
    (rankRows ?? []).findIndex((row) => row.id === gameId) + 1 || null;
  const genreRows = (rankRows ?? []).filter(
    (row) => row.genre && row.genre === gameRow.genre,
  );
  const genreRank =
    genreRows.findIndex((row) => row.id === gameId) + 1 || null;

  const { data: metricRow, error: metricError } = await admin
    .from("roblox_game_metrics")
    .upsert(metricToDb(gameId, metrics, { globalRank, genreRank }), {
      onConflict: "game_id",
    })
    .select("*")
    .single();
  if (metricError) throw metricError;

  const { mapDatabaseGame } = await import("./data");
  const mapped = mapDatabaseGame({
    ...gameRow,
    roblox_game_metrics: metricRow,
    roblox_game_snapshots: (snapshots ?? []).map((snapshot) => ({
      id: String(snapshot.captured_at),
      captured_at: String(snapshot.captured_at),
    })),
  });
  const score = scoreGame(mapped as Omit<Game, "score" | "ideas">);
  await admin.from("game_scores").upsert(
    {
      game_id: gameId,
      opportunity_score: score.opportunity,
      demand_score: score.demand,
      growth_score: score.growth,
      competition_score: score.competition,
      freshness_score: score.freshness,
      buildability_score: score.buildability,
      monetization_score: score.monetization,
      outlier_reason: score.outlierReason,
      risks: score.risks,
      generated_ideas: generateIdeas(mapped),
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "game_id" },
  );

  return { metrics: mapMetricsRow(metricRow), snapshotCount: metricSnapshots.length };
}

export async function collectSnapshotForGame(gameId: string) {
  const admin = createSupabaseAdminClient();
  const game = await getGameRow(gameId);
  try {
    const [raw, votes] = await Promise.all([
      fetchRobloxGameByUniverseId(game.roblox_universe_id!),
      fetchRobloxGameVotes(game.roblox_universe_id!),
    ]);
    const icon = game.thumbnail_url
      ? game.thumbnail_url
      : await fetchRobloxGameIcon(game.roblox_universe_id!);
    const normalized = normalizeRobloxGameData(
      { ...raw, rootPlaceId: raw.rootPlaceId ?? game.roblox_place_id },
      icon,
      votes,
    );

    const now = new Date().toISOString();
    const { error: updateError } = await admin
      .from("games")
      .update({
        title: normalized.title,
        description: normalized.description,
        thumbnail_url: normalized.thumbnailUrl,
        active_players: normalized.activePlayers,
        visits: normalized.visits,
        favorites: normalized.favorites,
        upvotes: normalized.upvotes,
        downvotes: normalized.downvotes,
        like_ratio: normalized.likeRatio,
        max_players: normalized.maxPlayers,
        updated_at_roblox: normalized.updatedAtRoblox,
        genre: normalized.genre,
        subgenre: normalized.subgenre,
        is_real_data: true,
        data_source: "public_tracking",
        last_fetched_at: now,
        raw_data: { ...raw, votes },
      })
      .eq("id", game.id);
    if (updateError) throw updateError;

    const { error: snapshotError } = await admin
      .from("roblox_game_snapshots")
      .insert({
        game_id: game.id,
        roblox_universe_id: normalized.robloxUniverseId,
        roblox_place_id: normalized.robloxPlaceId || game.roblox_place_id,
        title: normalized.title,
        active_players: normalized.activePlayers,
        visits: normalized.visits,
        favorites: normalized.favorites,
        upvotes: normalized.upvotes,
        downvotes: normalized.downvotes,
        like_ratio: normalized.likeRatio,
        genre: normalized.genre,
        subgenre: normalized.subgenre,
        created_at_roblox: normalized.createdAtRoblox,
        updated_at_roblox: normalized.updatedAtRoblox,
        captured_at: now,
      });
    if (snapshotError) throw snapshotError;

    const { data: tracked } = await admin
      .from("tracked_games")
      .select("tracking_interval_minutes")
      .eq("game_id", game.id)
      .maybeSingle();
    const interval = Number(tracked?.tracking_interval_minutes ?? 15);
    await admin
      .from("tracked_games")
      .update({
        last_snapshot_at: now,
        next_snapshot_at: addMinutes(interval),
        updated_at: now,
      })
      .eq("game_id", game.id);

    const metrics = await calculateMetricsForGame(game.id);
    return { game: normalized, ...metrics };
  } catch (error) {
    console.error("[tracking] Snapshot collection failed", { gameId, error });
    throw error;
  }
}

export async function collectSnapshotsForDueGames(limit = 5) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("tracked_games")
    .select("*")
    .eq("tracking_enabled", true)
    .or(`next_snapshot_at.is.null,next_snapshot_at.lte.${now}`)
    .order("next_snapshot_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  const results = [];
  for (const tracked of (data ?? []) as TrackingRow[]) {
    try {
      results.push({
        gameId: tracked.game_id,
        ok: true,
        result: await collectSnapshotForGame(tracked.game_id),
      });
    } catch (error) {
      results.push({
        gameId: tracked.game_id,
        ok: false,
        error: error instanceof Error ? error.message : "Snapshot failed",
      });
    }
  }
  return results;
}

export async function forceCollectSnapshotsForEnabledGames() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tracked_games")
    .select("game_id, tracking_enabled");
  if (error) throw error;

  const allRows = data ?? [];
  const rows = allRows.filter((row) => row.tracking_enabled);
  const failures: Array<{ gameId: string; error: string }> = [];
  let snapshotsCollected = 0;

  for (const row of rows) {
    try {
      await collectSnapshotForGame(row.game_id);
      snapshotsCollected += 1;
    } catch (error) {
      failures.push({
        gameId: row.game_id,
        error: error instanceof Error ? error.message : "Snapshot failed",
      });
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("rate limited")
      ) {
        break;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return {
    gamesChecked: allRows.length,
    snapshotsCollected,
    failures,
    skippedGames: allRows.length - rows.length,
  };
}

export async function calculateMetricsForAllTrackedGames() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("tracked_games")
    .select("game_id")
    .eq("tracking_enabled", true);
  if (error) throw error;
  const results = [];
  for (const row of data ?? []) {
    try {
      results.push({
        gameId: row.game_id,
        ok: true,
        result: await calculateMetricsForGame(row.game_id),
      });
    } catch (error) {
      results.push({
        gameId: row.game_id,
        ok: false,
        error: error instanceof Error ? error.message : "Metrics failed",
      });
    }
  }
  return results;
}

export async function getTrackingAdminSummary() {
  const admin = createSupabaseAdminClient();
  const [games, tracked, snapshots, metrics] = await Promise.all([
    admin
      .from("games")
      .select("id, title, roblox_universe_id, roblox_place_id, is_real_data, data_source")
      .not("roblox_universe_id", "is", null),
    admin.from("tracked_games").select("*"),
    admin
      .from("roblox_game_snapshots")
      .select("id, game_id, captured_at")
      .order("captured_at", { ascending: false }),
    admin.from("roblox_game_metrics").select("game_id, avg_session_1d, avg_ccu_7d"),
  ]);
  if (games.error) throw games.error;
  const trackedRows = (tracked.data ?? []) as TrackingRow[];
  const snapshotRows = snapshots.data ?? [];
  return {
    games: (games.data ?? []).map((game) => {
      const tracking = trackedRows.find((row) => row.game_id === game.id);
      const gameSnapshots = snapshotRows.filter((row) => row.game_id === game.id);
      return {
        id: game.id,
        title: game.title,
        universeId: game.roblox_universe_id,
        placeId: game.roblox_place_id,
        trackingEnabled: Boolean(tracking?.tracking_enabled),
        lastSnapshotAt: tracking?.last_snapshot_at ?? null,
        nextSnapshotAt: tracking?.next_snapshot_at ?? null,
        snapshotCount: gameSnapshots.length,
      };
    }),
    stats: {
      trackedGamesCount: trackedRows.filter((row) => row.tracking_enabled).length,
      snapshotsCount: snapshotRows.length,
      gamesWith1dMetrics: (metrics.data ?? []).filter(
        (row) => row.avg_session_1d !== null,
      ).length,
      gamesWith7dMetrics: (metrics.data ?? []).filter(
        (row) => row.avg_ccu_7d !== null,
      ).length,
      latestSnapshotAt: snapshotRows[0]?.captured_at ?? null,
    },
  };
}
