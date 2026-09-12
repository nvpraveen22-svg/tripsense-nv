"use client";

import { useEffect, useMemo, useState } from "react";
import { Bird, BookOpen, CalendarDays, CloudSun, Droplets, Sparkles, Trees, Waves } from "lucide-react";
import type { Destination } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DESTINATION_HIGHLIGHTS, type QuickStat } from "@/lib/destination-highlights";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { parseOrigin, parseMonthNotes } from "@/lib/parse-notes";
import { languageForState, budgetLevelFromHotelPrices } from "@/lib/state-language";
import { MonthCalendar } from "@/components/tabs/month-calendar";
import { SeasonalSnapshot } from "@/components/tabs/seasonal-snapshot";

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

function StatChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[120px] flex-none flex-col gap-0.5 rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
      <span className="text-xs text-muted-foreground">
        {icon} {label}
      </span>
      <span className="line-clamp-1 text-sm font-medium text-foreground">{value}</span>
    </div>
  );
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

  const highlights = DESTINATION_HIGHLIGHTS[destination.slug];

  const { data: routes, loading: routesLoading } = useDestinationTable(
    "how_to_reach",
    destination.id,
    "created_at"
  );
  const { data: hotels, loading: hotelsLoading } = useDestinationTable(
    "hotels",
    destination.id,
    "created_at"
  );

  const hyderabadRoadRoute = useMemo(
    () =>
      routes.find((r) => r.mode === "road" && parseOrigin(r.description) === "Hyderabad"),
    [routes]
  );

  const budgetLevel = useMemo(() => {
    const withPrice = hotels.filter((h) => h.price_min != null);
    if (withPrice.length === 0) return null;
    const avg =
      withPrice.reduce((sum, h) => sum + (h.price_min ?? 0), 0) / withPrice.length;
    return budgetLevelFromHotelPrices(avg);
  }, [hotels]);

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

  const hasMonthData =
    destination.best_months && destination.best_months.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Quick Stats Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <StatChip
          icon="📍"
          label="From Hyderabad"
          value={
            routesLoading
              ? "…"
              : hyderabadRoadRoute?.distance_from_hyderabad_km != null
                ? `${hyderabadRoadRoute.distance_from_hyderabad_km} km`
                : "—"
          }
        />
        <StatChip
          icon="🕐"
          label="Drive duration"
          value={routesLoading ? "…" : (hyderabadRoadRoute?.duration_from_hyderabad ?? "—")}
        />
        <StatChip
          icon="🌡️"
          label="Best season"
          value={destination.best_time_to_visit ?? "Year-round"}
        />
        <StatChip icon="🗣️" label="Language" value={languageForState(destination.state)} />
        <StatChip
          icon="💰"
          label="Budget"
          value={hotelsLoading ? "…" : (budgetLevel ?? "—")}
        />
        <StatChip icon="⭐" label="Known for" value={destination.tagline ?? destination.name} />
      </div>

      {/* 2. Existing overview: best time / ideal trip + description */}
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
            <span className="text-sm font-medium text-foreground">{tripDaysLabel}</span>
          </CardContent>
        </Card>
      </div>

      {destination.description && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-secondary">
              <Sparkles className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">About</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              {destination.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 3. History & Culture */}
      {destination.history_culture && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-primary">
              <BookOpen className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                📜 History &amp; Culture
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {destination.history_culture.split("\n\n").map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground">
                  {para}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Best Time to Visit — month calendar */}
      {hasMonthData && (
        <Card>
          <CardContent className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-primary">
              <CalendarDays className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Best Time to Visit
              </span>
            </div>
            <MonthCalendar
              bestMonths={destination.best_months ?? []}
              okayMonths={destination.okay_months ?? []}
              avoidMonths={destination.avoid_months ?? []}
              monthNotes={parseMonthNotes(destination.month_notes)}
            />
          </CardContent>
        </Card>
      )}

      {/* 5. AI Seasonal Snapshot */}
      <SeasonalSnapshot destinationSlug={destination.slug} />

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
                    <span className="text-sm font-medium text-foreground">{stat.value}</span>
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
              <span className="text-xl font-semibold text-foreground">{weather.temp}°C</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
