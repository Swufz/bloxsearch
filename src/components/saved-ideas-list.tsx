"use client";

import { useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import { useToast } from "@/components/toast";
import type { SavedIdea } from "@/lib/types";

export function SavedIdeasList({
  initialIdeas,
}: {
  initialIdeas: SavedIdea[];
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const { showToast } = useToast();

  async function deleteIdea(id: string) {
    const previous = ideas;
    setIdeas((items) => items.filter((item) => item.id !== id));
    const response = await fetch(`/api/saved-ideas/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setIdeas(previous);
      showToast("Error deleting idea");
      return;
    }
    showToast("Idea deleted");
  }

  if (!ideas.length) {
    return (
      <div className="card p-14 text-center">
        <h2 className="font-semibold">No saved ideas yet.</h2>
        <p className="mt-2 text-sm text-slate-400">
          Analyze a game and save a generated direction.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {ideas.map((idea) => (
          <div key={idea.id}>
            <div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-500">
              <span>
                Inspired by {idea.inspiredBy} | {idea.niche} | Score{" "}
                {idea.opportunityScore}
              </span>
              <button
                title="Delete saved idea"
                onClick={() => deleteIdea(idea.id)}
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
            <IdeaCard idea={idea} showSave={false} />
          </div>
        ))}
      </div>
    </>
  );
}
