"use client";

import { Database, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "./toast";

const actions = [
  {
    label: "Recalculate keyword signals",
    endpoint: "/api/admin/keyword-signals",
    icon: Database,
  },
  {
    label: "Recalculate scores",
    endpoint: "/api/admin/score-games",
    icon: RefreshCw,
  },
];

export function AdminActions() {
  const [loading, setLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  async function runAction(endpoint: string) {
    setLoading(endpoint);
    try {
      const response = await fetch(endpoint, { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Action failed");
      showToast(payload.message ?? "Admin action complete");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      {actions.map(({ label, endpoint, icon: Icon }) => (
        <button
          key={endpoint}
          onClick={() => runAction(endpoint)}
          disabled={Boolean(loading)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-700 px-4 py-3 text-left text-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            <Icon size={15} className="text-sky-400" />
            {label}
          </span>
          <span className="text-xs text-slate-500">
            {loading === endpoint ? "Running..." : "POST"}
          </span>
        </button>
      ))}
    </div>
  );
}
