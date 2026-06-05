import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { isMockMode } from "@/lib/mode";
import { discoverAndPreviewGames } from "@/lib/roblox";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type DiscoveryResponseRow = {
  id?: string;
  discovery_run_id: string;
  roblox_universe_id: string;
  roblox_place_id: string;
  title: string;
  creator_name: string;
  active_players: number;
  visits: number;
  thumbnail_url: string | null;
  source_keyword: string;
  already_imported: boolean;
};

function safeLimit(value: unknown) {
  const parsed = Number(value ?? 25);
  if (!Number.isFinite(parsed)) return 25;
  return Math.min(Math.max(Math.round(parsed), 1), 50);
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message : "Discovery failed";
}

export async function POST(request: Request) {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase service role is required for discovery." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    keyword?: string;
    limit?: number;
  };
  const keyword = body.keyword?.trim();
  if (!keyword) {
    return NextResponse.json({ error: "keyword is required" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const limit = safeLimit(body.limit);
  const { data: run, error: runError } = await admin
    .from("discovery_runs")
    .insert({ keyword, status: "processing" })
    .select("id")
    .single();
  if (runError || !run) {
    return NextResponse.json(
      { error: runError?.message ?? "Could not create discovery run." },
      { status: 500 },
    );
  }

  try {
    const results = await discoverAndPreviewGames(keyword, limit);
    const universeIds = results.map((result) => result.universeId);
    const { data: existing } = universeIds.length
      ? await admin
          .from("games")
          .select("roblox_universe_id")
          .in("roblox_universe_id", universeIds)
      : { data: [] };
    const existingIds = new Set(
      (existing ?? []).map((row) => String(row.roblox_universe_id)),
    );

    const rows = results.map((result) => ({
      discovery_run_id: run.id,
      roblox_universe_id: result.universeId,
      roblox_place_id: result.placeId,
      title: result.title,
      creator_name: result.creatorName,
      active_players: result.activePlayers,
      visits: result.visits,
      thumbnail_url: result.thumbnailUrl,
      source_keyword: result.sourceKeyword,
      already_imported: existingIds.has(result.universeId),
      raw_data: result.raw,
    }));
    let insertedRows: DiscoveryResponseRow[] = rows;
    if (rows.length) {
      const { data: inserted, error: insertError } = await admin
        .from("discovered_games")
        .insert(rows)
        .select(
          "id, discovery_run_id, roblox_universe_id, roblox_place_id, title, creator_name, active_players, visits, thumbnail_url, source_keyword, already_imported",
        );
      if (insertError) throw insertError;
      insertedRows = inserted ?? rows;
    }

    const { error: updateError } = await admin
      .from("discovery_runs")
      .update({
        status: "success",
        result_count: results.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id);
    if (updateError) throw updateError;

    return NextResponse.json({
      discoveryRunId: run.id,
      results: insertedRows,
    });
  } catch (error) {
    const message = safeError(error);
    await admin
      .from("discovery_runs")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id);
    const status = message.toLowerCase().includes("rate limited") ? 429 : 500;
    return NextResponse.json({ error: message, discoveryRunId: run.id }, { status });
  }
}
