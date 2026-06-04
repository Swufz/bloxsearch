"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bookmark, Menu, Search, Settings, X } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/outliers", label: "Outlier Finder", icon: Search },
  { href: "/ideas", label: "Saved Ideas", icon: Bookmark },
  { href: "/admin", label: "Admin", icon: Settings },
];

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#0B0F19]">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-800 bg-[#0B0F19] p-5 transition-transform lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between"><Logo /><button className="lg:hidden" onClick={() => setOpen(false)}><X size={20} /></button></div>
        <nav className="mt-9 space-y-1">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", pathname === href || pathname.startsWith(`${href}/`) ? "bg-sky-400/10 text-sky-400" : "text-slate-400 hover:bg-slate-800/60 hover:text-white")}><Icon size={17} />{label}</Link>)}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400">
          <p className="font-semibold text-slate-200">Mock data mode</p>
          <p className="mt-1">Connect Supabase and Roblox public APIs when you are ready.</p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-[#0B0F19]/90 px-4 backdrop-blur md:px-8">
          <button className="text-slate-400 lg:hidden" onClick={() => setOpen(true)}><Menu /></button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-400 sm:inline">Demo workspace</span><span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-xs font-bold text-slate-950">BS</span></div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 md:p-8">
          <div className="mb-7"><h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>{subtitle && <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>}</div>
          {children}
        </main>
      </div>
    </div>
  );
}
