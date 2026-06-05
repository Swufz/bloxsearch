import { analyzeTrendFormula } from "./trend-analysis";
import { createSupabaseAdminClient } from "./supabase/admin";
import type { Game, TrendAnalysis } from "./types";

export function extractTrendFormula(game: Game): TrendAnalysis {
  return analyzeTrendFormula(game);
}

function wordSet(text: string) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9+]+/)
      .filter((word) => word.length > 2),
  );
}

export function calculateSimilarity(gameA: Game, gameB: Game) {
  const trendA = extractTrendFormula(gameA);
  const trendB = extractTrendFormula(gameB);
  let score = 0;
  const matchedKeywords: string[] = [];
  if (trendA.growthMechanic === trendB.growthMechanic) {
    score += 30;
    matchedKeywords.push(trendA.growthMechanic);
  }
  if (trendA.goalFormat === trendB.goalFormat) {
    score += 25;
    matchedKeywords.push(trendA.goalFormat);
  }
  if (trendA.theme === trendB.theme) {
    score += 20;
    matchedKeywords.push(trendA.theme);
  }
  if (trendA.inputHook === trendB.inputHook) {
    score += 10;
    matchedKeywords.push(trendA.inputHook);
  }
  if (gameA.genre && gameA.genre === gameB.genre) score += 5;
  if (gameA.subgenre && gameA.subgenre === gameB.subgenre) score += 5;
  const wordsA = wordSet(gameA.title);
  const overlap = [...wordSet(gameB.title)].filter((word) => wordsA.has(word));
  score += Math.min(overlap.length * 5, 15);
  matchedKeywords.push(...overlap);
  return { score: Math.min(score, 100), matchedKeywords };
}

export function clusterGamesByTrend(games: Game[]) {
  const clusters = new Map<string, { trend: TrendAnalysis; games: Game[] }>();
  for (const game of games) {
    const trend = extractTrendFormula(game);
    const key = [
      trend.growthMechanic,
      trend.goalFormat,
      trend.theme,
      trend.inputHook,
    ].join("|");
    const cluster = clusters.get(key) ?? { trend, games: [] };
    cluster.games.push(game);
    clusters.set(key, cluster);
  }
  return [...clusters.values()];
}

function confidence(count: number) {
  if (count >= 5) return "high";
  if (count >= 2) return "medium";
  return "low";
}

export async function upsertTrendClusters() {
  const { getImportedGames } = await import("./data");
  const admin = createSupabaseAdminClient();
  const games = (await getImportedGames()).filter(
    (game) => game.dataSource === "real" && !game.archivedAt,
  );
  const clusters = clusterGamesByTrend(games);
  const results = [];

  for (const cluster of clusters) {
    const totalActive = cluster.games.reduce(
      (sum, game) => sum + game.activePlayers,
      0,
    );
    const totalVisits = cluster.games.reduce((sum, game) => sum + game.visits, 0);
    const avgLikeRatio = cluster.games.length
      ? cluster.games.reduce((sum, game) => sum + game.likeRatio, 0) /
        cluster.games.length
      : 0;
    const avgSessionRows = cluster.games
      .map((game) => game.metrics?.avgSession1d ?? game.metrics?.avgSession7d)
      .filter((value): value is number => typeof value === "number");
    const avgCcuRows = cluster.games
      .map((game) => game.metrics?.avgCcu1d ?? game.metrics?.avgCcu7d)
      .filter((value): value is number => typeof value === "number");
    const momentumRows = cluster.games
      .map((game) => game.metrics?.momentum1d ?? game.metrics?.momentum7d)
      .filter((value): value is number => typeof value === "number");
    const primaryKeyword =
      cluster.trend.detectedKeywords[0]?.keyword ?? cluster.trend.growthMechanic;
    const { data: saved, error } = await admin
      .from("trend_clusters")
      .upsert(
        {
          name: `${cluster.trend.growthMechanic} / ${cluster.trend.goalFormat}`,
          formula_summary: cluster.trend.formulaSummary,
          primary_keyword: primaryKeyword,
          growth_mechanic: cluster.trend.growthMechanic,
          goal_format: cluster.trend.goalFormat,
          theme: cluster.trend.theme,
          input_hook: cluster.trend.inputHook,
          games_count: cluster.games.length,
          total_active_players: totalActive,
          total_visits: totalVisits,
          avg_like_ratio: avgLikeRatio,
          avg_session: avgSessionRows.length
            ? avgSessionRows.reduce((sum, value) => sum + value, 0) /
              avgSessionRows.length
            : null,
          avg_ccu: avgCcuRows.length
            ? avgCcuRows.reduce((sum, value) => sum + value, 0) / avgCcuRows.length
            : null,
          momentum: momentumRows.length
            ? momentumRows.reduce((sum, value) => sum + value, 0) /
              momentumRows.length
            : null,
          confidence_level: confidence(cluster.games.length),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "formula_summary" },
      )
      .select("id")
      .single();
    if (error || !saved) throw error ?? new Error("Cluster was not saved.");

    for (const game of cluster.games) {
      const similarity = calculateSimilarity(cluster.games[0], game);
      await admin.from("trend_cluster_games").upsert(
        {
          cluster_id: saved.id,
          game_id: game.databaseId ?? game.id,
          similarity_score: similarity.score,
          matched_keywords: similarity.matchedKeywords,
        },
        { onConflict: "cluster_id,game_id" },
      );
    }
    results.push({ clusterId: saved.id, games: cluster.games.length });
  }
  return results;
}
