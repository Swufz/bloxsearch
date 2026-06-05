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
import { daysAgo, formatNumber } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";
import { SaveGameButton } from "./save-game-button";

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
        <div className="absolute right-3 top-3">
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
          {game.sourceKeyword && (
            <span className="ml-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-300">
              Imported from: {game.sourceKeyword}
            </span>
          )}
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
        <div className="my-4 flex flex-wrap gap-1.5">
          {[game.niche, ...game.tags].slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300"
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
