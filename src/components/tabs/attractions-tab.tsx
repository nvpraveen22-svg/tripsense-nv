import Image from "next/image";
import { Clock, Star, Ticket } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";

interface AttractionsTabProps {
  destinationId: string;
}

export function AttractionsTab({ destinationId }: AttractionsTabProps) {
  const { data, loading, error } = useDestinationTable(
    "attractions",
    destinationId
  );

  return (
    <TabState
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyTitle="No attractions listed yet"
      emptyDescription="We're curating attractions for this destination."
    >
      <div className="flex flex-col gap-3">
        {data.map((attraction) => (
          <Card key={attraction.id} className="overflow-hidden" size="sm">
            <div className="flex gap-3 px-(--card-spacing)">
              {attraction.image_url ? (
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={attraction.image_url}
                    alt={attraction.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                  🏞️
                </div>
              )}
              <CardContent className="flex flex-1 flex-col gap-1 p-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {attraction.name}
                  </span>
                  {attraction.rating != null && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-accent-foreground">
                      <Star className="size-3 fill-current" />
                      {attraction.rating}
                    </span>
                  )}
                </div>
                {attraction.category && (
                  <Badge variant="secondary" className="w-fit">
                    {attraction.category}
                  </Badge>
                )}
                {attraction.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {attraction.description}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                  {attraction.visit_duration_minutes != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {attraction.visit_duration_minutes} min
                    </span>
                  )}
                  {attraction.entry_fee && (
                    <span className="flex items-center gap-1">
                      <Ticket className="size-3" />
                      {attraction.entry_fee}
                    </span>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </TabState>
  );
}
