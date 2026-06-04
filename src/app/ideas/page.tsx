import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SavedGamesList } from "@/components/saved-games-list";
import { SavedIdeasList } from "@/components/saved-ideas-list";
import { getCurrentUser } from "@/lib/auth";
import { isMockMode } from "@/lib/mode";
import { getUserSavedGames, getUserSavedIdeas } from "@/lib/saved-data";

export default async function IdeasPage() {
  const demoMode = isMockMode();
  const user = await getCurrentUser();
  const [savedGames, savedIdeas] = user
    ? await Promise.all([
        getUserSavedGames(user.id),
        getUserSavedIdeas(user.id),
      ])
    : [[], []];

  return (
    <AppShell
      title="Saved Research"
      subtitle="Your bookmarked games and generated build directions."
      demoMode={demoMode}
      userEmail={user?.email}
    >
      {user ? (
        <div className="space-y-10">
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Saved Games</h2>
              <p className="mt-1 text-xs text-slate-500">
                Bookmarked Roblox market signals you want to revisit.
              </p>
            </div>
            <SavedGamesList initialGames={savedGames} />
          </section>
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Saved Ideas</h2>
              <p className="mt-1 text-xs text-slate-500">
                Generated directions you saved from game analysis pages.
              </p>
            </div>
            <SavedIdeasList initialIdeas={savedIdeas} />
          </section>
        </div>
      ) : (
        <div className="card p-14 text-center">
          <h2 className="text-xl font-semibold">
            Sign in to view saved research.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Demo browsing is available, but saved games and ideas are attached
            to your account.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login?next=/ideas"
              className="rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950"
            >
              Sign in
            </Link>
            <Link
              href="/outliers"
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              Continue demo browsing
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
