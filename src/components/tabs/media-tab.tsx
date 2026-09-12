"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, PlayCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DESTINATION_HIGHLIGHTS } from "@/lib/destination-highlights";
import { DESTINATION_VIDEOS } from "@/lib/destination-videos";

interface MediaTabProps {
  destinationId: string;
  destinationName: string;
  destinationSlug: string;
}

interface GalleryPhoto {
  url: string;
  caption: string;
}

function VideoThumbnail({ id, title }: { id: string; title: string }) {
  const [src, setSrc] = useState(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);

  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-1.5"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
        <Image
          src={src}
          alt={title}
          fill
          sizes="(max-width: 480px) 50vw, 33vw"
          className="object-cover"
          onError={() => setSrc(`https://img.youtube.com/vi/${id}/hqdefault.jpg`)}
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors group-hover:bg-black/35">
          <PlayCircle className="size-9 text-white drop-shadow" />
        </span>
      </div>
      <span className="line-clamp-2 text-xs font-medium text-foreground">{title}</span>
    </a>
  );
}

export function MediaTab({ destinationId, destinationName, destinationSlug }: MediaTabProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [photoError, setPhotoError] = useState(false);
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPhotos() {
      setLoadingPhotos(true);
      setPhotoError(false);
      try {
        const [attractions, hotels, activities] = await Promise.all([
          supabase
            .from("attractions")
            .select("name, photo_url")
            .eq("destination_id", destinationId),
          supabase.from("hotels").select("name, photo_url").eq("destination_id", destinationId),
          supabase
            .from("activities")
            .select("name, photo_url")
            .eq("destination_id", destinationId),
        ]);

        if (cancelled) return;

        if (attractions.error || hotels.error || activities.error) {
          setPhotoError(true);
          return;
        }

        const toPhotos = (
          rows: { name: string; photo_url: string | null }[] | null
        ): GalleryPhoto[] =>
          (rows ?? [])
            .filter((r) => Boolean(r.photo_url))
            .map((r) => ({ url: r.photo_url as string, caption: r.name }));

        setPhotos([
          ...toPhotos(attractions.data),
          ...toPhotos(hotels.data),
          ...toPhotos(activities.data),
        ]);
      } catch {
        if (!cancelled) setPhotoError(true);
      } finally {
        if (!cancelled) setLoadingPhotos(false);
      }
    }

    loadPhotos();
    return () => {
      cancelled = true;
    };
  }, [destinationId]);

  const videos = DESTINATION_VIDEOS[destinationSlug] ?? [];
  const photoSpots = DESTINATION_HIGHLIGHTS[destinationSlug]?.photoSpots ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          📹 Videos
        </span>

        {videos.length === 0 ? (
          <Alert>
            <AlertTitle>Videos coming soon</AlertTitle>
            <AlertDescription>
              We&apos;re working on bringing in travel videos for {destinationName}.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {videos.map((video) => (
              <VideoThumbnail key={video.id} id={video.id} title={video.title} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          🖼️ Photo Gallery
        </span>

        {loadingPhotos ? (
          <div className="columns-2 gap-2.5 sm:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="mb-2.5 w-full rounded-xl"
                style={{ height: `${120 + (i % 3) * 40}px` }}
              />
            ))}
          </div>
        ) : photoError ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t load photos</AlertTitle>
            <AlertDescription>Please try again in a moment.</AlertDescription>
          </Alert>
        ) : photos.length === 0 ? (
          <Alert>
            <AlertTitle>No photos yet</AlertTitle>
            <AlertDescription>
              We&apos;re still gathering photos for {destinationName}.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="columns-2 gap-2.5 sm:columns-3">
            {photos.map((photo, i) => (
              <button
                key={`${photo.url}-${i}`}
                onClick={() => setLightbox(photo)}
                className="mb-2.5 block w-full overflow-hidden rounded-xl bg-muted"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  width={400}
                  height={300}
                  loading="lazy"
                  className="w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

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

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
            onClick={() => setLightbox(null)}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
          <div
            className="flex max-h-full max-w-full flex-col items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightbox.url}
              alt={lightbox.caption}
              width={1200}
              height={900}
              className="max-h-[80vh] w-auto rounded-lg object-contain"
            />
            <span className="text-sm text-white/90">{lightbox.caption}</span>
          </div>
        </div>
      )}
    </div>
  );
}
