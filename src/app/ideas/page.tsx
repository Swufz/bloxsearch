"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { IdeaCard } from "@/components/idea-card";
import { getSavedIdeas } from "@/lib/data";

export default function IdeasPage() {
  const [ideas, setIdeas] = useState(getSavedIdeas());
  return <AppShell title="Saved Ideas" subtitle="Your research-backed backlog of original Roblox concepts.">{ideas.length ? <div className="grid gap-4 lg:grid-cols-2">{ideas.map((idea) => <div key={idea.id}><div className="mb-2 flex items-center justify-between px-1 text-xs text-slate-500"><span>Inspired by {idea.inspiredBy} · {idea.niche} · Score {idea.opportunityScore}</span><button onClick={() => setIdeas((items) => items.filter((item) => item.id !== idea.id))} className="text-red-400 hover:text-red-300">Delete</button></div><IdeaCard idea={idea} showSave={false} /></div>)}</div> : <div className="card p-14 text-center"><h2 className="font-semibold">No saved ideas yet</h2><p className="mt-2 text-sm text-slate-400">Analyze an outlier game and save a direction worth prototyping.</p></div>}</AppShell>;
}
