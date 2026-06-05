import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { analyzeTrendFormula } from "@/lib/trend-analysis";

type GameRow = {
  id: string;
  title: string;
  description: string | null;
  active_players: number | null;
  visits: number | null;
  like_ratio: number | null;
  created_at_roblox: string | null;
  updated_at_roblox: string | null;
  tags: string[] | null;
  niche: string | null;
  mechanics: string[] | null;
  monetization_tags: string[] | null;
};

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
  const { data: games, error } = await admin
    .from("games")
    .select(
      "id, title, description, active_players, visits, like_ratio, created_at_roblox, updated_at_roblox, tags, niche, mechanics, monetization_tags",
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: deleteError } = await admin
    .from("keyword_signals")
    .delete()
    .not("id", "is", null);
  if (deleteError)
    return NextResponse.json(
      {
        error:
          "Could not recalculate keyword signals. Apply the keyword_signals migration first.",
      },
      { status: 500 },
    );

  const rows = (games as GameRow[]).flatMap((game) => {
    const trend = analyzeTrendFormula({
      title: game.title,
      description: game.description ?? "",
      tags: game.tags ?? [],
      niche: game.niche ?? "Roblox",
      mechanics: game.mechanics ?? [],
      monetizationTags: game.monetization_tags ?? [],
    });
    return trend.detectedKeywords.map((signal) => ({
      keyword: signal.keyword,
      category: signal.category,
      game_id: game.id,
      active_players: game.active_players ?? 0,
      visits: game.visits ?? 0,
      like_ratio: game.like_ratio ?? 0,
      created_at_roblox: game.created_at_roblox,
      updated_at_roblox: game.updated_at_roblox,
    }));
  });

  if (rows.length) {
    const { error: insertError } = await admin.from("keyword_signals").insert(rows);
    if (insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `Recalculated ${rows.length} keyword signals`,
    count: rows.length,
  });
}
