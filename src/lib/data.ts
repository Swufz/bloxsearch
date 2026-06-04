import { mockGames } from "./mock-data";
import type { CollectionLog, Game, SavedIdea } from "./types";

export const getGames = (): Game[] => [...mockGames].sort((a, b) => b.score.opportunity - a.score.opportunity);
export const getGame = (id: string): Game | undefined => mockGames.find((game) => game.id === id || game.robloxUniverseId === id);

export const getSavedIdeas = (): SavedIdea[] =>
  getGames().slice(0, 4).map((game, index) => ({
    ...game.ideas[0],
    id: `idea-${index + 1}`,
    gameId: game.id,
    inspiredBy: game.title,
    niche: game.niche,
    opportunityScore: game.score.opportunity,
    notes: index === 0 ? "Explore a one-week prototype focused on the core loop." : "",
    createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
  }));

export const getCollectionLogs = (): CollectionLog[] => [
  { id: "log-1", action: "score_games", status: "success", message: "Recalculated opportunity scores for 25 games.", createdAt: new Date(Date.now() - 22 * 60_000).toISOString() },
  { id: "log-2", action: "seed_mock_data", status: "success", message: "Mock dataset is ready.", createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString() },
  { id: "log-3", action: "fetch_game", status: "info", message: "Mock mode returned normalized game data.", createdAt: new Date(Date.now() - 5 * 3_600_000).toISOString() },
];
