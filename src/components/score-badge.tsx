import { cn } from "@/lib/utils";

export function ScoreBadge({ score, large = false }: { score: number; large?: boolean }) {
  const color =
    score >= 75
      ? "border-emerald-400/60 text-emerald-300 shadow-emerald-950/50"
      : score >= 55
        ? "border-orange-300/60 text-orange-200 shadow-orange-950/40"
        : "border-slate-400/50 text-white shadow-slate-950/50";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border bg-slate-950/90 font-black leading-none shadow-lg backdrop-blur-sm",
        large ? "min-h-12 min-w-12 px-4 py-2 text-xl" : "px-2.5 py-1 text-xs",
        color,
      )}
    >
      {score}
    </span>
  );
}
