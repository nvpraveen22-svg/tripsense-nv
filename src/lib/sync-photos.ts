import type { SupabaseClient } from "@supabase/supabase-js";
import { getPlacePhoto } from "@/lib/google-places-photos";

// Server-only. Fetches a representative photo per attraction/temple —
// Google Places first (real photos of the actual place), falling back to
// Unsplash when Places has no key configured or no photo for that result —
// and persists it to that row's photo_url. Shared between the automatic
// post-build sync (build-destination) and the manual admin backfill
// (sync-media) so the two never drift. Destination cover/hero images stay
// Unsplash-only and are synced separately by the caller.

const MAX_ATTRACTIONS_PER_CALL = 10;
const MAX_TEMPLES_PER_CALL = 8;

interface UnsplashPhoto {
  urls: { regular: string };
}

interface NamedRow {
  id: string;
  name: string;
}

interface PhotoSyncResult {
  attraction_photos: number;
  temple_photos: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchUnsplashPhoto(
  query: string,
  accessKey: string
): Promise<UnsplashPhoto | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
    if (!res.ok) {
      console.error(`[sync-photos] Unsplash request failed (${res.status}) for "${query}"`);
      return null;
    }
    const data = await res.json();
    return data.results?.[0] ?? null;
  } catch (err) {
    console.error(`[sync-photos] Unsplash request error for "${query}":`, err);
    return null;
  }
}

// Google Places first, Unsplash fallback. Never throws.
async function resolvePhotoUrl(
  name: string,
  destinationName: string,
  unsplashQuery: string,
  unsplashKey: string | undefined
): Promise<string | null> {
  const placePhoto = await getPlacePhoto(name, destinationName);
  if (placePhoto) return placePhoto;

  await sleep(200);

  if (!unsplashKey) return null;
  const photo = await searchUnsplashPhoto(unsplashQuery, unsplashKey);
  return photo?.urls.regular ?? null;
}

export async function syncPhotosForDestination(
  destinationId: string,
  destinationName: string,
  supabase: SupabaseClient
): Promise<PhotoSyncResult> {
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.warn(
      "[sync-photos] GOOGLE_PLACES_API_KEY not set — skipping Google Places photos, using Unsplash only"
    );
  }
  if (!unsplashKey) {
    console.error("[sync-photos] UNSPLASH_ACCESS_KEY is not set — Unsplash fallback unavailable.");
  }

  const { data: attractions, error: attractionsError } = await supabase
    .from("attractions")
    .select("id, name")
    .eq("destination_id", destinationId)
    .or("photo_url.is.null,photo_url.eq.")
    .limit(MAX_ATTRACTIONS_PER_CALL);
  if (attractionsError) {
    console.error("[sync-photos] attractions lookup failed:", attractionsError.message);
  }

  const { data: temples, error: templesError } = await supabase
    .from("temples")
    .select("id, name")
    .eq("destination_id", destinationId)
    .or("photo_url.is.null,photo_url.eq.")
    .limit(MAX_TEMPLES_PER_CALL);
  if (templesError) {
    console.error("[sync-photos] temples lookup failed:", templesError.message);
  }

  let attractionPhotos = 0;
  for (const attraction of (attractions ?? []) as NamedRow[]) {
    const photoUrl = await resolvePhotoUrl(
      attraction.name,
      destinationName,
      `${attraction.name} ${destinationName} India`,
      unsplashKey
    );
    if (photoUrl) {
      const { error: updateError } = await supabase
        .from("attractions")
        .update({ photo_url: photoUrl })
        .eq("id", attraction.id);
      if (updateError) {
        console.error(
          `[sync-photos] attraction photo update failed for "${attraction.name}":`,
          updateError.message
        );
      } else {
        attractionPhotos++;
      }
    }
    await sleep(600);
  }

  let templePhotos = 0;
  for (const temple of (temples ?? []) as NamedRow[]) {
    const photoUrl = await resolvePhotoUrl(
      temple.name,
      destinationName,
      `${temple.name} temple ${destinationName} India`,
      unsplashKey
    );
    if (photoUrl) {
      const { error: updateError } = await supabase
        .from("temples")
        .update({ photo_url: photoUrl })
        .eq("id", temple.id);
      if (updateError) {
        console.error(
          `[sync-photos] temple photo update failed for "${temple.name}":`,
          updateError.message
        );
      } else {
        templePhotos++;
      }
    }
    await sleep(600);
  }

  return { attraction_photos: attractionPhotos, temple_photos: templePhotos };
}
