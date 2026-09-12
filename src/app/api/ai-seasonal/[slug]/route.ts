import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase-admin";
import type { AiSeasonalContent } from "@/types";

export const runtime = "nodejs";

const MODEL_NAME = "gemini-3.6-flash";
const PROMPT_VERSION = 1;

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    recommendation: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["go_now", "wait", "book_ahead"],
    },
    recommendationReason: { type: SchemaType.STRING },
    upcomingEvents: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          timing: { type: SchemaType.STRING },
        },
        required: ["name", "timing"],
      },
    },
    currentSeasonTips: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    openNow: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    closedNow: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
  },
  required: [
    "recommendation",
    "recommendationReason",
    "upcomingEvents",
    "currentSeasonTips",
    "openNow",
    "closedNow",
  ],
};

interface RouteParams {
  params: { slug: string };
}

interface SeasonalDestination {
  id: string;
  name: string;
  state: string;
  tagline: string | null;
  best_time_to_visit: string | null;
  best_months: string[] | null;
  okay_months: string[] | null;
  avoid_months: string[] | null;
  month_notes: Record<string, string> | null;
}

type ResolveResult =
  | { ok: true; data: SeasonalDestination }
  | { ok: false; status: 404 | 500; message: string };

async function resolveDestination(slug: string): Promise<ResolveResult> {
  const supabase = createAdminClient();
  console.log(`[ai-seasonal] looking up destination for slug="${slug}"`);
  const { data, error } = await supabase
    .from("destinations")
    .select(
      "id, name, state, tagline, best_time_to_visit, best_months, okay_months, avoid_months, month_notes"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    // A schema/query error (e.g. a selected column doesn't exist yet) is NOT
    // the same as "no destination with this slug" - conflating the two is
    // exactly what made this show a misleading "Destination not found".
    console.error(`[ai-seasonal] query error for slug="${slug}":`, error.message, error);
    return { ok: false, status: 500, message: error.message };
  }

  if (!data) {
    console.warn(`[ai-seasonal] no destination row matched slug="${slug}"`);
    return { ok: false, status: 404, message: "Destination not found." };
  }

  console.log(`[ai-seasonal] resolved slug="${slug}" -> id=${data.id}`);
  return { ok: true, data: data as SeasonalDestination };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolved = await resolveDestination(params.slug);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }
  const destination = resolved.data;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_insights")
    .select("content, generated_at, prompt_version")
    .eq("destination_id", destination.id)
    .eq("type", "seasonal")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Couldn't load the seasonal snapshot right now." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ exists: false });
  }

  let content: AiSeasonalContent;
  try {
    content = JSON.parse(data.content);
  } catch {
    return NextResponse.json(
      { error: "Stored seasonal snapshot is corrupted." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    exists: true,
    content,
    generated_at: data.generated_at,
    prompt_version: data.prompt_version,
  });
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI seasonal snapshots are not configured." },
      { status: 503 }
    );
  }

  const resolved = await resolveDestination(params.slug);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }
  const destination = resolved.data;

  const now = new Date();
  const currentMonthLabel = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const sixtyDaysOut = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const windowLabel = sixtyDaysOut.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const monthContext =
    destination.best_months || destination.okay_months || destination.avoid_months
      ? `\nSeasonal reference for this destination: best months ${(destination.best_months ?? []).join(", ") || "n/a"}; okay months ${(destination.okay_months ?? []).join(", ") || "n/a"}; avoid months ${(destination.avoid_months ?? []).join(", ") || "n/a"}. Notes: ${destination.month_notes ? JSON.stringify(destination.month_notes) : "n/a"}.`
      : "";

  const prompt = `You are a practical, honest Indian travel advisor. It is currently ${currentMonthLabel}. Give a seasonal snapshot for a traveler considering ${destination.name}, ${destination.state}, India, for a trip sometime between now and ${windowLabel} (the next 60 days).
${monthContext}
Tagline: ${destination.tagline ?? "n/a"}. Typical best time to visit: ${destination.best_time_to_visit ?? "n/a"}.

Answer honestly based on the current real-world calendar date (${currentMonthLabel}):
1. recommendation: one of "go_now" (conditions are good, go soon), "wait" (current season is bad, better to wait for a specific window), or "book_ahead" (conditions will be good but it's peak/festival season so book lodging/transport early) - plus a one or two sentence recommendationReason explaining why, grounded in the actual current month and this destination's season.
2. upcomingEvents: any real festivals, local events, or seasonal phenomena (e.g. coffee blossom, migratory birds, a specific festival) plausibly happening in ${destination.name} within the next 60 days from ${currentMonthLabel}. If genuinely nothing notable, return an empty array rather than inventing one.
3. currentSeasonTips: 3-5 concrete tips specific to traveling there RIGHT NOW in ${currentMonthLabel} (weather reality, crowd levels, what to pack).
4. openNow / closedNow: which typical activities or attraction types (e.g. "river rafting", "high-altitude trekking", "beach shacks") are realistically open vs closed/reduced right now given the current season - short phrases, not full sentences.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const result = await model.generateContent(prompt);
    const content: AiSeasonalContent = JSON.parse(result.response.text());
    const generatedAt = new Date().toISOString();

    const supabase = createAdminClient();
    const { error: upsertError } = await supabase.from("ai_insights").upsert(
      {
        destination_id: destination.id,
        type: "seasonal",
        content: JSON.stringify(content),
        generated_at: generatedAt,
        prompt_version: PROMPT_VERSION,
      },
      { onConflict: "destination_id,type" }
    );

    if (upsertError) {
      console.error("ai-seasonal upsert failed", upsertError);
    }

    return NextResponse.json({
      content,
      generated_at: generatedAt,
      prompt_version: PROMPT_VERSION,
      saved: !upsertError,
    });
  } catch (err) {
    console.error("ai-seasonal generation failed", err);
    return NextResponse.json(
      { error: "Couldn't generate a seasonal snapshot right now. Please try again." },
      { status: 502 }
    );
  }
}
