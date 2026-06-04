import { notFound } from "next/navigation";
import Image from "next/image";
import {
  CalendarDays,
  ExternalLink,
  Heart,
  TrendingUp,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { GameCard } from "@/components/game-card";
import { IdeaCard } from "@/components/idea-card";
import { OpportunityBreakdown } from "@/components/opportunity-breakdown";
import { SaveGameButton } from "@/components/save-game-button";
import { SavedGamesProvider } from "@/components/saved-games-provider";
import { ScoreBadge } from "@/components/score-badge";
import { getGame, getGames } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/utils";
import { isMockMode } from "@/lib/mode";
import { ensureProfile, getCurrentUser } from "@/lib/auth";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (user) await ensureProfile(user);
  const game = getGame(id);
  if (!game) notFound();
  const demoMode = isMockMode();
  const similar = getGames()
    .filter((item) => item.id !== game.id && item.niche === game.niche)
    .slice(0, 3);
  return (
    <AppShell
      title="Game Analysis"
      subtitle="Explainable market signals and buildable directions."
      demoMode={demoMode}
      userEmail={user?.email}
    >
      <SavedGamesProvider signedIn={Boolean(user)}>
        <div className="card overflow-hidden">
          <div className="relative aspect-[3/1] min-h-56 bg-slate-900">
            <Image
              src={game.thumbnailUrl}
              alt=""
              fill
              unoptimized
              className="object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <div className="mb-3 flex flex-wrap gap-2">
                {[game.niche, ...game.tags].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-slate-900/80 px-2 py-1 text-[11px] text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {game.title}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                by {game.creatorName}
              </p>
            </div>
            <div className="absolute right-6 top-6">
              <ScoreBadge score={game.score.opportunity} large />
            </div>
          </div>
          <div className="grid gap-4 border-t border-slate-800 p-5 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [Users, "Active players", formatNumber(game.activePlayers)],
              [TrendingUp, "Visits", formatNumber(game.visits)],
              [Heart, "Like ratio", `${game.likeRatio}%`],
              [CalendarDays, "Created", formatDate(game.createdAtRoblox)],
              [CalendarDays, "Last updated", formatDate(game.updatedAtRoblox)],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof Users;
              return (
                <div key={label as string}>
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <I size={13} />
                    {label as string}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {value as string}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <section className="card p-6">
              <h2 className="font-semibold">Why this game may be working</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {game.description}
              </p>
              <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-200">
                {game.score.outlierReason}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Detected niche</p>
                  <p className="mt-1 text-sm font-medium">{game.niche}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Mechanics</p>
                  <p className="mt-1 text-sm font-medium">
                    {game.mechanics.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Monetization style</p>
                  <p className="mt-1 text-sm font-medium">
                    {game.monetizationTags.join(", ")}
                  </p>
                </div>
              </div>
            </section>
            <section className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Historical trend</h2>
                <span className="text-[11px] text-slate-500">
                  Placeholder until snapshots accumulate
                </span>
              </div>
              <div className="mt-8 flex h-48 items-end gap-2">
                {[20, 25, 23, 34, 42, 39, 51, 62, 58, 72, 80, 88].map(
                  (height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t bg-gradient-to-t from-sky-500/20 to-sky-400"
                      style={{ height: `${height}%` }}
                    />
                  ),
                )}
              </div>
            </section>
            <section>
              <div className="mb-4">
                <h2 className="font-semibold">
                  Buildable ideas inspired by this game
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Original directions based on the market signal, not the
                  game&apos;s assets or identity.
                </p>
              </div>
              <div className="grid gap-4">
                {game.ideas.map((idea) => (
                  <IdeaCard
                    key={idea.title}
                    idea={idea}
                    gameId={game.id}
                    niche={game.niche}
                    opportunityScore={game.score.opportunity}
                    signedIn={Boolean(user)}
                  />
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="card p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold">Opportunity score</h2>
                <ScoreBadge score={game.score.opportunity} />
              </div>
              <OpportunityBreakdown score={game.score} />
            </section>
            <section className="card p-6">
              <h2 className="font-semibold">Risks</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
                {game.score.risks.map((risk) => (
                  <li
                    key={risk}
                    className="border-l-2 border-orange-500/50 pl-3"
                  >
                    {risk}
                  </li>
                ))}
              </ul>
            </section>
            <a
              href={game.gameUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              View public Roblox page <ExternalLink size={15} />
            </a>
            <SaveGameButton
              gameId={game.id}
              savedKey={game.robloxUniverseId}
              signedIn={Boolean(user)}
              compact={false}
            />
          </aside>
        </div>
        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 font-semibold">Similar games</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((item) => (
                <GameCard key={item.id} game={item} signedIn={Boolean(user)} />
              ))}
            </div>
          </section>
        )}
        <p className="mt-10 text-center text-xs text-slate-500">
          Use these signals for inspiration. Do not clone assets, names, maps,
          UI, or copyrighted material from other games.
        </p>
      </SavedGamesProvider>
    </AppShell>
  );
}
