import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { disableTrackingForGame } from "@/lib/tracking";

export async function POST(request: Request) {
  if (!(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { gameId?: string };
  if (!body.gameId)
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  const data = await disableTrackingForGame(body.gameId);
  return NextResponse.json({ message: "Tracking disabled", data });
}
