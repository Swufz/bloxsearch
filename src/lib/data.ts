import { mockGames } from "./mock-data";
import { generateIdeas } from "./idea-generator";
import { scoreGame } from "./scoring";
import { mapMetricsRow } from "./tracking";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "./supabase/server";
import type { CollectionLog, Game, SavedIdea } from "./types";

export const getGames = (): Game[] =>
  [...mockGames]
    .map((game) => ({ ...game, dataSource: "mock" as const }))
    .sort((a, b) => b.score.opportunity - a.score.opportunity);
export const getGame = (id: string): Game | undefined =>
  getGames().find((game) => game.id === id || game.robloxUniverseId === id);

type DatabaseGameRow = {
  id: string;
  roblox_universe_id: string | null;
  roblox_place_id: string | null;
  title: string;
  description: string | null;
  creator_name: string | null;
  creator_id: string | null;
  creator_type: string | null;
  thumbnail_url: string | null;
  game_url: string | null;
  active_players: number | null;
  visits: number | null;
  favorites: number | null;
  upvotes: number | null;
  downvotes: number | null;
  like_ratio: number | null;
  max_players: number | null;
  created_at_roblox: string | null;
  updated_at_roblox: string | null;
  first_seen_at: string | null;
  last_fetched_at: string | null;
  tags: string[] | null;
  niche: string | null;
  source_keyword?: string | null;
  discovery_source?: string | null;
  discovery_rank?: number | null;
  discovered_at?: string | null;
  is_archived?: boolean | null;
  archived_at?: string | null;
  archive_reason?: string | null;
  low_ccu_streak?: number | null;
  genre?: string | null;
  subgenre?: string | null;
  mechanics: string[] | null;
  monetization_tags: string[] | null;
  game_scores?:
    | {
        opportunity_score: number | null;
        demand_score: number | null;
        growth_score: number | null;
        competition_score: number | null;
        freshness_score: number | null;
        buildability_score: number | null;
        monetization_score: number | null;
        outlier_reason: string | null;
        risks: string[] | null;
        generated_ideas: unknown;
      }
    | Array<{
        opportunity_score: number | null;
        demand_score: number | null;
        growth_score: number | null;
        competition_score: number | null;
        freshness_score: number | null;
        buildability_score: number | null;
        monetization_score: number | null;
        outlier_reason: string | null;
        risks: string[] | null;
        generated_ideas: unknown;
      }>
    | null;
  roblox_game_metrics?: Record<string, unknown> | Record<string, unknown>[] | null;
  roblox_game_snapshots?: Array<{ id: string; captured_at?: string | null }> | null;
  tracked_games?:
    | { tracking_enabled: boolean | null }
    | Array<{ tracking_enabled: boolean | null }>
    | null;
};

export function mapDatabaseGame(row: DatabaseGameRow): Game {
  const scoreRow = Array.isArray(row.game_scores)
    ? row.game_scores[0]
    : row.game_scores;
  const base = {
    id: row.id,
    databaseId: row.id,
    dataSource: "real" as const,
    sourceKeyword: row.source_keyword ?? null,
    discoverySource: row.discovery_source ?? null,
    discoveryRank: row.discovery_rank ?? null,
    discoveredAt: row.discovered_at ?? null,
    isArchived: Boolean(row.is_archived),
    archivedAt: row.archived_at ?? null,
    archiveReason: row.archive_reason ?? null,
    lowCcuStreak: Number(row.low_ccu_streak ?? 0),
    trackingEnabled: Array.isArray(row.tracked_games)
      ? Boolean(row.tracked_games[0]?.tracking_enabled)
      : Boolean(row.tracked_games?.tracking_enabled),
    robloxUniverseId: row.roblox_universe_id ?? "",
    robloxPlaceId: row.roblox_place_id ?? "",
    title: row.title,
    description: row.description ?? "",
    creatorName: row.creator_name ?? "Unknown creator",
    creatorId: row.creator_id ?? "",
    creatorType: row.creator_type ?? "",
    thumbnailUrl:
      row.thumbnail_url ??
      `https://placehold.co/720x405/111827/38BDF8?text=${encodeURIComponent(row.title)}`,
    gameUrl:
      row.game_url ??
      (row.roblox_place_id
        ? `https://www.roblox.com/games/${row.roblox_place_id}`
        : "https://www.roblox.com/discover"),
    activePlayers: row.active_players ?? 0,
    visits: Number(row.visits ?? 0),
    favorites: Number(row.favorites ?? 0),
    upvotes: Number(row.upvotes ?? 0),
    downvotes: Number(row.downvotes ?? 0),
    likeRatio: Number(row.like_ratio ?? 0),
    maxPlayers: row.max_players ?? 0,
    createdAtRoblox: row.created_at_roblox ?? new Date().toISOString(),
    updatedAtRoblox:
      row.updated_at_roblox ??
      row.created_at_roblox ??
      new Date().toISOString(),
    firstSeenAt: row.first_seen_at ?? new Date().toISOString(),
    lastFetchedAt: row.last_fetched_at ?? new Date().toISOString(),
    tags: row.tags?.length ? row.tags : ["Roblox"],
    niche: row.niche ?? "Roblox",
    genre: row.genre ?? row.niche ?? "Roblox",
    subgenre: row.subgenre ?? null,
    mechanics: row.mechanics?.length ? row.mechanics : ["progression"],
    monetizationTags: row.monetization_tags?.length
      ? row.monetization_tags
      : ["cosmetics"],
    snapshotCount: row.roblox_game_snapshots?.length ?? 0,
  };
  const metricsRow = Array.isArray(row.roblox_game_metrics)
    ? row.roblox_game_metrics[0]
    : row.roblox_game_metrics;
  const snapshots = row.roblox_game_snapshots ?? [];
  const sortedSnapshots = [...snapshots].sort(
    (a, b) =>
      +new Date(String(a.captured_at ?? 0)) -
      +new Date(String(b.captured_at ?? 0)),
  );
  const fallbackScore = scoreGame(base);
  const ideas = Array.isArray(scoreRow?.generated_ideas)
    ? scoreRow.generated_ideas
    : generateIdeas(base);
  return {
    ...base,
    score: {
      opportunity: scoreRow?.opportunity_score ?? fallbackScore.opportunity,
      demand: scoreRow?.demand_score ?? fallbackScore.demand,
      growth: scoreRow?.growth_score ?? fallbackScore.growth,
      competition: scoreRow?.competition_score ?? fallbackScore.competition,
      freshness: scoreRow?.freshness_score ?? fallbackScore.freshness,
      buildability: scoreRow?.buildability_score ?? fallbackScore.buildability,
      monetization: scoreRow?.monetization_score ?? fallbackScore.monetization,
      outlierReason: scoreRow?.outlier_reason ?? fallbackScore.outlierReason,
      risks: scoreRow?.risks ?? fallbackScore.risks,
      growthEstimated: true,
    },
    ideas: ideas as Game["ideas"],
    metrics: metricsRow ? mapMetricsRow(metricsRow) : null,
    trackingSummary: {
      count: snapshots.length,
      firstSnapshotAt: sortedSnapshots[0]?.captured_at ?? null,
      latestSnapshotAt:
        sortedSnapshots[sortedSnapshots.length - 1]?.captured_at ?? null,
    },
  };
}

export async function getImportedGames(): Promise<Game[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("games")
    .select(
      "*, game_scores(opportunity_score, demand_score, growth_score, competition_score, freshness_score, buildability_score, monetization_score, outlier_reason, risks, generated_ideas), roblox_game_metrics(*), roblox_game_snapshots(id, captured_at), tracked_games(tracking_enabled)",
    )
    .eq("is_archived", false)
    .order("last_fetched_at", { ascending: false });
  if (error) {
    console.error("[games] Failed to fetch imported games", { error });
    return [];
  }
  return (data ?? []).map((row) =>
    mapDatabaseGame(row as unknown as DatabaseGameRow),
  );
}

export async function getDisplayGames(): Promise<Game[]> {
  const importedGames = await getImportedGames();
  const showMock =
    process.env.SHOW_MOCK_DATA === "true" && process.env.NODE_ENV === "development";
  if (!showMock) return importedGames;
  const importedUniverseIds = new Set(
    importedGames.map((game) => game.robloxUniverseId).filter(Boolean),
  );
  return [
    ...importedGames,
    ...getGames().filter(
      (game) => !importedUniverseIds.has(game.robloxUniverseId),
    ),
  ].sort((a, b) => b.score.opportunity - a.score.opportunity);
}

export async function getDisplayGame(id: string): Promise<Game | undefined> {
  const showMock =
    process.env.SHOW_MOCK_DATA === "true" && process.env.NODE_ENV === "development";
  const mock = showMock ? getGame(id) : undefined;
  if (mock) return mock;
  if (!isSupabaseConfigured()) return undefined;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("games")
    .select(
      "*, game_scores(opportunity_score, demand_score, growth_score, competition_score, freshness_score, buildability_score, monetization_score, outlier_reason, risks, generated_ideas), roblox_game_metrics(*), roblox_game_snapshots(id, captured_at), tracked_games(tracking_enabled)",
    )
    .or(`id.eq.${id},roblox_universe_id.eq.${id},roblox_place_id.eq.${id}`)
    .eq("is_archived", false)
    .maybeSingle();
  return data ? mapDatabaseGame(data as unknown as DatabaseGameRow) : undefined;
}

export const getSavedIdeas = (): SavedIdea[] =>
  getGames()
    .slice(0, 4)
    .map((game, index) => ({
      ...game.ideas[0],
      id: `idea-${index + 1}`,
      gameId: game.id,
      inspiredBy: game.title,
      niche: game.niche,
      opportunityScore: game.score.opportunity,
      notes:
        index === 0
          ? "Explore a one-week prototype focused on the core loop."
          : "",
      createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    }));

export const getCollectionLogs = (): CollectionLog[] => [
  {
    id: "log-1",
    action: "score_games",
    status: "success",
    message: "Recalculated opportunity scores for 25 games.",
    createdAt: new Date(Date.now() - 22 * 60_000).toISOString(),
  },
  {
    id: "log-2",
    action: "seed_mock_data",
    status: "success",
    message: "Mock dataset is ready.",
    createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: "log-3",
    action: "fetch_game",
    status: "info",
    message: "Mock mode returned normalized game data.",
    createdAt: new Date(Date.now() - 5 * 3_600_000).toISOString(),
  },
];
