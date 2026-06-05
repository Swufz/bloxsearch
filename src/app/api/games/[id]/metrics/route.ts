import { NextResponse } from "next/server";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured())
    return NextResponse.json({ data: null, snapshots: [] });
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .or(`id.eq.${id},roblox_universe_id.eq.${id},roblox_place_id.eq.${id}`)
    .maybeSingle();
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  const [{ data: metrics }, { data: snapshots }] = await Promise.all([
    supabase.from("roblox_game_metrics").select("*").eq("game_id", game.id).maybeSingle(),
    supabase
      .from("roblox_game_snapshots")
      .select("captured_at, active_players, visits, favorites, like_ratio")
      .eq("game_id", game.id)
      .order("captured_at", { ascending: false })
      .limit(20),
  ]);
  return NextResponse.json({ data: metrics, snapshots: snapshots ?? [] });
}
