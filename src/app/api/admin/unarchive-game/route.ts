import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { unarchiveGame } from "@/lib/dataset-pruning";
import { isMockMode } from "@/lib/mode";

export async function POST(request: Request) {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { gameId?: string };
  if (!body.gameId)
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  return NextResponse.json({ data: await unarchiveGame(body.gameId) });
}
