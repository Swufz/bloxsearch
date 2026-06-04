import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@/lib/auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/dashboard";
  if (!code || !isSupabaseConfigured()) return NextResponse.redirect(new URL("/login", url.origin));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
  if (data.user) await ensureProfile(data.user);
  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/dashboard", url.origin));
}
