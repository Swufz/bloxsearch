import type { Game, GeneratedIdea } from "./types";

type TrendFormula = {
  growthMechanic: string;
  inputHook: string;
  goalFormat: string;
  theme: string;
};

const antiCloningWarning =
  "Use the trend, not the exact game. Change the mechanic, theme, UI, map, name, and economy.";

function has(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function extractGrowthMechanic(text: string) {
  const plusOne = text.match(/\+1\s+([a-z0-9 -]+)/i)?.[1]?.trim();
  if (plusOne) {
    const clean = plusOne
      .split(/[,|:()[\]\n]/)[0]
      .replace(/\s+/g, " ")
      .slice(0, 24)
      .trim();
    return `+1 ${clean || "Power"}`;
  }
  if (has(text, ["speed", "run", "race"])) return "+1 Speed";
  if (has(text, ["jump", "climb", "tower"])) return "+1 Jump";
  if (has(text, ["strength", "lift", "punch"])) return "+1 Strength";
  if (has(text, ["typing", "keyboard"])) return "+1 Typing Power";
  return "+1 Power";
}

function extractInputHook(text: string) {
  if (has(text, ["keyboard", "typing", "type"])) return "Keyboard";
  if (has(text, ["piano", "music", "rhythm"])) return "Rhythm";
  if (has(text, ["click", "tap", "button"])) return "Button Mash";
  if (has(text, ["mouse", "aim"])) return "Mouse Aim";
  return "Reaction";
}

function extractGoalFormat(text: string) {
  if (has(text, ["escape", "obby"])) return "Escape";
  if (has(text, ["race", "speedrun"])) return "Race";
  if (has(text, ["tower", "climb"])) return "Climb";
  if (has(text, ["survive", "survival"])) return "Survive";
  if (has(text, ["door", "key"])) return "Unlock Doors";
  return "Reach the Finish";
}

function extractTheme(text: string, tags: string[]) {
  if (has(text, ["candy", "chocolate", "sweet"])) return "Candy & Chocolate";
  if (has(text, ["kitchen", "food", "chef"])) return "Giant Kitchen";
  if (has(text, ["space", "alien", "planet"])) return "Space Station";
  if (has(text, ["school", "classroom"])) return "School";
  if (has(text, ["haunted", "ghost", "horror"])) return "Haunted Arcade";
  const themeTag = tags.find((tag) => !["roblox", "imported"].includes(tag.toLowerCase()));
  return themeTag ?? "Toybox World";
}

function extractTrendFormula(
  game: Pick<Game, "title" | "description" | "tags" | "niche" | "mechanics">,
): TrendFormula {
  const text = `${game.title} ${game.description} ${game.tags.join(" ")} ${game.niche} ${game.mechanics.join(" ")}`.toLowerCase();
  return {
    growthMechanic: extractGrowthMechanic(text),
    inputHook: extractInputHook(text),
    goalFormat: extractGoalFormat(text),
    theme: extractTheme(text, game.tags),
  };
}

function shiftedTheme(theme: string, index: number) {
  if (theme === "Candy & Chocolate") {
    return ["Fruit Factory", "Neon Bakery", "Soda Lab"][index] ?? "Toybox World";
  }
  if (theme === "Haunted Arcade") {
    return ["Moon Mall", "Toy Factory", "Crystal Cavern"][index] ?? "Moon Mall";
  }
  return ["Space Station", "Giant Kitchen", "Clockwork Carnival"][index] ?? theme;
}

function shiftedMechanic(mechanic: string, index: number) {
  const options = ["+1 Jump", "+1 Typing Power", "+1 Strength"];
  if (!options.includes(mechanic)) return options[index] ?? mechanic;
  return options[(options.indexOf(mechanic) + index + 1) % options.length];
}

function shiftedInput(input: string, index: number) {
  const options = ["Rhythm", "Keyboard", "Button Mash"];
  if (!options.includes(input)) return options[index] ?? input;
  return options[(options.indexOf(input) + index + 1) % options.length];
}

function shiftedGoal(goal: string, index: number) {
  const options = ["Unlock Doors", "Climb", "Race"];
  if (!options.includes(goal)) return options[index] ?? goal;
  return options[(options.indexOf(goal) + index + 1) % options.length];
}

export function generateIdeas(
  game: Pick<
    Game,
    "title" | "description" | "niche" | "mechanics" | "monetizationTags" | "tags"
  >,
): GeneratedIdea[] {
  const formula = extractTrendFormula(game);
  const monetization = game.monetizationTags.length
    ? game.monetizationTags
    : ["cosmetics", "boosts", "vip"];

  return [0, 1, 2].map((index) => {
    const growthMechanic = shiftedMechanic(formula.growthMechanic, index);
    const inputHook = shiftedInput(formula.inputHook, index);
    const goalFormat = shiftedGoal(formula.goalFormat, index);
    const theme = shiftedTheme(formula.theme, index);
    const difficulty: GeneratedIdea["difficulty"] =
      index === 0 ? "Easy" : index === 1 ? "Medium" : "Hard";
    const potentialScore = [84, 81, 78][index];
    const title = `${growthMechanic} ${inputHook} ${goalFormat}: ${theme}`;

    return {
      title,
      concept: `A short-session ${game.niche.toLowerCase()} where players use ${inputHook.toLowerCase()} actions to build ${growthMechanic.replace("+1 ", "").toLowerCase()} and complete ${goalFormat.toLowerCase()} challenges in a ${theme.toLowerCase()} world.`,
      coreLoop: `Tap into the ${inputHook.toLowerCase()} hook, earn visible ${growthMechanic.toLowerCase()} upgrades, clear a compact ${goalFormat.toLowerCase()} route, then spend rewards on new zones, trails, and timed modifiers.`,
      howPlayersPlay: `Players repeat quick rounds: perform the input challenge, grow a stat, beat an obstacle route, claim coins, and choose the next upgrade or themed area.`,
      whyItCouldWork: `It preserves the trend formula of ${formula.growthMechanic} plus ${formula.inputHook} plus ${formula.goalFormat}, but moves the fantasy into ${theme} with different progression pacing.`,
      differentFromOriginal: `Swap the original theme and route layout for ${theme}, add a different upgrade economy, and make the input challenge the main skill test instead of copying maps or branding.`,
      difficulty,
      monetization,
      avoidCloning: antiCloningWarning,
      buildScope:
        index === 0
          ? "Solo developer: 4-6 weeks for one polished world and three upgrade paths."
          : index === 1
            ? "Small team: 6-10 weeks for two worlds, daily quests, and cosmetics."
            : "Small team: 10-14 weeks with live events and a deeper upgrade economy.",
      potentialScore,
      potentialReason: `${potentialScore}/100 because the concept keeps a proven growth/input/goal loop while changing the theme, economy, and moment-to-moment challenge enough to test demand safely.`,
      risk:
        index === 0
          ? "The hook may feel too simple unless upgrades create a strong sense of speed and mastery."
          : index === 1
            ? "Needs enough content variety to avoid feeling repetitive after the first session."
            : "Higher scope could slow launch unless the first world is tightly constrained.",
    };
  });
}
