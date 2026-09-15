// Thin wrapper around the Google Places API (legacy Places API, not the
// newer Places API (New)) for enriching hotels/attractions with real
// ratings, contact info, and photos. Every function is best-effort: on any
// failure (missing key, network error, non-OK status) it returns null
// rather than throwing, so a single bad lookup never breaks a batch job.

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export interface PlaceSearchResult {
  placeId: string;
  rating: number | null;
  userRatingsTotal: number | null;
}

export interface PlaceDetails {
  rating: number | null;
  userRatingsTotal: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  openingHours: string[] | null;
  photoReference: string | null;
}

// Words too generic to prove two names refer to the same place (hospitality/
// tourism boilerplate) - excluded from the relevance check below alongside
// the destination city name itself, which appears in nearly every result in
// the area and would otherwise make almost any pair "match".
const GENERIC_NAME_WORDS = new Set([
  "the", "and", "near", "beach", "resort", "hotel", "stay", "inn", "lodge",
  "guest", "house", "eco", "camp", "park", "village", "market", "temple",
  "museum", "complex", "spa", "restaurant", "cafe", "view", "garden",
  "point", "india", "road", "street", "grand", "palace",
]);

function significantTokens(text: string, exclude: Set<string>): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !GENERIC_NAME_WORDS.has(t) && !exclude.has(t))
  );
}

// Text Search always returns *something* if any place is even loosely
// related to the query - for a name with no real Google listing (common for
// AI-generated hotel/attraction names) it silently falls back to the
// closest nearby result instead of "no match". Require at least one
// distinctive word in common before trusting a result; with nothing
// distinctive to check (e.g. the name is just generic words + city), fall
// back to trusting the API since there's no way to verify either way.
function isPlausibleMatch(sourceName: string, resultName: string, city: string): boolean {
  const cityTokens = new Set(
    city
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
  const sourceTokens = significantTokens(sourceName, cityTokens);
  if (sourceTokens.size === 0) return true;
  const resultTokens = significantTokens(resultName, cityTokens);
  return Array.from(sourceTokens).some((token) => resultTokens.has(token));
}

// Return value distinguishes two different kinds of "nothing found" so
// callers can track them separately: `null` means the search definitively
// found no plausible match (zero results, or a result rejected by the
// relevance guard) - not a problem, just nothing to enrich. `undefined`
// means the search itself failed (missing key, network error, bad HTTP
// status) - a real error worth surfacing. Either way this never throws.
export async function searchPlace(
  name: string,
  city: string
): Promise<PlaceSearchResult | null | undefined> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return undefined;

  try {
    const url = new URL(`${PLACES_BASE}/textsearch/json`);
    url.searchParams.set("query", `${name} ${city} India`);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[google-places] textsearch request failed (${res.status}) for "${name}"`);
      return undefined;
    }

    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`[google-places] textsearch status "${data.status}" for "${name}"`);
      return undefined;
    }

    const first = data.results?.[0];
    if (!first?.place_id) return null;

    if (!isPlausibleMatch(name, first.name ?? "", city)) {
      console.warn(
        `[google-places] rejecting low-confidence match: "${name}" -> "${first.name}"`
      );
      return null;
    }

    return {
      placeId: first.place_id,
      rating: first.rating ?? null,
      userRatingsTotal: first.user_ratings_total ?? null,
    };
  } catch (err) {
    console.error(`[google-places] searchPlace error for "${name}":`, err);
    return undefined;
  }
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(`${PLACES_BASE}/details/json`);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set(
      "fields",
      "rating,user_ratings_total,formatted_phone_number,website,formatted_address,opening_hours,photos"
    );
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[google-places] details request failed (${res.status}) for "${placeId}"`);
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK") {
      console.error(`[google-places] details status "${data.status}" for "${placeId}"`);
      return null;
    }

    const r = data.result ?? {};
    return {
      rating: r.rating ?? null,
      userRatingsTotal: r.user_ratings_total ?? null,
      phone: r.formatted_phone_number ?? null,
      website: r.website ?? null,
      address: r.formatted_address ?? null,
      openingHours: r.opening_hours?.weekday_text ?? null,
      photoReference: r.photos?.[0]?.photo_reference ?? null,
    };
  } catch (err) {
    console.error(`[google-places] getPlaceDetails error for "${placeId}":`, err);
    return null;
  }
}

export function getPlacePhotoUrl(photoReference: string, maxWidth = 800): string | null {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(`${PLACES_BASE}/photo`);
    url.searchParams.set("maxwidth", String(maxWidth));
    url.searchParams.set("photo_reference", photoReference);
    url.searchParams.set("key", apiKey);
    return url.toString();
  } catch (err) {
    console.error("[google-places] getPlacePhotoUrl error:", err);
    return null;
  }
}
