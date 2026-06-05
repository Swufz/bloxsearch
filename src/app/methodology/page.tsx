import { AppShell } from "@/components/app-shell";
import { ensureProfile, getCurrentUser } from "@/lib/auth";
import { isMockMode } from "@/lib/mode";

const sections = [
  {
    title: "What BloxSearch Can Measure",
    body: "BloxSearch currently uses public Roblox data and imported games: players/CCU, visits, favorites, votes, like ratio, created date, updated date, genre, subgenre when available, public descriptions, tags, detected mechanics, and BloxSearch snapshots.",
  },
  {
    title: "What BloxSearch Cannot Measure Yet",
    body: "BloxSearch does not yet have access to private retention, revenue, conversion, payer behavior, ad-spend analytics, or Creator Dashboard analytics unless a creator connects their own data in a future Creator Diagnosis Mode.",
  },
  {
    title: "Avg Session",
    body: "BloxSearch calculates Avg Session from tracked public player activity and visit growth. It estimates player-minutes from CCU snapshots and divides that by new visits during the same period: total player-minutes / new visits.",
  },
  {
    title: "Avg CCU",
    body: "Formula: average active_players across snapshots inside the selected window, such as 1d, 7d, or 14d.",
  },
  {
    title: "Momentum",
    body: "Formula: ((average CCU in the current period - average CCU in the previous matching period) / previous average CCU) * 100. If the previous period has no data, momentum is not shown.",
  },
  {
    title: "Visit Growth",
    body: "Formula: visits at the end of the window minus visits at the start of the window. It requires at least two snapshots.",
  },
  {
    title: "Demand Score",
    body: "Formula: log-scaled active players plus log-scaled visits. Active players carry more weight because they represent current demand. Inputs: active_players, visits, active players per million visits.",
  },
  {
    title: "Growth Score",
    body: "Formula: tracked momentum and visit growth when available. If only one snapshot exists, growth falls back to current active players and visits per day and is marked low confidence.",
  },
  {
    title: "Freshness Score",
    body: "Formula: updated within 1 day = 100, within 3 days = 85, within 7 days = 70, within 14 days = 50, within 30 days = 30, older = 10.",
  },
  {
    title: "Competition Score",
    body: "Formula: based on similar games currently imported into BloxSearch using detected growth mechanic, input hook, goal format, theme, and tags. Many huge similar games lower the score. A tiny dataset lowers confidence.",
  },
  {
    title: "Buildability Score",
    body: "Formula: starts at 58, adds points for simple Roblox patterns like obby, clicker, tycoon, simulator, RNG, and collection, and subtracts for complex systems like advanced combat or large-scale RPGs.",
  },
  {
    title: "Monetization Score",
    body: "Formula: starts at 42 and adds points for public monetization clues such as pets, boosts, VIP, cosmetics, rebirths, spins, crates, premium areas, and skip-stage mechanics. It cannot prove revenue.",
  },
  {
    title: "Idea Potential Score",
    body: "Formula: Demand 25%, Growth 20%, Engagement 20%, Freshness 10%, Competition Gap 15%, Rating/Satisfaction 10%. Engagement uses Avg Session when available and never invents it when snapshots are insufficient.",
  },
  {
    title: "Confidence Levels",
    body: "Low means the app has few similar imports or only one snapshot. Medium means public inputs are clear but trend history is limited. High requires multiple matching games and repeated snapshots over time.",
  },
];

export default async function MethodologyPage() {
  const user = await getCurrentUser();
  if (user) await ensureProfile(user);
  return (
    <AppShell
      title="Scoring Methodology"
      subtitle="How BloxSearch turns public Roblox data into cautious research signals."
      demoMode={isMockMode()}
      userEmail={user?.email}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="card p-6">
            <h2 className="font-semibold">{section.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {section.body}
            </p>
          </section>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 text-sm leading-6 text-orange-100/80">
        BloxSearch can identify public market signals, but it should not claim
        certainty about retention, revenue, or long-term growth until more
        snapshots and comparable imported games exist.
      </div>
    </AppShell>
  );
}
