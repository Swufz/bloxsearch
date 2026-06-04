import { NextResponse } from "next/server";
import { getGames } from "@/lib/data";
import { isMockMode } from "@/lib/mode";

export async function GET() {
  return NextResponse.json(
    { data: getGames() },
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
