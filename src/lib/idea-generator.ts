import type { Game, GeneratedIdea } from "./types";
import { analyzeTrendFormula } from "./trend-analysis";

const antiCloningWarning =
  "Use the trend, not the exact game. Change the mechanic, theme, UI, map, name, and economy.";

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
  > & { activePlayers?: number; likeRatio?: number; metrics?: Game["metrics"] },
): GeneratedIdea[] {
  const formula = analyzeTrendFormula(game);
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
      dataSignals: [
        `Based on the current imported dataset, the source game shows the formula ${formula.formulaSummary}.`,
        game.activePlayers
          ? `High CCU signal: ${game.activePlayers.toLocaleString()} current active players.`
          : "Current CCU was not available for this idea.",
        game.metrics?.avgSession1d
          ? `Avg Session 1d: ${game.metrics.avgSession1d} minutes from tracked snapshots.`
          : "Avg Session is not available yet; track this game longer to measure engagement.",
        game.metrics?.visitGrowth1d
          ? `Visit growth 1d: ${game.metrics.visitGrowth1d.toLocaleString()} new visits.`
          : "Visit growth needs multiple snapshots before it becomes meaningful.",
        game.likeRatio
          ? `Rating signal: ${game.likeRatio}% like ratio.`
          : "Rating signal was not available.",
        game.metrics?.updateFreshnessScore
          ? `Update freshness score: ${game.metrics.updateFreshnessScore}.`
          : "Update freshness uses public updated date until snapshot history grows.",
        `${formula.growthMechanic} and ${formula.goalFormat} are detected from public title, description, tags, and mechanics.`,
        formula.monetizationSignals.length
          ? `Monetization clues detected: ${formula.monetizationSignals.join(", ")}.`
          : "No explicit monetization clues were detected beyond existing tags.",
        "Needs more similar games imported to confirm trend strength.",
      ],
      confidence: formula.confidence === "High" ? "Medium" : formula.confidence,
    };
  });
}
