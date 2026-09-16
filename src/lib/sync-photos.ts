import { createAdminClient } from "@/lib/supabase-admin";

// Server-only. Fetches a representative photo per attraction/temple from
// Unsplash and persists it to that row's photo_url. Shared between the
// automatic post-build sync (build-destination) and the manual admin
// backfill (sync-media) so the two never drift.

const MAX_ATTRACTIONS_PER_CALL = 10;
const MAX_TEMPLES_PER_CALL = 5;

interface UnsplashPhoto {
  urls: { regular: string };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchUnsplashPhoto(
  query: string,
  accessKey: string
): Promise<UnsplashPhoto | null> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=1&orientation=landscape&client_id=${accessKey}`;
  try {
    const res = await fetch(url);
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

interface PhotoSyncResult {
  attraction_photos: number;
  temple_photos: number;
}

export async function syncPhotosForDestination(
  destinationId: string,
  destinationName: string
): Promise<PhotoSyncResult> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.error("[sync-photos] UNSPLASH_ACCESS_KEY is not set — skipping photo sync.");
    return { attraction_photos: 0, temple_photos: 0 };
  }

  const supabase = createAdminClient();

  const { data: attractions, error: attractionsError } = await supabase
    .from("attractions")
    .select("id, name")
    .eq("destination_id", destinationId)
    .is("photo_url", null)
    .limit(MAX_ATTRACTIONS_PER_CALL);
  if (attractionsError) {
    console.error("[sync-photos] attractions lookup failed:", attractionsError.message);
  }

  const { data: temples, error: templesError } = await supabase
    .from("temples")
    .select("id, name")
    .eq("destination_id", destinationId)
    .is("photo_url", null)
    .limit(MAX_TEMPLES_PER_CALL);
  if (templesError) {
    console.error("[sync-photos] temples lookup failed:", templesError.message);
  }

  let attractionPhotos = 0;
  for (const attraction of (attractions ?? []) as { id: string; name: string }[]) {
    const photo = await searchUnsplashPhoto(`${attraction.name} ${destinationName} India`, accessKey);
    if (photo) {
      const { error: updateError } = await supabase
        .from("attractions")
        .update({ photo_url: photo.urls.regular })
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
  for (const temple of (temples ?? []) as { id: string; name: string }[]) {
    const photo = await searchUnsplashPhoto(`${temple.name} ${destinationName} India temple`, accessKey);
    if (photo) {
      const { error: updateError } = await supabase
        .from("temples")
        .update({ photo_url: photo.urls.regular })
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
