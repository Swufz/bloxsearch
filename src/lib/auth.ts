import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient, isSupabaseConfigured } from "./supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export async function requireUser(): Promise<{ user: User; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}

export async function ensureProfile(user: User) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) return;
  const admin = createSupabaseAdminClient();
  await admin.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
}
