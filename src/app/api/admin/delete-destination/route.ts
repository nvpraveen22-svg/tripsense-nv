import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  let body: { pin?: string; destinationId?: string; destinationSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.pin !== "string" || body.pin !== adminPin) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  if (typeof body.destinationId !== "string" || typeof body.destinationSlug !== "string") {
    return NextResponse.json(
      { error: "destinationId and destinationSlug are required." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { destinationId, destinationSlug } = body;

  const deletions: Array<{ table: string; column: string; value: string }> = [
    { table: "media", column: "destination_id", value: destinationId },
    { table: "temples", column: "destination_id", value: destinationId },
    { table: "attractions", column: "destination_id", value: destinationId },
    { table: "hotels", column: "destination_id", value: destinationId },
    { table: "activities", column: "destination_id", value: destinationId },
    { table: "how_to_reach", column: "destination_id", value: destinationId },
    { table: "ai_itineraries", column: "destination_id", value: destinationId },
    { table: "destinations", column: "id", value: destinationId },
  ];

  for (const { table, column, value } of deletions) {
    const { error } = await supabase.from(table).delete().eq(column, value);
    if (error) {
      console.error(`[delete-destination] delete failed for ${table}:`, error.message);
      return NextResponse.json({ error: `Failed to delete: ${table}` }, { status: 500 });
    }
  }

  return NextResponse.json({ deleted: true, slug: destinationSlug });
}
