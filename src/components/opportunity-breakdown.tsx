import type { ScoreBreakdown, ScoreExplanation } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

const fallbackRows: Array<[keyof ScoreBreakdown, string]> = [
  ["demand", "Demand"],
  ["growth", "Growth"],
  ["freshness", "Freshness"],
  ["competition", "Competition"],
  ["buildability", "Buildability"],
  ["monetization", "Monetization"],
];

export function OpportunityBreakdown({
  score,
  explanations,
}: {
  score: ScoreBreakdown;
  explanations?: ScoreExplanation[];
}) {
  if (explanations?.length) {
    return (
      <div className="space-y-3">
        {explanations.map((item) => (
          <details
            key={item.key}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {item.label} score
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Confidence: {item.confidence}
                  </p>
                </div>
                <span className="text-sm font-bold text-sky-300">
                  {item.score}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </summary>
            <div className="mt-3 space-y-3 text-xs leading-5 text-slate-400">
              <div>
                <p className="font-semibold text-slate-200">Why this score?</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {item.why.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
              <p>
                <strong className="text-slate-200">Inputs used:</strong>{" "}
                {item.inputs.join(", ")}
              </p>
              <p>
                <strong className="text-slate-200">Formula:</strong>{" "}
                {item.formula}
              </p>
              {item.similarGames?.length ? (
                <div>
                  <p className="font-semibold text-slate-200">
                    Similar games used
                  </p>
                  <ul className="mt-1 space-y-1">
                    {item.similarGames.map((game) => (
                      <li key={game.id}>
                        {game.title} - {formatNumber(game.activePlayers)} active
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {fallbackRows.map(([key, label]) => {
        const value = score[key] as number;
        return <div key={key}><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-400">{label}{key === "growth" && score.growthEstimated ? " (estimated)" : ""}</span><span className="font-semibold">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" style={{ width: `${value}%` }} /></div></div>;
      })}
    </div>
  );
}
