import { getImportedGames } from "./data";
import { searchRobloxGamesByKeyword } from "./roblox";
import { createSupabaseAdminClient } from "./supabase/admin";
import { analyzeTrendFormula } from "./trend-analysis";
import type { ConfidenceLevel, Game, RobloxSearchResult } from "./types";

export type TopIdea = {
  id?: string;
  rank: number;
  title: string;
  description: string;
  howPlayersPlay: string;
  trendFormula: string;
  dataSignals: string[];
  whyItCouldWork: string;
  differentFromExisting: string;
  potentialScore: number;
  potentialReason: string;
  originalityRisk: "Low" | "Medium" | "High";
  originalityReason: string;
  similarGames: Array<{
    title: string;
    universeId: string;
    activePlayers: number;
    visits: number;
  }>;
  difficulty: "Easy" | "Medium" | "Hard";
  monetizationOptions: string[];
  risks: string[];
  confidenceLevel: ConfidenceLevel;
  createdAt: string;
};

export type DatasetSignals = {
  games: Game[];
  clusters: Array<Record<string, unknown>>;
  snapshotsCount: number;
  trackedGamesCount: number;
  gamesWithAvgSession: number;
  gamesWith24hTracking: number;
};

type Candidate = {
  title: string;
  description: string;
  howPlayersPlay: string;
  growthMechanic: string;
  goalFormat: string;
  theme: string;
  inputHook: string;
  sourceGames: Game[];
  cluster?: Record<string, unknown>;
  differentFromExisting: string;
  difficulty: TopIdea["difficulty"];
  monetizationOptions: string[];
  risks: string[];
};

const growthMechanics = [
  "+1 speed",
  "+1 jump",
  "+1 strength",
  "grow",
  "collect",
  "rng",
  "tycoon",
  "simulator",
  "rebirth",
];
const goalFormats = [
  "escape",
  "obby",
  "race",
  "survive",
  "climb",
  "tower",
  "defend",
  "steal",
  "battle",
];
const themes = [
  "candy",
  "anime",
  "brainrot",
  "garden",
  "pets",
  "school",
  "prison",
  "space",
  "car",
  "fish",
  "ninja",
  "hospital",
];
const inputHooks = [
  "keyboard",
  "typing",
  "click",
  "controller",
  "piano",
  "rhythm",
  "button mash",
];

function average(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function clamp(value: number) {
  return Math.max(1, Math.min(100, Math.round(value)));
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pickDifferent<T>(items: T[], avoid: T | null | undefined, offset = 0) {
  return items.find((item, index) => item !== avoid && index >= offset) ?? items[0];
}

export async function getDatasetSignals(): Promise<DatasetSignals> {
  const admin = createSupabaseAdminClient();
  const games = (await getImportedGames()).filter(
    (game) => game.dataSource === "real" && !game.isArchived,
  );
  const [{ data: clusters }, { count: snapshotsCount }, { data: tracked }] =
    await Promise.all([
      admin
        .from("trend_clusters")
        .select("*")
        .order("total_active_players", { ascending: false })
        .limit(10),
      admin
        .from("roblox_game_snapshots")
        .select("id", { count: "exact", head: true }),
      admin.from("tracked_games").select("game_id, tracking_enabled"),
    ]);

  return {
    games,
    clusters: clusters ?? [],
    snapshotsCount: snapshotsCount ?? 0,
    trackedGamesCount: (tracked ?? []).filter((row) => row.tracking_enabled)
      .length,
    gamesWithAvgSession: games.filter(
      (game) => game.metrics?.avgSession1d ?? game.metrics?.avgSession7d,
    ).length,
    gamesWith24hTracking: games.filter((game) => {
      const first = game.trackingSummary?.firstSnapshotAt;
      const latest = game.trackingSummary?.latestSnapshotAt;
      if (!first || !latest) return false;
      return +new Date(latest) - +new Date(first) >= 86_400_000;
    }).length,
  };
}

function candidateFromCluster(
  cluster: Record<string, unknown>,
  games: Game[],
  index: number,
): Candidate {
  const growthMechanic = String(
    cluster.growth_mechanic ??
      pickDifferent(growthMechanics, null, index % growthMechanics.length),
  );
  const goalFormat = String(
    cluster.goal_format ?? pickDifferent(goalFormats, null, index % goalFormats.length),
  );
  const theme = pickDifferent(
    themes,
    String(cluster.theme ?? ""),
    index % Math.max(themes.length - 1, 1),
  );
  const inputHook = pickDifferent(inputHooks, String(cluster.input_hook ?? ""));
  const relatedGames = games
    .filter((game) => {
      const trend = analyzeTrendFormula(game);
      return (
        trend.growthMechanic === growthMechanic ||
        trend.goalFormat === goalFormat ||
        trend.theme === cluster.theme
      );
    })
    .slice(0, 6);
  const title = `${titleCase(growthMechanic)} ${titleCase(inputHook)} ${titleCase(goalFormat)} | ${titleCase(theme)}`;
  return {
    title,
    description: `A ${theme} Roblox experience that combines ${growthMechanic}, ${inputHook}, and ${goalFormat} into a fresh progression loop.`,
    howPlayersPlay: `Players use ${inputHook} actions to build power, clear ${goalFormat} challenges, unlock new ${theme} zones, and compete on timed leaderboards.`,
    growthMechanic,
    goalFormat,
    theme,
    inputHook,
    sourceGames: relatedGames.length ? relatedGames : games.slice(0, 6),
    cluster,
    differentFromExisting: `Changes the theme to ${theme}, changes the input hook to ${inputHook}, and restructures progression around short challenge runs rather than copying an existing title.`,
    difficulty:
      goalFormat === "battle" || goalFormat === "defend" ? "Hard" : "Medium",
    monetizationOptions: ["cosmetics", "boosts", "vip areas"],
    risks: [
      "Needs a distinct map, economy, UI, and name before prototyping.",
      "Retention depends on update cadence and fair progression pacing.",
    ],
  };
}

function fallbackCandidates(games: Game[]) {
  const sorted = [...games].sort((a, b) => b.activePlayers - a.activePlayers);
  return sorted.slice(0, 6).map((game, index) => {
    const trend = analyzeTrendFormula(game);
    const theme = pickDifferent(themes, trend.theme, index);
    const inputHook = pickDifferent(inputHooks, trend.inputHook, index);
    const goalFormat = pickDifferent(goalFormats, trend.goalFormat, index);
    const growthMechanic =
      trend.growthMechanic === "progression"
        ? pickDifferent(growthMechanics, null, index)
        : trend.growthMechanic;
    return {
      title: `${titleCase(growthMechanic)} ${titleCase(inputHook)} ${titleCase(goalFormat)} | ${titleCase(theme)}`,
      description: `A dataset-backed remix of proven demand signals using ${growthMechanic}, ${goalFormat}, ${theme}, and ${inputHook}.`,
      howPlayersPlay: `Players complete short ${goalFormat} runs, upgrade through ${growthMechanic}, and unlock new ${theme} challenges built around ${inputHook}.`,
      growthMechanic,
      goalFormat,
      theme,
      inputHook,
      sourceGames: [game],
      differentFromExisting: `Changes at least the theme and input hook from ${game.title}, and should use a new map, economy, UI, and naming direction.`,
      difficulty: goalFormat === "battle" || goalFormat === "defend" ? "Hard" : "Easy",
      monetizationOptions: ["cosmetics", "boosts", "private servers"],
      risks: ["Dataset is still small; validate with a focused prototype."],
    } satisfies Candidate;
  });
}

export function buildIdeaSearchQueries(candidate: Candidate) {
  return [
    `${candidate.growthMechanic} ${candidate.inputHook} ${candidate.goalFormat}`,
    `${candidate.inputHook} ${candidate.goalFormat}`,
    `${candidate.theme} ${candidate.goalFormat} obby`,
    `${candidate.growthMechanic} ${candidate.goalFormat}`,
    `${candidate.theme} ${candidate.growthMechanic}`,
  ].filter((query, index, all) => query.trim() && all.indexOf(query) === index);
}

function overlapScore(candidate: Candidate, result: RobloxSearchResult) {
  const title = result.title.toLowerCase();
  let score = 0;
  for (const token of [
    candidate.growthMechanic,
    candidate.goalFormat,
    candidate.theme,
    candidate.inputHook,
  ]) {
    if (title.includes(token.toLowerCase())) score += 20;
  }
  return score + Math.min(result.activePlayers / 1000, 20);
}

export async function checkIdeaOriginality(candidate: Candidate) {
  const queries = buildIdeaSearchQueries(candidate).slice(0, 5);
  const similarMap = new Map<string, RobloxSearchResult>();
  for (const query of queries) {
    try {
      const results = await searchRobloxGamesByKeyword(query, 10);
      for (const result of results) similarMap.set(result.universeId, result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("rate limited")
      ) {
        throw error;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  const similar = [...similarMap.values()]
    .map((result) => ({ result, score: overlapScore(candidate, result) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  const closeHighCcu = similar.filter(
    (item) => item.score >= 60 && item.result.activePlayers >= 1000,
  ).length;
  const closeMatches = similar.filter((item) => item.score >= 60).length;
  const risk: TopIdea["originalityRisk"] =
    closeHighCcu >= 2 || closeMatches >= 4
      ? "High"
      : closeMatches >= 2 || similar.length >= 4
        ? "Medium"
        : "Low";
  return {
    risk,
    similarGames: similar.map(({ result }) => ({
      title: result.title,
      universeId: result.universeId,
      activePlayers: result.activePlayers,
      visits: result.visits,
    })),
    reason:
      risk === "High"
        ? "Multiple public Roblox search results overlap strongly with the same mechanic, goal, or theme."
        : risk === "Medium"
          ? "Some similar games exist, but the proposed formula changes at least two major pieces."
          : "Few close public Roblox search matches were found, and similar results appear less dominant.",
  };
}

export function scoreIdeaPotential(
  candidate: Candidate,
  originalityRisk: TopIdea["originalityRisk"],
) {
  const games = candidate.sourceGames;
  const demand = Math.min(
    100,
    Math.log10(
      games.reduce((sum, game) => sum + game.activePlayers, 0) + 100,
    ) * 22,
  );
  const growth = Math.min(
    100,
    average(
      games.map(
        (game) =>
          game.metrics?.momentum1d ??
          (game.metrics?.visitGrowth1d
            ? Math.log10(game.metrics.visitGrowth1d + 10) * 12
            : 20),
      ),
    ) ?? 20,
  );
  const avgSession = average(
    games
      .map((game) => game.metrics?.avgSession1d ?? game.metrics?.avgSession7d)
      .filter((value): value is number => typeof value === "number"),
  );
  const engagement = avgSession ? Math.min(100, avgSession * 6) : 35;
  const competitionGap =
    games.length <= 2
      ? 75
      : average(games.map((game) => game.score.competition)) ?? 50;
  const buildability =
    candidate.goalFormat === "battle" || candidate.goalFormat === "defend"
      ? 45
      : candidate.growthMechanic.includes("+1") ||
          ["obby", "escape", "race"].includes(candidate.goalFormat)
        ? 85
        : 65;
  const originality =
    originalityRisk === "Low" ? 90 : originalityRisk === "Medium" ? 60 : 25;
  return clamp(
    demand * 0.25 +
      growth * 0.2 +
      engagement * 0.2 +
      competitionGap * 0.15 +
      buildability * 0.1 +
      originality * 0.1,
  );
}

export function rankIdeaCandidates(candidates: Candidate[]) {
  return [...candidates].sort((a, b) => {
    const aActive = a.sourceGames.reduce((sum, game) => sum + game.activePlayers, 0);
    const bActive = b.sourceGames.reduce((sum, game) => sum + game.activePlayers, 0);
    return bActive - aActive;
  });
}

function confidence(signals: DatasetSignals): ConfidenceLevel {
  if (
    signals.games.length >= 20 &&
    signals.snapshotsCount >= 40 &&
    signals.gamesWithAvgSession >= 5
  ) {
    return "High";
  }
  if (signals.games.length >= 8 && signals.snapshotsCount >= 10) return "Medium";
  return "Low";
}

export async function generateTopIdeas() {
  const signals = await getDatasetSignals();
  const clusterCandidates = signals.clusters.map((cluster, index) =>
    candidateFromCluster(cluster, signals.games, index),
  );
  const candidates = rankIdeaCandidates([
    ...clusterCandidates,
    ...fallbackCandidates(signals.games),
  ]).slice(0, 5);

  const ideas: TopIdea[] = [];
  for (const candidate of candidates) {
    if (ideas.length >= 3) break;
    const originality = await checkIdeaOriginality(candidate);
    const potentialScore = scoreIdeaPotential(candidate, originality.risk);
    const relatedActive = candidate.sourceGames.reduce(
      (sum, game) => sum + game.activePlayers,
      0,
    );
    const avgRating = average(candidate.sourceGames.map((game) => game.likeRatio));
    const avgSession = average(
      candidate.sourceGames
        .map((game) => game.metrics?.avgSession1d ?? game.metrics?.avgSession7d)
        .filter((value): value is number => typeof value === "number"),
    );
    ideas.push({
      rank: ideas.length + 1,
      title: candidate.title,
      description: candidate.description,
      howPlayersPlay: candidate.howPlayersPlay,
      trendFormula: `${candidate.growthMechanic} + ${candidate.inputHook} + ${candidate.goalFormat} + ${candidate.theme}`,
      dataSignals: [
        `Related dataset slice has ${candidate.sourceGames.length} games with ${relatedActive.toLocaleString()} total active players.`,
        avgRating === null
          ? "Average rating is not available."
          : `Average rating is ${Math.round(avgRating * 10) / 10}%.`,
        avgSession === null
          ? "Avg Session is not available for this slice yet."
          : `Avg Session averages ${Math.round(avgSession * 10) / 10} minutes.`,
        `Dataset confidence is ${confidence(signals)} from ${signals.games.length} real games and ${signals.snapshotsCount} snapshots.`,
      ],
      whyItCouldWork: `It combines demand-backed pieces from tracked games while changing the formula enough to create a new testable prototype.`,
      differentFromExisting: candidate.differentFromExisting,
      potentialScore,
      potentialReason: `Score blends demand, growth, engagement, competition gap, buildability, and originality risk. Missing Avg Session lowers confidence instead of inventing data.`,
      originalityRisk: originality.risk,
      originalityReason: `${originality.reason} Originality check is based on public Roblox search similarity, not a legal trademark or copyright search.`,
      similarGames: originality.similarGames,
      difficulty: candidate.difficulty,
      monetizationOptions: candidate.monetizationOptions,
      risks: candidate.risks,
      confidenceLevel: confidence(signals),
      createdAt: new Date().toISOString(),
    });
  }

  const admin = createSupabaseAdminClient();
  const inserted = [];
  for (const idea of ideas) {
    const { data } = await admin
      .from("generated_top_ideas")
      .insert({
        title: idea.title,
        description: idea.description,
        how_players_play: idea.howPlayersPlay,
        trend_formula: idea.trendFormula,
        data_signals: idea.dataSignals,
        potential_score: idea.potentialScore,
        potential_reason: idea.potentialReason,
        originality_risk: idea.originalityRisk,
        originality_reason: idea.originalityReason,
        similar_games: idea.similarGames,
        difficulty: idea.difficulty,
        monetization_options: idea.monetizationOptions,
        risks: idea.risks,
        confidence_level: idea.confidenceLevel,
      })
      .select("id, created_at")
      .single();
    inserted.push({ ...idea, id: data?.id, createdAt: data?.created_at ?? idea.createdAt });
  }

  return { ideas: inserted, dataset: signals };
}
