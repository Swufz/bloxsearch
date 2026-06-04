import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { ensureGameRecord, getUserSavedIdeas } from "@/lib/saved-data";

type SaveIdeaBody = {
  gameId?: string;
  title?: string;
  description?: string;
  niche?: string;
  difficulty?: string;
  monetizationOptions?: string[];
  opportunityScore?: number;
  notes?: string;
};

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Sign in to save games and ideas." }, { status: 401 });
  return NextResponse.json({ data: await getUserSavedIdeas(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Sign in to save games and ideas." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as SaveIdeaBody;
  if (!body.title || typeof body.title !== "string") return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (body.title.length > 140) return NextResponse.json({ error: "title is too long" }, { status: 400 });
  const resolved = body.gameId ? await ensureGameRecord(body.gameId) : null;
  const { data, error } = await auth.supabase.from("saved_ideas").insert({
    user_id: auth.user.id,
    game_id: resolved?.databaseId ?? null,
    title: body.title,
    description: typeof body.description === "string" ? body.description.slice(0, 2000) : null,
    niche: typeof body.niche === "string" ? body.niche.slice(0, 80) : resolved?.game.niche ?? null,
    difficulty: typeof body.difficulty === "string" ? body.difficulty.slice(0, 30) : null,
    monetization_options: Array.isArray(body.monetizationOptions) ? body.monetizationOptions.slice(0, 12).map(String) : [],
    opportunity_score: Number.isFinite(body.opportunityScore) ? Math.round(Number(body.opportunityScore)) : resolved?.game.score.opportunity ?? null,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : null,
  }).select("id").single();
  if (error) return NextResponse.json({ error: "Error saving idea" }, { status: 500 });
  return NextResponse.json({ message: "Idea saved", data }, { status: 201 });
}
