"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { extractLabeled } from "@/lib/parse-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabState } from "@/components/tabs/tab-state";
import { StarRating } from "@/components/tabs/star-rating";
import { cn } from "@/lib/utils";

interface StayTabProps {
  destinationId: string;
}

type StarFilter = "all" | 3 | 4;
type SortKey = "rating" | "price";

export function StayTab({ destinationId }: StayTabProps) {
  const { data, loading, error, refetch } = useDestinationTable(
    "hotels",
    destinationId,
    "created_at"
  );
  const [starFilter, setStarFilter] = useState<StarFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");

  const filtered = useMemo(() => {
    const rows =
      starFilter === "all" ? data : data.filter((h) => h.stars === starFilter);
    return [...rows].sort((a, b) => {
      if (sortKey === "rating") return (b.rating ?? 0) - (a.rating ?? 0);
      return (a.price_min ?? 0) - (b.price_min ?? 0);
    });
  }, [data, starFilter, sortKey]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(["all", 3, 4] as StarFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setStarFilter(f)}
              className={cn(
                "flex-none rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                starFilter === f
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "All" : `${f} Star`}
            </button>
          ))}
        </div>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="h-8 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="rating">Sort: Rating</option>
          <option value="price">Sort: Price (Low-High)</option>
        </select>
      </div>

      <TabState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyTitle="No stays listed yet"
        emptyDescription="We're curating places to stay for this destination."
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((hotel) => {
            const reviewMatch = hotel.ai_summary
              ? /(\d+)\s+reviews\.?/.exec(hotel.ai_summary)
              : null;
            const reviewCount = reviewMatch?.[1] ?? null;
            const withoutReviews = reviewMatch
              ? hotel.ai_summary!.replace(reviewMatch[0], "").replace(/\s+/g, " ").trim()
              : hotel.ai_summary;
            const { value: tip, rest: summary } = extractLabeled(withoutReviews, "Tip");

            return (
              <Card key={hotel.id} className="overflow-hidden">
                {hotel.photo_url && (
                  <div className="relative h-32 w-full bg-muted">
                    <Image
                      src={hotel.photo_url}
                      alt={hotel.name}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  </div>
                )}
                <CardContent className="flex flex-col gap-1.5 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {hotel.name}
                    </span>
                    {hotel.stars != null && (
                      <Badge variant="secondary">{hotel.stars}★ Hotel</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hotel.rating != null && <StarRating value={hotel.rating} />}
                    {reviewCount && (
                      <span className="text-xs text-muted-foreground">
                        ({reviewCount} reviews)
                      </span>
                    )}
                  </div>

                  {(hotel.price_min != null || hotel.price_max != null) && (
                    <span className="text-sm font-medium text-foreground">
                      ₹{hotel.price_min ?? "—"}
                      {hotel.price_max != null && ` – ₹${hotel.price_max}`}{" "}
                      <span className="font-normal text-muted-foreground">/ night</span>
                    </span>
                  )}

                  {hotel.address && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {hotel.address}
                    </span>
                  )}

                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hotel.amenities.slice(0, 4).map((amenity) => (
                        <Badge key={amenity} variant="outline">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {summary && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {summary}
                    </p>
                  )}

                  {tip && (
                    <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                      💡 {tip}
                    </p>
                  )}

                  <Button
                    variant={hotel.booking_url ? "default" : "outline"}
                    size="sm"
                    className="mt-1 w-full"
                    disabled={!hotel.booking_url}
                    onClick={() =>
                      hotel.booking_url && window.open(hotel.booking_url, "_blank")
                    }
                  >
                    {hotel.booking_url ? "Book Now" : "Booking coming soon"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabState>
    </div>
  );
}
