"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plane,
  TrainFront,
  Bus,
  Car,
  Clock,
  Landmark,
  Lightbulb,
  ExternalLink,
  Loader2,
  MapPin,
  RotateCw,
} from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { extractLabeled, formatInr, parseOrigin, parseTollBreakdown } from "@/lib/parse-notes";
import { daysAgoLabel } from "@/lib/format-time";
import { CityAutocomplete } from "@/components/city-autocomplete";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabState } from "@/components/tabs/tab-state";
import { cn } from "@/lib/utils";
import type {
  AiRoadRoute,
  Destination,
  FlightEstimate,
  RailEstimate,
  RoadEstimate,
  TransportMode,
} from "@/types";

interface HowToReachTabProps {
  destination: Destination;
  originCity: string;
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

const MODES: { value: TransportMode; label: string; emoji: string; icon: typeof Car }[] = [
  { value: "road", label: "By Road", emoji: "🚗", icon: Car },
  { value: "train", label: "By Train", emoji: "🚂", icon: TrainFront },
  { value: "air", label: "By Air", emoji: "✈️", icon: Plane },
  { value: "bus", label: "By Bus", emoji: "🚌", icon: Bus },
];

function stripOriginPrefix(text: string | null): string {
  if (!text) return "";
  const stripped = text.replace(/^From [^:]+:\s*/, "").trim();
  return stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : stripped;
}

export function HowToReachTab({ destination, originCity }: HowToReachTabProps) {
  const destinationId = destination.id;
  const {
    data: routes,
    loading,
    error,
    refetch,
  } = useDestinationTable("how_to_reach", destinationId, "created_at");
  const { data: tollRoutes } = useDestinationTable(
    "toll_routes",
    destinationId,
    "created_at"
  );

  const [mode, setMode] = useState<TransportMode>("road");
  const [fuelPrice, setFuelPrice] = useState(105);
  const [mileage, setMileage] = useState(14);

  const [travelCity, setTravelCity] = useState("");
  const [travelOrigin, setTravelOrigin] = useState<string | null>(null);
  const [travelResult, setTravelResult] = useState<EstimateResult | null>(null);
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelRefreshing, setTravelRefreshing] = useState(false);
  const [travelError, setTravelError] = useState<string | null>(null);

  const [aiRoadRoutes, setAiRoadRoutes] = useState<AiRoadRoute[] | null>(null);
  const [aiRoadLoading, setAiRoadLoading] = useState(false);
  const [aiRoadError, setAiRoadError] = useState<string | null>(null);

  const nearestStation = useMemo(() => {
    const row = routes.find((r) => r.nearest_railway_station);
    return row?.nearest_railway_station ?? destination.name;
  }, [routes, destination.name]);

  async function fetchTravelEstimates(cityName: string, forceRefresh: boolean) {
    setTravelError(null);
    try {
      if (!forceRefresh) {
        const getRes = await fetch(
          `/api/travel-estimate/${destination.slug}?origin=${encodeURIComponent(cityName)}`
        );
        const getData = await getRes.json();
        if (getRes.ok && getData.exists) {
          setTravelResult(getData);
          setTravelOrigin(cityName);
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
      setTravelResult(postData);
      setTravelOrigin(cityName);
    } catch (err) {
      setTravelError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleTravelSubmit() {
    if (!travelCity.trim()) return;
    setTravelLoading(true);
    setTravelResult(null);
    await fetchTravelEstimates(travelCity.trim(), false);
    setTravelLoading(false);
  }

  async function handleTravelRefresh() {
    if (!travelOrigin) return;
    setTravelRefreshing(true);
    await fetchTravelEstimates(travelOrigin, true);
    setTravelRefreshing(false);
  }

  const railyatriUrl = travelOrigin
    ? `https://www.railyatri.in/train-between-stations?from_code=${encodeURIComponent(travelOrigin)}&to_code=${encodeURIComponent(nearestStation)}`
    : "#";
  const googleFlightsUrl = travelOrigin
    ? `https://www.google.com/travel/flights?q=${encodeURIComponent(`flights from ${travelOrigin} to ${destination.name}`)}`
    : "#";
  const googleMapsUrl = travelOrigin
    ? `https://www.google.com/maps/dir/${encodeURIComponent(travelOrigin)}/${encodeURIComponent(destination.name)}`
    : "#";

  const modeRows = useMemo(
    () => routes.filter((r) => r.mode === mode),
    [routes, mode]
  );
  const roadOrigins = useMemo(
    () => routes.filter((r) => r.mode === "road").map((r) => parseOrigin(r.description)),
    [routes]
  );
  const [calcOrigin, setCalcOrigin] = useState<string | null>(null);
  const selectedOrigin =
    calcOrigin ?? (roadOrigins.includes(originCity) ? originCity : roadOrigins[0]);

  const tollRoute = tollRoutes.find((t) => t.origin_city === selectedOrigin);
  const distance = tollRoute?.distance_km ?? null;
  const tollCost = tollRoute?.toll_estimate_rs ?? 0;
  const fuelCost = distance != null ? (distance / mileage) * fuelPrice : null;
  const totalCost = fuelCost != null ? fuelCost + tollCost : null;
  const tollBreakdown = parseTollBreakdown(tollRoute?.route_description ?? null);

  useEffect(() => {
    if (loading) return;
    if (mode !== "road") return;
    if (modeRows.length > 0) return;
    if (aiRoadRoutes !== null) return;

    setAiRoadLoading(true);
    fetch(`/api/road-routes/${destination.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.routes) setAiRoadRoutes(data.routes);
        else setAiRoadError("Couldn't load route suggestions.");
      })
      .catch(() => setAiRoadError("Couldn't load route suggestions."))
      .finally(() => setAiRoadLoading(false));
  }, [loading, mode, modeRows.length, aiRoadRoutes, destination.slug]);

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-primary/30 bg-primary/5 overflow-visible">
        <CardContent className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-primary">
            <MapPin className="size-4" />
            <Label htmlFor="travel-origin" className="text-foreground">
              Where are you travelling from?
            </Label>
          </div>
          <div className="flex gap-2">
            <CityAutocomplete
              id="travel-origin"
              value={travelCity}
              onChange={setTravelCity}
              onSubmit={handleTravelSubmit}
              placeholder="e.g. Mumbai, Bangalore, Chennai..."
              className="flex-1"
            />
            <Button
              onClick={handleTravelSubmit}
              disabled={travelLoading || !travelCity.trim()}
              className="gap-1.5"
            >
              {travelLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Get Estimates
            </Button>
          </div>
        </CardContent>
      </Card>

      {travelLoading && (
        <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      )}

      {travelError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t get estimates</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>{travelError}</span>
            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              onClick={handleTravelSubmit}
            >
              <RotateCw className="size-3.5" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!travelLoading && travelResult && (
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
                  <span className="text-foreground">{travelResult.road.distance_km} km</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3.5" />
                    {travelResult.road.drive_hours}h
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Fuel cost</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatInr(travelResult.road.fuel_cost_min)} –{" "}
                    {formatInr(travelResult.road.fuel_cost_max)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Toll estimate</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatInr(travelResult.road.toll_estimate)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Best route</span>
                  <span className="text-xs text-foreground">{travelResult.road.best_route}</span>
                </div>
                {travelResult.road.rest_stops.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Rest stops</span>
                    <PillRow items={travelResult.road.rest_stops} />
                  </div>
                )}
                <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                  💡 {travelResult.road.tips}
                </p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm", className: "w-full gap-1.5" })}
                >
                  <MapPin className="size-4" />
                  🗺️ Open in Google Maps
                </a>
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
                  {travelResult.rail.journey_hours_min}–{travelResult.rail.journey_hours_max}h
                  journey
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
                          {formatInr(travelResult.rail.sleeper_fare_min)}–
                          {formatInr(travelResult.rail.sleeper_fare_max)}
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="px-2 py-1">3AC</td>
                        <td className="px-2 py-1 text-right">
                          {formatInr(travelResult.rail.ac3_fare_min)}–
                          {formatInr(travelResult.rail.ac3_fare_max)}
                        </td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="px-2 py-1">2AC</td>
                        <td className="px-2 py-1 text-right">
                          {formatInr(travelResult.rail.ac2_fare_min)}–
                          {formatInr(travelResult.rail.ac2_fare_max)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {travelResult.rail.popular_trains.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Popular trains</span>
                    <PillRow items={travelResult.rail.popular_trains} />
                  </div>
                )}
                <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                  💡 {travelResult.rail.tips}
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
                  {travelResult.flight.duration_hours_min}–{travelResult.flight.duration_hours_max}h
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Economy fare</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatInr(travelResult.flight.economy_fare_min)} –{" "}
                    {formatInr(travelResult.flight.economy_fare_max)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {travelResult.flight.nearest_airport_origin} →{" "}
                    {travelResult.flight.nearest_airport_destination}
                  </span>
                </div>
                {travelResult.flight.airlines.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Airlines</span>
                    <PillRow items={travelResult.flight.airlines} />
                  </div>
                )}
                <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                  💡 {travelResult.flight.tips}
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
              ⚡ AI estimates — not live fares · Generated{" "}
              {daysAgoLabel(travelResult.generated_at)}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={travelRefreshing}
              onClick={handleTravelRefresh}
            >
              <RotateCw className={travelRefreshing ? "size-3.5 animate-spin" : "size-3.5"} />
              Refresh
            </Button>
          </div>
        </>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-xs font-medium transition-colors",
              mode === m.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-base leading-none">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      <TabState
        loading={loading}
        error={error}
        empty={mode !== "road" && modeRows.length === 0}
        emptyTitle="No routes listed yet"
        emptyDescription="We're gathering how-to-reach details for this destination."
        onRetry={refetch}
      >
        <div className="flex flex-col gap-3">
          {modeRows.map((route) => {
            const { value: costEstimate, rest: r1 } = extractLabeled(
              route.description,
              "Estimated cost"
            );
            const description = stripOriginPrefix(r1);
            return (
              <Card key={route.id}>
                <CardContent className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      From {parseOrigin(route.description)}
                    </span>
                    {route.duration_from_hyderabad && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="size-3" />
                        {route.duration_from_hyderabad}
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {route.distance_from_hyderabad_km != null && (
                      <span>Distance: {route.distance_from_hyderabad_km} km</span>
                    )}
                    {costEstimate && <span>Cost: ₹{costEstimate.replace("₹", "")}</span>}
                    {route.nearest_airport && (
                      <span className="flex items-center gap-1">
                        <Plane className="size-3" />
                        {route.nearest_airport}
                      </span>
                    )}
                    {route.nearest_railway_station && (
                      <span className="flex items-center gap-1">
                        <Landmark className="size-3" />
                        {route.nearest_railway_station}
                      </span>
                    )}
                  </div>
                  {route.tips && (
                    <p className="flex items-start gap-1.5 rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                      <Lightbulb className="mt-0.5 size-3 shrink-0" />
                      {route.tips}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {mode === "road" && modeRows.length === 0 && (
            <>
              {aiRoadLoading && (
                <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              )}

              {aiRoadError && (
                <Alert variant="destructive">
                  <AlertTitle>Couldn&apos;t load route suggestions</AlertTitle>
                  <AlertDescription>{aiRoadError}</AlertDescription>
                </Alert>
              )}

              {aiRoadRoutes && (
                <>
                  <div className="flex flex-col gap-4 md:grid md:grid-cols-3">
                    {aiRoadRoutes.map((route) => (
                      <Card key={route.origin_city}>
                        <CardContent className="flex flex-col gap-2 pt-1">
                          <span className="text-sm font-medium text-foreground">
                            🚗 From {route.origin_city}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {route.distance_km} km · ~{route.drive_hours}h drive
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Best route</span>
                            <span className="text-xs text-foreground">{route.best_route}</span>
                          </div>
                          {route.rest_stops.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">Rest stops</span>
                              <PillRow items={route.rest_stops} />
                            </div>
                          )}
                          <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                            💡 {route.tips}
                          </p>
                          <a
                            href={`https://www.google.com/maps/dir/${encodeURIComponent(route.origin_city)}/${encodeURIComponent(destination.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({ variant: "outline", size: "sm", className: "w-full gap-1.5" })}
                          >
                            <MapPin className="size-4" />
                            🗺️ Open in Google Maps
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ⚡ AI suggested routes · not verified
                  </span>
                </>
              )}
            </>
          )}

          {mode === "road" && roadOrigins.length > 0 && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-4 pt-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Road Trip Calculator
                </span>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="calc-origin">Origin city</Label>
                    <select
                      id="calc-origin"
                      value={selectedOrigin}
                      onChange={(e) => setCalcOrigin(e.target.value)}
                      className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {roadOrigins.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fuel-price">Fuel price (₹/L)</Label>
                    <Input
                      id="fuel-price"
                      type="number"
                      min={1}
                      value={fuelPrice}
                      onChange={(e) => setFuelPrice(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="mileage">Mileage (km/L)</Label>
                    <Input
                      id="mileage"
                      type="number"
                      min={1}
                      value={mileage}
                      onChange={(e) => setMileage(Number(e.target.value) || 1)}
                    />
                  </div>
                </div>

                {distance != null && (
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <div className="rounded-lg bg-card px-2.5 py-2 ring-1 ring-foreground/10">
                      <div className="text-xs text-muted-foreground">Distance</div>
                      <div className="font-medium text-foreground">{distance} km</div>
                    </div>
                    <div className="rounded-lg bg-card px-2.5 py-2 ring-1 ring-foreground/10">
                      <div className="text-xs text-muted-foreground">Fuel cost</div>
                      <div className="font-medium text-foreground">
                        {fuelCost != null ? formatInr(fuelCost) : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg bg-card px-2.5 py-2 ring-1 ring-foreground/10">
                      <div className="text-xs text-muted-foreground">Toll cost</div>
                      <div className="font-medium text-foreground">
                        {formatInr(tollCost)}
                      </div>
                    </div>
                    <div className="rounded-lg bg-primary px-2.5 py-2 text-primary-foreground">
                      <div className="text-xs opacity-90">Total</div>
                      <div className="font-semibold">
                        {totalCost != null ? formatInr(totalCost) : "—"}
                      </div>
                    </div>
                  </div>
                )}

                {tollBreakdown.points.length > 0 && (
                  <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="px-2.5 py-1.5 font-medium">Toll point</th>
                          <th className="px-2.5 py-1.5 font-medium">km</th>
                          <th className="px-2.5 py-1.5 text-right font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tollBreakdown.points.map((p) => (
                          <tr key={p.name} className="border-t border-border">
                            <td className="px-2.5 py-1.5">{p.name}</td>
                            <td className="px-2.5 py-1.5">{p.kmFromStart}</td>
                            <td className="px-2.5 py-1.5 text-right">₹{p.amount}</td>
                          </tr>
                        ))}
                        {tollBreakdown.miscAmount != null && (
                          <tr className="border-t border-border text-muted-foreground">
                            <td className="px-2.5 py-1.5">Miscellaneous</td>
                            <td className="px-2.5 py-1.5">—</td>
                            <td className="px-2.5 py-1.5 text-right">
                              ₹{tollBreakdown.miscAmount}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </TabState>
    </div>
  );
}
