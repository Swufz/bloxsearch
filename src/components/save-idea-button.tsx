"use client";

import { BookmarkPlus } from "lucide-react";
import { useState } from "react";
import type { GeneratedIdea } from "@/lib/types";

export function SaveIdeaButton({
  gameId,
  idea,
  niche,
  opportunityScore,
  signedIn = false,
}: {
  gameId: string;
  idea: GeneratedIdea;
  niche: string;
  opportunityScore: number;
  signedIn?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!signedIn) {
      setMessage("Sign in to save ideas.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/saved-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          title: idea.title,
          description: idea.concept,
          niche,
          difficulty: idea.difficulty,
          monetizationOptions: idea.monetization,
          opportunityScore,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Error saving idea");
      setSaved(true);
      setMessage("Idea saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error saving");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={save}
        disabled={loading || saved}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BookmarkPlus size={14} />
        {saved ? "Saved" : "Save idea"}
      </button>
      {message && (
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs text-slate-200 shadow-xl">
          {message}
        </div>
      )}
    </div>
  );
}
