import type { Game, GeneratedIdea } from "./types";

const themePairs: Record<string, string[]> = {
  Simulator: ["Workshop", "Expedition", "Factory"],
  Tycoon: ["District", "Empire", "Startup"],
  Obby: ["Rush", "Trials", "Escape"],
  RNG: ["Laboratory", "Vault", "Forge"],
  Collection: ["Sanctuary", "Museum", "Island"],
  Survival: ["Night Shift", "Outpost", "Rescue"],
  Strategy: ["Frontier", "Defense Lab", "Command"],
  Roleplay: ["Neighborhood", "Campus", "City Stories"],
};

export function generateIdeas(game: Pick<Game, "title" | "niche" | "mechanics" | "monetizationTags" | "tags">): GeneratedIdea[] {
  const themes = themePairs[game.niche] ?? ["Adventure", "World", "Quest"];
  const mechanic = game.mechanics[0] ?? "progression";
  const secondary = game.mechanics[1] ?? "collection";
  const monetization = game.monetizationTags.length ? game.monetizationTags : ["cosmetics", "boosts"];

  return themes.map((theme, index) => ({
    title: `${game.tags[index % game.tags.length] ?? game.niche} ${theme}`,
    concept: `A ${game.niche.toLowerCase()} experience that combines ${mechanic} with ${secondary} in a distinct ${theme.toLowerCase()} setting.`,
    coreLoop: `Complete short ${mechanic} sessions, earn visible upgrades, unlock new zones, and build a collection that changes how each run plays.`,
    whyItCouldWork: `It keeps the proven ${game.niche.toLowerCase()} demand signal while giving players a clear progression goal and a shareable visual payoff.`,
    difficulty: index === 0 ? "Easy" : index === 1 ? "Medium" : "Hard",
    monetization,
    avoidCloning: `Use an original setting, progression model, art direction, names, maps, UI, and economy. Treat "${game.title}" only as a market signal.`,
    buildScope: index === 0 ? "Solo developer: 4-6 weeks for a focused first world." : index === 1 ? "Small team: 6-10 weeks for a polished MVP." : "Small team: 10-14 weeks with content updates planned.",
  }));
}
