import { Lightbulb, Sparkles } from "lucide-react";
import type { GeneratedIdea } from "@/lib/types";
import { SaveIdeaButton } from "./save-idea-button";

export function IdeaCard({
  idea,
  showSave = true,
  gameId,
  niche = "",
  opportunityScore = 0,
  signedIn = false,
}: {
  idea: GeneratedIdea;
  showSave?: boolean;
  gameId?: string;
  niche?: string;
  opportunityScore?: number;
  signedIn?: boolean;
}) {
  const potentialScore = idea.potentialScore ?? opportunityScore;
  const potentialReason =
    idea.potentialReason ??
    "This score reflects the source game's opportunity signal and how buildable the direction appears.";
  const howPlayersPlay = idea.howPlayersPlay ?? idea.coreLoop;
  const differentFromOriginal =
    idea.differentFromOriginal ??
    "Change the progression, theme, layout, UI, name, and economy before prototyping.";

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300">
            <Sparkles size={12} />
            Inspired idea
          </span>
          <h3 className="font-semibold">{idea.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300">
            {idea.difficulty}
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
            Potential {Math.round(potentialScore)}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{idea.concept}</p>
      <div className="mt-4 space-y-3 text-xs text-slate-400">
        <p>
          <strong className="text-slate-200">How players play:</strong>{" "}
          {howPlayersPlay}
        </p>
        <p>
          <strong className="text-slate-200">Why it could work:</strong>{" "}
          {idea.whyItCouldWork}
        </p>
        <p>
          <strong className="text-slate-200">What makes it different:</strong>{" "}
          {differentFromOriginal}
        </p>
        <p>
          <strong className="text-slate-200">Why this score?</strong>{" "}
          {potentialReason}
        </p>
        {idea.risk && (
          <p>
            <strong className="text-slate-200">Risk:</strong> {idea.risk}
          </p>
        )}
        <p>
          <strong className="text-slate-200">Scope:</strong> {idea.buildScope}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {idea.monetization.map((item) => (
          <span
            key={item}
            className="rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300"
          >
            {item}
          </span>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 text-xs leading-5 text-orange-200/80">
        <Lightbulb size={13} className="mr-1 inline" />
        {idea.avoidCloning}
      </div>
      {showSave && gameId && (
        <SaveIdeaButton
          gameId={gameId}
          idea={idea}
          niche={niche}
          opportunityScore={opportunityScore}
          signedIn={signedIn}
        />
      )}
    </div>
  );
}
