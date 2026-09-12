"use client";

import { Sparkles, Wand2 } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AiPlanTabProps {
  destinationId: string;
  originCity: string;
}

export function AiPlanTab({ destinationId, originCity }: AiPlanTabProps) {
  const { data, loading, error } = useDestinationTable(
    "ai_itineraries",
    destinationId,
    "generated_at"
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-secondary/30 bg-secondary/5">
        <CardContent className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-secondary">
            <Sparkles className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              AI itinerary
            </span>
          </div>
          <p className="text-sm text-foreground">
            Generate a personalized day-by-day plan from{" "}
            <span className="font-medium">{originCity}</span>.
          </p>
          <Button className="mt-1 w-fit gap-1.5" disabled>
            <Wand2 className="size-4" />
            Generate itinerary
          </Button>
          <p className="text-xs text-muted-foreground">
            AI generation is arriving in a future update.
          </p>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : data.length > 0 ? (
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Previously generated
          </span>
          {data.map((itinerary) => (
            <Card key={itinerary.id}>
              <CardContent className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {itinerary.trip_days
                      ? `${itinerary.trip_days}-day plan`
                      : "Custom plan"}
                  </span>
                  {itinerary.budget_level && (
                    <Badge variant="secondary">{itinerary.budget_level}</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  From {itinerary.origin_city ?? "unknown"} ·{" "}
                  {itinerary.travelers_count ?? 1} traveler
                  {(itinerary.travelers_count ?? 1) > 1 ? "s" : ""}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
