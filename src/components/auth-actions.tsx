"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuthActions({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  if (!userEmail) return <Link href="/login" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800">Log in</Link>;
  return <div className="flex items-center gap-2"><span className="hidden max-w-48 truncate text-sm text-slate-400 md:inline">{userEmail}</span><button onClick={async () => { await createSupabaseBrowserClient().auth.signOut(); router.refresh(); router.push("/dashboard?demo=true"); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"><LogOut size={13} />Logout</button></div>;
}
