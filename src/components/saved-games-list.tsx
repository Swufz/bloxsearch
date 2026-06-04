"use client";

import Link from "next/link";
import { BookmarkX } from "lucide-react";
import { useState } from "react";
import type { SavedGame } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ScoreBadge } from "./score-badge";

export function SavedGamesList({
  initialGames,
}: {
  initialGames: SavedGame[];
}) {
  const [games, setGames] = useState(initialGames);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { showToast } = useToast();

  async function unsave(game: SavedGame) {
    if (pendingId) return;
    setPendingId(game.id);
    const previous = games;
    setGames((items) => items.filter((item) => item.id !== game.id));
    const response = await fetch(
      `/api/saved-games/${encodeURIComponent(game.databaseGameId)}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setGames(previous);
      showToast("Game could not be saved");
      setPendingId(null);
      return;
    }
    showToast("Game removed");
    setPendingId(null);
  }

  if (!games.length) {
    return (
      <div className="card p-8 text-center text-sm text-slate-400">
        No saved games yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {games.map((game) => (
        <div
          key={game.id}
          className="card flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{game.title}</h3>
              {game.opportunityScore !== null && (
                <ScoreBadge score={game.opportunityScore} />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">by {game.creatorName}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
              <span>{formatNumber(game.activePlayers)} active players</span>
              <span>{formatNumber(game.visits)} visits</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/games/${game.gameId}`}
              className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-300"
            >
              Analyze
            </Link>
            <button
              onClick={() => unsave(game)}
              disabled={pendingId === game.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800 active:scale-95 disabled:cursor-wait disabled:opacity-60"
            >
              <BookmarkX size={14} />
              Unsave
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
