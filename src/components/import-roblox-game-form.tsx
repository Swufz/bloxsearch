"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "./toast";

type ImportResult = {
  id?: string;
  title?: string;
};

export function ImportRobloxGameForm() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  async function importGame() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/import-roblox-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        data?: ImportResult;
      };
      if (!response.ok) throw new Error(payload.error ?? "Import failed");
      setResult(payload.data ?? null);
      showToast(payload.message ?? "Roblox game imported");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 p-3">
      <label className="text-xs text-slate-400">
        Roblox game URL or Place ID
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="https://www.roblox.com/games/95082159892680/..."
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-400"
        />
        <button
          onClick={importGame}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Importing..." : "Import Roblox Game"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {result?.id && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">
          Imported {result.title ?? "Roblox game"}.{" "}
          <Link
            href={`/games/${result.id}`}
            className="font-semibold text-sky-300"
          >
            Analyze
          </Link>
        </div>
      )}
    </div>
  );
}
