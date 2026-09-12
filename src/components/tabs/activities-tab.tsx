import Image from "next/image";
import { Clock, Gauge } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";

interface ActivitiesTabProps {
  destinationId: string;
}

export function ActivitiesTab({ destinationId }: ActivitiesTabProps) {
  const { data, loading, error } = useDestinationTable(
    "activities",
    destinationId
  );

  return (
    <TabState
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyTitle="No activities listed yet"
      emptyDescription="We're curating things to do for this destination."
    >
      <div className="flex flex-col gap-3">
        {data.map((activity) => (
          <Card key={activity.id} className="overflow-hidden" size="sm">
            <div className="flex gap-3 px-(--card-spacing)">
              {activity.image_url ? (
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={activity.image_url}
                    alt={activity.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                  🎒
                </div>
              )}
              <CardContent className="flex flex-1 flex-col gap-1 p-0">
                <span className="text-sm font-medium text-foreground">
                  {activity.name}
                </span>
                {activity.category && (
                  <Badge variant="secondary" className="w-fit">
                    {activity.category}
                  </Badge>
                )}
                {activity.description && (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                  {activity.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {activity.duration}
                    </span>
                  )}
                  {activity.difficulty_level && (
                    <span className="flex items-center gap-1">
                      <Gauge className="size-3" />
                      {activity.difficulty_level}
                    </span>
                  )}
                  {activity.price_range && <span>{activity.price_range}</span>}
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </TabState>
  );
}
