"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { useToast } from "./toast";

export function SaveGameButton({
  gameId,
  initiallySaved = false,
  signedIn = false,
  compact = true,
}: {
  gameId: string;
  initiallySaved?: boolean;
  signedIn?: boolean;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function toggle() {
    if (loading) return;
    if (!signedIn) {
      showToast("Sign in to save games and ideas");
      return;
    }
    const nextSaved = !saved;
    setSaved(nextSaved);
    setLoading(true);
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
      setSaved(!nextSaved);
      showToast(
        error instanceof Error ? error.message : "Game could not be saved",
      );
    } finally {
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
            ? `rounded-lg border px-3 py-2 text-xs font-semibold transition active:scale-95 disabled:cursor-wait ${saved ? "border-sky-400 bg-sky-400/10 text-sky-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`
            : `inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition active:scale-95 disabled:cursor-wait ${saved ? "border-sky-400 bg-sky-400/10 text-sky-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`
        }
        title={
          !signedIn
            ? "Sign in to save games and ideas."
            : saved
              ? "Unsave game"
              : "Save game"
        }
      >
        <Bookmark size={15} className={saved ? "fill-current" : ""} />
        {compact ? "" : loading ? "Saving..." : saved ? "Saved" : "Save game"}
      </button>
    </>
  );
}
