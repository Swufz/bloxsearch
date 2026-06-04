import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { canFetchGame } from "@/lib/rate-limit";
import { fetchGameByUniverseId } from "@/lib/roblox";

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { universeId?: string };
  if (!body.universeId || !/^\d+$/.test(body.universeId)) return NextResponse.json({ error: "A numeric universeId is required" }, { status: 400 });
  if (!canFetchGame(body.universeId)) return NextResponse.json({ error: "This game was fetched within the last 10 minutes" }, { status: 429 });
  try {
    return NextResponse.json({ data: await fetchGameByUniverseId(body.universeId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Fetch failed" }, { status: 502 });
  }
}
