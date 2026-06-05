import { NextResponse } from "next/server";
import { getDisplayGames } from "@/lib/data";
import {
  getTopKeywordsByActivePlayers,
  getTopKeywordsByAverageAvgSession,
  getTopKeywordsByAverageLikeRatio,
} from "@/lib/trend-analysis";

export async function GET() {
  const games = await getDisplayGames();
  const tracked = games.filter((game) => game.dataSource === "real");
  return NextResponse.json({
    label: "Based on BloxSearch tracked dataset, not all of Roblox.",
    datasetSize: tracked.length,
    topGamesByAvgSession: tracked
      .filter((game) => game.metrics?.avgSession1d !== null && game.metrics?.avgSession1d !== undefined)
      .sort((a, b) => (b.metrics?.avgSession1d ?? 0) - (a.metrics?.avgSession1d ?? 0))
      .slice(0, 10),
    topGamesByMomentum: tracked
      .filter((game) => game.metrics?.momentum1d !== null && game.metrics?.momentum1d !== undefined)
      .sort((a, b) => (b.metrics?.momentum1d ?? 0) - (a.metrics?.momentum1d ?? 0))
      .slice(0, 10),
    topGamesByVisitGrowth: tracked
      .sort((a, b) => (b.metrics?.visitGrowth1d ?? 0) - (a.metrics?.visitGrowth1d ?? 0))
      .slice(0, 10),
    topGamesByAvgCcu: tracked
      .sort((a, b) => (b.metrics?.avgCcu1d ?? 0) - (a.metrics?.avgCcu1d ?? 0))
      .slice(0, 10),
    topKeywordsByActivePlayers: await getTopKeywordsByActivePlayers(10).catch(() => []),
    topKeywordsByAverageAvgSession: await getTopKeywordsByAverageAvgSession(10).catch(() => []),
    topKeywordsByAverageRating: await getTopKeywordsByAverageLikeRatio(10).catch(() => []),
  });
}
