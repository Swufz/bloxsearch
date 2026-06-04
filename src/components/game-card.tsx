import Link from "next/link";
import Image from "next/image";
import { Bookmark, CalendarDays, CircleUserRound, Heart, TrendingUp, Users } from "lucide-react";
import type { Game } from "@/lib/types";
import { daysAgo, formatNumber } from "@/lib/utils";
import { ScoreBadge } from "./score-badge";

export function GameCard({ game }: { game: Game }) {
  return (
    <article className="card overflow-hidden transition hover:-translate-y-0.5 hover:border-slate-600">
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {/* Public thumbnails can replace this placeholder URL when live Roblox fetching is enabled. */}
        <Image src={game.thumbnailUrl} alt="" fill unoptimized loading="eager" className="object-cover opacity-90" />
        <div className="absolute right-3 top-3"><ScoreBadge score={game.score.opportunity} large /></div>
      </div>
      <div className="p-4">
        <div className="mb-3"><h3 className="truncate font-semibold">{game.title}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CircleUserRound size={13} />{game.creatorName}</p></div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><Users size={14} className="text-sky-400" />{formatNumber(game.activePlayers)} active</span>
          <span className="flex items-center gap-1.5"><TrendingUp size={14} className="text-emerald-400" />{formatNumber(game.visits)} visits</span>
          <span className="flex items-center gap-1.5"><Heart size={14} className="text-orange-400" />{game.likeRatio}% liked</span>
          <span className="flex items-center gap-1.5"><CalendarDays size={14} />{daysAgo(game.createdAtRoblox)} days old</span>
        </div>
        <div className="my-4 flex flex-wrap gap-1.5">{[game.niche, ...game.tags].slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300">{tag}</span>)}</div>
        <p className="min-h-10 text-xs leading-5 text-slate-400">{game.score.outlierReason}</p>
        <div className="mt-4 flex gap-2"><Link href={`/games/${game.id}`} className="flex-1 rounded-lg bg-sky-400 px-3 py-2 text-center text-xs font-semibold text-slate-950 hover:bg-sky-300">Analyze</Link><button className="rounded-lg border border-slate-700 px-3 text-slate-300 hover:bg-slate-800" title="Save game"><Bookmark size={15} /></button></div>
      </div>
    </article>
  );
}
