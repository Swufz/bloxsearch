"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "./toast";

type DiscoveryResult = {
  id?: string;
  title?: string;
  creator_name?: string;
  creatorName?: string;
  active_players?: number;
  activePlayers?: number;
  visits?: number;
  roblox_universe_id?: string;
  universeId?: string;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  source_keyword?: string;
  sourceKeyword?: string;
  already_imported?: boolean;
  alreadyImported?: boolean;
};

function formatNumber(value: number | undefined) {
  return Number(value ?? 0).toLocaleString();
}

export function DiscoveryAdminPanel() {
  const [keyword, setKeyword] = useState("+1 speed");
  const [limit, setLimit] = useState("25");
  const [minCcu, setMinCcu] = useState("100");
  const [allowBelowThreshold, setAllowBelowThreshold] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<"discover" | "import" | null>(null);
  const [error, setError] = useState("");
  const selectAllRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const selectedCount = selectedGameIds.length;
  const selectableIds = useMemo(
    () =>
      results
        .filter((result) => {
          const imported = result.already_imported ?? result.alreadyImported;
          const below =
            Number(result.active_players ?? result.activePlayers ?? 0) <
            Number(minCcu || 0);
          return !imported && (allowBelowThreshold || !below);
        })
        .map((result) => result.id)
        .filter((id): id is string => Boolean(id)),
    [allowBelowThreshold, minCcu, results],
  );
  const allSelectableSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedGameIds.includes(id));
  const someSelectableSelected =
    selectedGameIds.length > 0 && !allSelectableSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelectableSelected;
    }
  }, [someSelectableSelected]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[discovery] selected IDs", selectedGameIds);
    }
  }, [selectedGameIds]);

  async function discover() {
    setLoading("discover");
    setError("");
    setResults([]);
    setSelectedGameIds([]);
    try {
      const response = await fetch("/api/admin/discover-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, limit: Number(limit) }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        discoveryRunId?: string;
        results?: DiscoveryResult[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error ?? "Discovery failed");
      setRunId(payload.discoveryRunId ?? null);
      setResults(payload.results ?? []);
      if (process.env.NODE_ENV === "development") {
        console.log("[discovery] results count", (payload.results ?? []).length);
      }
      showToast(`Discovered ${(payload.results ?? []).length} games`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Discovery failed";
      setError(message);
      showToast(message);
    } finally {
      setLoading(null);
    }
  }

  async function importGames(ids: string[], enableTracking = true) {
    if (!runId || !ids.length) return;
    const payloadBody = {
      discoveryRunId: runId,
          gameIds: ids,
          enableTracking,
          minCcu: Number(minCcu),
          allowBelowThreshold,
        };
    if (process.env.NODE_ENV === "development") {
      console.log("[discovery] import payload", payloadBody);
    }
    setLoading("import");
    setError("");
    try {
      const response = await fetch("/api/admin/import-discovered-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        importedCount?: number;
        failures?: Array<{ error: string }>;
        skippedBelowCcu?: Array<{ id: string }>;
        error?: string;
      };
      if (!response.ok) {
        const failure = payload.failures?.[0]?.error;
        throw new Error(payload.error ?? failure ?? "Import failed");
      }
      const failedCount = payload.failures?.length ?? 0;
      const skippedCount = payload.skippedBelowCcu?.length ?? 0;
      setResults((items) =>
        items.map((item) =>
          item.id && ids.includes(item.id)
            ? { ...item, already_imported: true }
            : item,
        ),
      );
      setSelectedGameIds([]);
      showToast(
        failedCount
          ? `Imported ${payload.importedCount ?? 0} games, ${failedCount} failed.`
          : skippedCount
            ? `Imported ${payload.importedCount ?? 0} games, ${skippedCount} skipped below CCU limit.`
          : `Imported ${payload.importedCount ?? 0} games.`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setError(message);
      showToast(message);
    } finally {
      setLoading(null);
    }
  }

  function toggle(id: string) {
    setSelectedGameIds((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  }

  function toggleAll() {
    setSelectedGameIds(allSelectableSelected ? [] : selectableIds);
  }

  return (
    <section className="card p-6 lg:col-span-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-semibold">Discover Roblox Games</h2>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="+1 speed"
              className="min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-400 sm:w-72"
            />
            <select
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-400"
            >
              <option value="10">10 results</option>
              <option value="25">25 results</option>
              <option value="50">50 results</option>
            </select>
            <input
              value={minCcu}
              onChange={(event) => setMinCcu(event.target.value)}
              type="number"
              min="0"
              placeholder="Min CCU"
              className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-400"
            />
            <label className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={allowBelowThreshold}
                onChange={(event) => setAllowBelowThreshold(event.target.checked)}
              />
              Allow below-threshold imports
            </label>
            <button
              onClick={discover}
              disabled={Boolean(loading) || !keyword.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-60"
            >
              <Search size={14} />
              {loading === "discover" ? "Discovering..." : "Discover Games"}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => importGames(selectedGameIds)}
            disabled={loading !== null || !selectedCount}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Import selected
          </button>
          <button
            onClick={() => importGames(selectableIds)}
            disabled={loading !== null || !selectableIds.length}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Import all
          </button>
          <button
            onClick={() => importGames(selectedGameIds, true)}
            disabled={loading !== null || !selectedCount}
            className="rounded-lg bg-sky-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-300 disabled:opacity-60"
          >
            Import selected + enable tracking
          </button>
        </div>
      </div>
      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      {results.length ? (
        <div className="mt-5">
          <div className="mb-3 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>Selected: {selectedCount}</p>
            {!selectableIds.length && (
              <p className="text-amber-300">
                All discovered games are already imported. No new games to
                import from this search.
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="px-2 py-2">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allSelectableSelected}
                    disabled={!selectableIds.length}
                    onChange={toggleAll}
                    aria-label="Select all non-imported discovered games"
                  />
                </th>
                <th className="px-2 py-2">Game</th>
                <th className="px-2 py-2">Creator</th>
                <th className="px-2 py-2">Active</th>
                <th className="px-2 py-2">Visits</th>
                <th className="px-2 py-2">Universe ID</th>
                <th className="px-2 py-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const id = result.id ?? "";
                const imported = result.already_imported ?? result.alreadyImported;
                const belowCcu =
                  Number(result.active_players ?? result.activePlayers ?? 0) <
                  Number(minCcu || 0);
                const selectable = Boolean(
                  id && !imported && (allowBelowThreshold || !belowCcu),
                );
                return (
                  <tr key={id || result.roblox_universe_id} className="border-t border-slate-800">
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={Boolean(id && selectedGameIds.includes(id))}
                        disabled={!selectable}
                        onChange={() => id && toggle(id)}
                        aria-label={`Select ${result.title ?? "discovered game"}`}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        {result.thumbnail_url || result.thumbnailUrl ? (
                          <Image
                            src={result.thumbnail_url ?? result.thumbnailUrl ?? ""}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-slate-800" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-200">
                            {result.title}
                          </p>
                          {imported && (
                            <p className="mt-1 text-[11px] text-emerald-300">
                              Already imported
                            </p>
                          )}
                          {!imported && belowCcu && (
                            <p className="mt-1 text-[11px] text-amber-300">
                              Below CCU limit
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-slate-400">
                      {result.creator_name ?? result.creatorName}
                    </td>
                    <td className="px-2 py-3 text-slate-400">
                      {formatNumber(result.active_players ?? result.activePlayers)}
                    </td>
                    <td className="px-2 py-3 text-slate-400">
                      {formatNumber(result.visits)}
                    </td>
                    <td className="px-2 py-3 text-slate-400">
                      {result.roblox_universe_id ?? result.universeId}
                    </td>
                    <td className="px-2 py-3 text-slate-400">
                      {result.source_keyword ?? result.sourceKeyword}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
