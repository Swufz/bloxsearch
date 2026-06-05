"use client";

import { BookmarkPlus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "./toast";

type TopIdea = {
  id?: string;
  rank: number;
  title: string;
  description: string;
  howPlayersPlay: string;
  trendFormula: string;
  dataSignals: string[];
  whyItCouldWork: string;
  differentFromExisting: string;
  potentialScore: number;
  potentialReason: string;
  originalityRisk: "Low" | "Medium" | "High";
  originalityReason: string;
  similarGames: Array<{
    title: string;
    universeId: string;
    activePlayers: number;
    visits: number;
  }>;
  difficulty: "Easy" | "Medium" | "Hard";
  monetizationOptions: string[];
  risks: string[];
  confidenceLevel: "Low" | "Medium" | "High";
  createdAt: string;
};

type DatasetSummary = {
  games: unknown[];
  clusters: unknown[];
  snapshotsCount: number;
  trackedGamesCount: number;
  gamesWithAvgSession: number;
  gamesWith24hTracking: number;
};

function riskClass(risk: TopIdea["originalityRisk"]) {
  if (risk === "Low")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (risk === "Medium")
    return "border-orange-400/30 bg-orange-400/10 text-orange-200";
  return "border-red-400/30 bg-red-400/10 text-red-200";
}

export function TopIdeasPanel({
  initialIdeas,
  initialDataset,
  signedIn,
}: {
  initialIdeas: TopIdea[];
  initialDataset: DatasetSummary;
  signedIn: boolean;
}) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [dataset, setDataset] = useState(initialDataset);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const { showToast } = useToast();
  const latestGenerated = ideas[0]?.createdAt ?? null;
  const lowConfidence =
    dataset.games.length < 8 ||
    dataset.snapshotsCount < 10 ||
    dataset.gamesWithAvgSession < 3;

  async function generate() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/generate-top-ideas", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ideas?: TopIdea[];
        dataset?: DatasetSummary;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Generation failed");
      setIdeas(payload.ideas ?? []);
      if (payload.dataset) setDataset(payload.dataset);
      showToast(`Generated ${(payload.ideas ?? []).length} top ideas`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveIdea(idea: TopIdea) {
    if (!signedIn) {
      showToast("Sign in to save ideas.");
      return;
    }
    if (saved.includes(idea.title)) return;
    try {
      const response = await fetch("/api/saved-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          niche: idea.trendFormula,
          difficulty: idea.difficulty,
          monetizationOptions: idea.monetizationOptions,
          opportunityScore: idea.potentialScore,
          notes: [
            `Originality risk: ${idea.originalityRisk}`,
            idea.originalityReason,
            idea.potentialReason,
            ...idea.dataSignals,
          ].join("\n\n"),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Error saving idea");
      setSaved((items) => [...items, idea.title]);
      showToast("Idea saved");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error saving idea");
    }
  }

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Dataset confidence</h2>
            <p className="mt-1 text-xs text-slate-500">
              {dataset.games.length} real games · {dataset.trackedGamesCount}{" "}
              tracked · {dataset.snapshotsCount} snapshots ·{" "}
              {dataset.clusters.length} trend clusters ·{" "}
              {dataset.gamesWithAvgSession} games with Avg Session ·{" "}
              {dataset.gamesWith24hTracking} games with 24h+ tracking
            </p>
            {latestGenerated && (
              <p className="mt-2 text-xs text-slate-500">
                Last generated {new Date(latestGenerated).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-60"
          >
            <Sparkles size={16} />
            {loading ? "Generating..." : "Generate Top Ideas"}
          </button>
        </div>
        {lowConfidence && (
          <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-sm text-orange-100/80">
            Confidence is low. Import and track more games to improve idea
            quality.
          </div>
        )}
      </section>

      {ideas.length ? (
        ideas.slice(0, 3).map((idea, index) => (
          <article key={`${idea.title}:${index}`} className="card p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-sky-400 px-3 py-1 text-xs font-black text-slate-950">
                    #{index + 1}
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Potential {idea.potentialScore}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskClass(idea.originalityRisk)}`}>
                    Originality risk: {idea.originalityRisk}
                  </span>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                    {idea.difficulty}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold">{idea.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {idea.description}
                </p>
              </div>
              <button
                onClick={() => saveIdea(idea)}
                disabled={saved.includes(idea.title)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                <BookmarkPlus size={14} />
                {saved.includes(idea.title) ? "Saved" : "Save idea"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {[
                ["How players play", idea.howPlayersPlay],
                ["Trend formula", idea.trendFormula],
                ["Why it could work", idea.whyItCouldWork],
                ["What makes it different", idea.differentFromExisting],
                ["Why this score?", idea.potentialReason],
                ["Originality reasoning", idea.originalityReason],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-800 p-3">
                  <p className="text-xs font-semibold text-slate-200">{label}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-xs font-semibold text-slate-200">
                  Data signals used
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-400">
                  {idea.dataSignals.map((signal) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-xs font-semibold text-slate-200">
                  Similar Roblox games found
                </p>
                <div className="mt-2 space-y-2 text-xs text-slate-400">
                  {idea.similarGames.length ? (
                    idea.similarGames.map((game) => (
                      <p key={game.universeId}>
                        {game.title} · {game.activePlayers.toLocaleString()} active
                      </p>
                    ))
                  ) : (
                    <p>No close public search matches found.</p>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-xs font-semibold text-slate-200">
                  Monetization & risks
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {idea.monetizationOptions.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-slate-400">
                  {idea.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))
      ) : (
        <div className="card p-12 text-center text-sm text-slate-400">
          Generate top ideas after importing and tracking real Roblox games.
        </div>
      )}
    </div>
  );
}
