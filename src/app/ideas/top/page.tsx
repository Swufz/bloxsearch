import { AppShell } from "@/components/app-shell";
import { TopIdeasPanel } from "@/components/top-ideas-panel";
import { getCurrentUser } from "@/lib/auth";
import { isMockMode } from "@/lib/mode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getDatasetSignals, type TopIdea } from "@/lib/top-ideas";

type TopIdeaRow = {
  id: string;
  title: string;
  description: string | null;
  how_players_play: string | null;
  trend_formula: string | null;
  data_signals: string[] | null;
  potential_score: number | null;
  potential_reason: string | null;
  originality_risk: "Low" | "Medium" | "High" | null;
  originality_reason: string | null;
  similar_games:
    | Array<{
        title: string;
        universeId: string;
        activePlayers: number;
        visits: number;
      }>
    | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  monetization_options: string[] | null;
  risks: string[] | null;
  confidence_level: "Low" | "Medium" | "High" | null;
  created_at: string;
};

function mapIdea(row: TopIdeaRow, index: number): TopIdea {
  return {
    id: row.id,
    rank: index + 1,
    title: row.title,
    description: row.description ?? "",
    howPlayersPlay: row.how_players_play ?? "",
    trendFormula: row.trend_formula ?? "",
    dataSignals: row.data_signals ?? [],
    whyItCouldWork:
      "This idea is based on repeated demand and opportunity signals in the tracked dataset.",
    differentFromExisting:
      "Use the trend formula as inspiration, then change the map, UI, economy, name, and progression.",
    potentialScore: row.potential_score ?? 0,
    potentialReason: row.potential_reason ?? "",
    originalityRisk: row.originality_risk ?? "Medium",
    originalityReason: row.originality_reason ?? "",
    similarGames: row.similar_games ?? [],
    difficulty: row.difficulty ?? "Medium",
    monetizationOptions: row.monetization_options ?? [],
    risks: row.risks ?? [],
    confidenceLevel: row.confidence_level ?? "Low",
    createdAt: row.created_at,
  };
}

export default async function TopIdeasPage() {
  const user = await getCurrentUser();
  const admin = createSupabaseAdminClient();
  const [{ data }, dataset] = await Promise.all([
    admin
      .from("generated_top_ideas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3),
    getDatasetSignals().catch(() => ({
      games: [],
      clusters: [],
      snapshotsCount: 0,
      trackedGamesCount: 0,
      gamesWithAvgSession: 0,
      gamesWith24hTracking: 0,
    })),
  ]);
  const ideas = ((data ?? []) as unknown as TopIdeaRow[]).map(mapIdea);

  return (
    <AppShell
      title="Top 3 Game Ideas"
      subtitle="Generated from BloxSearch's tracked Roblox dataset."
      demoMode={isMockMode()}
      userEmail={user?.email}
    >
      <TopIdeasPanel
        initialIdeas={ideas}
        initialDataset={dataset}
        signedIn={Boolean(user)}
      />
    </AppShell>
  );
}
