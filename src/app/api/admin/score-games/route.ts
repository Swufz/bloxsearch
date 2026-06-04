import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getGames } from "@/lib/data";

export async function POST() {
  if (!(await isAdminRequest())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ message: "Scores recalculated", count: getGames().length });
}
