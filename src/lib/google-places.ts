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

export async function searchPlace(
  name: string,
  city: string
): Promise<PlaceSearchResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL(`${PLACES_BASE}/textsearch/json`);
    url.searchParams.set("query", `${name} ${city} India`);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[google-places] textsearch request failed (${res.status}) for "${name}"`);
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`[google-places] textsearch status "${data.status}" for "${name}"`);
    }

    const first = data.results?.[0];
    if (!first?.place_id) return null;

    return {
      placeId: first.place_id,
      rating: first.rating ?? null,
      userRatingsTotal: first.user_ratings_total ?? null,
    };
  } catch (err) {
    console.error(`[google-places] searchPlace error for "${name}":`, err);
    return null;
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
