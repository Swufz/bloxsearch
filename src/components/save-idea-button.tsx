"use client";

import { BookmarkPlus } from "lucide-react";
import { useState } from "react";
import type { GeneratedIdea } from "@/lib/types";
import { useToast } from "./toast";

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
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  async function save() {
    if (loading || saved) return;
    if (!signedIn) {
      showToast("Sign in to save games and ideas");
      return;
    }
    setSaved(true);
    setLoading(true);
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
      showToast("Idea saved");
    } catch (error) {
      setSaved(false);
      showToast(error instanceof Error ? error.message : "Error saving");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={save}
        disabled={loading || saved}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BookmarkPlus size={14} />
        {loading ? "Saving..." : saved ? "Saved" : "Save idea"}
      </button>
    </>
  );
}
