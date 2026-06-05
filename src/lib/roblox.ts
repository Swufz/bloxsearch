import { generateIdeas } from "./idea-generator";
import { scoreGame } from "./scoring";
import type { Game, RobloxSearchResult } from "./types";

export async function safeFetchWithRetry(
  url: string,
  attempts = 3,
): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "BloxSearch-MVP/1.0" },
        next: { revalidate: 600 },
      });
      if (!response.ok)
        throw new Error(`Roblox request failed with ${response.status}`);
      return response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    }
  }
  throw lastError;
}

export function extractRobloxPlaceId(input: string): string | null {
  const value = input.trim();
  if (/^\d+$/.test(value)) return value;
  const match =
    value.match(/roblox\.com\/games\/(\d+)/i) ??
    value.match(/[?&]placeId=(\d+)/i);
  return match?.[1] ?? null;
}

export async function fetchUniverseIdFromPlaceId(
  placeId: string,
): Promise<string> {
  const primary = (await safeFetchWithRetry(
    `https://apis.roblox.com/universes/v1/places/${encodeURIComponent(placeId)}/universe`,
  ).catch(() => null)) as { universeId?: number | string } | null;
  if (primary?.universeId) return String(primary.universeId);

  const fallback = (await safeFetchWithRetry(
    `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${encodeURIComponent(placeId)}`,
  )) as
    | Array<{ universeId?: number | string }>
    | { data?: Array<{ universeId?: number | string }> };
  const details = Array.isArray(fallback) ? fallback[0] : fallback.data?.[0];
  if (details?.universeId) return String(details.universeId);
  throw new Error("Could not resolve Roblox universe ID for that place ID.");
}

export async function fetchRobloxGameByUniverseId(
  universeId: string,
): Promise<Record<string, unknown>> {
  const raw = (await safeFetchWithRetry(
    `https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(universeId)}`,
  )) as { data?: Record<string, unknown>[] };
  if (!raw.data?.[0]) throw new Error("Roblox game not found.");
  return raw.data[0];
}

export type RobloxVoteData = {
  upVotes: number;
  downVotes: number;
};

export async function fetchRobloxGameVotes(
  universeId: string,
): Promise<RobloxVoteData | null> {
  try {
    const raw = (await safeFetchWithRetry(
      `https://games.roblox.com/v1/games/votes?universeIds=${encodeURIComponent(universeId)}`,
    )) as {
      data?: Array<{ id?: number | string; upVotes?: number; downVotes?: number }>;
    };
    const votes = raw.data?.find((item) => String(item.id) === universeId) ?? raw.data?.[0];
    if (!votes) return null;
    return {
      upVotes: Number(votes.upVotes ?? 0),
      downVotes: Number(votes.downVotes ?? 0),
    };
  } catch (error) {
    console.error("[roblox] Failed to fetch game votes", { universeId, error });
    return null;
  }
}

export async function fetchRobloxGameIcon(
  universeId: string,
): Promise<string | null> {
  const raw = (await safeFetchWithRetry(
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${encodeURIComponent(universeId)}&size=512x512&format=Png&isCircular=false`,
  ).catch(() => null)) as {
    data?: Array<{ imageUrl?: string; state?: string }>;
  } | null;
  return raw?.data?.[0]?.imageUrl ?? null;
}

export async function fetchRobloxGameIcons(
  universeIds: string[],
): Promise<Map<string, string>> {
  if (!universeIds.length) return new Map();
  const raw = (await safeFetchWithRetry(
    `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeIds.map(encodeURIComponent).join(",")}&size=512x512&format=Png&isCircular=false`,
  ).catch(() => null)) as {
    data?: Array<{ targetId?: number | string; imageUrl?: string }>;
  } | null;
  return new Map(
    (raw?.data ?? [])
      .filter((item) => item.targetId && item.imageUrl)
      .map((item) => [String(item.targetId), String(item.imageUrl)]),
  );
}

export function normalizeRobloxSearchResult(
  raw: Record<string, unknown>,
  sourceKeyword = "",
  thumbnailUrl?: string | null,
): RobloxSearchResult | null {
  const universeId = raw.universeId ?? raw.contentId;
  const placeId = raw.rootPlaceId;
  if (!universeId) return null;
  const upvotes = Number(raw.totalUpVotes ?? raw.upVotes ?? 0);
  const downvotes = Number(raw.totalDownVotes ?? raw.downVotes ?? 0);
  return {
    title: String(raw.name ?? raw.title ?? "Untitled Roblox Experience"),
    universeId: String(universeId),
    placeId: placeId ? String(placeId) : "",
    creatorName: String(raw.creatorName ?? "Unknown creator"),
    creatorId: String(raw.creatorId ?? ""),
    thumbnailUrl: thumbnailUrl ?? null,
    activePlayers: Number(raw.playerCount ?? raw.playing ?? 0),
    visits: Number(raw.visits ?? 0),
    favorites: Number(raw.favoritedCount ?? raw.favorites ?? 0),
    genre: raw.genre ? String(raw.genre) : null,
    sourceKeyword,
    raw: { ...raw, totalUpVotes: upvotes, totalDownVotes: downvotes },
  };
}

export async function searchRobloxGamesByKeyword(
  keyword: string,
  limit = 25,
): Promise<RobloxSearchResult[]> {
  const trimmed = keyword.trim();
  const safeLimit = Math.min(Math.max(Math.round(limit), 1), 50);
  if (!trimmed) return [];
  const url =
    `https://apis.roblox.com/search-api/omni-search?searchQuery=${encodeURIComponent(trimmed)}` +
    "&sessionId=00000000-0000-0000-0000-000000000000&pageType=games";
  const response = await fetch(url, {
    headers: { "User-Agent": "BloxSearch-MVP/1.0" },
    next: { revalidate: 300 },
  });
  if (response.status === 429) {
    throw new Error("Roblox rate limited this request. Try again later.");
  }
  if (!response.ok) {
    throw new Error("Roblox search endpoint unavailable. Paste game URLs manually.");
  }
  const raw = (await response.json()) as {
    searchResults?: Array<{ contentGroupType?: string; contents?: Record<string, unknown>[] }>;
  };
  const contents = (raw.searchResults ?? [])
    .flatMap((group) => group.contents ?? [])
    .filter((item) => item.universeId || item.contentId)
    .slice(0, safeLimit);
  const icons = await fetchRobloxGameIcons(
    contents
      .map((item) => String(item.universeId ?? item.contentId ?? ""))
      .filter(Boolean),
  );
  return contents
    .map((item) =>
      normalizeRobloxSearchResult(
        item,
        trimmed,
        icons.get(String(item.universeId ?? item.contentId ?? "")),
      ),
    )
    .filter((item): item is RobloxSearchResult => Boolean(item));
}

export async function discoverAndPreviewGames(keyword: string, limit: number) {
  return searchRobloxGamesByKeyword(keyword, limit);
}

export async function importDiscoveredGame(input: {
  universeId?: string;
  placeId?: string;
}) {
  if (input.universeId) return fetchGameByUniverseId(input.universeId);
  if (input.placeId) return fetchGameByPlaceId(input.placeId);
  throw new Error("A universeId or placeId is required.");
}

function inferNicheAndMechanics(title: string, description: string) {
  const text = `${title} ${description}`.toLowerCase();
  if (text.includes("obby") || text.includes("escape"))
    return {
      niche: "Obby",
      mechanics: ["obby", "escape"],
      tags: ["Obby", "Escape"],
    };
  if (text.includes("tycoon"))
    return {
      niche: "Tycoon",
      mechanics: ["tycoon", "builder"],
      tags: ["Tycoon", "Builder"],
    };
  if (text.includes("simulator"))
    return {
      niche: "Simulator",
      mechanics: ["simulator", "progression"],
      tags: ["Simulator", "Progression"],
    };
  if (text.includes("rng"))
    return {
      niche: "RNG",
      mechanics: ["rng", "collection"],
      tags: ["RNG", "Collection"],
    };
  return {
    niche: "Roblox",
    mechanics: ["progression"],
    tags: ["Roblox", "Imported"],
  };
}

export function normalizeRobloxGameData(
  raw: Record<string, unknown>,
  thumbnailUrl?: string | null,
  votes?: RobloxVoteData | null,
): Game {
  const universeId = String(raw.id ?? raw.universeId ?? "");
  const placeId = String(raw.rootPlaceId ?? "");
  const title = String(raw.name ?? "Untitled Roblox Experience");
  const description = String(raw.description ?? "");
  const created = String(raw.created ?? new Date().toISOString());
  const updated = String(raw.updated ?? created);
  const upvotes = Number(votes?.upVotes ?? raw.upVotes ?? raw.upvotes ?? 0);
  const downvotes = Number(
    votes?.downVotes ?? raw.downVotes ?? raw.downvotes ?? 0,
  );
  const likeRatio =
    upvotes + downvotes > 0
      ? Math.round((upvotes / (upvotes + downvotes)) * 1000) / 10
      : 0;
  const inferred = inferNicheAndMechanics(title, description);
  const base = {
    id: universeId,
    dataSource: "real" as const,
    robloxUniverseId: universeId,
    robloxPlaceId: placeId,
    title,
    description,
    creatorName: String(
      (raw.creator as Record<string, unknown> | undefined)?.name ??
        "Unknown creator",
    ),
    creatorId: String(
      (raw.creator as Record<string, unknown> | undefined)?.id ?? "",
    ),
    creatorType: String(
      (raw.creator as Record<string, unknown> | undefined)?.type ?? "",
    ),
    thumbnailUrl:
      thumbnailUrl ||
      `https://placehold.co/720x405/111827/38BDF8?text=${encodeURIComponent(title)}`,
    gameUrl: `https://www.roblox.com/games/${placeId}`,
    activePlayers: Number(raw.playing ?? 0),
    visits: Number(raw.visits ?? 0),
    favorites: Number(raw.favoritedCount ?? 0),
    upvotes,
    downvotes,
    likeRatio,
    maxPlayers: Number(raw.maxPlayers ?? 0),
    createdAtRoblox: created,
    updatedAtRoblox: updated,
    firstSeenAt: new Date().toISOString(),
    lastFetchedAt: new Date().toISOString(),
    tags: inferred.tags,
    niche: inferred.niche,
    genre: String(raw.genre_l1 ?? raw.genre ?? inferred.niche),
    subgenre: String(raw.genre_l2 ?? ""),
    mechanics: inferred.mechanics,
    monetizationTags: ["cosmetics", "vip"],
  };
  return { ...base, score: scoreGame(base), ideas: generateIdeas(base) };
}

export async function importRobloxGameFromInput(
  input: string,
): Promise<{
  placeId: string;
  universeId: string;
  game: Game;
  raw: Record<string, unknown>;
  votes: RobloxVoteData | null;
}> {
  const placeId = extractRobloxPlaceId(input);
  if (!placeId)
    throw new Error("Enter a valid Roblox game URL or numeric place ID.");
  const universeId = await fetchUniverseIdFromPlaceId(placeId);
  const raw = await fetchRobloxGameByUniverseId(universeId);
  const [icon, votes] = await Promise.all([
    fetchRobloxGameIcon(universeId),
    fetchRobloxGameVotes(universeId),
  ]);
  const game = normalizeRobloxGameData(
    { ...raw, rootPlaceId: raw.rootPlaceId ?? placeId },
    icon,
    votes,
  );
  return { placeId, universeId, game, raw, votes };
}

export async function fetchGameByUniverseId(universeId: string): Promise<Game> {
  const raw = await fetchRobloxGameByUniverseId(universeId);
  const [icon, votes] = await Promise.all([
    fetchRobloxGameIcon(universeId),
    fetchRobloxGameVotes(universeId),
  ]);
  return normalizeRobloxGameData(raw, icon, votes);
}

export async function fetchGameByPlaceId(placeId: string): Promise<Game> {
  const universeId = await fetchUniverseIdFromPlaceId(placeId);
  return fetchGameByUniverseId(universeId);
}
