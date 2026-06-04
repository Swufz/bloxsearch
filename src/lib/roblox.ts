import type { Game } from "./types";
import { generateIdeas } from "./idea-generator";
import { scoreGame } from "./scoring";
import { mockGames } from "./mock-data";

const MOCK_MODE = process.env.MOCK_ROBLOX_MODE !== "false";

export async function safeFetchWithRetry(url: string, attempts = 3): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": "BloxSearch-MVP/1.0" }, next: { revalidate: 600 } });
      if (!response.ok) throw new Error(`Roblox request failed with ${response.status}`);
      return response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    }
  }
  throw lastError;
}

export function normalizeRobloxGameData(raw: Record<string, unknown>): Game {
  const universeId = String(raw.id ?? raw.universeId ?? "");
  const created = String(raw.created ?? new Date().toISOString());
  const updated = String(raw.updated ?? created);
  const base = {
    id: universeId,
    robloxUniverseId: universeId,
    robloxPlaceId: String(raw.rootPlaceId ?? ""),
    title: String(raw.name ?? "Untitled Roblox Experience"),
    description: String(raw.description ?? ""),
    creatorName: String((raw.creator as Record<string, unknown> | undefined)?.name ?? "Unknown creator"),
    creatorId: String((raw.creator as Record<string, unknown> | undefined)?.id ?? ""),
    creatorType: String((raw.creator as Record<string, unknown> | undefined)?.type ?? ""),
    thumbnailUrl: `https://placehold.co/720x405/111827/38BDF8?text=${encodeURIComponent(String(raw.name ?? "Roblox Experience"))}`,
    gameUrl: `https://www.roblox.com/games/${String(raw.rootPlaceId ?? "")}`,
    activePlayers: Number(raw.playing ?? 0),
    visits: Number(raw.visits ?? 0),
    favorites: Number(raw.favoritedCount ?? 0),
    upvotes: 0,
    downvotes: 0,
    likeRatio: 0,
    maxPlayers: Number(raw.maxPlayers ?? 0),
    createdAtRoblox: created,
    updatedAtRoblox: updated,
    firstSeenAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
    tags: ["Unclassified"],
    niche: "Unclassified",
    mechanics: ["progression"],
    monetizationTags: ["cosmetics"],
  };
  return { ...base, score: scoreGame(base), ideas: generateIdeas(base) };
}

export async function fetchGameByUniverseId(universeId: string): Promise<Game> {
  if (MOCK_MODE) return mockGames.find((game) => game.robloxUniverseId === universeId) ?? mockGames[0];
  // Roblox public endpoint URLs and response shapes may change; keep adjustments isolated here.
  const raw = await safeFetchWithRetry(`https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(universeId)}`) as { data?: Record<string, unknown>[] };
  if (!raw.data?.[0]) throw new Error("Roblox game not found");
  return normalizeRobloxGameData(raw.data[0]);
}

export async function fetchGameByPlaceId(placeId: string): Promise<Game> {
  if (MOCK_MODE) return mockGames.find((game) => game.robloxPlaceId === placeId) ?? mockGames[0];
  const universe = await safeFetchWithRetry(`https://apis.roblox.com/universes/v1/places/${encodeURIComponent(placeId)}/universe`) as { universeId?: number };
  if (!universe.universeId) throw new Error("Roblox universe not found");
  return fetchGameByUniverseId(String(universe.universeId));
}
