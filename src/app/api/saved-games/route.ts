import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureGameRecord, getSavedGameUniverseIds } from "@/lib/saved-data";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Sign in to save games and ideas." }, { status: 401 });
  return NextResponse.json({ data: await getSavedGameUniverseIds(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Sign in to save games and ideas." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { gameId?: string };
  if (!body.gameId || typeof body.gameId !== "string") return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  const resolved = await ensureGameRecord(body.gameId);
  if (!resolved) return NextResponse.json({ error: "Game could not be saved" }, { status: 400 });
  const { data, error } = await auth.supabase.from("saved_games").upsert({
    user_id: auth.user.id,
    game_id: resolved.databaseId,
  }, { onConflict: "user_id,game_id", ignoreDuplicates: true }).select("id").single();
  if (error && error.code !== "PGRST116") return NextResponse.json({ error: "Error saving game" }, { status: 500 });
  return NextResponse.json({ message: "Game saved", data: { id: data?.id, universeId: resolved.game.robloxUniverseId } }, { status: 201 });
}
