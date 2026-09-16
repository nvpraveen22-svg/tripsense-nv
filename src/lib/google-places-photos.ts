// Dedicated Google Places photo lookup for attractions/temples. A single
// Text Search call already returns a `photos` array per result, so this
// intentionally skips the separate Place Details round trip that
// src/lib/google-places.ts uses for hotel enrichment (ratings/phone/
// website) — one API call instead of two to fetch a photo. Every function
// is best-effort: on any failure (missing key, network error, non-OK
// status) it returns null rather than throwing, so a single bad lookup
// never breaks a batch job.

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

function buildPhotoUrl(photoReference: string, apiKey: string): string {
  const url = new URL(`${PLACES_BASE}/photo`);
  url.searchParams.set("maxwidth", "800");
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("key", apiKey);
  return url.toString();
}

export async function getPlacePhoto(
  name: string,
  locationContext: string
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn(
      "[google-places-photos] GOOGLE_PLACES_API_KEY not set — skipping Google Places photos, using Unsplash only"
    );
    return null;
  }

  try {
    const url = new URL(`${PLACES_BASE}/textsearch/json`);
    url.searchParams.set("query", `${name} ${locationContext} India`);
    url.searchParams.set("fields", "photos,place_id");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[google-places-photos] textsearch request failed (${res.status}) for "${name}"`);
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error(`[google-places-photos] textsearch status "${data.status}" for "${name}"`);
      return null;
    }

    const photoReference = data.results?.[0]?.photos?.[0]?.photo_reference;
    if (!photoReference) return null;

    return buildPhotoUrl(photoReference, apiKey);
  } catch (err) {
    console.error(`[google-places-photos] getPlacePhoto error for "${name}":`, err);
    return null;
  }
}

export interface PlacePhotoDetails {
  photoUrl: string | null;
  rating: number | null;
  reviewCount: number | null;
}

export async function getPlaceDetails(placeId: string): Promise<PlacePhotoDetails> {
  const empty: PlacePhotoDetails = { photoUrl: null, rating: null, reviewCount: null };

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn(
      "[google-places-photos] GOOGLE_PLACES_API_KEY not set — skipping Google Places photos, using Unsplash only"
    );
    return empty;
  }

  try {
    const url = new URL(`${PLACES_BASE}/details/json`);
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "photos,rating,user_ratings_total");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`[google-places-photos] details request failed (${res.status}) for "${placeId}"`);
      return empty;
    }

    const data = await res.json();
    if (data.status !== "OK") {
      console.error(`[google-places-photos] details status "${data.status}" for "${placeId}"`);
      return empty;
    }

    const r = data.result ?? {};
    const photoReference = r.photos?.[0]?.photo_reference;
    return {
      photoUrl: photoReference ? buildPhotoUrl(photoReference, apiKey) : null,
      rating: r.rating ?? null,
      reviewCount: r.user_ratings_total ?? null,
    };
  } catch (err) {
    console.error(`[google-places-photos] getPlaceDetails error for "${placeId}":`, err);
    return empty;
  }
}
