"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Clock, MapPin, Star, Ticket } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { extractLabeled } from "@/lib/parse-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";
import { CategoryFilter } from "@/components/tabs/category-filter";

interface AttractionsTabProps {
  destinationId: string;
}

export function AttractionsTab({ destinationId }: AttractionsTabProps) {
  const { data, loading, error, refetch } = useDestinationTable(
    "attractions",
    destinationId,
    "sort_order"
  );
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(data.map((a) => a.category).filter((c): c is string => !!c))),
    [data]
  );

  const filtered = useMemo(
    () => (category === "all" ? data : data.filter((a) => a.category === category)),
    [data, category]
  );

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 0 && (
        <CategoryFilter categories={categories} active={category} onChange={setCategory} />
      )}

      <TabState
        loading={loading}
        error={error}
        empty={filtered.length === 0}
        emptyTitle="No attractions listed yet"
        emptyDescription="We're curating attractions for this destination."
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((attraction) => {
            const { value: bestTime, rest: withoutBestTime } = extractLabeled(
              attraction.description,
              "Best time to visit"
            );
            const { value: tip, rest: description } = extractLabeled(
              withoutBestTime,
              "Tip"
            );

            return (
              <Card key={attraction.id} className="overflow-hidden">
                <div className="relative h-40 w-full bg-gradient-to-br from-primary/40 to-secondary/40">
                  {attraction.photo_url && (
                    <Image
                      src={attraction.photo_url}
                      alt={attraction.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  )}
                  {attraction.rating != null && (
                    <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      <Star className="size-3 fill-current" />
                      {attraction.rating.toFixed(1)}
                    </span>
                  )}
                  {attraction.category && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 left-2 w-fit capitalize"
                    >
                      {attraction.category}
                    </Badge>
                  )}
                </div>

                <CardContent className="flex flex-col gap-2 pt-3">
                  <span className="text-sm font-medium text-foreground">
                    {attraction.name}
                  </span>

                  {description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {attraction.distance_from_center_km != null && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {attraction.distance_from_center_km} km
                      </span>
                    )}
                    {attraction.timings && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {attraction.timings}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Ticket className="size-3" />
                      {attraction.entry_fee_adult === 0
                        ? "Free"
                        : attraction.entry_fee_adult != null
                          ? `₹${attraction.entry_fee_adult}`
                          : "—"}
                    </span>
                  </div>

                  {bestTime && (
                    <Badge variant="outline" className="w-fit">
                      Best time: {bestTime}
                    </Badge>
                  )}

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
    </div>
  );
}
