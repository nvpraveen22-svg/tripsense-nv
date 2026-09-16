import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  let body: { pin?: string; destinationId?: string; isActive?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.pin !== "string" || body.pin !== adminPin) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  if (typeof body.destinationId !== "string" || typeof body.isActive !== "boolean") {
    return NextResponse.json({ error: "destinationId and isActive are required." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("destinations")
    .update({ is_active: body.isActive })
    .eq("id", body.destinationId);

  if (error) {
    console.error("[toggle-destination] update failed:", error.message);
    return NextResponse.json({ error: "Couldn't update destination." }, { status: 500 });
  }

  return NextResponse.json({ updated: true, isActive: body.isActive });
}
