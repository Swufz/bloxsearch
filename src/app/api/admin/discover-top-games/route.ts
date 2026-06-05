import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getDatasetSettings } from "@/lib/dataset-settings";
import { isMockMode } from "@/lib/mode";
import { discoverTopGamesPipeline } from "@/lib/roblox";
import { importRobloxUniverse } from "@/lib/roblox-import";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { RobloxDiscoverySource } from "@/lib/types";

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeSource(value: unknown): RobloxDiscoverySource {
  return value === "trending" || value === "popular" || value === "top_games"
    ? value
    : "top_games";
}

export async function POST(request: Request) {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase service role is required." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    source?: RobloxDiscoverySource;
    limit?: number;
    autoImport?: boolean;
    enableTracking?: boolean;
    minCcu?: number;
  };
  const settings = await getDatasetSettings();
  const source = safeSource(body.source);
  const limit = Math.min(
    Math.max(Math.round(Number(body.limit ?? 50)), 1),
    settings.maxTopGamesPerRun,
    100,
  );
  const minCcu = Number.isFinite(Number(body.minCcu))
    ? Number(body.minCcu)
    : settings.minImportCcu;
  const autoImport = body.autoImport !== false;
  const admin = createSupabaseAdminClient();

  try {
    const games = await discoverTopGamesPipeline({ source, limit });
    const universeIds = games.map((game) => game.roblox_universe_id);
    const { data: existing } = universeIds.length
      ? await admin.from("games").select("roblox_universe_id").in("roblox_universe_id", universeIds)
      : { data: [] };
    const existingIds = new Set((existing ?? []).map((row) => String(row.roblox_universe_id)));
    const failures: Array<{ universeId: string; error: string }> = [];
    let imported = 0;
    let skippedBelowCcu = 0;
    let skippedAlreadyImported = 0;

    for (const game of games) {
      if (game.active_players < minCcu) {
        skippedBelowCcu += 1;
        continue;
      }
      if (existingIds.has(game.roblox_universe_id)) {
        skippedAlreadyImported += 1;
        continue;
      }
      if (!autoImport) continue;
      try {
        await importRobloxUniverse({
          universeId: game.roblox_universe_id,
          placeId: game.roblox_place_id,
          discoverySource: source,
          discoveryRank: game.discovery_rank,
          sourceKeyword: game.title,
          enableTracking: body.enableTracking !== false,
        });
        imported += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Import failed";
        failures.push({ universeId: game.roblox_universe_id, error: message });
        if (message.toLowerCase().includes("rate limited")) break;
      }
      await pause(750);
    }

    return NextResponse.json({
      fetched: games.length,
      imported,
      skippedBelowCcu,
      skippedAlreadyImported,
      failures,
      source,
      minCcu,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Top game discovery failed";
    const status = message.toLowerCase().includes("rate limited") ? 429 : 502;
    return NextResponse.json({ error: message, source, minCcu }, { status });
  }
}
