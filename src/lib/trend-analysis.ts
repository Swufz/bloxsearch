import type { ConfidenceLevel, Game, TrendAnalysis } from "./types";

type KeywordRule = {
  keyword: string;
  category: string;
  aliases: string[];
};

const keywordRules: KeywordRule[] = [
  { keyword: "+1 speed", category: "growth_mechanic", aliases: ["+1 speed", "speed"] },
  { keyword: "+1 jump", category: "growth_mechanic", aliases: ["+1 jump", "jump power"] },
  { keyword: "+1 strength", category: "growth_mechanic", aliases: ["+1 strength", "strength"] },
  { keyword: "grow", category: "growth_mechanic", aliases: ["grow", "growth"] },
  { keyword: "collect", category: "growth_mechanic", aliases: ["collect", "collection"] },
  { keyword: "upgrade", category: "growth_mechanic", aliases: ["upgrade", "upgrades"] },
  { keyword: "rebirth", category: "growth_mechanic", aliases: ["rebirth", "rebirths"] },
  { keyword: "tycoon", category: "growth_mechanic", aliases: ["tycoon"] },
  { keyword: "simulator", category: "growth_mechanic", aliases: ["simulator"] },
  { keyword: "rng", category: "growth_mechanic", aliases: ["rng"] },
  { keyword: "keyboard", category: "input_hook", aliases: ["keyboard"] },
  { keyword: "click", category: "input_hook", aliases: ["click", "tap"] },
  { keyword: "button", category: "input_hook", aliases: ["button"] },
  { keyword: "piano", category: "input_hook", aliases: ["piano"] },
  { keyword: "controller", category: "input_hook", aliases: ["controller"] },
  { keyword: "typing", category: "input_hook", aliases: ["typing", "type"] },
  { keyword: "rhythm", category: "input_hook", aliases: ["rhythm"] },
  { keyword: "escape/obby", category: "goal_format", aliases: ["escape", "obby", "parkour"] },
  { keyword: "race", category: "goal_format", aliases: ["race", "racing", "speedrun"] },
  { keyword: "climb", category: "goal_format", aliases: ["climb", "tower"] },
  { keyword: "survive", category: "goal_format", aliases: ["survive", "survival"] },
  { keyword: "break walls", category: "goal_format", aliases: ["break walls", "break wall"] },
  { keyword: "reach end", category: "goal_format", aliases: ["reach the end", "reach end", "finish"] },
  { keyword: "beat timer", category: "goal_format", aliases: ["timer", "time trial"] },
  { keyword: "candy/chocolate", category: "theme", aliases: ["candy", "chocolate", "sweet"] },
  { keyword: "lava", category: "theme", aliases: ["lava", "volcano"] },
  { keyword: "school", category: "theme", aliases: ["school", "classroom"] },
  { keyword: "prison", category: "theme", aliases: ["prison", "jail"] },
  { keyword: "zoo", category: "theme", aliases: ["zoo", "animal"] },
  { keyword: "pets", category: "theme", aliases: ["pets", "pet"] },
  { keyword: "anime", category: "theme", aliases: ["anime"] },
  { keyword: "brainrot", category: "theme", aliases: ["brainrot"] },
  { keyword: "space", category: "theme", aliases: ["space", "planet", "alien"] },
  { keyword: "factory", category: "theme", aliases: ["factory"] },
  { keyword: "garden", category: "theme", aliases: ["garden"] },
  { keyword: "race friends", category: "social_hook", aliases: ["race against friends", "race friends"] },
  { keyword: "multiplayer", category: "social_hook", aliases: ["multiplayer", "friends"] },
  { keyword: "leaderboard", category: "social_hook", aliases: ["leaderboard", "leaderboards"] },
  { keyword: "fastest", category: "social_hook", aliases: ["fastest", "compete", "competitive"] },
  { keyword: "vip", category: "monetization", aliases: ["vip", "gamepass", "game pass"] },
  { keyword: "boosts", category: "monetization", aliases: ["boost", "boosts", "multiplier"] },
  { keyword: "cosmetics", category: "monetization", aliases: ["cosmetic", "cosmetics", "trails", "trail"] },
  { keyword: "skip stage", category: "monetization", aliases: ["skip stage", "skip-stage"] },
  { keyword: "private server", category: "monetization", aliases: ["private server", "vip server"] },
];

function includesAny(text: string, aliases: string[]) {
  return aliases.some((alias) => text.includes(alias));
}

function firstByCategory(detected: Array<{ keyword: string; category: string }>, category: string, fallback: string) {
  return detected.find((item) => item.category === category)?.keyword ?? fallback;
}

export function analyzeTrendFormula(
  game: Pick<Game, "title" | "description" | "tags" | "niche" | "mechanics" | "monetizationTags">,
): TrendAnalysis {
  const text = `${game.title} ${game.description} ${game.tags.join(" ")} ${game.niche} ${game.mechanics.join(" ")} ${game.monetizationTags.join(" ")}`.toLowerCase();
  const detected = keywordRules
    .filter((rule) => includesAny(text, rule.aliases))
    .map(({ keyword, category }) => ({ keyword, category }));

  const growthMechanic = firstByCategory(detected, "growth_mechanic", game.mechanics[0] ?? "progression");
  const inputHook = firstByCategory(detected, "input_hook", "general input");
  const goalFormat = firstByCategory(detected, "goal_format", game.niche.toLowerCase());
  const theme = firstByCategory(detected, "theme", game.tags[0] ?? "general Roblox");
  const socialHook = firstByCategory(detected, "social_hook", "not clearly detected");
  const monetizationSignals = detected
    .filter((item) => item.category === "monetization")
    .map((item) => item.keyword);

  const coreDetections = [growthMechanic, inputHook, goalFormat, theme].filter(
    (value) => value && !["general input", "general Roblox"].includes(value),
  ).length;
  const confidence: ConfidenceLevel =
    coreDetections >= 4 ? "High" : coreDetections >= 2 ? "Medium" : "Low";

  return {
    formulaSummary: `${growthMechanic} + ${inputHook} + ${goalFormat} + ${theme}`,
    growthMechanic,
    inputHook,
    goalFormat,
    theme,
    socialHook,
    monetizationSignals,
    confidence,
    detectedKeywords: detected,
  };
}

export function getSimilarGamesByTrend(game: Game, games: Game[]) {
  const trend = analyzeTrendFormula(game);
  return games
    .filter((candidate) => candidate.id !== game.id)
    .map((candidate) => {
      const candidateTrend = analyzeTrendFormula(candidate);
      const matches = [
        candidateTrend.growthMechanic === trend.growthMechanic,
        candidateTrend.inputHook === trend.inputHook,
        candidateTrend.goalFormat === trend.goalFormat,
        candidateTrend.theme === trend.theme,
        candidate.tags.some((tag) => game.tags.includes(tag)),
      ].filter(Boolean).length;
      return { game: candidate, matches };
    })
    .filter((item) => item.matches > 0)
    .sort((a, b) => b.matches - a.matches || b.game.activePlayers - a.game.activePlayers)
    .slice(0, 5);
}

export function confidenceFromDataset(count: number): ConfidenceLevel {
  if (count >= 8) return "High";
  if (count >= 3) return "Medium";
  return "Low";
}

export async function getKeywordStats(keyword: string) {
  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("keyword_signals")
    .select("keyword, active_players, visits, like_ratio")
    .eq("keyword", keyword);
  if (error) {
    console.error("[keyword-signals] Failed to fetch keyword stats", { keyword, error });
    return null;
  }
  const rows = data ?? [];
  const totalActive = rows.reduce((sum, row) => sum + Number(row.active_players ?? 0), 0);
  const totalVisits = rows.reduce((sum, row) => sum + Number(row.visits ?? 0), 0);
  const avgLikeRatio = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.like_ratio ?? 0), 0) / rows.length
    : 0;
  return { keyword, count: rows.length, totalActive, totalVisits, avgLikeRatio };
}

export async function getTopKeywordsByActivePlayers(limit = 10) {
  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("keyword_signals")
    .select("keyword, category, active_players, like_ratio");
  if (error) {
    console.error("[keyword-signals] Failed to fetch top keywords", { error });
    return [];
  }
  const totals = new Map<string, { keyword: string; category: string; activePlayers: number; games: number; likeTotal: number }>();
  for (const row of data ?? []) {
    const key = `${row.category}:${row.keyword}`;
    const current = totals.get(key) ?? {
      keyword: String(row.keyword),
      category: String(row.category),
      activePlayers: 0,
      games: 0,
      likeTotal: 0,
    };
    current.activePlayers += Number(row.active_players ?? 0);
    current.games += 1;
    current.likeTotal += Number(row.like_ratio ?? 0);
    totals.set(key, current);
  }
  return [...totals.values()]
    .map((item) => ({ ...item, averageLikeRatio: item.games ? item.likeTotal / item.games : 0 }))
    .sort((a, b) => b.activePlayers - a.activePlayers)
    .slice(0, limit);
}

export async function getTopKeywordsByAverageLikeRatio(limit = 10) {
  const rows = await getTopKeywordsByActivePlayers(100);
  return rows
    .filter((row) => row.games >= 1)
    .sort((a, b) => b.averageLikeRatio - a.averageLikeRatio)
    .slice(0, limit);
}

export async function getTopKeywordsByAverageAvgSession(limit = 10) {
  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const admin = createSupabaseAdminClient();
  const [{ data: signals, error: signalError }, { data: metrics, error: metricError }] =
    await Promise.all([
      admin.from("keyword_signals").select("game_id, keyword, category"),
      admin.from("roblox_game_metrics").select("game_id, avg_session_1d, avg_session_7d"),
    ]);
  if (signalError || metricError) {
    console.error("[keyword-signals] Failed to fetch avg session keywords", {
      signalError,
      metricError,
    });
    return [];
  }
  const metricByGame = new Map(
    (metrics ?? []).map((row) => [
      String(row.game_id),
      Number(row.avg_session_1d ?? row.avg_session_7d ?? 0),
    ]),
  );
  const totals = new Map<
    string,
    { keyword: string; category: string; totalAvgSession: number; games: number }
  >();
  for (const signal of signals ?? []) {
    const avgSession = metricByGame.get(String(signal.game_id));
    if (!avgSession) continue;
    const key = `${signal.category}:${signal.keyword}`;
    const current = totals.get(key) ?? {
      keyword: String(signal.keyword),
      category: String(signal.category),
      totalAvgSession: 0,
      games: 0,
    };
    current.totalAvgSession += avgSession;
    current.games += 1;
    totals.set(key, current);
  }
  return [...totals.values()]
    .map((item) => ({
      ...item,
      averageAvgSession: item.games ? item.totalAvgSession / item.games : 0,
    }))
    .sort((a, b) => b.averageAvgSession - a.averageAvgSession)
    .slice(0, limit);
}

export async function getTopKeywordCombinations(limit = 10) {
  const { createSupabaseAdminClient } = await import("./supabase/admin");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("keyword_signals")
    .select("game_id, keyword, category, active_players");
  if (error) {
    console.error("[keyword-signals] Failed to fetch keyword combinations", { error });
    return [];
  }
  const byGame = new Map<string, { activePlayers: number; keywords: string[] }>();
  for (const row of data ?? []) {
    const gameId = String(row.game_id);
    const current = byGame.get(gameId) ?? { activePlayers: Number(row.active_players ?? 0), keywords: [] };
    current.keywords.push(`${row.category}:${row.keyword}`);
    byGame.set(gameId, current);
  }
  return [...byGame.values()]
    .map((item) => ({
      combination: item.keywords.slice(0, 4).join(" + "),
      activePlayers: item.activePlayers,
    }))
    .sort((a, b) => b.activePlayers - a.activePlayers)
    .slice(0, limit);
}
