import { AppShell } from "@/components/app-shell";
import { ensureProfile, getCurrentUser } from "@/lib/auth";
import { isMockMode } from "@/lib/mode";

const sections = [
  {
    title: "What BloxSearch Can Measure",
    body: "BloxSearch currently uses public Roblox data and imported games: active players, visits, favorites, votes, like ratio, public descriptions, update dates, tags, detected mechanics, and stored snapshots.",
  },
  {
    title: "What BloxSearch Cannot Measure Yet",
    body: "BloxSearch does not yet have access to private retention, revenue, conversion, session-time, payer behavior, or ad-spend analytics unless a creator connects their own data.",
  },
  {
    title: "Demand Score",
    body: "Formula: log-scaled active players plus log-scaled visits. Active players carry more weight because they represent current demand. Inputs: active_players, visits, active players per million visits.",
  },
  {
    title: "Growth Score",
    body: "Formula: active players divided by game age plus visits per day, log-scaled to 0-100. If only one snapshot exists, growth is estimated from current public stats rather than proven history.",
  },
  {
    title: "Freshness Score",
    body: "Formula: newer games score higher, recent updates help, and games older than 90 days lose freshness unless update recency offsets it. Inputs: created_at_roblox and updated_at_roblox.",
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
    body: "Formula: combines the source opportunity signal, detected trend formula, build difficulty, differentiation from the source game, monetization fit, and data confidence. It is a research estimate, not a guarantee.",
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
