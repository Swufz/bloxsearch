"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { useSavedGames } from "./saved-games-provider";
import { useToast } from "./toast";

export function SaveGameButton({
  gameId,
  savedKey,
  initiallySaved = false,
  signedIn = false,
  compact = true,
}: {
  gameId: string;
  savedKey?: string;
  initiallySaved?: boolean;
  signedIn?: boolean;
  compact?: boolean;
}) {
  const savedGames = useSavedGames();
  const effectiveSignedIn = savedGames?.signedIn ?? signedIn;
  const saved = savedGames ? savedGames.isSaved(savedKey) : initiallySaved;
  const [localSaved, setLocalSaved] = useState(initiallySaved);
  const displayedSaved = savedGames ? saved : localSaved;
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function toggle() {
    if (loading) return;
    if (!effectiveSignedIn) {
      showToast("Sign in to save games and ideas");
      return;
    }
    const nextSaved = !displayedSaved;
    if (savedGames) {
      if (nextSaved) savedGames.markSaved(savedKey);
      else savedGames.markUnsaved(savedKey);
    } else {
      setLocalSaved(nextSaved);
    }
    setLoading(true);
    if (process.env.NODE_ENV === "development")
      console.time("save request duration");
    try {
      const response = await fetch(
        !nextSaved
          ? `/api/saved-games/${encodeURIComponent(gameId)}`
          : "/api/saved-games",
        {
          method: !nextSaved ? "DELETE" : "POST",
          headers: !nextSaved
            ? undefined
            : { "Content-Type": "application/json" },
          body: !nextSaved ? undefined : JSON.stringify({ gameId }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(payload.error ?? "Game could not be saved");
      showToast(nextSaved ? "Game saved" : "Game removed");
    } catch (error) {
      if (savedGames) {
        if (nextSaved) savedGames.markUnsaved(savedKey);
        else savedGames.markSaved(savedKey);
      } else {
        setLocalSaved(!nextSaved);
      }
      showToast(
        error instanceof Error ? error.message : "Game could not be saved",
      );
    } finally {
      if (process.env.NODE_ENV === "development")
        console.timeEnd("save request duration");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={toggle}
        disabled={loading}
        className={
          compact
            ? `rounded-lg border px-3 py-2 text-xs font-semibold transition active:scale-95 disabled:cursor-wait ${displayedSaved ? "border-sky-400 bg-sky-400/10 text-sky-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`
            : `inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition active:scale-95 disabled:cursor-wait ${displayedSaved ? "border-sky-400 bg-sky-400/10 text-sky-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`
        }
        title={
          !effectiveSignedIn
            ? "Sign in to save games and ideas."
            : displayedSaved
              ? "Unsave game"
              : "Save game"
        }
      >
        <Bookmark size={15} className={displayedSaved ? "fill-current" : ""} />
        {compact
          ? ""
          : loading
            ? "Saving..."
            : displayedSaved
              ? "Saved"
              : "Save game"}
      </button>
    </>
  );
}
