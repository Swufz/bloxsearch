import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureProfile } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const providerError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(providerError)}`, requestUrl.origin));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=Supabase%20is%20not%20configured.", requestUrl.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=Missing%20OAuth%20code.", requestUrl.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) await ensureProfile(data.user);

  return NextResponse.redirect(new URL(next.startsWith("/") ? next : "/dashboard", requestUrl.origin));
}
