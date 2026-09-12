import { CalendarDays, CloudSun, Sparkles } from "lucide-react";
import type { Destination } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface OverviewTabProps {
  destination: Destination;
}

export function OverviewTab({ destination }: OverviewTabProps) {
  const { ideal_trip_days_min, ideal_trip_days_max } = destination;
  const tripDaysLabel =
    ideal_trip_days_min && ideal_trip_days_max
      ? ideal_trip_days_min === ideal_trip_days_max
        ? `${ideal_trip_days_min} days`
        : `${ideal_trip_days_min}–${ideal_trip_days_max} days`
      : ideal_trip_days_min
        ? `${ideal_trip_days_min}+ days`
        : "Flexible";

  return (
    <div className="flex flex-col gap-4">
      {destination.description && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-secondary">
              <Sparkles className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                About
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {destination.description}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-primary">
              <CalendarDays className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Best time
              </span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {destination.best_time_to_visit ?? "Year-round"}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-primary">
              <CalendarDays className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ideal trip
              </span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {tripDaysLabel}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center gap-3 pt-1">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CloudSun className="size-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              Weather
            </span>
            <span className="text-xs text-muted-foreground">
              Live forecast coming soon
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
