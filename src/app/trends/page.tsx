import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ensureProfile, getCurrentUser } from "@/lib/auth";
import { getDisplayGames } from "@/lib/data";
import { isMockMode } from "@/lib/mode";
import {
  getTopKeywordsByActivePlayers,
  getTopKeywordsByAverageAvgSession,
  getTopKeywordsByAverageLikeRatio,
} from "@/lib/trend-analysis";
import { formatNumber } from "@/lib/utils";

function GameRows({
  title,
  games,
  value,
}: {
  title: string;
  games: Awaited<ReturnType<typeof getDisplayGames>>;
  value: (game: Awaited<ReturnType<typeof getDisplayGames>>[number]) => string;
}) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {games.length ? (
          games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="flex items-center justify-between rounded-lg border border-slate-800 p-3 text-sm hover:bg-slate-800/60"
            >
              <span className="truncate text-slate-200">{game.title}</span>
              <span className="ml-3 text-xs font-semibold text-sky-300">
                {value(game)}
              </span>
            </Link>
          ))
        ) : (
          <p className="text-sm text-slate-400">Not enough tracked data yet.</p>
        )}
      </div>
    </section>
  );
}

export default async function TrendsPage() {
  const user = await getCurrentUser();
  if (user) await ensureProfile(user);
  const games = (await getDisplayGames()).filter(
    (game) => game.dataSource === "real",
  );
  const topKeywords = await getTopKeywordsByActivePlayers(8).catch(() => []);
  const topAvgSessionKeywords = await getTopKeywordsByAverageAvgSession(8).catch(
    () => [],
  );
  const topRatings = await getTopKeywordsByAverageLikeRatio(8).catch(() => []);
  const byAvgSession = games
    .filter((game) => game.metrics?.avgSession1d !== null && game.metrics?.avgSession1d !== undefined)
    .sort((a, b) => (b.metrics?.avgSession1d ?? 0) - (a.metrics?.avgSession1d ?? 0))
    .slice(0, 5);
  const byMomentum = games
    .filter((game) => game.metrics?.momentum1d !== null && game.metrics?.momentum1d !== undefined)
    .sort((a, b) => (b.metrics?.momentum1d ?? 0) - (a.metrics?.momentum1d ?? 0))
    .slice(0, 5);
  const byVisitGrowth = [...games]
    .sort((a, b) => (b.metrics?.visitGrowth1d ?? 0) - (a.metrics?.visitGrowth1d ?? 0))
    .slice(0, 5);
  const byAvgCcu = [...games]
    .sort((a, b) => (b.metrics?.avgCcu1d ?? 0) - (a.metrics?.avgCcu1d ?? 0))
    .slice(0, 5);

  return (
    <AppShell
      title="Trends"
      subtitle="Based on BloxSearch tracked dataset, not all of Roblox."
      demoMode={isMockMode()}
      userEmail={user?.email}
    >
      {games.length < 5 && (
        <div className="mb-5 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-orange-100/80">
          Trend confidence is low. Import and track more games to improve
          accuracy.
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        <GameRows
          title="Top games by Avg Session"
          games={byAvgSession}
          value={(game) => `${game.metrics?.avgSession1d} min`}
        />
        <GameRows
          title="Top games by Momentum"
          games={byMomentum}
          value={(game) => `${game.metrics?.momentum1d}%`}
        />
        <GameRows
          title="Top games by Visit Growth"
          games={byVisitGrowth}
          value={(game) => formatNumber(game.metrics?.visitGrowth1d ?? 0)}
        />
        <GameRows
          title="Top games by Avg CCU"
          games={byAvgCcu}
          value={(game) => formatNumber(game.metrics?.avgCcu1d ?? game.activePlayers)}
        />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Top keywords by average Avg Session</h2>
          <div className="mt-4 space-y-3">
            {topAvgSessionKeywords.length ? (
              topAvgSessionKeywords.map((row) => (
                <div
                  key={`${row.category}:${row.keyword}`}
                  className="rounded-lg border border-slate-800 p-3"
                >
                  <p className="text-sm font-semibold text-slate-200">
                    {row.keyword}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.category.replaceAll("_", " ")} · {row.games} games ·{" "}
                    {Math.round(row.averageAvgSession * 10) / 10} min Avg
                    Session
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">
                Not enough Avg Session data yet.
              </p>
            )}
          </div>
        </section>
        {[["Top keywords by total active players", topKeywords], ["Top keywords by average rating", topRatings]].map(([title, rows]) => (
          <section key={title as string} className="card p-5">
            <h2 className="font-semibold">{title as string}</h2>
            <div className="mt-4 space-y-3">
              {(rows as typeof topKeywords).length ? (
                (rows as typeof topKeywords).map((row) => (
                  <div
                    key={`${row.category}:${row.keyword}`}
                    className="rounded-lg border border-slate-800 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-200">
                      {row.keyword}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {row.category.replaceAll("_", " ")} · {row.games} games ·{" "}
                      {formatNumber(row.activePlayers)} active ·{" "}
                      {Math.round(row.averageLikeRatio * 10) / 10}% rating
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  No keyword signals yet.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
