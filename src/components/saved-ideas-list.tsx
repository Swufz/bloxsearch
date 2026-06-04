"use client";

import { useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import type { SavedIdea } from "@/lib/types";

export function SavedIdeasList({ initialIdeas, demoMode = false }: { initialIdeas: SavedIdea[]; demoMode?: boolean }) {
  const [ideas, setIdeas] = useState(initialIdeas);

  if (!ideas.length) {
    return <div className="card p-14 text-center"><h2 className="font-semibold">No saved ideas yet</h2><p className="mt-2 text-sm text-slate-400">Analyze an outlier game and save a direction worth prototyping.</p></div>;
  }

  return <div className="grid gap-4 lg:grid-cols-2">{ideas.map((idea) => <div key={idea.id}><div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-500"><span>Inspired by {idea.inspiredBy} · {idea.niche} · Score {idea.opportunityScore}</span><button disabled={demoMode} title={demoMode ? "Saving requires login. Demo browsing is available." : "Delete saved idea"} onClick={() => setIdeas((items) => items.filter((item) => item.id !== idea.id))} className="text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40">Delete</button></div><IdeaCard idea={idea} showSave={false} demoMode={demoMode} /></div>)}</div>;
}
