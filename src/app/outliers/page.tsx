import { AppShell } from "@/components/app-shell";
import { OutlierExplorer } from "@/components/outlier-explorer";
import { getGames } from "@/lib/data";
import { isMockMode } from "@/lib/mode";
import { ensureProfile, getCurrentUser } from "@/lib/auth";
import { getSavedGameUniverseIds } from "@/lib/saved-data";

export default async function OutliersPage() {
  const user = await getCurrentUser();
  if (user) await ensureProfile(user);
  const demoMode = isMockMode();
  return (
    <AppShell
      title="Outlier Finder"
      subtitle="Discover experiences performing unusually well for their age, niche, and complexity."
      demoMode={demoMode}
      userEmail={user?.email}
    >
      <OutlierExplorer
        initialGames={getGames()}
        signedIn={Boolean(user)}
        initialSavedGameUniverseIds={await getSavedGameUniverseIds(user?.id)}
      />
    </AppShell>
  );
}
