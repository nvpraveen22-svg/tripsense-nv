import { NextRequest, NextResponse } from "next/server";
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

interface HotelRow {
  id: string;
  name: string;
  places_enriched_at: string | null;
}

interface AttractionRow {
  id: string;
  name: string;
  places_enriched_at: string | null;
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

  let body: { pin?: string; destinationSlug?: string; type?: "hotels" | "attractions" | "all" };
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
  let skipped = 0;
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
        for (const hotel of (hotels ?? []) as HotelRow[]) {
          if (!needsEnrichment(hotel.places_enriched_at)) {
            skipped++;
            continue;
          }

          const found = await searchPlace(hotel.name, cityName);
          await sleep(200);
          if (!found) {
            errors++;
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
      const { data: attractions, error: attractionsError } = await supabase
        .from("attractions")
        .select("id, name, places_enriched_at")
        .eq("destination_id", dest.id);

      if (attractionsError) {
        console.error(
          `[enrich-places] attractions lookup failed for ${dest.slug}:`,
          attractionsError.message
        );
        errors++;
      } else {
        for (const attraction of (attractions ?? []) as AttractionRow[]) {
          if (!needsEnrichment(attraction.places_enriched_at)) {
            skipped++;
            continue;
          }

          const found = await searchPlace(attraction.name, cityName);
          await sleep(200);
          if (!found) {
            errors++;
            continue;
          }

          const { error: updateError } = await supabase
            .from("attractions")
            .update({
              google_rating: found.rating,
              google_place_id: found.placeId,
              places_enriched_at: new Date().toISOString(),
            })
            .eq("id", attraction.id);

          if (updateError) {
            console.error(
              `[enrich-places] attraction update failed for "${attraction.name}":`,
              updateError.message
            );
            errors++;
          } else {
            attractionsEnriched++;
          }
        }
      }
    }
  }

  return NextResponse.json({
    enriched: { hotels: hotelsEnriched, attractions: attractionsEnriched },
    skipped,
    errors,
  });
}
