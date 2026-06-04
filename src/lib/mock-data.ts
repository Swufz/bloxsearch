import { generateIdeas } from "./idea-generator";
import { scoreGame } from "./scoring";
import type { Game } from "./types";

const names = [
  ["Steal a Dragon", "Collection", ["collection", "base-building"], ["pets", "boosts"], ["Dragons", "Heist"]],
  ["Grow a Garden Empire", "Tycoon", ["tycoon", "collection"], ["boosts", "vip"], ["Garden", "Cozy"]],
  ["Brainrot RNG", "RNG", ["rng", "collection"], ["spins", "vip"], ["Chaos", "Memes"]],
  ["Obby But You Get Faster", "Obby", ["obby", "speed"], ["skip-stage", "cosmetics"], ["Speed", "Parkour"]],
  ["Build a Zoo Tycoon", "Tycoon", ["tycoon", "collection"], ["pets", "premium areas"], ["Animals", "Builder"]],
  ["Anime Pet Tower", "Strategy", ["tower defense-lite", "collection"], ["pets", "crates"], ["Anime", "Defense"]],
  ["Escape Evil Daycare", "Survival", ["escape", "obby"], ["cosmetics", "revives"], ["Horror", "Escape"]],
  ["Restaurant Race Simulator", "Simulator", ["simulator", "racing"], ["boosts", "vip"], ["Food", "Race"]],
  ["Merge Pets Island", "Collection", ["merge", "collection"], ["pets", "boosts"], ["Island", "Pets"]],
  ["Delivery Empire", "Simulator", ["simulator", "tycoon"], ["vehicles", "boosts"], ["Delivery", "City"]],
  ["Dungeon Shift", "Survival", ["survival", "dungeon"], ["cosmetics", "revives"], ["Dungeon", "Night"]],
  ["Tiny Town Startup", "Tycoon", ["tycoon", "builder"], ["vip", "premium areas"], ["Town", "Business"]],
  ["Minecart Mayhem", "Obby", ["obby", "racing"], ["cosmetics", "skip-stage"], ["Mine", "Race"]],
  ["Potion Lab RNG", "RNG", ["rng", "collection"], ["spins", "boosts"], ["Magic", "Lab"]],
  ["Aquarium Collector", "Collection", ["collection", "idle"], ["pets", "premium areas"], ["Ocean", "Cozy"]],
  ["Skyline Rescue", "Survival", ["rescue", "roleplay world"], ["vehicles", "cosmetics"], ["City", "Rescue"]],
  ["Factory Merge", "Simulator", ["merge", "tycoon"], ["boosts", "vip"], ["Factory", "Automation"]],
  ["Haunted Hotel Shift", "Survival", ["survival", "escape"], ["revives", "cosmetics"], ["Horror", "Hotel"]],
  ["Cloud Cafe Tycoon", "Tycoon", ["tycoon", "collection"], ["vip", "cosmetics"], ["Cafe", "Clouds"]],
  ["Treasure Dive Club", "Collection", ["collection", "exploration"], ["boosts", "premium areas"], ["Ocean", "Treasure"]],
  ["Rooftop Tag League", "Obby", ["obby", "pvp-lite"], ["cosmetics", "boosts"], ["Parkour", "Tag"]],
  ["Space Junk Salvage", "Simulator", ["simulator", "collection"], ["boosts", "vehicles"], ["Space", "Salvage"]],
  ["Monster Farm Merge", "Collection", ["merge", "collection"], ["pets", "boosts"], ["Monsters", "Farm"]],
  ["Castle Defense Lab", "Strategy", ["tower defense-lite", "builder"], ["crates", "vip"], ["Castle", "Defense"]],
  ["Neighborhood Stories", "Roleplay", ["roleplay world", "housing"], ["cosmetics", "vehicles"], ["Home", "Social"]],
] as const;

const now = Date.now();
const day = 86_400_000;

export const mockGames: Game[] = names.map((item, index) => {
  const [title, niche, mechanics, monetizationTags, tags] = item;
  const age = 18 + ((index * 47) % 720);
  const activePlayers = Math.round((index % 5 === 0 ? 9200 : 350 + ((index * 733) % 5800)) * (age < 120 ? 1.35 : 0.8));
  const visits = Math.round(activePlayers * (500 + ((index * 311) % 5200)));
  const upvotes = Math.round(visits * (0.015 + (index % 4) * 0.003));
  const downvotes = Math.round(upvotes * (0.04 + (index % 5) * 0.018));
  const base = {
    id: `game-${index + 1}`,
    robloxUniverseId: `${9000000 + index}`,
    robloxPlaceId: `${19000000 + index}`,
    title,
    description: `${title} is a fast-moving ${niche.toLowerCase()} experience built around ${mechanics.join(" and ")}. Unlock new areas, show off progress, and return for regular updates.`,
    creatorName: index % 4 === 0 ? "Small Spark Studio" : `${tags[0]} Works`,
    creatorId: `${50000 + index}`,
    creatorType: "Group",
    thumbnailUrl: `https://placehold.co/720x405/111827/38BDF8?text=${encodeURIComponent(title)}`,
    gameUrl: `https://www.roblox.com/games/${19000000 + index}`,
    activePlayers,
    visits,
    favorites: Math.round(visits * 0.035),
    upvotes,
    downvotes,
    likeRatio: Math.round((upvotes / (upvotes + downvotes)) * 1000) / 10,
    maxPlayers: 12 + (index % 5) * 8,
    createdAtRoblox: new Date(now - age * day).toISOString(),
    updatedAtRoblox: new Date(now - (1 + ((index * 7) % 60)) * day).toISOString(),
    firstSeenAt: new Date(now - Math.min(age, 90) * day).toISOString(),
    lastFetchedAt: new Date(now - (index % 10) * 3_600_000).toISOString(),
    tags: [...tags],
    niche,
    mechanics: [...mechanics],
    monetizationTags: [...monetizationTags],
  };
  const score = scoreGame(base, names.filter((n) => n[1] === niche).length);
  return { ...base, score, ideas: generateIdeas(base) };
});
