import type { Game, ScoreBreakdown } from "./types";
import { clamp, daysAgo } from "./utils";

const easyMechanics = ["obby", "clicker", "tycoon", "simulator", "rng", "collection", "merge", "tower defense-lite"];
const hardMechanics = ["advanced combat", "battlegrounds", "large-scale rpg", "roleplay world"];
const strongMonetization = ["pets", "boosts", "vip", "cosmetics", "rebirths", "spins", "crates", "premium areas", "skip-stage"];

export function scoreGame(
  game: Omit<Game, "score" | "ideas">,
  nicheCount = 4,
  similarActivePlayers: number[] = [],
): ScoreBreakdown {
  const age = daysAgo(game.createdAtRoblox);
  const updateAge = daysAgo(game.updatedAtRoblox);
  const demand = clamp(Math.log10(game.activePlayers + 10) * 24 + Math.log10(game.visits + 100) * 7 - 45);
  const velocity = game.activePlayers / age + game.visits / age / 1500;
  const growth = clamp(Math.log10(velocity + 1) * 28);
  const freshness = clamp(105 - Math.log10(age + 1) * 35 - Math.min(updateAge, 90) * 0.25);
  const averageSimilarActive = similarActivePlayers.length
    ? similarActivePlayers.reduce((sum, value) => sum + value, 0) /
      similarActivePlayers.length
    : 0;
  const competition = similarActivePlayers.length
    ? clamp(
        82 -
          similarActivePlayers.length * 8 -
          Math.log10(averageSimilarActive + 10) * 7 +
          Math.min(game.activePlayers / 5000, 8),
      )
    : clamp(88 - nicheCount * 7 + Math.min(game.activePlayers / 2000, 12));
  const mechanics = game.mechanics.map((m) => m.toLowerCase());
  const buildability = clamp(58 + mechanics.filter((m) => easyMechanics.includes(m)).length * 15 - mechanics.filter((m) => hardMechanics.includes(m)).length * 25);
  const monetization = clamp(42 + game.monetizationTags.filter((m) => strongMonetization.includes(m.toLowerCase())).length * 12);
  const opportunity = clamp(demand * 0.25 + growth * 0.25 + freshness * 0.15 + competition * 0.15 + buildability * 0.1 + monetization * 0.1);

  const reasons = [
    age < 120 && game.activePlayers > 1000 ? "High active-player count for a young game." : "",
    game.likeRatio > 90 && game.visits < 5_000_000 ? "Strong like ratio with relatively low total visits." : "",
    updateAge < 14 && growth > 65 ? "Recently updated game gaining traction." : "",
    buildability > 75 && demand > 60 ? "Simple mechanic with high demand." : "",
  ].filter(Boolean);

  return {
    opportunity, demand, growth, competition, freshness, buildability, monetization,
    outlierReason: reasons[0] ?? "Healthy demand relative to its niche and age.",
    risks: [
      competition < 50 ? "The niche has established competitors." : "Demand may be sensitive to trend cycles.",
      buildability < 55 ? "The core mechanic may require a larger team." : "Retention will depend on a strong update cadence.",
    ],
    growthEstimated: true,
  };
}
