import Link from "next/link";
import { ArrowRight, BarChart3, Bookmark, Check, Database, Search, Sparkles, Target, X } from "lucide-react";
import { Logo } from "@/components/logo";

const features = [
  [Search, "Outlier Finder", "Surface games performing above expectations for their age and niche."],
  [Target, "Opportunity Score", "Compare demand, growth, freshness, competition, and buildability."],
  [BarChart3, "Game Analysis", "Understand public stats, mechanics, monetization, and market risks."],
  [Sparkles, "Niche Signals", "See themes and mechanics that are repeatedly earning attention."],
  [Bookmark, "Saved Ideas", "Turn signals into an actionable backlog of original concepts."],
];

export default function Home() {
  return (
    <main className="grid-bg min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Logo /><div className="flex items-center gap-3"><Link href="/login" className="hidden text-sm text-slate-400 hover:text-white sm:block">Log in</Link><Link href="/dashboard" className="rounded-lg bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300">View demo</Link></div></nav>
      <section className="relative mx-auto max-w-5xl px-5 pb-24 pt-24 text-center md:pt-32">
        <div className="absolute left-1/2 top-0 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/5 px-3 py-1.5 text-xs text-sky-300"><Database size={13} />Roblox market intelligence for builders</span>
        <h1 className="text-gradient mx-auto mt-6 max-w-4xl text-5xl font-bold tracking-[-0.04em] md:text-7xl">Find Roblox game ideas before they blow up.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">BloxSearch tracks Roblox games, detects outliers, and helps developers discover high-potential niches backed by data.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-sky-300">Start finding ideas <ArrowRight size={16} /></Link><Link href="/outliers" className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 text-sm font-semibold hover:bg-slate-800">View demo</Link></div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20"><p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">How it works</p><div className="mt-9 grid gap-5 md:grid-cols-3">{[["01", "Track Roblox games", "Collect public experience stats and historical snapshots."], ["02", "Detect outliers", "Score unusual traction against age, niche, competition, and complexity."], ["03", "Generate buildable ideas", "Turn market signals into original concepts sized for small teams."]].map(([n, title, text]) => <div key={n} className="card p-6"><span className="text-sm font-bold text-sky-400">{n}</span><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>)}</div></section>
      <section className="mx-auto max-w-7xl px-5 py-20"><div className="mb-10 max-w-xl"><h2 className="text-3xl font-bold tracking-tight">A research workflow, not a random idea machine.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Every recommendation starts with public Roblox market data and an explainable opportunity score.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{features.map(([Icon, title, text]) => { const I = Icon as typeof Search; return <div key={title as string} className="card p-5"><I className="text-sky-400" size={20} /><h3 className="mt-5 font-semibold">{title as string}</h3><p className="mt-2 text-xs leading-5 text-slate-400">{text as string}</p></div>; })}</div></section>
      <section className="mx-auto max-w-4xl px-5 py-20"><div className="card panel-glow grid overflow-hidden md:grid-cols-2"><div className="border-b border-slate-800 p-7 md:border-b-0 md:border-r"><p className="text-sm font-semibold text-slate-400">Random AI ideas</p><div className="mt-6 space-y-4 text-sm text-slate-500">{["No proof of player demand", "Easy to generate, hard to validate", "Often too broad or too derivative"].map((x) => <p key={x} className="flex gap-2"><X size={16} className="text-red-400" />{x}</p>)}</div></div><div className="bg-sky-400/[0.03] p-7"><p className="text-sm font-semibold text-sky-400">Ideas backed by Roblox data</p><div className="mt-6 space-y-4 text-sm text-slate-300">{["Visible demand and freshness signals", "Explainable opportunity score", "Original concepts sized for builders"].map((x) => <p key={x} className="flex gap-2"><Check size={16} className="text-emerald-400" />{x}</p>)}</div></div></div></section>
      <footer className="border-t border-slate-800 px-5 py-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row"><span>BloxSearch. Find Roblox game ideas backed by live market data.</span><span>Use signals for inspiration. Never clone assets, names, maps, or UI.</span></div></footer>
    </main>
  );
}
