"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Clock, Users } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { extractLabeled } from "@/lib/parse-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";
import { CategoryFilter } from "@/components/tabs/category-filter";
import { cn } from "@/lib/utils";

interface ActivitiesTabProps {
  destinationId: string;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-500 text-white",
  moderate: "bg-amber-500 text-white",
  hard: "bg-red-500 text-white",
};

export function ActivitiesTab({ destinationId }: ActivitiesTabProps) {
  const { data, loading, error, refetch } = useDestinationTable(
    "activities",
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
        emptyTitle="No activities listed yet"
        emptyDescription="We're curating things to do for this destination."
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((activity) => {
            const { value: difficulty, rest: r1 } = extractLabeled(
              activity.description,
              "Difficulty"
            );
            const { value: bestSeason, rest: r2 } = extractLabeled(r1, "Best season");
            const { value: tip, rest: description } = extractLabeled(r2, "Tip");
            const difficultyKey = difficulty?.toLowerCase();

            return (
              <Card key={activity.id} className="overflow-hidden">
                <div className="relative h-[180px] w-full bg-gradient-to-br from-primary/40 to-secondary/40">
                  {activity.photo_url && (
                    <Image
                      src={activity.photo_url}
                      alt={activity.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  )}
                  {difficultyKey && (
                    <span
                      className={cn(
                        "absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium capitalize shadow-sm",
                        DIFFICULTY_STYLES[difficultyKey] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {difficulty}
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2">
                    {activity.duration_hours != null && (
                      <span className="flex items-center gap-1 text-xs font-medium text-white">
                        <Clock className="size-3" />
                        {activity.duration_hours < 1
                          ? `${activity.duration_hours * 60} min`
                          : `${activity.duration_hours} hr${activity.duration_hours > 1 ? "s" : ""}`}
                      </span>
                    )}
                    {activity.price_per_person != null && (
                      <span className="text-xs font-medium text-white">
                        ₹{activity.price_per_person}/person
                      </span>
                    )}
                  </div>
                </div>

                <CardContent className="flex flex-col gap-1.5 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {activity.name}
                    </span>
                    {activity.category && (
                      <Badge variant="secondary" className="capitalize">
                        {activity.category}
                      </Badge>
                    )}
                  </div>

                  {description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {bestSeason && <span>Best season: {bestSeason}</span>}
                    {activity.operator_name && (
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {activity.operator_name}
                      </span>
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
    </div>
  );
}
