import { NextResponse } from "next/server";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ message: "Saved idea removed", id: (await params).id });
}
