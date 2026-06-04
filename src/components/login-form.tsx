"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const callbackError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(callbackError ?? "");
  const [loading, setLoading] = useState(false);

  async function sendMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });
      if (signInError) throw signInError;
      setMessage("Check your email for the login link.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send magic link.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card panel-glow p-7">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-slate-400">
        Sign in to save games, ideas, and research notes.
      </p>
      <form onSubmit={sendMagicLink} className="mt-7 space-y-4">
        <label className="block text-xs font-medium text-slate-300">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            placeholder="you@example.com"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-sky-400"
          />
        </label>
        <button
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Mail size={16} />
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>
      {message && (
        <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {message}
        </div>
      )}
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
