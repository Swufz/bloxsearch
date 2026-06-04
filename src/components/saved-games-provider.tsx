"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SavedGamesContextValue = {
  ready: boolean;
  signedIn: boolean;
  isSaved: (key?: string) => boolean;
  markSaved: (key?: string) => void;
  markUnsaved: (key?: string) => void;
};

const SavedGamesContext = createContext<SavedGamesContextValue | null>(null);
const cacheKey = "bloxsearch:saved-game-universe-ids";

export function SavedGamesProvider({
  children,
  signedIn,
}: {
  children: React.ReactNode;
  signedIn: boolean;
}) {
  const [ids, setIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined" || !signedIn) return new Set();
    try {
      return new Set(
        JSON.parse(sessionStorage.getItem(cacheKey) ?? "[]") as string[],
      );
    } catch {
      return new Set();
    }
  });
  const [ready, setReady] = useState(!signedIn);

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    let cancelled = false;
    if (process.env.NODE_ENV === "development") console.time("saved IDs load");
    fetch("/api/saved-games")
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error("Failed to load saved games")),
      )
      .then((payload: { savedUniverseIds?: string[] }) => {
        if (cancelled) return;
        const nextIds = payload.savedUniverseIds ?? [];
        setIds(new Set(nextIds));
        sessionStorage.setItem(cacheKey, JSON.stringify(nextIds));
      })
      .catch(() => {
        if (!cancelled) sessionStorage.removeItem(cacheKey);
      })
      .finally(() => {
        if (process.env.NODE_ENV === "development")
          console.timeEnd("saved IDs load");
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const value = useMemo<SavedGamesContextValue>(
    () => ({
    ready,
    signedIn,
    isSaved(key) {
      return Boolean(signedIn && key && ids.has(key));
    },
      markSaved(key) {
        if (!key) return;
        setIds((current) => {
          const next = new Set(current);
          next.add(key);
          sessionStorage.setItem(cacheKey, JSON.stringify([...next]));
          return next;
        });
      },
      markUnsaved(key) {
        if (!key) return;
        setIds((current) => {
          const next = new Set(current);
          next.delete(key);
          sessionStorage.setItem(cacheKey, JSON.stringify([...next]));
          return next;
        });
      },
    }),
    [ids, ready, signedIn],
  );

  return (
    <SavedGamesContext.Provider value={value}>
      {children}
    </SavedGamesContext.Provider>
  );
}

export function useSavedGames() {
  return useContext(SavedGamesContext);
}
