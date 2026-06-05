import { NextResponse } from "next/server";
import { collectSnapshotsForDueGames } from "@/lib/tracking";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  const url = new URL(request.url);
  return header === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!authorized(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await collectSnapshotsForDueGames();
  return NextResponse.json({
    message: `Collected ${results.filter((item) => item.ok).length} due snapshots`,
    results,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
