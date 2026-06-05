import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import {
  CalendarDays,
  CircleUserRound,
  Heart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Game } from "@/lib/types";
import { analyzeTrendFormula } from "@/lib/trend-analysis";
import { daysAgo, formatNumber } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { SaveGameButton } from "./save-game-button";

function shortTag(label: string) {
  const normalized = label
    .replace(/^cluster:\s*/i, "")
    .replace(/^imported from:\s*/i, "")
    .replace(/low competition opportunity/i, "low comp")
    .replace(/high momentum trend/i, "momentum")
    .replace(/top games/i, "top game")
    .trim()
    .toLowerCase();
  if (normalized.length <= 14) return normalized;
  return normalized
    .replace("simulator", "sim")
    .replace("competition", "comp")
    .replace("collection", "collect")
    .replace("keyboard", "keys")
    .slice(0, 14)
    .trim();
}

function addUnique(tags: string[], value?: string | null) {
  if (!value) return;
  const tag = shortTag(value);
  if (!tag || tag.includes("imported from") || tags.includes(tag)) return;
  tags.push(tag);
}

function getResearchTags(game: Game) {
  const trend = analyzeTrendFormula(game);
  const tags: string[] = [];
  addUnique(tags, trend.growthMechanic);
  addUnique(tags, trend.goalFormat);
  addUnique(tags, trend.theme);
  addUnique(tags, trend.inputHook === "general input" ? null : trend.inputHook);

  if (game.metrics?.momentum1d && game.metrics.momentum1d >= 15) {
    addUnique(tags, "momentum");
  }
  if (game.score.competition >= 70) addUnique(tags, "low comp");
  if (game.discoverySource === "top_games") addUnique(tags, "top game");
  if (game.discoverySource === "trending") addUnique(tags, "trending");
  if (game.discoverySource === "popular") addUnique(tags, "popular");

  for (const fallback of [
    game.niche,
    ...game.mechanics,
    ...game.tags,
    ...game.monetizationTags,
  ]) {
    if (tags.length >= 4) break;
    addUnique(tags, fallback);
  }
  return tags.slice(0, 4);
}

export const GameCard = memo(function GameCard({
  game,
  signedIn = false,
  initiallySaved = false,
}: {
  game: Game;
  signedIn?: boolean;
  initiallySaved?: boolean;
}) {
  const avgSession =
    game.metrics?.avgSession1d ?? game.metrics?.avgSession7d ?? null;
  const avgCcu = game.metrics?.avgCcu1d ?? null;
  const momentum = game.metrics?.momentum1d ?? game.metrics?.momentum7d ?? null;
  const researchTags = getResearchTags(game);
  return (
    <article className="card overflow-hidden transition hover:-translate-y-0.5 hover:border-slate-600">
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {/* Public thumbnails can replace this placeholder URL when live Roblox fetching is enabled. */}
        <Image
          src={game.thumbnailUrl}
          alt=""
          fill
          unoptimized
          loading="eager"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-slate-950/75 via-slate-950/35 to-transparent" />
        <div className="absolute right-3 top-3 z-10">
          <ScoreBadge score={game.score.opportunity} large />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-3">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${game.dataSource === "real" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}
          >
            {game.dataSource === "real" ? "Real Roblox Data" : "Demo Data"}
          </span>
        </div>
        <div className="mb-3">
          <h3 className="truncate font-semibold">{game.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <CircleUserRound size={13} />
            {game.creatorName}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-sky-400" />
            {formatNumber(game.activePlayers)} active
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-400" />
            {formatNumber(game.visits)} visits
          </span>
          <span className="flex items-center gap-1.5">
            <Heart size={14} className="text-orange-400" />
            {game.likeRatio}% liked
          </span>
          <span className="flex items-center gap-1.5">
            <Star size={14} className="text-yellow-300" />
            {formatNumber(game.favorites)} favorites
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={14} />
            Updated {daysAgo(game.updatedAtRoblox)}d ago
          </span>
          <span
            className="flex items-center gap-1.5"
            title="Calculated from tracked player activity and visit growth."
          >
            Avg Session:{" "}
            {avgSession === null ? "Not enough data" : `${avgSession}m`}
          </span>
          <span className="flex items-center gap-1.5">
            Avg CCU 1d:{" "}
            {avgCcu === null ? "Not enough data" : formatNumber(avgCcu)}
          </span>
          <span className="flex items-center gap-1.5">
            Momentum:{" "}
            {momentum === null ? "Not enough data" : `${momentum}%`}
          </span>
        </div>
        <div className="my-4 flex max-w-full flex-wrap gap-1.5">
          {researchTags.map((tag) => (
            <span
              key={tag}
              className="max-w-full truncate rounded-full border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-medium leading-none text-slate-300"
              title={tag}
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="min-h-10 text-xs leading-5 text-slate-400">
          {game.score.outlierReason}
        </p>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/games/${game.id}`}
            className="flex-1 rounded-lg bg-sky-400 px-3 py-2 text-center text-xs font-semibold text-slate-950 hover:bg-sky-300"
          >
            Analyze
          </Link>
          <SaveGameButton
            gameId={game.id}
            savedKey={game.robloxUniverseId}
            signedIn={signedIn}
            initiallySaved={initiallySaved}
          />
        </div>
      </div>
    </article>
  );
});
