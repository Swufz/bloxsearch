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

export type ConfidenceLevel = "Low" | "Medium" | "High";

export type RobloxGameMetrics = {
  avgSession1d: number | null;
  avgSession7d: number | null;
  avgSession14d: number | null;
  avgCcu1d: number | null;
  avgCcu7d: number | null;
  avgCcu14d: number | null;
  momentum1d: number | null;
  momentum7d: number | null;
  momentum14d: number | null;
  visitGrowth1d: number;
  visitGrowth7d: number;
  visitGrowth14d: number;
  favoriteGrowth1d: number;
  favoriteGrowth7d: number;
  ratingMovement1d: number | null;
  ratingMovement7d: number | null;
  updateFreshnessScore: number;
  globalRank: number | null;
  rankShift1d: number | null;
  rankShift7d: number | null;
  genreRank: number | null;
  confidenceLevel: ConfidenceLevel;
  calculatedAt: string;
};

export type RobloxGameSnapshotSummary = {
  count: number;
  firstSnapshotAt: string | null;
  latestSnapshotAt: string | null;
};

export type TrendAnalysis = {
  formulaSummary: string;
  growthMechanic: string;
  inputHook: string;
  goalFormat: string;
  theme: string;
  socialHook: string;
  monetizationSignals: string[];
  confidence: ConfidenceLevel;
  detectedKeywords: Array<{ keyword: string; category: string }>;
};

export type ScoreExplanation = {
  key: Exclude<keyof ScoreBreakdown, "outlierReason" | "risks" | "growthEstimated">;
  label: string;
  score: number;
  why: string[];
  inputs: string[];
  formula: string;
  confidence: ConfidenceLevel;
  similarGames?: Array<{ id: string; title: string; activePlayers: number }>;
};

export type GeneratedIdea = {
  title: string;
  concept: string;
  coreLoop: string;
  whyItCouldWork: string;
  howPlayersPlay: string;
  differentFromOriginal: string;
  difficulty: "Easy" | "Medium" | "Hard";
  monetization: string[];
  avoidCloning: string;
  buildScope: string;
  potentialScore: number;
  potentialReason: string;
  risk: string;
  dataSignals: string[];
  confidence: ConfidenceLevel;
};

export type Game = {
  id: string;
  databaseId?: string;
  dataSource?: "mock" | "real";
  sourceKeyword?: string | null;
  trackingEnabled?: boolean;
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
  genre?: string | null;
  subgenre?: string | null;
  mechanics: string[];
  monetizationTags: string[];
  score: ScoreBreakdown;
  ideas: GeneratedIdea[];
  snapshotCount?: number;
  metrics?: RobloxGameMetrics | null;
  trackingSummary?: RobloxGameSnapshotSummary | null;
};

export type RobloxSearchResult = {
  title: string;
  universeId: string;
  placeId: string;
  creatorName: string;
  creatorId: string;
  thumbnailUrl: string | null;
  activePlayers: number;
  visits: number;
  favorites: number;
  genre: string | null;
  sourceKeyword: string;
  raw: Record<string, unknown>;
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
