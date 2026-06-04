import type { Game, SavedIdea } from "./types";
import { getGame } from "./data";
import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";

export async function getSavedGameUniverseIds(userId?: string): Promise<string[]> {
  if (!userId || !isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("saved_games").select("games(roblox_universe_id)").eq("user_id", userId);
  return (data ?? []).map((row) => {
    const game = row.games as unknown as { roblox_universe_id?: string } | null;
    return game?.roblox_universe_id;
  }).filter((id): id is string => Boolean(id));
}

export async function getUserSavedIdeas(userId?: string): Promise<SavedIdea[]> {
  if (!userId || !isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("saved_ideas")
    .select("id, game_id, title, description, niche, difficulty, monetization_options, opportunity_score, notes, created_at, games(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => {
    const game = row.games as unknown as { title?: string } | null;
    return {
      id: row.id,
      gameId: row.game_id ?? "",
      inspiredBy: game?.title ?? "Market research",
      title: row.title,
      concept: row.description ?? "",
      coreLoop: "Prototype the core loop, validate retention, and expand only after players return.",
      whyItCouldWork: "Saved from an opportunity signal discovered in BloxSearch.",
      difficulty: row.difficulty === "Easy" || row.difficulty === "Hard" ? row.difficulty : "Medium",
      monetization: row.monetization_options ?? [],
      avoidCloning: "Use original assets, names, maps, UI, art direction, and economy.",
      buildScope: "Define a focused MVP before expanding content.",
      niche: row.niche ?? "",
      opportunityScore: row.opportunity_score ?? 0,
      notes: row.notes ?? "",
      createdAt: row.created_at,
    };
  });
}

export async function ensureGameRecord(gameId: string): Promise<{ databaseId: string; game: Game } | null> {
  const game = getGame(gameId);
  if (!game || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("games").upsert({
    roblox_universe_id: game.robloxUniverseId,
    roblox_place_id: game.robloxPlaceId,
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
    last_fetched_at: game.lastFetchedAt,
    tags: game.tags,
    niche: game.niche,
    mechanics: game.mechanics,
    monetization_tags: game.monetizationTags,
  }, { onConflict: "roblox_universe_id" }).select("id").single();
  if (error || !data) return null;
  await admin.from("game_scores").upsert({
    game_id: data.id,
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
  }, { onConflict: "game_id" });
  return { databaseId: data.id, game };
}
