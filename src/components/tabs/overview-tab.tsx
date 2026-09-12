"use client";

import { useEffect, useState } from "react";
import {
  Bird,
  CalendarDays,
  CloudSun,
  Droplets,
  Sparkles,
  Trees,
  Waves,
} from "lucide-react";
import type { Destination } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DESTINATION_HIGHLIGHTS, type QuickStat } from "@/lib/destination-highlights";

interface OverviewTabProps {
  destination: Destination;
}

interface Weather {
  temp: number;
  condition: string;
  description: string;
  humidity: number;
}

const STAT_ICON: Record<QuickStat["icon"], typeof Bird> = {
  wildlife: Bird,
  forest: Trees,
  river: Waves,
  city: CalendarDays,
};

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

  const highlights = DESTINATION_HIGHLIGHTS[destination.slug];

  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setWeatherLoading(true);
      setWeatherError(false);
      const params = new URLSearchParams();
      if (destination.latitude != null && destination.longitude != null) {
        params.set("lat", String(destination.latitude));
        params.set("lon", String(destination.longitude));
      } else {
        params.set("city", destination.name);
      }

      try {
        const res = await fetch(`/api/weather?${params.toString()}`);
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        if (!cancelled) setWeather(data);
      } catch {
        if (!cancelled) setWeatherError(true);
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }

    loadWeather();
    return () => {
      cancelled = true;
    };
  }, [destination.latitude, destination.longitude, destination.name]);

  return (
    <div className="flex flex-col gap-4">
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

      {highlights && highlights.quickStats.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {highlights.quickStats.map((stat) => {
            const Icon = STAT_ICON[stat.icon];
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-2.5 pt-1">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span className="text-sm font-medium text-foreground">
                      {stat.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardContent className="flex items-center gap-3 pt-1">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <CloudSun className="size-5" />
          </span>
          {weatherLoading ? (
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : weatherError || !weather ? (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">Weather</span>
              <span className="text-xs text-muted-foreground">
                Forecast unavailable right now
              </span>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium capitalize text-foreground">
                  {weather.description || weather.condition}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Droplets className="size-3" />
                  {weather.humidity}% humidity
                </span>
              </div>
              <span className="text-xl font-semibold text-foreground">
                {weather.temp}°C
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
