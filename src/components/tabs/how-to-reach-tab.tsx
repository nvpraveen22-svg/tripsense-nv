import { Bus, Car, Plane, Ship, TrainFront } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { Card, CardContent } from "@/components/ui/card";
import { TabState } from "@/components/tabs/tab-state";
import type { TransportMode } from "@/types";

interface HowToReachTabProps {
  destinationId: string;
  originCity: string;
}

const MODE_ICON: Record<TransportMode, typeof Plane> = {
  flight: Plane,
  train: TrainFront,
  bus: Bus,
  car: Car,
  ferry: Ship,
};

const MODE_LABEL: Record<TransportMode, string> = {
  flight: "By air",
  train: "By train",
  bus: "By bus",
  car: "By road",
  ferry: "By ferry",
};

export function HowToReachTab({ destinationId, originCity }: HowToReachTabProps) {
  const { data, loading, error } = useDestinationTable(
    "how_to_reach",
    destinationId
  );

  return (
    <TabState
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyTitle="No travel routes listed yet"
      emptyDescription="We're gathering how-to-reach details for this destination."
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Showing routes from <span className="font-medium text-foreground">{originCity}</span>
        </p>
        {data.map((route) => {
          const Icon = MODE_ICON[route.mode] ?? Car;
          return (
            <Card key={route.id}>
              <CardContent className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {route.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {MODE_LABEL[route.mode] ?? route.mode}
                    </span>
                  </div>
                </div>
                {route.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {route.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
                  {route.nearest_hub && (
                    <span className="text-muted-foreground">
                      Hub: <span className="text-foreground">{route.nearest_hub}</span>
                    </span>
                  )}
                  {route.distance_km != null && (
                    <span className="text-muted-foreground">
                      Distance: <span className="text-foreground">{route.distance_km} km</span>
                    </span>
                  )}
                  {route.estimated_duration && (
                    <span className="text-muted-foreground">
                      Duration: <span className="text-foreground">{route.estimated_duration}</span>
                    </span>
                  )}
                  {route.estimated_cost && (
                    <span className="text-muted-foreground">
                      Cost: <span className="text-foreground">{route.estimated_cost}</span>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TabState>
  );
}
