import type { Game, SavedGame, SavedIdea } from "./types";
import { getGames } from "./data";
import { getGame } from "./data";
import { createSupabaseAdminClient } from "./supabase/admin";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "./supabase/server";

export function getMissingSaveEnvVars() {
  return [
    ["NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL],
    [
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ],
    ["SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

export async function getSavedGameUniverseIds(
  userId?: string,
): Promise<string[]> {
  if (!userId || !isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("saved_games")
    .select("games(roblox_universe_id)")
    .eq("user_id", userId);
  return (data ?? [])
    .map((row) => {
      const game = row.games as unknown as {
        roblox_universe_id?: string;
      } | null;
      return game?.roblox_universe_id;
    })
    .filter((id): id is string => Boolean(id));
}

export async function getUserSavedGames(userId?: string): Promise<SavedGame[]> {
  if (!userId || !isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_games")
    .select(
      "id, game_id, created_at, games(id, roblox_universe_id, title, creator_name, active_players, visits, game_scores(opportunity_score))",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[saved-games] Failed to fetch saved games", {
      userId,
      error,
    });
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const game = row.games as unknown as {
        id?: string;
        roblox_universe_id?: string;
        title?: string;
        creator_name?: string;
        active_players?: number;
        visits?: number;
        game_scores?:
          | { opportunity_score?: number }
          | { opportunity_score?: number }[]
          | null;
      } | null;
      const score = Array.isArray(game?.game_scores)
        ? game?.game_scores[0]?.opportunity_score
        : game?.game_scores?.opportunity_score;
      if (!game?.id || !game.title) return null;
      const mockGameId = getGames().find(
        (item) => item.robloxUniverseId === game.roblox_universe_id,
      )?.id;
      return {
        id: row.id,
        gameId: mockGameId ?? game.id,
        databaseGameId: game.id,
        robloxUniverseId: game.roblox_universe_id ?? "",
        title: game.title,
        creatorName: game.creator_name ?? "Unknown creator",
        activePlayers: game.active_players ?? 0,
        visits: game.visits ?? 0,
        opportunityScore: score ?? null,
        createdAt: row.created_at,
      };
    })
    .filter((game): game is SavedGame => Boolean(game));
}

export async function getUserSavedIdeas(userId?: string): Promise<SavedIdea[]> {
  if (!userId || !isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("saved_ideas")
    .select(
      "id, game_id, title, description, niche, difficulty, monetization_options, opportunity_score, notes, created_at, games(title)",
    )
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
      coreLoop:
        "Prototype the core loop, validate retention, and expand only after players return.",
      howPlayersPlay:
        "Prototype the core loop, validate retention, and expand only after players return.",
      whyItCouldWork:
        "Saved from an opportunity signal discovered in BloxSearch.",
      differentFromOriginal:
        "Change the mechanic, theme, UI, map, name, and economy before building.",
      difficulty:
        row.difficulty === "Easy" || row.difficulty === "Hard"
          ? row.difficulty
          : "Medium",
      monetization: row.monetization_options ?? [],
      avoidCloning:
        "Use the trend, not the exact game. Change the mechanic, theme, UI, map, name, and economy.",
      buildScope: "Define a focused MVP before expanding content.",
      potentialScore: row.opportunity_score ?? 0,
      potentialReason:
        row.notes ??
        "Saved from an opportunity signal discovered in BloxSearch.",
      risk: "Validate retention with a small prototype before scaling content.",
      niche: row.niche ?? "",
      opportunityScore: row.opportunity_score ?? 0,
      notes: row.notes ?? "",
      createdAt: row.created_at,
    };
  });
}

export async function ensureGameRecord(
  gameId: string,
): Promise<{ databaseId: string; game: Game } | null> {
  const game = getGame(gameId);
  const uuidLike =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      gameId,
    );
  if (!game && uuidLike) {
    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL
    )
      return null;
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("games")
      .select(
        "*, game_scores(opportunity_score, demand_score, growth_score, competition_score, freshness_score, buildability_score, monetization_score, outlier_reason, risks, generated_ideas)",
      )
      .eq("id", gameId)
      .maybeSingle();
    if (error || !data) {
      console.error("[saved-games] Real game id not found", { gameId, error });
      return null;
    }
    const { mapDatabaseGame } = await import("./data");
    return { databaseId: gameId, game: mapDatabaseGame(data) };
  }
  if (!game) {
    console.error("[saved-games] Unknown game id", { gameId });
    return null;
  }

  const missingEnv = getMissingSaveEnvVars();
  if (missingEnv.length) {
    console.error("[saved-games] Missing required save environment variables", {
      missingEnv,
      gameId,
    });
    return null;
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("games")
      .upsert(
        {
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
        },
        { onConflict: "roblox_universe_id" },
      )
      .select("id")
      .single();

    if (error || !data) {
      console.error("[saved-games] Failed to upsert game", {
        gameId,
        robloxUniverseId: game.robloxUniverseId,
        error,
      });
      return null;
    }

    const { error: scoreError } = await admin.from("game_scores").upsert(
      {
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
      },
      { onConflict: "game_id" },
    );

    if (scoreError) {
      console.error("[saved-games] Failed to upsert game score", {
        gameId,
        databaseId: data.id,
        error: scoreError,
      });
    }

    return { databaseId: data.id, game };
  } catch (error) {
    console.error("[saved-games] Unexpected error ensuring game record", {
      gameId,
      error,
    });
    return null;
  }
}
