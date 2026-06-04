export type ScoreBreakdown = {
  opportunity: number;
  demand: number;
  growth: number;
  competition: number;
  freshness: number;
  buildability: number;
  monetization: number;
  outlierReason: string;
  risks: string[];
  growthEstimated: boolean;
};

export type GeneratedIdea = {
  title: string;
  concept: string;
  coreLoop: string;
  whyItCouldWork: string;
  difficulty: "Easy" | "Medium" | "Hard";
  monetization: string[];
  avoidCloning: string;
  buildScope: string;
};

export type Game = {
  id: string;
  databaseId?: string;
  dataSource?: "mock" | "real";
  robloxUniverseId: string;
  robloxPlaceId: string;
  title: string;
  description: string;
  creatorName: string;
  creatorId: string;
  creatorType: string;
  thumbnailUrl: string;
  gameUrl: string;
  activePlayers: number;
  visits: number;
  favorites: number;
  upvotes: number;
  downvotes: number;
  likeRatio: number;
  maxPlayers: number;
  createdAtRoblox: string;
  updatedAtRoblox: string;
  firstSeenAt: string;
  lastFetchedAt: string;
  tags: string[];
  niche: string;
  mechanics: string[];
  monetizationTags: string[];
  score: ScoreBreakdown;
  ideas: GeneratedIdea[];
};

export type SavedIdea = GeneratedIdea & {
  id: string;
  gameId: string;
  inspiredBy: string;
  niche: string;
  opportunityScore: number;
  notes: string;
  createdAt: string;
};

export type SavedGame = {
  id: string;
  gameId: string;
  databaseGameId: string;
  robloxUniverseId: string;
  title: string;
  creatorName: string;
  activePlayers: number;
  visits: number;
  opportunityScore: number | null;
  createdAt: string;
};

export type CollectionLog = {
  id: string;
  action: string;
  status: "success" | "error" | "info";
  message: string;
  createdAt: string;
};
