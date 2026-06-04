import { isSupabaseConfigured, createSupabaseServerClient } from "./supabase/server";

export async function isAdminRequest() {
  if (process.env.NODE_ENV === "development" && !isSupabaseConfigured()) return true;
  if (!isSupabaseConfigured()) return false;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase());
  return Boolean(data.user?.email && admins.includes(data.user.email.toLowerCase()));
}
