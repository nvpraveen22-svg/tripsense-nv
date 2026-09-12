import { Clock, MapPin, Shirt, Sparkles } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { extractLabeled } from "@/lib/parse-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";
import { StarRating } from "@/components/tabs/star-rating";

interface TemplesTabProps {
  destinationId: string;
}

export function TemplesTab({ destinationId }: TemplesTabProps) {
  const { data, loading, error, refetch } = useDestinationTable(
    "temples",
    destinationId,
    "sort_order"
  );

  return (
    <TabState
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyTitle="No temples listed yet"
      emptyDescription="We're curating temple information for this destination."
      onRetry={refetch}
    >
      <div className="flex flex-col gap-3">
        {data.map((temple) => {
          const { value: specialPuja, rest: r1 } = extractLabeled(
            temple.description,
            "Special puja"
          );
          const { value: bestTime, rest: r2 } = extractLabeled(r1, "Best time to visit");
          const { value: ratingText, rest: r3 } = extractLabeled(r2, "Rating");
          const { value: tip, rest: significance } = extractLabeled(r3, "Tip");
          const rating = ratingText ? Number(ratingText.split("/")[0]) : null;

          return (
            <Card key={temple.id}>
              <CardContent className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-start justify-between gap-2">
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
