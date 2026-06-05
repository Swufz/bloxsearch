import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getDatasetSettings } from "@/lib/dataset-settings";
import { isMockMode } from "@/lib/mode";
import { searchRobloxGamesByKeyword } from "@/lib/roblox";
import { importRobloxUniverse } from "@/lib/roblox-import";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertTrendClusters } from "@/lib/trend-clustering";

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ClusterRow = {
  id: string;
  growth_mechanic: string | null;
  goal_format: string | null;
  theme: string | null;
  input_hook: string | null;
  primary_keyword: string | null;
};

function phrases(cluster: ClusterRow) {
  return [
    [cluster.growth_mechanic, cluster.goal_format].filter(Boolean).join(" "),
    [cluster.input_hook, cluster.goal_format].filter(Boolean).join(" "),
    [cluster.theme, cluster.goal_format].filter(Boolean).join(" "),
    [cluster.primary_keyword, cluster.theme].filter(Boolean).join(" "),
  ].filter((phrase, index, all) => phrase && all.indexOf(phrase) === index);
}

export async function POST(request: Request) {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    clusterId?: string;
    limitPerKeyword?: number;
    minCcu?: number;
  };
  const settings = await getDatasetSettings();
  const minCcu = Number.isFinite(Number(body.minCcu))
    ? Number(body.minCcu)
    : settings.minImportCcu;
  const limitPerKeyword = Math.min(
    Math.max(Math.round(Number(body.limitPerKeyword ?? 10)), 1),
    settings.maxKeywordResultsPerRun,
    50,
  );
  const admin = createSupabaseAdminClient();
  const query = admin
    .from("trend_clusters")
    .select("id, growth_mechanic, goal_format, theme, input_hook, primary_keyword")
    .order("total_active_players", { ascending: false })
    .limit(body.clusterId ? 1 : 5);
  const { data: clusters, error } = body.clusterId
    ? await query.eq("id", body.clusterId)
    : await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let imported = 0;
  let skippedBelowCcu = 0;
  const failures: Array<{ keyword: string; error: string }> = [];
  for (const cluster of (clusters ?? []) as ClusterRow[]) {
    for (const keyword of phrases(cluster)) {
      try {
        const results = await searchRobloxGamesByKeyword(keyword, limitPerKeyword);
        for (const result of results) {
          if (result.activePlayers < minCcu) {
            skippedBelowCcu += 1;
            continue;
          }
          const saved = await importRobloxUniverse({
            universeId: result.universeId,
            placeId: result.placeId,
            sourceKeyword: keyword,
            discoverySource: "keyword",
            enableTracking: true,
          });
          await admin.from("trend_cluster_games").upsert(
            {
              cluster_id: cluster.id,
              game_id: saved.id,
              similarity_score: 75,
              matched_keywords: keyword.split(" "),
            },
            { onConflict: "cluster_id,game_id" },
          );
          imported += 1;
          await pause(750);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Expansion failed";
        failures.push({ keyword, error: message });
        if (message.toLowerCase().includes("rate limited")) break;
      }
      await pause(500);
    }
  }
  await upsertTrendClusters().catch(() => null);
  return NextResponse.json({
    imported,
    skippedBelowCcu,
    failures,
    minCcu,
    clustersChecked: clusters?.length ?? 0,
  });
}
