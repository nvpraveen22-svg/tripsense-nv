import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";
import { searchPlace, getPlaceDetails } from "@/lib/google-places";

export const runtime = "nodejs";
export const maxDuration = 60;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function needsEnrichment(placesEnrichedAt: string | null): boolean {
  if (!placesEnrichedAt) return true;
  return Date.now() - new Date(placesEnrichedAt).getTime() > SEVEN_DAYS_MS;
}

interface DestinationRow {
  id: string;
  name: string;
  state: string;
  slug: string;
}

interface NamedRow {
  id: string;
  name: string;
  places_enriched_at: string | null;
}

interface EnrichCounts {
  enriched: number;
  noMatch: number;
  errors: number;
  skipped: number;
}

// Shared by attractions and temples - both only get google_rating,
// google_place_id, and places_enriched_at (no phone/website/reviews count,
// unlike hotels, which also fetches Place Details for those).
async function enrichRatingOnlyTable(
  supabase: SupabaseClient,
  table: "attractions" | "temples",
  destinationId: string,
  destinationSlug: string,
  cityName: string
): Promise<EnrichCounts> {
  const counts: EnrichCounts = { enriched: 0, noMatch: 0, errors: 0, skipped: 0 };

  const { data: rows, error: lookupError } = await supabase
    .from(table)
    .select("id, name, places_enriched_at")
    .eq("destination_id", destinationId);

  if (lookupError) {
    console.error(`[enrich-places] ${table} lookup failed for ${destinationSlug}:`, lookupError.message);
    counts.errors++;
    return counts;
  }

  for (const row of (rows ?? []) as NamedRow[]) {
    if (!needsEnrichment(row.places_enriched_at)) {
      counts.skipped++;
      continue;
    }

    const found = await searchPlace(row.name, cityName);
    await sleep(200);
    if (found === undefined) {
      counts.errors++;
      continue;
    }
    if (found === null) {
      counts.noMatch++;
      continue;
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({
        google_rating: found.rating,
        google_place_id: found.placeId,
        places_enriched_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (updateError) {
      console.error(`[enrich-places] ${table} update failed for "${row.name}":`, updateError.message);
      counts.errors++;
    } else {
      counts.enriched++;
    }
  }

  return counts;
}

export async function POST(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  const placesKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placesKey) {
    console.warn("[enrich-places] GOOGLE_PLACES_API_KEY is not set — skipping enrichment.");
    return NextResponse.json(
      { error: "Google Places enrichment is not configured." },
      { status: 503 }
    );
  }

  let body: {
    pin?: string;
    destinationSlug?: string;
    type?: "hotels" | "attractions" | "temples" | "all";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.pin !== "string" || body.pin !== adminPin) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const type = body.type ?? "all";
  const supabase = createAdminClient();

  let destQuery = supabase.from("destinations").select("id, name, state, slug");
  if (body.destinationSlug) {
    destQuery = destQuery.eq("slug", body.destinationSlug);
  }
  const { data: destinations, error: destError } = await destQuery;
  if (destError) {
    console.error("[enrich-places] destinations lookup failed:", destError.message);
    return NextResponse.json({ error: "Couldn't load destinations." }, { status: 500 });
  }
  if (body.destinationSlug && (!destinations || destinations.length === 0)) {
    return NextResponse.json(
      { error: `No destination found for slug "${body.destinationSlug}".` },
      { status: 404 }
    );
  }

  let hotelsEnriched = 0;
  let attractionsEnriched = 0;
  let templesEnriched = 0;
  let skipped = 0;
  let noMatch = 0;
  let errors = 0;

  for (const dest of (destinations ?? []) as DestinationRow[]) {
    const cityName = `${dest.name} ${dest.state}`.trim();

    if (type === "hotels" || type === "all") {
      const { data: hotels, error: hotelsError } = await supabase
        .from("hotels")
        .select("id, name, places_enriched_at")
        .eq("destination_id", dest.id);

      if (hotelsError) {
        console.error(`[enrich-places] hotels lookup failed for ${dest.slug}:`, hotelsError.message);
        errors++;
      } else {
        for (const hotel of (hotels ?? []) as NamedRow[]) {
          if (!needsEnrichment(hotel.places_enriched_at)) {
            skipped++;
            continue;
          }

          const found = await searchPlace(hotel.name, cityName);
          await sleep(200);
          if (found === undefined) {
            errors++;
            continue;
          }
          if (found === null) {
            noMatch++;
            continue;
          }

          const details = await getPlaceDetails(found.placeId);
          await sleep(200);

          const { error: updateError } = await supabase
            .from("hotels")
            .update({
              google_rating: details?.rating ?? found.rating,
              google_reviews_count: details?.userRatingsTotal ?? found.userRatingsTotal,
              phone: details?.phone ?? null,
              website: details?.website ?? null,
              google_place_id: found.placeId,
              places_enriched_at: new Date().toISOString(),
            })
            .eq("id", hotel.id);

          if (updateError) {
            console.error(
              `[enrich-places] hotel update failed for "${hotel.name}":`,
              updateError.message
            );
            errors++;
          } else {
            hotelsEnriched++;
          }
        }
      }
    }

    if (type === "attractions" || type === "all") {
      const c = await enrichRatingOnlyTable(supabase, "attractions", dest.id, dest.slug, cityName);
      attractionsEnriched += c.enriched;
      noMatch += c.noMatch;
      errors += c.errors;
      skipped += c.skipped;
    }

    if (type === "temples" || type === "all") {
      const c = await enrichRatingOnlyTable(supabase, "temples", dest.id, dest.slug, cityName);
      templesEnriched += c.enriched;
      noMatch += c.noMatch;
      errors += c.errors;
      skipped += c.skipped;
    }
  }

  return NextResponse.json({
    enriched: { hotels: hotelsEnriched, attractions: attractionsEnriched, temples: templesEnriched },
    skipped,
    noMatch,
    errors,
  });
}
