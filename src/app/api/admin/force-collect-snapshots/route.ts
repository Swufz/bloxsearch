import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { isMockMode } from "@/lib/mode";
import { forceCollectSnapshotsForEnabledGames } from "@/lib/tracking";

export async function POST() {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const summary = await forceCollectSnapshotsForEnabledGames();
  return NextResponse.json({
    message: `Force collected ${summary.snapshotsCollected} snapshots`,
    ...summary,
  });
}
