"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";

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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!signedIn) {
      setMessage("Sign in to save games and ideas.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        saved
          ? `/api/saved-games/${encodeURIComponent(gameId)}`
          : "/api/saved-games",
        {
          method: saved ? "DELETE" : "POST",
          headers: saved ? undefined : { "Content-Type": "application/json" },
          body: saved ? undefined : JSON.stringify({ gameId }),
        },
      );
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Error saving");
      setSaved(!saved);
      setMessage(saved ? "Game removed" : "Game saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error saving");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={loading}
        className={
          compact
            ? `rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-wait ${saved ? "border-sky-400 bg-sky-400/10 text-sky-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`
            : `inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition disabled:cursor-wait ${saved ? "border-sky-400 bg-sky-400/10 text-sky-300" : "border-slate-700 text-slate-300 hover:bg-slate-800"}`
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
        {compact ? "" : saved ? "Saved" : "Save game"}
      </button>
      {message && (
        <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 shadow-xl">
          {message}
        </div>
      )}
    </div>
  );
}
