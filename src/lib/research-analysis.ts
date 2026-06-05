import type { Game, ScoreExplanation } from "./types";
import { analyzeTrendFormula, confidenceFromDataset, getSimilarGamesByTrend } from "./trend-analysis";
import { daysAgo, formatNumber } from "./utils";

export function getGameResearchMetrics(game: Game) {
  const ageDays = daysAgo(game.createdAtRoblox);
  const updatedDaysAgo = daysAgo(game.updatedAtRoblox);
  const activePerMillionVisits =
    game.visits > 0 ? (game.activePlayers / game.visits) * 1_000_000 : 0;
  const visitsPerDay = game.visits / Math.max(ageDays, 1);
  return { ageDays, updatedDaysAgo, activePerMillionVisits, visitsPerDay };
}

export function getWorkingReasons(game: Game, allGames: Game[]) {
  const trend = analyzeTrendFormula(game);
  const metrics = getGameResearchMetrics(game);
  const importedGames = allGames.filter((item) => item.dataSource === "real");
  const similar = getSimilarGamesByTrend(game, importedGames);
  const importedCount = allGames.filter((item) => item.dataSource === "real").length;
  return [
    {
      title: "High demand",
      text: `${formatNumber(game.activePlayers)} active players and ${formatNumber(game.visits)} visits are strong signals based on the current imported dataset.`,
    },
    {
      title: "Player approval",
      text:
        game.upvotes + game.downvotes > 0
          ? `${game.likeRatio}% like ratio from ${formatNumber(game.upvotes)} upvotes and ${formatNumber(game.downvotes)} downvotes.`
          : "Vote counts are not available yet, so approval confidence is low.",
    },
    {
      title: "Avg Session",
      text: game.metrics?.avgSession1d
        ? `Avg Session 1d is ${game.metrics.avgSession1d} minutes, calculated from tracked player activity and visit growth.`
        : "Avg Session is not available yet because BloxSearch needs at least 2 snapshots with visit growth. Once tracking runs for 24h, BloxSearch can estimate session length from player-minutes and visit growth.",
    },
    {
      title: "Tracked growth",
      text:
        game.metrics?.visitGrowth1d || game.metrics?.momentum1d
          ? `Recent tracking shows ${formatNumber(game.metrics.visitGrowth1d)} visit growth in 1d and ${game.metrics.momentum1d ?? "not enough data"}% momentum.`
          : "Visit growth and momentum need multiple snapshots before they become meaningful.",
    },
    {
      title: "Clear trend formula",
      text: `${trend.formulaSummary}. This is detected from title, description, tags, and mechanics.`,
    },
    {
      title: "Recent maintenance",
      text: `Created ${metrics.ageDays} days ago and last updated ${metrics.updatedDaysAgo} days ago, which suggests current developer support.`,
    },
    {
      title: "Simple promise",
      text: "The title communicates the growth mechanic, input hook, goal format, and theme quickly, which may help click-through.",
    },
    {
      title: "Dataset confidence",
      text:
        importedCount < 5
          ? "This analysis is based on public game data and the games currently imported into BloxSearch. Import more similar games to improve confidence."
          : `Based on ${importedCount} imported real games. Similar-game confidence improves as more related games are imported.`,
    },
    ...(similar.length
      ? [
          {
            title: "Similar imported games",
            text: `Competition check used ${similar.length} similar imported/current games: ${similar.map((item) => item.game.title).join(", ")}.`,
          },
        ]
      : []),
  ];
}

export function buildScoreExplanations(game: Game, allGames: Game[]): ScoreExplanation[] {
  const metrics = getGameResearchMetrics(game);
  const importedGames = allGames.filter((item) => item.dataSource === "real");
  const similar = getSimilarGamesByTrend(game, importedGames);
  const similarGames = similar.map((item) => ({
    id: item.game.id,
    title: item.game.title,
    activePlayers: item.game.activePlayers,
  }));
  const snapshotCount = game.snapshotCount ?? 1;
  const similarConfidence = confidenceFromDataset(similar.length);

  return [
    {
      key: "demand",
      label: "Demand",
      score: game.score.demand,
      why: [
        `${formatNumber(game.activePlayers)} active players.`,
        `${formatNumber(game.visits)} lifetime visits.`,
        `${formatNumber(metrics.activePerMillionVisits)} active players per million visits.`,
      ],
      inputs: ["active_players", "visits", "active players per million visits"],
      formula: "Log-scaled active players plus log-scaled visits. Active players carry more weight because they represent current demand.",
      confidence: game.activePlayers > 0 && game.visits > 0 ? "High" : "Low",
    },
    {
      key: "growth",
      label: "Growth",
      score: game.score.growth,
      why: [
        snapshotCount <= 1
          ? "Estimated from current active players and visits because there is not enough historical data yet."
          : `Based on ${snapshotCount} stored snapshots.`,
        `${formatNumber(metrics.visitsPerDay)} estimated visits per day since creation.`,
      ],
      inputs: ["active_players", "visits", "game age", "snapshot count"],
      formula: "Current active players divided by game age plus visits per day, log-scaled to 0-100. Historical trend confidence increases after multiple snapshots.",
      confidence: snapshotCount <= 1 ? "Low" : snapshotCount < 4 ? "Medium" : "High",
    },
    {
      key: "freshness",
      label: "Freshness",
      score: game.score.freshness,
      why: [
        `Game was created ${metrics.ageDays} days ago.`,
        `Last updated ${metrics.updatedDaysAgo} days ago.`,
        game.metrics?.updateFreshnessScore
          ? `Tracked update freshness score: ${game.metrics.updateFreshnessScore}.`
          : "Newer games score higher, but recent updates help.",
      ],
      inputs: ["created_at_roblox", "updated_at_roblox"],
      formula: "Created recently = higher score. Updated recently = bonus. Older than 90 days lowers freshness unless updates are frequent.",
      confidence: "Medium",
    },
    {
      key: "competition",
      label: "Competition",
      score: game.score.competition,
      why: [
        `Competition score is based on similar games currently imported into BloxSearch.`,
        similar.length
          ? `${similar.length} similar games were found using goal format, theme, growth mechanic, and tags.`
          : "No close similar imported games were found yet.",
        similar.length <= 2
          ? "Needs more similar games imported to confirm trend strength."
          : "More similar games improve competition confidence.",
      ],
      inputs: ["detected trend formula", "tags", "similar imported games", "similar game active players"],
      formula: "Few similar games keeps confidence low. Many huge similar games reduce the score. Several small or new games with traction can raise opportunity.",
      confidence: similarConfidence,
      similarGames,
    },
    {
      key: "buildability",
      label: "Buildability",
      score: game.score.buildability,
      why: [
        `Detected mechanics: ${game.mechanics.join(", ") || "none"}.`,
        "Simple mechanics such as obby, clicker, tycoon, simulator, RNG, and collection score higher.",
      ],
      inputs: ["mechanics", "detected niche"],
      formula: "Starts at 58, adds points for simple proven mechanics, subtracts for complex mechanics like advanced combat or large-scale RPG systems.",
      confidence: game.mechanics.length ? "Medium" : "Low",
    },
    {
      key: "monetization",
      label: "Monetization",
      score: game.score.monetization,
      why: [
        `Detected monetization tags: ${game.monetizationTags.join(", ") || "none"}.`,
        "BloxSearch cannot see private revenue, conversion, or ARPPU data.",
      ],
      inputs: ["monetization_tags", "public description clues"],
      formula: "Starts at 42 and adds points for common Roblox monetization patterns such as pets, boosts, VIP, cosmetics, rebirths, spins, crates, premium areas, and skip-stage.",
      confidence: game.monetizationTags.length ? "Medium" : "Low",
    },
  ];
}
