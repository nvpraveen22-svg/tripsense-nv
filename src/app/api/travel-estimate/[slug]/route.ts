import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase-admin";
import type { RoadEstimate, RailEstimate, FlightEstimate } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30; // seconds — Vercel default is 10s which Gemini can exceed

// gemini-2.0-flash is retired for this API key (confirmed via a live call:
// 404 "no longer available", same as gemini-1.5-flash and gemini-2.5-flash
// elsewhere in this project). gemini-3.6-flash is the model already proven
// working across the rest of this codebase's Gemini routes.
const MODEL_NAME = "gemini-3.6-flash";

function normalizeCity(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    road: {
      type: SchemaType.OBJECT,
      properties: {
        distance_km: { type: SchemaType.NUMBER },
        drive_hours: { type: SchemaType.NUMBER },
        fuel_cost_min: { type: SchemaType.NUMBER },
        fuel_cost_max: { type: SchemaType.NUMBER },
        toll_estimate: { type: SchemaType.NUMBER },
        best_route: { type: SchemaType.STRING },
        rest_stops: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tips: { type: SchemaType.STRING },
      },
      required: [
        "distance_km",
        "drive_hours",
        "fuel_cost_min",
        "fuel_cost_max",
        "toll_estimate",
        "best_route",
        "rest_stops",
        "tips",
      ],
    },
    rail: {
      type: SchemaType.OBJECT,
      properties: {
        journey_hours_min: { type: SchemaType.NUMBER },
        journey_hours_max: { type: SchemaType.NUMBER },
        sleeper_fare_min: { type: SchemaType.NUMBER },
        sleeper_fare_max: { type: SchemaType.NUMBER },
        ac3_fare_min: { type: SchemaType.NUMBER },
        ac3_fare_max: { type: SchemaType.NUMBER },
        ac2_fare_min: { type: SchemaType.NUMBER },
        ac2_fare_max: { type: SchemaType.NUMBER },
        popular_trains: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        nearest_station_destination: { type: SchemaType.STRING },
        tips: { type: SchemaType.STRING },
      },
      required: [
        "journey_hours_min",
        "journey_hours_max",
        "sleeper_fare_min",
        "sleeper_fare_max",
        "ac3_fare_min",
        "ac3_fare_max",
        "ac2_fare_min",
        "ac2_fare_max",
        "popular_trains",
        "nearest_station_destination",
        "tips",
      ],
    },
    flight: {
      type: SchemaType.OBJECT,
      properties: {
        duration_hours_min: { type: SchemaType.NUMBER },
        duration_hours_max: { type: SchemaType.NUMBER },
        economy_fare_min: { type: SchemaType.NUMBER },
        economy_fare_max: { type: SchemaType.NUMBER },
        nearest_airport_origin: { type: SchemaType.STRING },
        nearest_airport_destination: { type: SchemaType.STRING },
        airlines: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        tips: { type: SchemaType.STRING },
      },
      required: [
        "duration_hours_min",
        "duration_hours_max",
        "economy_fare_min",
        "economy_fare_max",
        "nearest_airport_origin",
        "nearest_airport_destination",
        "airlines",
        "tips",
      ],
    },
  },
  required: ["road", "rail", "flight"],
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
  console.log(`[travel-estimate] looking up destination for slug="${slug}"`);
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, state")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(`[travel-estimate] query error for slug="${slug}":`, error.message);
    return { ok: false, status: 500, message: error.message };
  }
  if (!data) {
    return { ok: false, status: 404, message: "Destination not found." };
  }
  return { ok: true, data: data as ResolvedDestination };
}

async function findCached(destinationId: string, originCity: string) {
  const supabase = createAdminClient();
  return supabase
    .from("travel_estimates")
    .select("road_json, rail_json, flight_json, generated_at")
    .eq("destination_id", destinationId)
    .eq("origin_city", originCity)
    .maybeSingle();
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const originRaw = searchParams.get("origin");
  if (!originRaw) {
    return NextResponse.json({ error: "Missing origin query param." }, { status: 400 });
  }
  const origin = normalizeCity(originRaw);

  const resolved = await resolveDestination(params.slug);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }

  const { data, error } = await findCached(resolved.data.id, origin);
  if (error) {
    console.error("[travel-estimate] cache lookup error:", error.message);
    return NextResponse.json(
      { error: "Couldn't load travel estimates right now." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({
    exists: true,
    road: data.road_json as RoadEstimate,
    rail: data.rail_json as RailEstimate,
    flight: data.flight_json as FlightEstimate,
    generated_at: data.generated_at,
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Travel estimates are not configured." },
      { status: 503 }
    );
  }

  let body: { origin?: string; refresh?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.origin) {
    return NextResponse.json({ error: "Missing origin in request body." }, { status: 400 });
  }
  const origin = normalizeCity(body.origin);
  const refresh = body.refresh === true;

  const resolved = await resolveDestination(params.slug);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message }, { status: resolved.status });
  }
  const destination = resolved.data;

  if (!refresh) {
    const { data: cached, error: cacheError } = await findCached(destination.id, origin);
    if (!cacheError && cached) {
      return NextResponse.json({
        road: cached.road_json as RoadEstimate,
        rail: cached.rail_json as RailEstimate,
        flight: cached.flight_json as FlightEstimate,
        generated_at: cached.generated_at,
        cached: true,
      });
    }
  }

  const prompt = `You are a travel cost estimator for Indian travellers. Give honest APPROXIMATE estimates only — not live fares.

Origin city: ${origin}
Destination: ${destination.name}, ${destination.state}

Return a JSON object with exactly this shape:
{
  "road": {
    "distance_km": number,
    "drive_hours": number,
    "fuel_cost_min": number,
    "fuel_cost_max": number,
    "toll_estimate": number,
    "best_route": "string (via which highways/cities)",
    "rest_stops": ["stop1", "stop2"],
    "tips": "string"
  },
  "rail": {
    "journey_hours_min": number,
    "journey_hours_max": number,
    "sleeper_fare_min": number,
    "sleeper_fare_max": number,
    "ac3_fare_min": number,
    "ac3_fare_max": number,
    "ac2_fare_min": number,
    "ac2_fare_max": number,
    "popular_trains": ["train name 1", "train name 2"],
    "nearest_station_destination": "string",
    "tips": "string"
  },
  "flight": {
    "duration_hours_min": number,
    "duration_hours_max": number,
    "economy_fare_min": number,
    "economy_fare_max": number,
    "nearest_airport_origin": "string",
    "nearest_airport_destination": "string",
    "airlines": ["airline1", "airline2"],
    "tips": "string"
  }
}

All costs in Indian Rupees (₹). Fuel cost assumes a car doing 15 km/litre at ₹103/litre. Return ONLY valid JSON, no markdown, no explanation.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const parsed: { road: RoadEstimate; rail: RailEstimate; flight: FlightEstimate } = JSON.parse(
        result.response.text()
      );
      const generatedAt = new Date().toISOString();

      const supabase = createAdminClient();
      const { error: upsertError } = await supabase.from("travel_estimates").upsert(
        {
          destination_id: destination.id,
          origin_city: origin,
          road_json: parsed.road,
          rail_json: parsed.rail,
          flight_json: parsed.flight,
          generated_at: generatedAt,
        },
        { onConflict: "destination_id,origin_city" }
      );

      if (upsertError) {
        console.error("[travel-estimate] upsert failed:", upsertError.message);
      }

      return NextResponse.json({
        road: parsed.road,
        rail: parsed.rail,
        flight: parsed.flight,
        generated_at: generatedAt,
        cached: false,
        saved: !upsertError,
      });
    } catch (err) {
      lastErr = err;
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[travel-estimate] attempt ${attempt} failed:`, message);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.error("[travel-estimate] all attempts failed:", lastErr);
  return NextResponse.json(
    { error: "Couldn't generate travel estimates right now. Please try again in a moment." },
    { status: 502 }
  );
}
