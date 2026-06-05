import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ensureProfile, getCurrentUser } from "@/lib/auth";
import { isMockMode } from "@/lib/mode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatNumber } from "@/lib/utils";

export default async function TrendClusterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (user) await ensureProfile(user);
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const [{ data: cluster }, { data: links }] = await Promise.all([
    admin.from("trend_clusters").select("*").eq("id", id).maybeSingle(),
    admin
      .from("trend_cluster_games")
      .select("similarity_score, matched_keywords, games(id, title, active_players, visits, like_ratio, source_keyword, game_scores(opportunity_score), roblox_game_metrics(avg_session_1d, avg_ccu_1d, momentum_1d))")
      .eq("cluster_id", id)
      .order("similarity_score", { ascending: false }),
  ]);

  const games = (links ?? []).map((row) => ({
    similarity: row.similarity_score,
    matchedKeywords: row.matched_keywords ?? [],
    game: Array.isArray(row.games) ? row.games[0] : row.games,
  }));
  const repeatedKeywords = [
    ...new Set(games.flatMap((row) => row.matchedKeywords ?? [])),
  ].slice(0, 12);
  const searchPhrases = [
    [cluster?.growth_mechanic, cluster?.goal_format].filter(Boolean).join(" "),
    [cluster?.input_hook, cluster?.goal_format].filter(Boolean).join(" "),
    [cluster?.theme, cluster?.goal_format].filter(Boolean).join(" "),
    [cluster?.primary_keyword, cluster?.theme].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <AppShell
      title={cluster?.name ?? "Trend Cluster"}
      subtitle="Based on BloxSearch imported and tracked dataset."
      demoMode={isMockMode()}
      userEmail={user?.email}
    >
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Games", cluster?.games_count ?? 0],
          ["Active players", formatNumber(cluster?.total_active_players ?? 0)],
          ["Visits", formatNumber(cluster?.total_visits ?? 0)],
          ["Avg rating", `${Math.round(Number(cluster?.avg_like_ratio ?? 0) * 10) / 10}%`],
          ["Avg Session", cluster?.avg_session ?? "Unknown"],
          ["Momentum", cluster?.momentum ?? "Unknown"],
        ].map(([label, value]) => (
          <div key={label as string} className="card p-4">
            <p className="text-xs text-slate-500">{label as string}</p>
            <p className="mt-2 font-semibold text-slate-100">{String(value)}</p>
          </div>
        ))}
      </div>
      <section className="card mt-5 p-5">
        <h2 className="font-semibold">Formula</h2>
        <p className="mt-2 text-sm text-slate-300">{cluster?.formula_summary}</p>
        <p className="mt-3 text-xs text-slate-500">
          Confidence: {cluster?.confidence_level ?? "low"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {repeatedKeywords.map((keyword) => (
            <span key={keyword} className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300">
              {keyword}
            </span>
          ))}
        </div>
      </section>
      <section className="card mt-5 p-5">
        <h2 className="font-semibold">Related search phrases</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {searchPhrases.map((phrase) => (
            <span key={phrase} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
              {phrase}
            </span>
          ))}
        </div>
      </section>
      <section className="card mt-5 p-5">
        <h2 className="font-semibold">Generated idea signals</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>This cluster has {cluster?.games_count ?? 0} games with {formatNumber(cluster?.total_active_players ?? 0)} total active players.</li>
          <li>Average rating is {Math.round(Number(cluster?.avg_like_ratio ?? 0) * 10) / 10}%.</li>
          <li>Avg Session is {cluster?.avg_session ? "available from snapshots" : "not available yet"}.</li>
          <li>Momentum is {cluster?.momentum ? "available from snapshots" : "unknown based on current snapshots"}.</li>
        </ul>
      </section>
      <section className="card mt-5 p-5">
        <h2 className="font-semibold">Games in cluster</h2>
        <div className="mt-4 space-y-3">
          {games.map(({ game, similarity }) =>
            game ? (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-800 p-3 text-sm hover:bg-slate-800/60"
              >
                <span>{game.title}</span>
                <span className="text-xs text-sky-300">
                  {formatNumber(game.active_players ?? 0)} active · similarity {similarity}
                </span>
              </Link>
            ) : null,
          )}
        </div>
      </section>
    </AppShell>
  );
}
