import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { isMockMode } from "@/lib/mode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertTrendClusters } from "@/lib/trend-clustering";

export async function GET() {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("trend_clusters")
    .select("*")
    .order("total_active_players", { ascending: false })
    .limit(25);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST() {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await upsertTrendClusters();
  return NextResponse.json({ message: `Updated ${data.length} trend clusters`, data });
}
