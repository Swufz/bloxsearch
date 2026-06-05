import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { mapDatabaseGame } from "@/lib/data";
import { generateIdeas } from "@/lib/idea-generator";
import { scoreGame } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { analyzeTrendFormula } from "@/lib/trend-analysis";

export async function POST() {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase service role is required." },
      { status: 500 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("games")
    .select(
      "*, game_scores(opportunity_score, demand_score, growth_score, competition_score, freshness_score, buildability_score, monetization_score, outlier_reason, risks, generated_ideas), game_snapshots(id)",
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const games = (data ?? []).map((row) => mapDatabaseGame(row));
  for (const game of games) {
    const trend = analyzeTrendFormula(game);
    const similarActivePlayers = games
      .filter((candidate) => candidate.id !== game.id)
      .filter((candidate) => {
        const candidateTrend = analyzeTrendFormula(candidate);
        return (
          candidateTrend.growthMechanic === trend.growthMechanic ||
          candidateTrend.goalFormat === trend.goalFormat ||
          candidateTrend.theme === trend.theme
        );
      })
      .map((candidate) => candidate.activePlayers);
    const score = scoreGame(
      game,
      Math.max(similarActivePlayers.length, 1),
      similarActivePlayers,
    );
    const ideas = generateIdeas(game);
    const { error: scoreError } = await admin.from("game_scores").upsert(
      {
        game_id: game.databaseId ?? game.id,
        opportunity_score: score.opportunity,
        demand_score: score.demand,
        growth_score: score.growth,
        competition_score: score.competition,
        freshness_score: score.freshness,
        buildability_score: score.buildability,
        monetization_score: score.monetization,
        outlier_reason: score.outlierReason,
        risks: score.risks,
        generated_ideas: ideas,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: "game_id" },
    );
    if (scoreError)
      return NextResponse.json({ error: scoreError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Recalculated scores for ${games.length} imported games`,
    count: games.length,
  });
}
