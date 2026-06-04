import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { title?: string };
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  return NextResponse.json({ message: "Saved idea placeholder accepted", title: body.title }, { status: 201 });
}
