import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase-admin";
import type { AiRoadRoute } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// See src/app/api/travel-estimate/[slug]/route.ts for why this model:
// gemini-2.0-flash is retired for this API key, gemini-3.6-flash is the
// model already proven working across this project's Gemini routes.
const MODEL_NAME = "gemini-3.6-flash";

const responseSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      origin_city: { type: SchemaType.STRING },
      distance_km: { type: SchemaType.NUMBER },
      drive_hours: { type: SchemaType.NUMBER },
      best_route: { type: SchemaType.STRING },
      rest_stops: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      tips: { type: SchemaType.STRING },
    },
    required: ["origin_city", "distance_km", "drive_hours", "best_route", "rest_stops", "tips"],
  },
};

interface RouteParams {
  params: { slug: string };
}

interface ResolvedDestination {
  id: string;
  name: string;
  state: string;
}

type ResolveResult =
  | { ok: true; data: ResolvedDestination }
  | { ok: false; status: 404 | 500; message: string };

async function resolveDestination(slug: string): Promise<ResolveResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, state")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, message: error.message };
  }
  if (!data) {
    return { ok: false, status: 404, message: "Destination not found." };
  }
  return { ok: true, data: data as ResolvedDestination };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const resolved = await resolveDestination(params.slug);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }
  const destination = resolved.data;

  const supabase = createAdminClient();
  const { data: cached, error: cacheError } = await supabase
    .from("road_routes_ai")
    .select("routes_json, generated_at")
    .eq("destination_id", destination.id)
    .maybeSingle();

  if (cacheError) {
    console.error("[road-routes] cache lookup error:", cacheError.message);
    return NextResponse.json(
      { error: "Couldn't load route suggestions right now." },
      { status: 500 }
    );
  }

  if (cached) {
    return NextResponse.json({
      routes: cached.routes_json as AiRoadRoute[],
      generated_at: cached.generated_at,
      cached: true,
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Route suggestions are not configured." },
      { status: 503 }
    );
  }

  const prompt = `You are a travel expert for Indian road trips. For the destination ${destination.name}, ${destination.state}, India — name the 3 most popular cities that Indian travellers road trip FROM to reach this destination. For each city, provide:
- origin_city: the city name
- distance_km: approximate road distance in km
- drive_hours: approximate drive time in hours (realistic with breaks)
- best_route: the recommended highway route (e.g. 'NH44 via Nagpur')
- rest_stops: 2–3 good rest stop towns along the way
- tips: one practical driving tip specific to this route
Return a JSON array of exactly 3 objects. All distances and times should be realistic for Indian road conditions.`;

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
    const parsed: AiRoadRoute[] = JSON.parse(result.response.text());
    const generatedAt = new Date().toISOString();

    const { error: upsertError } = await supabase.from("road_routes_ai").upsert(
      {
        destination_id: destination.id,
        routes_json: parsed,
        generated_at: generatedAt,
      },
      { onConflict: "destination_id" }
    );

    if (upsertError) {
      console.error("[road-routes] upsert failed:", upsertError.message);
    }

    return NextResponse.json({
      routes: parsed,
      generated_at: generatedAt,
      cached: false,
    });
  } catch (err) {
    console.error("[road-routes] generation failed", err);
    return NextResponse.json(
      { error: "Couldn't generate routes right now." },
      { status: 502 }
    );
  }
}
