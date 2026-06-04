import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  ensureGameRecord,
  getMissingSaveEnvVars,
  getSavedGameUniverseIds,
} from "@/lib/saved-data";

export async function GET() {
  const auth = await requireUser();
  if (!auth)
    return NextResponse.json(
      { error: "Sign in to save games and ideas." },
      { status: 401 },
    );
  return NextResponse.json({
    data: await getSavedGameUniverseIds(auth.user.id),
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth)
    return NextResponse.json(
      { error: "Sign in to save games and ideas." },
      { status: 401 },
    );
  const body = (await request.json().catch(() => ({}))) as { gameId?: string };
  if (!body.gameId || typeof body.gameId !== "string")
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  const missingEnv = getMissingSaveEnvVars();
  if (missingEnv.length) {
    console.error("[saved-games] Save attempted without required env vars", {
      missingEnv,
      gameId: body.gameId,
    });
    const message =
      process.env.NODE_ENV === "development"
        ? `Server is missing ${missingEnv.join(", ")}`
        : "Game could not be saved";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  const resolved = await ensureGameRecord(body.gameId);
  if (!resolved)
    return NextResponse.json(
      { error: "Game could not be saved" },
      { status: 400 },
    );
  const { data, error } = await auth.supabase
    .from("saved_games")
    .upsert(
      {
        user_id: auth.user.id,
        game_id: resolved.databaseId,
      },
      { onConflict: "user_id,game_id", ignoreDuplicates: true },
    )
    .select("id")
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("[saved-games] Failed to insert saved game", {
      userId: auth.user.id,
      gameId: body.gameId,
      databaseId: resolved.databaseId,
      error,
    });
    return NextResponse.json(
      { error: "Game could not be saved" },
      { status: 500 },
    );
  }
  return NextResponse.json(
    {
      message: "Game saved",
      data: { id: data?.id, universeId: resolved.game.robloxUniverseId },
    },
    { status: 201 },
  );
}
