import { AppShell } from "@/components/app-shell";
import { SavedIdeasList } from "@/components/saved-ideas-list";
import { getSavedIdeas } from "@/lib/data";
import { isMockMode } from "@/lib/mode";

export default function IdeasPage() {
  const demoMode = isMockMode();
  return (
    <AppShell title="Saved Ideas" subtitle="Your research-backed backlog of original Roblox concepts." demoMode={demoMode}>
      <SavedIdeasList initialIdeas={getSavedIdeas()} demoMode={demoMode} />
    </AppShell>
  );
}
