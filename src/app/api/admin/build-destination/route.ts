import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

// gemini-2.0-flash is retired for this API key; gemini-3.6-flash is the
// model already proven working across this project's Gemini routes.
const MODEL_NAME = "gemini-3.6-flash";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const attractionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["nature", "wildlife", "adventure", "beach", "heritage", "culture"],
    },
    description: { type: SchemaType.STRING },
    distance_from_center_km: { type: SchemaType.NUMBER },
    entry_fee_adult: { type: SchemaType.NUMBER },
    entry_fee_child: { type: SchemaType.NUMBER },
    timings: { type: SchemaType.STRING },
    duration_hours: { type: SchemaType.NUMBER },
    family_friendly: { type: SchemaType.BOOLEAN },
  },
  required: [
    "name", "category", "description", "distance_from_center_km",
    "entry_fee_adult", "entry_fee_child", "timings", "duration_hours", "family_friendly",
  ],
};

const hotelSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    stars: { type: SchemaType.NUMBER },
    rating: { type: SchemaType.NUMBER },
    price_min: { type: SchemaType.NUMBER },
    price_max: { type: SchemaType.NUMBER },
    address: { type: SchemaType.STRING },
    amenities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    ai_summary: { type: SchemaType.STRING },
    warning_flag: { type: SchemaType.BOOLEAN },
    warning_reason: { type: SchemaType.STRING },
  },
  required: [
    "name", "stars", "rating", "price_min", "price_max", "address",
    "amenities", "ai_summary", "warning_flag", "warning_reason",
  ],
};

const activitySchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING },
    category: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["adventure", "wildlife", "leisure", "nature", "culture", "heritage"],
    },
    description: { type: SchemaType.STRING },
    duration_hours: { type: SchemaType.NUMBER },
    price_per_person: { type: SchemaType.NUMBER },
    family_friendly: { type: SchemaType.BOOLEAN },
    booking_required: { type: SchemaType.BOOLEAN },
  },
  required: [
    "name", "category", "description", "duration_hours",
    "price_per_person", "family_friendly", "booking_required",
  ],
};

const howToReachSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    mode: { type: SchemaType.STRING, format: "enum", enum: ["road", "train", "air", "bus"] },
    description: { type: SchemaType.STRING },
    distance_from_hyderabad_km: { type: SchemaType.NUMBER },
    duration_from_hyderabad: { type: SchemaType.STRING },
    nearest_airport: { type: SchemaType.STRING },
    nearest_railway_station: { type: SchemaType.STRING },
    tips: { type: SchemaType.STRING },
  },
  required: [
    "mode", "description", "distance_from_hyderabad_km", "duration_from_hyderabad",
    "nearest_airport", "nearest_railway_station", "tips",
  ],
};

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    destination: {
      type: SchemaType.OBJECT,
      properties: {
        tagline: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        best_time_to_visit: { type: SchemaType.STRING },
        ideal_trip_days_min: { type: SchemaType.NUMBER },
        ideal_trip_days_max: { type: SchemaType.NUMBER },
        history_culture: { type: SchemaType.STRING },
        month_notes: { type: SchemaType.STRING },
        best_months: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING, format: "enum", enum: MONTHS },
        },
        okay_months: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING, format: "enum", enum: MONTHS },
        },
        avoid_months: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING, format: "enum", enum: MONTHS },
        },
      },
      required: [
        "tagline", "description", "best_time_to_visit", "ideal_trip_days_min",
        "ideal_trip_days_max", "history_culture", "month_notes",
        "best_months", "okay_months", "avoid_months",
      ],
    },
    attractions: { type: SchemaType.ARRAY, items: attractionSchema },
    hotels: { type: SchemaType.ARRAY, items: hotelSchema },
    activities: { type: SchemaType.ARRAY, items: activitySchema },
    how_to_reach: { type: SchemaType.ARRAY, items: howToReachSchema },
  },
  required: ["destination", "attractions", "hotels", "activities", "how_to_reach"],
};

interface GeneratedDestination {
  tagline: string;
  description: string;
  best_time_to_visit: string;
  ideal_trip_days_min: number;
  ideal_trip_days_max: number;
  history_culture: string;
  month_notes: string;
  best_months: string[];
  okay_months: string[];
  avoid_months: string[];
}

interface GeneratedAttraction {
  name: string;
  category: string;
  description: string;
  distance_from_center_km: number;
  entry_fee_adult: number;
  entry_fee_child: number;
  timings: string;
  duration_hours: number;
  family_friendly: boolean;
}

interface GeneratedHotel {
  name: string;
  stars: number;
  rating: number;
  price_min: number;
  price_max: number;
  address: string;
  amenities: string[];
  ai_summary: string;
  warning_flag: boolean;
  warning_reason: string;
}

interface GeneratedActivity {
  name: string;
  category: string;
  description: string;
  duration_hours: number;
  price_per_person: number;
  family_friendly: boolean;
  booking_required: boolean;
}

interface GeneratedHowToReach {
  mode: "road" | "train" | "air" | "bus";
  description: string;
  distance_from_hyderabad_km: number;
  duration_from_hyderabad: string;
  nearest_airport: string;
  nearest_railway_station: string;
  tips: string;
}

interface GeneratedPayload {
  destination: GeneratedDestination;
  attractions: GeneratedAttraction[];
  hotels: GeneratedHotel[];
  activities: GeneratedActivity[];
  how_to_reach: GeneratedHowToReach[];
}

export async function POST(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Destination builder is not configured." },
      { status: 503 }
    );
  }

  let body: { pin?: string; name?: string; state?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.pin !== "string" || body.pin !== adminPin) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Destination name is required." }, { status: 400 });
  }
  const stateHint = body.state?.trim();

  const slug = generateSlug(name);
  if (!slug) {
    return NextResponse.json({ error: "Couldn't derive a slug from that name." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing, error: lookupError } = await supabase
    .from("destinations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (lookupError) {
    console.error("[build-destination] lookup error:", lookupError.message);
    return NextResponse.json({ error: "Couldn't check for an existing destination." }, { status: 500 });
  }
  if (existing) {
    return NextResponse.json(
      { error: `A destination with slug "${slug}" already exists.` },
      { status: 409 }
    );
  }

  const prompt = `You are a travel content expert building a destination guide for TripSense AI, an Indian travel planning app used mainly by travellers from Hyderabad.

Destination name: ${name}${stateHint ? `\nState: ${stateHint}` : "\n(Infer the correct real Indian state for this destination.)"}

Generate a complete, realistic destination guide as a JSON object with exactly this shape:
- destination: tagline, description, best_time_to_visit, ideal_trip_days_min, ideal_trip_days_max, history_culture, month_notes, best_months (array of month names), okay_months, avoid_months
- attractions: exactly 6 real, well-known attractions/sights near this destination
- hotels: exactly 5 realistic hotels or stays spanning budget to luxury (set warning_flag true only if there's a genuine, common practical caveat for that property, e.g. remote location or seasonal closure, otherwise false with warning_reason as an empty string)
- activities: exactly 5 things travellers can do there
- how_to_reach: exactly 4 entries, one each for mode "road", "train", "air", and "bus", describing how to reach ${name} from Hyderabad specifically

All costs must be in Indian Rupees (numbers only, no currency symbols). Month names must be full English month names (e.g. "October"). Be realistic and specific — use real place names, real highway/route references, and real nearby airports/stations where possible. Return ONLY the JSON object, no markdown, no explanation.`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  let parsed: GeneratedPayload | undefined;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      parsed = JSON.parse(result.response.text());
      break;
    } catch (err) {
      lastErr = err;
      console.error(`[build-destination] attempt ${attempt} failed:`, err);
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    }
  }

  if (!parsed) {
    const message = lastErr instanceof Error ? lastErr.message : "Unknown error";
    console.error("[build-destination] all attempts failed:", lastErr);
    return NextResponse.json(
      { error: `Couldn't generate destination content: ${message}` },
      { status: 502 }
    );
  }

  const { data: destinationRow, error: insertDestError } = await supabase
    .from("destinations")
    .insert({
      name,
      slug,
      state: stateHint || "",
      tagline: parsed.destination.tagline,
      description: parsed.destination.description,
      best_time_to_visit: parsed.destination.best_time_to_visit,
      ideal_trip_days_min: parsed.destination.ideal_trip_days_min,
      ideal_trip_days_max: parsed.destination.ideal_trip_days_max,
      history_culture: parsed.destination.history_culture,
      month_notes: parsed.destination.month_notes,
      best_months: parsed.destination.best_months,
      okay_months: parsed.destination.okay_months,
      avoid_months: parsed.destination.avoid_months,
      status: "active",
    })
    .select("id")
    .single();

  if (insertDestError || !destinationRow) {
    console.error("[build-destination] destination insert failed:", insertDestError?.message);
    return NextResponse.json(
      { error: "Couldn't create the destination record." },
      { status: 500 }
    );
  }

  const destinationId = destinationRow.id;
  const counts = { attractions: 0, hotels: 0, activities: 0, howToReach: 0 };

  const { error: attractionsError } = await supabase.from("attractions").insert(
    parsed.attractions.map((a, i) => ({ ...a, destination_id: destinationId, sort_order: i + 1 }))
  );
  if (attractionsError) {
    console.error("[build-destination] attractions insert failed:", attractionsError.message);
  } else {
    counts.attractions = parsed.attractions.length;
  }

  const { error: hotelsError } = await supabase.from("hotels").insert(
    parsed.hotels.map((h) => ({
      ...h,
      // hotels_stars_check requires stars >= 3; Gemini has no visibility
      // into that DB constraint, so clamp rather than let one budget
      // property fail the whole batch insert.
      stars: Math.max(3, h.stars),
      destination_id: destinationId,
    }))
  );
  if (hotelsError) {
    console.error("[build-destination] hotels insert failed:", hotelsError.message);
  } else {
    counts.hotels = parsed.hotels.length;
  }

  const { error: activitiesError } = await supabase.from("activities").insert(
    parsed.activities.map((a, i) => ({ ...a, destination_id: destinationId, sort_order: i + 1 }))
  );
  if (activitiesError) {
    console.error("[build-destination] activities insert failed:", activitiesError.message);
  } else {
    counts.activities = parsed.activities.length;
  }

  const { error: howToReachError } = await supabase.from("how_to_reach").insert(
    parsed.how_to_reach.map((r) => ({ ...r, destination_id: destinationId }))
  );
  if (howToReachError) {
    console.error("[build-destination] how_to_reach insert failed:", howToReachError.message);
  } else {
    counts.howToReach = parsed.how_to_reach.length;
  }

  return NextResponse.json({
    success: true,
    slug,
    destinationId,
    counts,
  });
}
