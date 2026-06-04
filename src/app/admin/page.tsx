import {
  Activity,
  CheckCircle2,
  Database,
  RefreshCw,
  Server,
  Trash2,
} from "lucide-react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ImportRobloxGameForm } from "@/components/import-roblox-game-form";
import { getCurrentUser } from "@/lib/auth";
import { getCollectionLogs, getGames } from "@/lib/data";
import { isMockMode } from "@/lib/mode";

export default async function AdminPage() {
  const logs = getCollectionLogs();
  const user = await getCurrentUser();
  const mockMode = isMockMode();
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!mockMode && !admins.includes(user?.email?.toLowerCase() ?? ""))
    redirect("/dashboard");
  return (
    <AppShell
      title="Admin & Data Tools"
      subtitle="Manage demo data collection and scoring. Admin writes should use the Supabase service role on the server."
      demoMode={mockMode}
      userEmail={user?.email}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["System status", "Operational", Server],
          ["Data mode", "Mock Roblox data", Database],
          ["Games ready", String(getGames().length), Activity],
        ].map(([label, value, Icon]) => {
          const I = Icon as typeof Server;
          return (
            <div key={label as string} className="card p-5">
              <I size={18} className="text-emerald-400" />
              <p className="mt-4 text-xs text-slate-500">{label as string}</p>
              <p className="mt-1 font-semibold">{value as string}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className="card p-6">
          <h2 className="font-semibold">Data actions</h2>
          <div className="mt-5 space-y-3">
            <button className="flex w-full items-center justify-between rounded-lg border border-slate-700 px-4 py-3 text-left text-sm hover:bg-slate-800">
              <span className="flex items-center gap-2">
                <Database size={15} className="text-sky-400" />
                Seed mock data
              </span>
              <span className="text-xs text-slate-500">
                POST /api/admin/seed
              </span>
            </button>
            <button className="flex w-full items-center justify-between rounded-lg border border-slate-700 px-4 py-3 text-left text-sm hover:bg-slate-800">
              <span className="flex items-center gap-2">
                <RefreshCw size={15} className="text-sky-400" />
                Score all games
              </span>
              <span className="text-xs text-slate-500">
                POST /api/admin/score-games
              </span>
            </button>
            <div className="rounded-lg border border-slate-700 p-3">
              <label className="text-xs text-slate-400">
                Fetch one Roblox universe ID
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  placeholder="Universe ID"
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
                <button className="rounded-lg bg-sky-400 px-3 text-xs font-semibold text-slate-950">
                  Fetch
                </button>
              </div>
            </div>
            <ImportRobloxGameForm />
            <button className="flex w-full items-center gap-2 rounded-lg border border-red-500/20 px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/5">
              <Trash2 size={15} />
              Clear mock data
            </button>
          </div>
        </section>
        <section className="card p-6">
          <h2 className="font-semibold">Recent collection logs</h2>
          <div className="mt-5 space-y-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex gap-3 border-b border-slate-800 pb-4 last:border-0"
              >
                <CheckCircle2 size={15} className="mt-0.5 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium">
                    {log.action.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{log.message}</p>
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
