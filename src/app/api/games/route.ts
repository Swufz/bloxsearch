import { NextResponse } from "next/server";
import { getGames } from "@/lib/data";

export async function GET() {
  return NextResponse.json({ data: getGames() });
}
