import { NextResponse } from "next/server";
import { getDisplayGames } from "@/lib/data";
import { isMockMode } from "@/lib/mode";

export async function GET() {
  const games = await getDisplayGames();
  return NextResponse.json(
    { data: games },
    {
      headers: isMockMode()
        ? {
            "Cache-Control":
              "public, s-maxage=300, stale-while-revalidate=3600",
          }
        : undefined,
    },
  );
}
