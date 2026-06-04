import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { gameId?: string };
  if (!body.gameId) return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  return NextResponse.json({ message: "Saved game placeholder accepted", gameId: body.gameId }, { status: 201 });
}
