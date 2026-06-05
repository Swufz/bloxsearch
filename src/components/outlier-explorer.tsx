"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Game } from "@/lib/types";
import { GameCard } from "./game-card";
import { daysAgo } from "@/lib/utils";

export function OutlierExplorer({
  initialGames,
  signedIn = false,
}: {
  initialGames: Game[];
  signedIn?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minActive, setMinActive] = useState("");
  const [maxActive, setMaxActive] = useState("");
  const [minVisits, setMinVisits] = useState("");
  const [minLikes, setMinLikes] = useState("");
  const [createdWithin, setCreatedWithin] = useState("");
  const [updatedWithin, setUpdatedWithin] = useState("");
  const [niche, setNiche] = useState("");
  const [monetization, setMonetization] = useState("");
  const [dataSource, setDataSource] = useState("");
  const [sourceKeyword, setSourceKeyword] = useState("");
  const [trackingStatus, setTrackingStatus] = useState("");
  const [sort, setSort] = useState("opportunity");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 180);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const niches = useMemo(
    () => [...new Set(initialGames.map((game) => game.niche))].sort(),
    [initialGames],
  );
  const sourceKeywords = useMemo(
    () =>
      [
        ...new Set(
          initialGames.map((game) => game.sourceKeyword).filter(Boolean),
        ),
      ].sort() as string[],
    [initialGames],
  );

  const games = useMemo(() => {
    const searchText = debouncedSearch.toLowerCase();
    const filtered = initialGames.filter(
      (game) =>
        game.title.toLowerCase().includes(searchText) &&
        (!minActive || game.activePlayers >= Number(minActive)) &&
        (!maxActive || game.activePlayers <= Number(maxActive)) &&
        (!minVisits || game.visits >= Number(minVisits)) &&
        (!minLikes || game.likeRatio >= Number(minLikes)) &&
        (!createdWithin ||
          daysAgo(game.createdAtRoblox) <= Number(createdWithin)) &&
        (!updatedWithin ||
          daysAgo(game.updatedAtRoblox) <= Number(updatedWithin)) &&
        (!niche || game.niche === niche) &&
        (!monetization || game.monetizationTags.includes(monetization)) &&
        (!dataSource || game.dataSource === dataSource) &&
        (!sourceKeyword || game.sourceKeyword === sourceKeyword) &&
        (!trackingStatus ||
          (trackingStatus === "enabled"
            ? game.trackingEnabled
            : !game.trackingEnabled)),
    );
    return [...filtered].sort((a, b) =>
      sort === "active"
        ? b.activePlayers - a.activePlayers
        : sort === "visits"
          ? b.visits - a.visits
          : sort === "likes"
            ? b.likeRatio - a.likeRatio
            : sort === "newest"
              ? +new Date(b.createdAtRoblox) - +new Date(a.createdAtRoblox)
              : sort === "updated"
                ? +new Date(b.updatedAtRoblox) - +new Date(a.updatedAtRoblox)
                : b.score.opportunity - a.score.opportunity,
    );
  }, [
    initialGames,
    debouncedSearch,
    minActive,
    maxActive,
    minVisits,
    minLikes,
    createdWithin,
    updatedWithin,
    niche,
    monetization,
    dataSource,
    sourceKeyword,
    trackingStatus,
    sort,
  ]);

  const inputClass =
    "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-sky-400";
  return (
    <>
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={16} className="text-sky-400" />
          Filters
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className={inputClass}
          />
          <input
            value={minActive}
            onChange={(e) => setMinActive(e.target.value)}
            type="number"
            placeholder="Min active players"
            className={inputClass}
          />
          <input
            value={maxActive}
            onChange={(e) => setMaxActive(e.target.value)}
            type="number"
            placeholder="Max active players"
            className={inputClass}
          />
          <input
            value={minVisits}
            onChange={(e) => setMinVisits(e.target.value)}
            type="number"
            placeholder="Minimum visits"
            className={inputClass}
          />
          <input
            value={minLikes}
            onChange={(e) => setMinLikes(e.target.value)}
            type="number"
            placeholder="Minimum like ratio"
            className={inputClass}
          />
          <select
            value={createdWithin}
            onChange={(e) => setCreatedWithin(e.target.value)}
            className={inputClass}
          >
            <option value="">Any created date</option>
            {[30, 90, 180, 365].map((x) => (
              <option key={x} value={x}>
                Created within {x} days
              </option>
            ))}
          </select>
          <select
            value={updatedWithin}
            onChange={(e) => setUpdatedWithin(e.target.value)}
            className={inputClass}
          >
            <option value="">Any updated date</option>
            {[7, 30, 90].map((x) => (
              <option key={x} value={x}>
                Updated within {x} days
              </option>
            ))}
          </select>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className={inputClass}
          >
            <option value="">All themes / niches</option>
            {niches.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            value={monetization}
            onChange={(e) => setMonetization(e.target.value)}
            className={inputClass}
          >
            <option value="">All monetization</option>
            <option value="pets">Pets</option>
            <option value="boosts">Boosts</option>
            <option value="vip">VIP</option>
            <option value="cosmetics">Cosmetics</option>
          </select>
          <select
            value={dataSource}
            onChange={(e) => setDataSource(e.target.value)}
            className={inputClass}
          >
            <option value="">All data sources</option>
            <option value="real">Real Roblox Data</option>
            <option value="mock">Demo Data</option>
          </select>
          <select
            value={sourceKeyword}
            onChange={(e) => setSourceKeyword(e.target.value)}
            className={inputClass}
          >
            <option value="">All source keywords</option>
            {sourceKeywords.map((keyword) => (
              <option key={keyword} value={keyword}>
                {keyword}
              </option>
            ))}
          </select>
          <select
            value={trackingStatus}
            onChange={(e) => setTrackingStatus(e.target.value)}
            className={inputClass}
          >
            <option value="">All tracking status</option>
            <option value="enabled">Tracking enabled</option>
            <option value="disabled">Not tracking</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={inputClass}
          >
            <option value="opportunity">Sort: Opportunity score</option>
            <option value="active">Active players</option>
            <option value="visits">Visit velocity</option>
            <option value="likes">Like ratio</option>
            <option value="newest">Newest</option>
            <option value="updated">Most recently updated</option>
          </select>
        </div>
      </div>
      <div className="my-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          <strong className="text-white">{games.length}</strong> games found
        </p>
        <p className="text-xs text-slate-500">
          Scores are explainable estimates from public data
        </p>
      </div>
      {games.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} signedIn={signedIn} />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-sm text-slate-400">
          No games match these filters. Try widening your search.
        </div>
      )}
    </>
  );
}
