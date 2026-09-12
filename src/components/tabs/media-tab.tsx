"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DESTINATION_HIGHLIGHTS } from "@/lib/destination-highlights";
import type { YoutubeVideo } from "@/app/api/youtube/route";

interface MediaTabProps {
  destinationName: string;
  destinationSlug: string;
}

function formatViews(count: number | null): string {
  if (count == null) return "";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

export function MediaTab({ destinationName, destinationSlug }: MediaTabProps) {
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadVideos() {
      setLoading(true);
      setUnavailable(false);
      try {
        const [vlogRes, adventureRes] = await Promise.all([
          fetch(
            `/api/youtube?query=${encodeURIComponent(`${destinationName} travel vlog`)}&maxResults=3`
          ),
          fetch(
            `/api/youtube?query=${encodeURIComponent(`${destinationName} adventure`)}&maxResults=3`
          ),
        ]);

        if (!vlogRes.ok || !adventureRes.ok) {
          if (!cancelled) setUnavailable(true);
          return;
        }

        const [vlogData, adventureData] = await Promise.all([
          vlogRes.json(),
          adventureRes.json(),
        ]);

        if (!cancelled) {
          setVideos([...(vlogData.videos ?? []), ...(adventureData.videos ?? [])]);
        }
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadVideos();
    return () => {
      cancelled = true;
    };
  }, [destinationName]);

  const photoSpots = DESTINATION_HIGHLIGHTS[destinationSlug]?.photoSpots ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Videos
        </span>

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-video w-full rounded-xl" />
            ))}
          </div>
        ) : unavailable || videos.length === 0 ? (
          <Alert>
            <AlertTitle>Videos coming soon</AlertTitle>
            <AlertDescription>
              We&apos;re working on bringing in travel videos for {destinationName}.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-1"
              >
                <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                  {video.thumbnail && (
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="(max-width: 480px) 50vw, 33vw"
                      className="object-cover"
                    />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <PlayCircle className="size-8 text-white drop-shadow" />
                  </span>
                </div>
                <span className="line-clamp-2 text-xs font-medium text-foreground">
                  {video.title}
                </span>
                {video.viewCount != null && (
                  <span className="text-xs text-muted-foreground">
                    {formatViews(video.viewCount)}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-1.5 py-6 text-center">
          <span className="text-2xl">📸</span>
          <span className="text-sm font-medium text-foreground">
            Community photos coming soon
          </span>
        </CardContent>
      </Card>

      {photoSpots.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Camera className="size-3.5" />
            Best photography spots
          </span>
          <div className="flex flex-col gap-1.5">
            {photoSpots.map((spot) => (
              <div
                key={spot}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
              >
                {spot}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
