import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import { getDatasetSettings, updateDatasetSettings } from "@/lib/dataset-settings";
import { isMockMode } from "@/lib/mode";

export async function GET() {
  return NextResponse.json({ data: await getDatasetSettings() });
}

export async function POST(request: Request) {
  if (!isMockMode() && !(await isAdminRequest()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  return NextResponse.json({ data: await updateDatasetSettings(body) });
}
