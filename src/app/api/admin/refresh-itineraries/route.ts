import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json(
      { error: "Admin access is not configured." },
      { status: 503 }
    );
  }

  let body: { pin?: string; destinationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (body.pin !== adminPin) {
    return NextResponse.json({ error: "Invalid PIN." }, { status: 401 });
  }
  if (!body.destinationId) {
    return NextResponse.json({ error: "Missing destinationId." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error, count } = await supabase
    .from("ai_itineraries")
    .delete({ count: "exact" })
    .eq("destination_id", body.destinationId);

  if (error) {
    return NextResponse.json(
      { error: "Couldn't clear cached itineraries." },
      { status: 500 }
    );
  }

  return NextResponse.json({ cleared: count ?? 0 });
}
