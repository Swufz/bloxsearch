import { NextResponse } from "next/server";
import { getGame } from "@/lib/data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const game = getGame((await params).id);
  return game ? NextResponse.json({ data: game }) : NextResponse.json({ error: "Game not found" }, { status: 404 });
}
