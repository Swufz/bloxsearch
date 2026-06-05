import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { isMockMode } from "@/lib/mode";
import { collectSnapshotsForDueGames } from "@/lib/tracking";

export async function POST() {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await collectSnapshotsForDueGames();
  return NextResponse.json({
    message: `Collected ${results.filter((item) => item.ok).length} due snapshots`,
    results,
  });
}
