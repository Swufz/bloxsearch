import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { importRobloxGameFromInput } from "@/lib/roblox";
import { analyzeTrendFormula } from "@/lib/trend-analysis";
import { generateIdeas } from "@/lib/idea-generator";
import { scoreGame } from "@/lib/scoring";

export async function POST(request: Request) {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase service role is required to import Roblox games." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    input?: string;
    force?: boolean;
  };
  if (!body.input || typeof body.input !== "string") {
    return NextResponse.json(
      { error: "Roblox game URL or Place ID is required." },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdminClient();

  try {
    const imported = await importRobloxGameFromInput(body.input);
    const existing = await admin
      .from("games")
      .select("id, title, last_fetched_at")
      .eq("roblox_universe_id", imported.universeId)
      .maybeSingle();

    if (
      !body.force &&
      existing.data?.last_fetched_at &&
      Date.now() - new Date(existing.data.last_fetched_at).getTime() <
        10 * 60 * 1000
    ) {
      await admin.from("data_collection_logs").insert({
        action: "import_roblox_game",
        status: "success",
        message: `Skipped refetch for recently imported ${existing.data.title}.`,
        metadata: {
          placeId: imported.placeId,
          universeId: imported.universeId,
          cached: true,
        },
      });
      return NextResponse.json({
        message: `Imported ${existing.data.title}`,
        data: existing.data,
        cached: true,
      });
    }

    const game = imported.game;
    const trend = analyzeTrendFormula(game);
    const { data: competitionRows } = await admin
      .from("games")
      .select("id, title, active_players, tags, niche, mechanics, monetization_tags, description")
      .neq("roblox_universe_id", imported.universeId);
    const similarActivePlayers = (competitionRows ?? [])
      .filter((row) => {
        const rowTrend = analyzeTrendFormula({
          title: String(row.title ?? ""),
          description: String(row.description ?? ""),
          tags: Array.isArray(row.tags) ? row.tags : [],
          niche: String(row.niche ?? "Roblox"),
          mechanics: Array.isArray(row.mechanics) ? row.mechanics : [],
          monetizationTags: Array.isArray(row.monetization_tags)
            ? row.monetization_tags
            : [],
        });
        return (
          rowTrend.growthMechanic === trend.growthMechanic ||
          rowTrend.goalFormat === trend.goalFormat ||
          rowTrend.theme === trend.theme
        );
      })
      .map((row) => Number(row.active_players ?? 0));
    game.score = scoreGame(game, Math.max(similarActivePlayers.length, 1), similarActivePlayers);
    game.ideas = generateIdeas(game);
    const { data: savedGame, error: gameError } = await admin
      .from("games")
      .upsert(
        {
          roblox_universe_id: game.robloxUniverseId,
          roblox_place_id: imported.placeId,
          title: game.title,
          description: game.description,
          creator_name: game.creatorName,
          creator_id: game.creatorId,
          creator_type: game.creatorType,
          thumbnail_url: game.thumbnailUrl,
          game_url: `https://www.roblox.com/games/${imported.placeId}`,
          active_players: game.activePlayers,
          visits: game.visits,
          favorites: game.favorites,
          upvotes: game.upvotes,
          downvotes: game.downvotes,
          like_ratio: game.likeRatio,
          max_players: game.maxPlayers,
          created_at_roblox: game.createdAtRoblox,
          updated_at_roblox: game.updatedAtRoblox,
          last_fetched_at: new Date().toISOString(),
          tags: game.tags,
          niche: game.niche,
          mechanics: game.mechanics,
          monetization_tags: game.monetizationTags,
          raw_data: { ...imported.raw, votes: imported.votes },
        },
        { onConflict: "roblox_universe_id" },
      )
      .select("*")
      .single();

    if (gameError || !savedGame)
      throw gameError ?? new Error("Game was not saved.");

    const { error: keywordDeleteError } = await admin
      .from("keyword_signals")
      .delete()
      .eq("game_id", savedGame.id);
    if (keywordDeleteError) {
      console.error("[admin/import-roblox-game] Keyword signal delete failed", {
        gameId: savedGame.id,
        error: keywordDeleteError,
      });
    }
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
      if (keywordError) {
        console.error("[admin/import-roblox-game] Keyword signal insert failed", {
          gameId: savedGame.id,
          error: keywordError,
        });
      }
    }

    await admin.from("game_snapshots").insert({
      game_id: savedGame.id,
      active_players: game.activePlayers,
      visits: game.visits,
      favorites: game.favorites,
      upvotes: game.upvotes,
      downvotes: game.downvotes,
      like_ratio: game.likeRatio,
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
      },
      { onConflict: "game_id" },
    );
    if (scoreError) throw scoreError;

    await admin.from("data_collection_logs").insert({
      action: "import_roblox_game",
      status: "success",
      message: `Imported ${game.title}.`,
      metadata: {
        placeId: imported.placeId,
        universeId: imported.universeId,
        gameId: savedGame.id,
        votes: imported.votes,
        forced: Boolean(body.force),
        trend: trend.formulaSummary,
      },
    });

    return NextResponse.json({
      message: `Imported ${game.title}`,
      data: { ...savedGame, score: game.score },
    });
  } catch (error) {
    console.error("[admin/import-roblox-game] Import failed", { error });
    try {
      await admin.from("data_collection_logs").insert({
        action: "import_roblox_game",
        status: "error",
        message: error instanceof Error ? error.message : "Import failed",
        metadata: { input: body.input },
      });
    } catch {
      // Logging should never hide the import error from the caller.
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 },
    );
  }
}
