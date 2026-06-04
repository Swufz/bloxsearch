import { cn } from "@/lib/utils";

export function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const color = score >= 75 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : score >= 55 ? "border-orange-500/30 bg-orange-500/10 text-orange-400" : "border-slate-600 bg-slate-700/30 text-slate-300";
  return <span className={cn("inline-flex items-center rounded-full border font-bold", large ? "px-4 py-2 text-lg" : "px-2.5 py-1 text-xs", color)}>{score}</span>;
}
