import { NextResponse } from "next/server";
import { getGame } from "@/lib/data";
import { isMockMode } from "@/lib/mode";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const game = getGame((await params).id);
  return game
    ? NextResponse.json(
        { data: game },
        {
          headers: isMockMode()
            ? {
                "Cache-Control":
                  "public, s-maxage=300, stale-while-revalidate=3600",
              }
            : undefined,
        },
      )
    : NextResponse.json({ error: "Game not found" }, { status: 404 });
}
