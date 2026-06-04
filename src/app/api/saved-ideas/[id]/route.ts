import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Sign in to save games and ideas." }, { status: 401 });
  const id = (await params).id;
  const { error } = await auth.supabase.from("saved_ideas").delete().eq("user_id", auth.user.id).eq("id", id);
  if (error) return NextResponse.json({ error: "Error deleting idea" }, { status: 500 });
  return NextResponse.json({ message: "Idea deleted", id });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Sign in to save games and ideas." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { notes?: string };
  const { data, error } = await auth.supabase.from("saved_ideas").update({
    notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : "",
    updated_at: new Date().toISOString(),
  }).eq("user_id", auth.user.id).eq("id", (await params).id).select("id, notes").single();
  if (error) return NextResponse.json({ error: "Error updating idea" }, { status: 500 });
  return NextResponse.json({ message: "Idea updated", data });
}
