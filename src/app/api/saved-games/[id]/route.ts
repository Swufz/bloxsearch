import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureGameRecord } from "@/lib/saved-data";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Sign in to save games and ideas." }, { status: 401 });
  const id = (await params).id;
  const resolved = await ensureGameRecord(id);
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  let query = auth.supabase.from("saved_games").delete().eq("user_id", auth.user.id);
  query = resolved ? query.eq("game_id", resolved.databaseId) : uuidLike ? query.or(`id.eq.${id},game_id.eq.${id}`) : query.eq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await query;
  if (error) return NextResponse.json({ error: "Error removing game" }, { status: 500 });
  return NextResponse.json({ message: "Game removed", id });
}
