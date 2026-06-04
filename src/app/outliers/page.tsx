import { AppShell } from "@/components/app-shell";
import { OutlierExplorer } from "@/components/outlier-explorer";
import { SavedGamesProvider } from "@/components/saved-games-provider";
import { getDisplayGames } from "@/lib/data";
import { isMockMode } from "@/lib/mode";
import { ensureProfile, getCurrentUser } from "@/lib/auth";

export default async function OutliersPage() {
  if (process.env.NODE_ENV === "development")
    console.time("outliers data load");
  const user = await getCurrentUser();
  if (user) await ensureProfile(user);
  const demoMode = isMockMode();
  const games = await getDisplayGames();
  if (process.env.NODE_ENV === "development")
    console.timeEnd("outliers data load");
  return (
    <AppShell
      title="Outlier Finder"
      subtitle="Discover experiences performing unusually well for their age, niche, and complexity."
      demoMode={demoMode}
      userEmail={user?.email}
    >
      <SavedGamesProvider signedIn={Boolean(user)}>
        <OutlierExplorer initialGames={games} signedIn={Boolean(user)} />
      </SavedGamesProvider>
    </AppShell>
  );
}
