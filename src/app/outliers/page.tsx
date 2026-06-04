import { AppShell } from "@/components/app-shell";
import { OutlierExplorer } from "@/components/outlier-explorer";
import { getGames } from "@/lib/data";
import { isMockMode } from "@/lib/mode";

export default function OutliersPage() {
  const demoMode = isMockMode();
  return <AppShell title="Outlier Finder" subtitle="Discover experiences performing unusually well for their age, niche, and complexity." demoMode={demoMode}><OutlierExplorer initialGames={getGames()} demoMode={demoMode} /></AppShell>;
}
