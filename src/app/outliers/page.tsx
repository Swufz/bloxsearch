import { AppShell } from "@/components/app-shell";
import { OutlierExplorer } from "@/components/outlier-explorer";
import { getGames } from "@/lib/data";

export default function OutliersPage() {
  return <AppShell title="Outlier Finder" subtitle="Discover experiences performing unusually well for their age, niche, and complexity."><OutlierExplorer initialGames={getGames()} /></AppShell>;
}
