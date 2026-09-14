"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, MapPin, Shirt, Sparkles } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { extractLabeled } from "@/lib/parse-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabState } from "@/components/tabs/tab-state";
import { StarRating } from "@/components/tabs/star-rating";
import type { Temple } from "@/types";

interface TemplesTabProps {
  destinationId: string;
  destinationSlug: string;
}

interface DisplayTemple extends Temple {
  isAiGenerated?: boolean;
}

export function TemplesTab({ destinationId, destinationSlug }: TemplesTabProps) {
  const { data: temples, loading, error, refetch } = useDestinationTable(
    "temples",
    destinationId,
    "sort_order"
  );
  const { data: attractions, loading: attractionsLoading } = useDestinationTable(
    "attractions",
    destinationId,
    "sort_order"
  );

  const [aiTemples, setAiTemples] = useState<DisplayTemple[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiRequested = useRef(false);

  const merged = useMemo<DisplayTemple[]>(() => {
    const existingNames = new Set(temples.map((t) => t.name.toLowerCase()));
    const fromAttractions: DisplayTemple[] = attractions
      .filter((a) => a.category?.toLowerCase() === "temple")
      .filter((a) => !existingNames.has(a.name.toLowerCase()))
      .map((a) => ({
        id: a.id,
        destination_id: a.destination_id,
        name: a.name,
        deity: null,
        description: a.description,
        distance_from_center_km: a.distance_from_center_km,
        timings: a.timings,
        dress_code: null,
        entry_fee: a.entry_fee_adult,
        temple_stay_available: false,
        stay_details: null,
        stay_price_min: null,
        stay_price_max: null,
        booking_contact: null,
        photo_url: a.photo_url,
        sort_order: a.sort_order,
        created_at: a.created_at,
      }));
    return [...temples, ...fromAttractions];
  }, [temples, attractions]);

  useEffect(() => {
    if (loading || attractionsLoading) return;
    if (merged.length > 0) return;
    if (aiRequested.current) return;
    aiRequested.current = true;

    setAiLoading(true);
    setAiError(null);
    fetch(`/api/ai-temples/${destinationSlug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.temples) {
          setAiTemples(
            (data.temples as Temple[]).map((t) => ({ ...t, isAiGenerated: data.source === "ai" }))
          );
        } else {
          setAiError(data.error ?? "Couldn't find temples for this destination.");
        }
      })
      .catch(() => setAiError("Couldn't find temples for this destination."))
      .finally(() => setAiLoading(false));
  }, [loading, attractionsLoading, merged.length, destinationSlug]);

  const displayList = merged.length > 0 ? merged : aiTemples ?? [];
  const stillDeciding = merged.length === 0 && aiTemples === null && !aiError && !aiRequested.current;

  return (
    <TabState
      loading={loading || attractionsLoading}
      error={error}
      empty={displayList.length === 0 && !aiLoading && !aiError && !stillDeciding}
      emptyTitle="No temples listed yet"
      emptyDescription="We're curating temple information for this destination."
      onRetry={refetch}
    >
      <div className="flex flex-col gap-3">
        {aiLoading && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">🙏 Finding famous temples with AI...</p>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        )}

        {aiError && (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t find temples</AlertTitle>
            <AlertDescription>{aiError}</AlertDescription>
          </Alert>
        )}

        {displayList.map((temple) => {
          const { value: specialPuja, rest: r1 } = extractLabeled(
            temple.description,
            "Special puja"
          );
          const { value: bestTime, rest: r2 } = extractLabeled(r1, "Best time to visit");
          const { value: ratingText, rest: r3 } = extractLabeled(r2, "Rating");
          const { value: tip, rest: significance } = extractLabeled(r3, "Tip");
          const rating = ratingText ? Number(ratingText.split("/")[0]) : null;

          return (
            <Card key={temple.id} className="relative">
              {temple.isAiGenerated && (
                <Badge
                  variant="secondary"
                  className="absolute right-2.5 top-2.5 bg-muted text-[10px] text-muted-foreground"
                >
                  AI Generated
                </Badge>
              )}
              <CardContent className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-start justify-between gap-2 pr-20">
                  <span className="text-sm font-medium text-foreground">
                    {temple.name}
                  </span>
                  {rating != null && !Number.isNaN(rating) && (
                    <StarRating value={rating} showValue={false} />
                  )}
                </div>

                {temple.deity && (
                  <Badge variant="secondary" className="w-fit">
                    {temple.deity}
                  </Badge>
                )}

                {significance && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {significance}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {temple.distance_from_center_km != null && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {temple.distance_from_center_km} km
                    </span>
                  )}
                  {temple.timings && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {temple.timings}
                    </span>
                  )}
                  {temple.dress_code && (
                    <span className="flex items-center gap-1">
                      <Shirt className="size-3" />
                      {temple.dress_code}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specialPuja && (
                    <Badge variant="outline" className="w-fit gap-1">
                      <Sparkles className="size-3" />
                      {specialPuja}
                    </Badge>
                  )}
                  {bestTime && (
                    <Badge variant="outline" className="w-fit">
                      Best visited: {bestTime}
                    </Badge>
                  )}
                </div>

                {tip && (
                  <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                    💡 {tip}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TabState>
  );
}
