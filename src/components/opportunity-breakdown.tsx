import type { ScoreBreakdown } from "@/lib/types";

const rows: Array<[keyof ScoreBreakdown, string]> = [
  ["demand", "Demand"], ["growth", "Growth"], ["freshness", "Freshness"], ["competition", "Competition"], ["buildability", "Buildability"], ["monetization", "Monetization"],
];

export function OpportunityBreakdown({ score }: { score: ScoreBreakdown }) {
  return (
    <div className="space-y-4">
      {rows.map(([key, label]) => {
        const value = score[key] as number;
        return <div key={key}><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-400">{label}{key === "growth" && score.growthEstimated ? " (estimated)" : ""}</span><span className="font-semibold">{value}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400" style={{ width: `${value}%` }} /></div></div>;
      })}
    </div>
  );
}
