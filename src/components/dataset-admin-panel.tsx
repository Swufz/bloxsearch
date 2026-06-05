"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "./toast";
import type { DatasetSettings } from "@/lib/dataset-settings";

type Cluster = {
  id: string;
  name: string;
  formula_summary: string | null;
  games_count: number;
  total_active_players: number;
  avg_like_ratio: number;
  avg_session: number | null;
  momentum: number | null;
  confidence_level: string;
};

type ArchivedGame = {
  id: string;
  title: string;
  active_players: number | null;
  low_ccu_streak: number | null;
  archive_reason: string | null;
  archived_at: string | null;
};

export function DatasetAdminPanel({
  settings,
  clusters,
  archivedGames,
}: {
  settings: DatasetSettings;
  clusters: Cluster[];
  archivedGames: ArchivedGame[];
}) {
  const [rules, setRules] = useState(settings);
  const [source, setSource] = useState("top_games");
  const [limit, setLimit] = useState("25");
  const [minCcu, setMinCcu] = useState(String(settings.minImportCcu));
  const [autoImport, setAutoImport] = useState(true);
  const [enableTracking, setEnableTracking] = useState(true);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  async function post(endpoint: string, body?: unknown) {
    setLoading(endpoint);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Action failed");
      return payload;
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed");
      throw error;
    } finally {
      setLoading(null);
    }
  }

  async function saveSettings() {
    const payload = await post("/api/admin/dataset-settings", rules);
    showToast("Dataset rules saved");
    setRules(payload.data ?? rules);
  }

  async function discoverTopGames() {
    const payload = await post("/api/admin/discover-top-games", {
      source,
      limit: Number(limit),
      minCcu: Number(minCcu),
      autoImport,
      enableTracking,
    });
    setSummary(payload);
    showToast(`Imported ${payload.imported ?? 0} games`);
  }

  async function refreshClusters() {
    const payload = await post("/api/admin/trend-clusters");
    showToast(payload.message ?? "Trend clusters updated");
  }

  async function expandCluster(clusterId: string) {
    const payload = await post("/api/admin/expand-trend-clusters", {
      clusterId,
      minCcu: Number(minCcu),
    });
    showToast(`Expanded cluster: imported ${payload.imported ?? 0}`);
  }

  async function unarchive(gameId: string) {
    await post("/api/admin/unarchive-game", { gameId });
    showToast("Game unarchived");
  }

  return (
    <>
      <section className="card p-6 lg:col-span-2">
        <h2 className="font-semibold">Dataset Rules</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["Minimum import CCU", "minImportCcu"],
            ["Minimum tracking CCU", "minTrackCcu"],
            ["Low CCU archive threshold", "lowCcuArchiveThreshold"],
            ["Low CCU snapshot streak", "lowCcuSnapshotStreak"],
          ].map(([label, key]) => (
            <label key={key} className="text-xs text-slate-400">
              {label}
              <input
                type="number"
                value={String(rules[key as keyof DatasetSettings])}
                onChange={(event) =>
                  setRules((current) => ({
                    ...current,
                    [key]: Number(event.target.value),
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
            </label>
          ))}
          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={rules.autoArchiveEnabled}
              onChange={(event) =>
                setRules((current) => ({
                  ...current,
                  autoArchiveEnabled: event.target.checked,
                }))
              }
            />
            Auto-archive enabled
          </label>
        </div>
        <button
          onClick={saveSettings}
          disabled={Boolean(loading)}
          className="mt-4 rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
        >
          Save settings
        </button>
      </section>

      <section className="card p-6 lg:col-span-2">
        <h2 className="font-semibold">Top Game Discovery</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
            <option value="top_games">Top Games</option>
            <option value="trending">Trending</option>
            <option value="popular">Popular</option>
          </select>
          <select value={limit} onChange={(e) => setLimit(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm">
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <input value={minCcu} onChange={(e) => setMinCcu(e.target.value)} type="number" className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={autoImport} onChange={(e) => setAutoImport(e.target.checked)} /> Auto-import</label>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={enableTracking} onChange={(e) => setEnableTracking(e.target.checked)} /> Enable tracking</label>
          <button onClick={discoverTopGames} disabled={Boolean(loading)} className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60">Discover Top Games</button>
        </div>
        {summary && (
          <pre className="mt-4 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
            {JSON.stringify(summary, null, 2)}
          </pre>
        )}
      </section>

      <section className="card p-6 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Trend Clusters</h2>
          <button onClick={refreshClusters} disabled={Boolean(loading)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200">Refresh clusters</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {clusters.map((cluster) => (
            <div key={cluster.id} className="rounded-lg border border-slate-800 p-3 text-xs text-slate-400">
              <p className="text-sm font-semibold text-slate-200">{cluster.name}</p>
              <p className="mt-1">{cluster.formula_summary}</p>
              <p className="mt-2">{cluster.games_count} games · {cluster.total_active_players.toLocaleString()} active · {Math.round(Number(cluster.avg_like_ratio ?? 0) * 10) / 10}% rating</p>
              <p className="mt-1">Avg Session: {cluster.avg_session ?? "unknown"} · Momentum: {cluster.momentum ?? "unknown"} · {cluster.confidence_level}</p>
              <div className="mt-3 flex gap-2">
                <Link href={`/trends/clusters/${cluster.id}`} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200">View cluster</Link>
                <button onClick={() => expandCluster(cluster.id)} className="rounded-lg bg-sky-400 px-3 py-2 font-semibold text-slate-950">Expand cluster</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 lg:col-span-2">
        <h2 className="font-semibold">Archived / Low CCU Games</h2>
        <div className="mt-4 space-y-3">
          {archivedGames.length ? archivedGames.map((game) => (
            <div key={game.id} className="flex flex-col gap-2 rounded-lg border border-slate-800 p-3 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
              <span>{game.title} · {game.active_players ?? 0} active · streak {game.low_ccu_streak ?? 0} · {game.archive_reason}</span>
              <button onClick={() => unarchive(game.id)} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200">Unarchive</button>
            </div>
          )) : <p className="text-sm text-slate-400">No archived games yet.</p>}
        </div>
      </section>
    </>
  );
}
