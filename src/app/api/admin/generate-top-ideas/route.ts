import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { isMockMode } from "@/lib/mode";
import { generateTopIdeas } from "@/lib/top-ideas";

export async function POST() {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await generateTopIdeas();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Top idea generation failed";
    const status = message.toLowerCase().includes("rate limited") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
