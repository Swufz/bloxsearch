import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SavedIdeasList } from "@/components/saved-ideas-list";
import { getCurrentUser } from "@/lib/auth";
import { isMockMode } from "@/lib/mode";
import { getUserSavedIdeas } from "@/lib/saved-data";

export default async function IdeasPage() {
  const demoMode = isMockMode();
  const user = await getCurrentUser();
  return (
    <AppShell title="Saved Ideas" subtitle="Your research-backed backlog of original Roblox concepts." demoMode={demoMode} userEmail={user?.email}>
      {user ? (
        <SavedIdeasList initialIdeas={await getUserSavedIdeas(user.id)} />
      ) : (
        <div className="card p-14 text-center">
          <h2 className="text-xl font-semibold">Sign in to view saved ideas.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Demo browsing is available, but saved ideas are attached to your account.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/login?next=/ideas" className="rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950">Sign in</Link>
            <Link href="/outliers" className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800">Continue demo browsing</Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
