import { analyzeTrendFormula } from "./trend-analysis";
import type { Game } from "./types";

const genericTags = new Set([
  "",
  "roblox",
  "general roblox",
  "real roblox data",
  "demo data",
  "imported",
  "manual",
  "manual import",
  "manual_import",
  "keyword",
  "top_games",
]);

type Rule = {
  tag: string;
  patterns: RegExp[];
};

const growthRules: Rule[] = [
  { tag: "+1 speed", patterns: [/\+1\s*speed\b/, /\bspeed\b/] },
  { tag: "+1 jump", patterns: [/\+1\s*jump\b/, /\bjump power\b/] },
  { tag: "+1 strength", patterns: [/\+1\s*strength\b/, /\bstrength\b/] },
  { tag: "grow", patterns: [/\bgrow\b/, /\bgrowth\b/] },
  { tag: "rng", patterns: [/\brng\b/] },
  { tag: "simulator", patterns: [/\bsimulator\b/] },
  { tag: "tycoon", patterns: [/\btycoon\b/] },
  { tag: "rebirth", patterns: [/\brebirths?\b/] },
  { tag: "collection", patterns: [/\bcollect(?:ion)?\b/, /\bpets?\b/] },
  { tag: "progression", patterns: [/\bupgrade\b/, /\bascension\b/, /\blevel\b/] },
];

const goalRules: Rule[] = [
  { tag: "obby", patterns: [/\bobby\b/, /\bparkour\b/] },
  { tag: "escape", patterns: [/\bescape\b/] },
  { tag: "race", patterns: [/\brace\b/, /\bracing\b/, /\brivals?\b/] },
  { tag: "survival", patterns: [/\bsurviv(?:e|al)\b/, /\bink game\b/] },
  { tag: "battle", patterns: [/\bbattle\b/, /\bfighting\b/, /\bfight\b/] },
  { tag: "defense", patterns: [/\btower defense\b/, /\bdefen[sc]e\b/, /\bvanguards?\b/] },
  { tag: "roleplay", patterns: [/\broleplay\b/, /\brp\b/, /\bempire\b/] },
  { tag: "steal", patterns: [/\bsteal\b/] },
  { tag: "challenge", patterns: [/\bchallenge\b/, /\bink game\b/] },
];

const themeRules: Rule[] = [
  { tag: "anime", patterns: [/\banime\b/, /\bblue lock\b/, /\bvanguards?\b/] },
  { tag: "pets", patterns: [/\bpets?\b/] },
  { tag: "candy", patterns: [/\bcandy\b/, /\bchocolate\b/, /\bsweet\b/] },
  { tag: "brainrot", patterns: [/\bbrainrot\b/] },
  { tag: "garden", patterns: [/\bgarden\b/] },
  { tag: "cars", patterns: [/\bcars?\b/, /\bdriving\b/, /\bvehicle\b/] },
  { tag: "soccer", patterns: [/\bsoccer\b/, /\bfootball\b/, /\bblue lock\b/] },
  { tag: "hospital", patterns: [/\bhospital\b/, /\brescue\b/] },
  { tag: "school", patterns: [/\bschool\b/] },
  { tag: "prison", patterns: [/\bprison\b/, /\bjail\b/] },
  { tag: "ninja", patterns: [/\bninja\b/] },
  { tag: "fish", patterns: [/\bfish(?:ing)?\b/] },
  { tag: "space", patterns: [/\bspace\b/, /\bplanet\b/] },
];

const inputRules: Rule[] = [
  { tag: "keyboard", patterns: [/\bkeyboard\b/] },
  { tag: "click", patterns: [/\bclick\b/, /\btap\b/] },
  { tag: "typing", patterns: [/\btyping\b/, /\btype\b/] },
  { tag: "piano", patterns: [/\bpiano\b/] },
  { tag: "controller", patterns: [/\bcontroller\b/] },
  { tag: "rhythm", patterns: [/\brhythm\b/] },
];

function textFor(game: Game) {
  return [
    game.title,
    game.description,
    game.niche,
    game.genre,
    game.subgenre,
    ...game.tags,
    ...game.mechanics,
    ...game.monetizationTags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function shorten(label: string) {
  return label
    .replace(/^cluster:\s*/i, "")
    .replace(/^imported from:\s*/i, "")
    .replace(/tower defense/i, "defense")
    .replace(/low competition/i, "low comp")
    .replace(/high momentum/i, "momentum")
    .replace(/strong player rating/i, "strong rating")
    .replace(/top games/i, "top game")
    .trim()
    .toLowerCase();
}

function add(tags: string[], label?: string | null) {
  if (!label) return;
  const tag = shorten(label);
  if (genericTags.has(tag) || tag.includes("imported from")) return;
  if (!tags.includes(tag)) tags.push(tag);
}

function firstMatch(text: string, rules: Rule[]) {
  return rules.find((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    ?.tag;
}

export function getResearchTagsForGame(game: Game) {
  const text = textFor(game);
  const trend = analyzeTrendFormula(game);
  const tags: string[] = [];

  add(tags, firstMatch(text, growthRules));
  add(tags, firstMatch(text, goalRules));
  add(tags, firstMatch(text, themeRules));
  add(tags, firstMatch(text, inputRules));

  add(tags, trend.growthMechanic === "progression" ? null : trend.growthMechanic);
  add(tags, trend.goalFormat === "roblox" ? null : trend.goalFormat);
  add(tags, trend.theme === "general Roblox" ? null : trend.theme);
  add(tags, trend.inputHook === "general input" ? null : trend.inputHook);

  if (game.discoverySource === "top_games") add(tags, "top game");
  if (game.discoverySource === "trending") add(tags, "trending");
  if (game.discoverySource === "popular") add(tags, "popular");
  if (
    (game.metrics?.momentum1d ?? game.metrics?.momentum7d ?? 0) >= 15
  ) {
    add(tags, "momentum");
  }
  if (game.likeRatio >= 90) add(tags, "strong rating");
  if (game.score.competition >= 70) add(tags, "low comp");

  for (const fallback of [
    ...game.mechanics,
    game.niche,
    ...game.tags,
    ...game.monetizationTags,
  ]) {
    if (tags.length >= 4) break;
    add(tags, fallback);
  }

  return tags.slice(0, 4);
}
