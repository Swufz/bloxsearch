"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");
  const [error, setError] = useState(callbackError ?? "");
  const [loading, setLoading] = useState(false);

  async function continueWithGoogle() {
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL;
      if (!origin) throw new Error("Site URL is not configured.");
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start Google sign-in. Check your Supabase URL and Google provider settings.",
      );
      setLoading(false);
    } finally {
      if (typeof window === "undefined") setLoading(false);
    }
  }

  return (
    <div className="card panel-glow p-7">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-400">
        Sign in to save games, ideas, and research notes.
      </p>
      <button
        onClick={continueWithGoogle}
        disabled={loading}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirecting..." : "Continue with Google"}
      </button>
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="my-5 flex items-center gap-3 text-[11px] text-slate-600">
        <span className="h-px flex-1 bg-slate-800" />
        or
        <span className="h-px flex-1 bg-slate-800" />
      </div>
      <Link
        href="/dashboard?demo=true"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
      >
        Continue to demo <ArrowRight size={15} />
      </Link>
      <p className="mt-5 text-center text-[11px] text-slate-500">
        Demo browsing is available without login. Saving requires an account.
      </p>
    </div>
  );
}
