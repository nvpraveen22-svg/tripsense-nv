"use client";

import { useMemo, useState } from "react";
import {
  Car,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Plane,
  RotateCw,
  TrainFront,
} from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { formatInr } from "@/lib/parse-notes";
import { daysAgoLabel } from "@/lib/format-time";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Destination, FlightEstimate, RailEstimate, RoadEstimate } from "@/types";

interface TravelTabProps {
  destination: Destination;
}

interface EstimateResult {
  road: RoadEstimate;
  rail: RailEstimate;
  flight: FlightEstimate;
  generated_at: string;
}

function PillRow({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="text-[11px]">
          {item}
        </Badge>
      ))}
    </div>
  );
}

export function TravelTab({ destination }: TravelTabProps) {
  const [city, setCity] = useState("");
  const [origin, setOrigin] = useState<string | null>(null);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: routes } = useDestinationTable("how_to_reach", destination.id, "created_at");

  const nearestStation = useMemo(() => {
    const row = routes.find((r) => r.nearest_railway_station);
    return row?.nearest_railway_station ?? destination.name;
  }, [routes, destination.name]);

  async function fetchEstimates(cityName: string, forceRefresh: boolean) {
    setError(null);
    try {
      if (!forceRefresh) {
        const getRes = await fetch(
          `/api/travel-estimate/${destination.slug}?origin=${encodeURIComponent(cityName)}`
        );
        const getData = await getRes.json();
        if (getRes.ok && getData.exists) {
          setResult(getData);
          setOrigin(cityName);
          return;
        }
      }

      const postRes = await fetch(`/api/travel-estimate/${destination.slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: cityName, refresh: forceRefresh }),
      });
      const postData = await postRes.json();
      if (!postRes.ok) throw new Error(postData.error ?? "Couldn't generate estimates.");
      setResult(postData);
      setOrigin(cityName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleSubmit() {
    if (!city.trim()) return;
    setLoading(true);
    setResult(null);
    await fetchEstimates(city.trim(), false);
    setLoading(false);
  }

  async function handleRefresh() {
    if (!origin) return;
    setRefreshing(true);
    await fetchEstimates(origin, true);
    setRefreshing(false);
  }

  const railyatriUrl = origin
    ? `https://www.railyatri.in/train-between-stations?from_code=${encodeURIComponent(origin)}&to_code=${encodeURIComponent(nearestStation)}`
    : "#";
  const googleFlightsUrl = origin
    ? `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${origin} to ${destination.name}`)}`
    : "#";

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2 pt-1">
          <Label htmlFor="travel-origin">Enter your city</Label>
          <div className="flex gap-2">
            <Input
              id="travel-origin"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Mumbai"
              className="flex-1"
            />
            <Button onClick={handleSubmit} disabled={loading || !city.trim()} className="gap-1.5">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Get Estimates
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t get estimates</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!loading && result && (
        <>
          <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
            {/* Road */}
            <Card>
              <CardContent className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <Car className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    🚗 Road Trip
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{result.road.distance_km} km</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3.5" />
                    {result.road.drive_hours}h
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Fuel cost</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatInr(result.road.fuel_cost_min)} – {formatInr(result.road.fuel_cost_max)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Toll estimate</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatInr(result.road.toll_estimate)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Best route</span>
                  <span className="text-xs text-foreground">{result.road.best_route}</span>
                </div>
                {result.road.rest_stops.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Rest stops</span>
                    <PillRow items={result.road.rest_stops} />
                  </div>
                )}
                <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                  💡 {result.road.tips}
                </p>
              </CardContent>
            </Card>

            {/* Rail */}
            <Card>
              <CardContent className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <TrainFront className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">🚆 Train</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  {result.rail.journey_hours_min}–{result.rail.journey_hours_max}h journey
                </div>
                <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-2 py-1 font-medium">Class</th>
                        <th className="px-2 py-1 text-right font-medium">Fare</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="px-2 py-1">Sleeper</td>
                        <td className="px-2 py-1 text-right">
                          {formatInr(result.rail.sleeper_fare_min)}–
                          {formatInr(result.rail.sleeper_fare_max)}
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="px-2 py-1">3AC</td>
                        <td className="px-2 py-1 text-right">
                          {formatInr(result.rail.ac3_fare_min)}–
                          {formatInr(result.rail.ac3_fare_max)}
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="px-2 py-1">2AC</td>
                        <td className="px-2 py-1 text-right">
                          {formatInr(result.rail.ac2_fare_min)}–
                          {formatInr(result.rail.ac2_fare_max)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {result.rail.popular_trains.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Popular trains</span>
                    <PillRow items={result.rail.popular_trains} />
                  </div>
                )}
                <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                  💡 {result.rail.tips}
                </p>
                <a
                  href={railyatriUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "w-full gap-1.5" })}
                >
                  Book on RailYatri
                  <ExternalLink className="size-3.5" />
                </a>
              </CardContent>
            </Card>

            {/* Flight */}
            <Card>
              <CardContent className="flex flex-col gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-primary">
                  <Plane className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wide">✈️ Flight</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  {result.flight.duration_hours_min}–{result.flight.duration_hours_max}h
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Economy fare</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatInr(result.flight.economy_fare_min)} –{" "}
                    {formatInr(result.flight.economy_fare_max)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {result.flight.nearest_airport_origin} → {result.flight.nearest_airport_destination}
                  </span>
                </div>
                {result.flight.airlines.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Airlines</span>
                    <PillRow items={result.flight.airlines} />
                  </div>
                )}
                <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                  💡 {result.flight.tips}
                </p>
                <a
                  href={googleFlightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "w-full gap-1.5" })}
                >
                  Search on Google Flights
                  <ExternalLink className="size-3.5" />
                </a>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              🤖 Estimates by AI — not live fares · Last updated{" "}
              {daysAgoLabel(result.generated_at)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={refreshing}
              onClick={handleRefresh}
            >
              <RotateCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} />
              Refresh
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
