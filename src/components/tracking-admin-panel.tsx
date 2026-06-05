"use client";

import { useState } from "react";
import { useToast } from "./toast";

type TrackingGame = {
  id: string;
  title: string;
  universeId: string | null;
  trackingEnabled: boolean;
  lastSnapshotAt: string | null;
  nextSnapshotAt: string | null;
  snapshotCount: number;
};

type TrackingStats = {
  trackedGamesCount: number;
  snapshotsCount: number;
  gamesWith1dMetrics: number;
  gamesWith7dMetrics: number;
  latestSnapshotAt: string | null;
};

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString() : "None yet";
}

export function TrackingAdminPanel({
  games,
  stats,
}: {
  games: TrackingGame[];
  stats: TrackingStats;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  async function post(endpoint: string, gameId?: string) {
    setLoading(`${endpoint}:${gameId ?? "global"}`);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: gameId ? { "Content-Type": "application/json" } : undefined,
        body: gameId ? JSON.stringify({ gameId }) : undefined,
      });
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Action failed");
      showToast(payload.message ?? "Tracking action complete");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="card p-6 lg:col-span-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-semibold">Tracking</h2>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Metrics like Avg Session require at least 2 snapshots and become
            more accurate after 24h+ of tracking.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => post("/api/admin/collect-snapshots")}
            disabled={Boolean(loading)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Collect due snapshots
          </button>
          <button
            onClick={() => post("/api/admin/calculate-metrics")}
            disabled={Boolean(loading)}
            className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-60"
          >
            Recalculate all metrics
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {[
          ["Tracked games", stats.trackedGamesCount],
          ["Snapshots", stats.snapshotsCount],
          ["1d metrics", stats.gamesWith1dMetrics],
          ["7d metrics", stats.gamesWith7dMetrics],
          ["Latest snapshot", formatTime(stats.latestSnapshotAt)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-800 p-3">
            <p className="text-[11px] text-slate-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {String(value)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {games.length ? (
          games.map((game) => (
            <div
              key={game.id}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    {game.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Universe {game.universeId} ·{" "}
                    {game.trackingEnabled ? "Tracking on" : "Tracking off"} ·{" "}
                    {game.snapshotCount} snapshots
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Last: {formatTime(game.lastSnapshotAt)} · Next:{" "}
                    {formatTime(game.nextSnapshotAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => post("/api/admin/track-game", game.id)}
                    disabled={Boolean(loading)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                  >
                    Enable tracking
                  </button>
                  <button
                    onClick={() => post("/api/admin/untrack-game", game.id)}
                    disabled={Boolean(loading)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                  >
                    Disable tracking
                  </button>
                  <button
                    onClick={() => post("/api/admin/refresh-game", game.id)}
                    disabled={Boolean(loading)}
                    className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-60"
                  >
                    Collect snapshot now
                  </button>
                  <button
                    onClick={() => post("/api/admin/calculate-metrics")}
                    disabled={Boolean(loading)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                  >
                    Recalculate metrics
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-slate-800 p-4 text-sm text-slate-400">
            No real imported games yet.
          </p>
        )}
      </div>
    </section>
  );
}
