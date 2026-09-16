import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase-admin";
import { syncPhotosForDestination } from "@/lib/sync-photos";

export const runtime = "nodejs";
export const maxDuration = 60;

interface UnsplashPhoto {
  urls: { regular: string; small: string };
  description: string | null;
  alt_description: string | null;
  user: { name: string } | null;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails?: { medium?: { url: string } };
  };
}

// YouTube publicly removed like/dislike ratios in 2021 - viewCount is the
// only "popularity" signal the public API still exposes, so it stands in
// for "rating" here. Thresholds are deliberately asymmetric: a video under
// a year old only needs a modest view count to qualify, but an older video
// must clear a much higher bar to be included alongside it.
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const RECENT_MIN_VIEWS = 3_000;
const OLD_MIN_VIEWS = 25_000;
// Excludes Shorts and other cut-down clips.
const MIN_DURATION_SECONDS = 2 * 60;

function qualifies(publishedAt: string, viewCount: number, durationSeconds: number): boolean {
  if (durationSeconds < MIN_DURATION_SECONDS) return false;
  const isRecent = Date.now() - new Date(publishedAt).getTime() <= ONE_YEAR_MS;
  return isRecent ? viewCount >= RECENT_MIN_VIEWS : viewCount >= OLD_MIN_VIEWS;
}

// Channels known to publish auto-dubbed/AI-narrated travel content (verified
// by ear, not detectable via YouTube API metadata - defaultAudioLanguage
// does not reliably distinguish these from normal uploads). Add a channel's
// ID here whenever one is spotted so future syncs skip it automatically.
const BLOCKED_CHANNEL_IDS = new Set<string>([
  "UCdzwqxFKeQBJlwLWhtFwJBg", // Abhishek Jha - auto-dubbed narration (flagged on Chirala videos)
  "UCZGTn3zYfHkDW_CreIm_qFg", // Sai Suhas Guttula - auto-dubbed narration (flagged on Chirala videos)
]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The YouTube Data API returns titles/channel names HTML-entity-encoded
// (e.g. "Goa &amp; Beaches") since they're meant for embedding in HTML —
// decode before storing so the app (which renders these as plain text,
// not HTML) doesn't display literal "&amp;" to users.
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function searchUnsplash(
  query: string,
  perPage: number,
  accessKey: string
): Promise<UnsplashPhoto[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&orientation=landscape&client_id=${accessKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[sync-media] Unsplash request failed (${res.status}) for "${query}"`);
      return [];
    }
    const data = await res.json();
    return data.results ?? [];
  } catch (err) {
    console.error(`[sync-media] Unsplash request error for "${query}":`, err);
    return [];
  }
}

async function searchYouTube(
  query: string,
  maxResults: number,
  apiKey: string
): Promise<YouTubeSearchItem[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&type=video&maxResults=${maxResults}&key=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[sync-media] YouTube request failed (${res.status}) for "${query}"`);
      return [];
    }
    const data = await res.json();
    return data.items ?? [];
  } catch (err) {
    console.error(`[sync-media] YouTube request error for "${query}":`, err);
    return [];
  }
}

interface YouTubeVideoDetails {
  viewCount: number;
  durationSeconds: number;
}

// Parses ISO 8601 durations as returned by contentDetails.duration (e.g.
// "PT4M13S", "PT1H2M", "PT45S").
function parseIsoDurationSeconds(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return (Number(hours ?? 0) * 3600) + (Number(minutes ?? 0) * 60) + Number(seconds ?? 0);
}

async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string
): Promise<Record<string, YouTubeVideoDetails>> {
  if (videoIds.length === 0) return {};
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(
    ","
  )}&key=${apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[sync-media] YouTube stats request failed (${res.status})`);
      return {};
    }
    const data = await res.json();
    return Object.fromEntries(
      (
        data.items ?? []
      ).map(
        (v: {
          id: string;
          statistics: { viewCount?: string };
          contentDetails: { duration: string };
        }) => [
          v.id,
          {
            viewCount: Number(v.statistics.viewCount ?? 0),
            durationSeconds: parseIsoDurationSeconds(v.contentDetails.duration),
          },
        ]
      )
    );
  } catch (err) {
    console.error("[sync-media] YouTube stats request error:", err);
    return {};
  }
}

// No unique constraint exists on (destination_id, url) in the live schema
// (confirmed live — ON CONFLICT there fails with 42P10), so dedup via a
// existence check rather than upsert. Matches this project's existing
// idempotent-seeding pattern (see scripts/seed-*.mjs) and avoids requiring
// a DDL change just for this route.
async function mediaRowExists(
  supabase: SupabaseClient,
  destinationId: string,
  url: string
): Promise<boolean> {
  const { data } = await supabase
    .from("media")
    .select("id")
    .eq("destination_id", destinationId)
    .eq("url", url)
    .maybeSingle();
  return Boolean(data);
}

interface DestinationRow {
  id: string;
  name: string;
  state: string;
  slug: string;
  cover_image_url: string | null;
  hero_url: string | null;
}

export async function POST(request: NextRequest) {
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    return NextResponse.json({ error: "Admin access is not configured." }, { status: 503 });
  }

  let body: { pin?: string; destinationSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.pin !== "string" || body.pin !== adminPin) {
    return NextResponse.json({ error: "Incorrect PIN." }, { status: 401 });
  }

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!unsplashKey) {
    console.error("[sync-media] UNSPLASH_ACCESS_KEY is not set — skipping all photo sync.");
  }
  if (!youtubeKey) {
    console.error("[sync-media] YOUTUBE_API_KEY is not set — skipping all video sync.");
  }

  const supabase = createAdminClient();

  let query = supabase
    .from("destinations")
    .select("id, name, state, slug, cover_image_url, hero_url");
  if (body.destinationSlug) {
    query = query.eq("slug", body.destinationSlug);
  }

  const { data: destinations, error: destError } = await query;
  if (destError) {
    console.error("[sync-media] destinations lookup failed:", destError.message);
    return NextResponse.json({ error: "Couldn't load destinations." }, { status: 500 });
  }
  if (body.destinationSlug && (!destinations || destinations.length === 0)) {
    return NextResponse.json(
      { error: `No destination found for slug "${body.destinationSlug}".` },
      { status: 404 }
    );
  }

  let photosSynced = 0;
  let imagesSynced = 0;
  let videosSynced = 0;
  let attractionPhotosSynced = 0;
  let templePhotosSynced = 0;
  let skipped = 0;

  for (const dest of (destinations ?? []) as DestinationRow[]) {
    // Step: attraction/temple photos
    if (unsplashKey) {
      const photos = await syncPhotosForDestination(dest.id, dest.name);
      attractionPhotosSynced += photos.attraction_photos;
      templePhotosSynced += photos.temple_photos;
    }

    // Step: destination cover/hero image
    if (unsplashKey && (!dest.cover_image_url || !dest.hero_url)) {
      const results = await searchUnsplash(`${dest.name} ${dest.state} India travel`, 3, unsplashKey);
      const photo = results[0];
      if (photo) {
        const { error: updateError } = await supabase
          .from("destinations")
          .update({ hero_url: photo.urls.regular, cover_image_url: photo.urls.small })
          .eq("id", dest.id);
        if (updateError) {
          console.error(`[sync-media] destination update failed for ${dest.slug}:`, updateError.message);
        } else {
          photosSynced++;
        }
      } else {
        skipped++;
      }
      await sleep(600);
    }

    // Step: media table images
    if (unsplashKey) {
      const { count: imageCount } = await supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("destination_id", dest.id)
        .eq("media_type", "image");

      if ((imageCount ?? 0) < 2) {
        const results = await searchUnsplash(`${dest.name} ${dest.state} India`, 4, unsplashKey);
        for (const photo of results) {
          if (await mediaRowExists(supabase, dest.id, photo.urls.regular)) continue;
          const { error: insertError } = await supabase.from("media").insert({
            destination_id: dest.id,
            media_type: "image",
            url: photo.urls.regular,
            thumbnail_url: photo.urls.small,
            title: photo.description || photo.alt_description || null,
            author: photo.user?.name ?? null,
          });
          if (insertError) {
            console.error(`[sync-media] image insert failed for ${dest.slug}:`, insertError.message);
          } else {
            imagesSynced++;
          }
        }
        await sleep(600);
      }
    }

    // Step: media table videos
    if (youtubeKey) {
      const { count: videoCount } = await supabase
        .from("media")
        .select("id", { count: "exact", head: true })
        .eq("destination_id", dest.id)
        .eq("media_type", "video");

      if ((videoCount ?? 0) < 2) {
        // Search quota cost is fixed per call regardless of maxResults, so
        // pull a wider candidate pool (25) to filter/rank down from rather
        // than taking the top-3 raw search results.
        const items = await searchYouTube(
          `${dest.name} ${dest.state} India travel vlog`,
          25,
          youtubeKey
        );
        const details = await fetchVideoDetails(
          items.map((item) => item.id.videoId),
          youtubeKey
        );
        // Filter to videos that clear the recency/view-count/duration bar
        // and aren't from a known auto-dubbed channel, but keep YouTube's
        // own relevance ordering rather than re-sorting by raw view count -
        // a tangential mega-viral video (e.g. about a nearby city that just
        // happens to mention this destination) would otherwise leapfrog
        // genuinely on-topic results.
        const qualifying = items.filter((item) => {
          if (BLOCKED_CHANNEL_IDS.has(item.snippet.channelId)) return false;
          const d = details[item.id.videoId];
          if (!d) return false;
          return qualifies(item.snippet.publishedAt, d.viewCount, d.durationSeconds);
        });

        let insertedForDest = 0;
        for (const item of qualifying) {
          if (insertedForDest >= 3) break;
          const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
          if (await mediaRowExists(supabase, dest.id, videoUrl)) continue;
          const { error: insertError } = await supabase.from("media").insert({
            destination_id: dest.id,
            media_type: "video",
            url: videoUrl,
            thumbnail_url: item.snippet.thumbnails?.medium?.url ?? null,
            title: decodeHtmlEntities(item.snippet.title),
            author: decodeHtmlEntities(item.snippet.channelTitle),
          });
          if (insertError) {
            console.error(`[sync-media] video insert failed for ${dest.slug}:`, insertError.message);
          } else {
            videosSynced++;
            insertedForDest++;
          }
        }
        await sleep(200);
      }
    }
  }

  return NextResponse.json({
    synced: {
      photos: photosSynced,
      images: imagesSynced,
      videos: videosSynced,
      attractionPhotos: attractionPhotosSynced,
      templePhotos: templePhotosSynced,
    },
    skipped,
  });
}
