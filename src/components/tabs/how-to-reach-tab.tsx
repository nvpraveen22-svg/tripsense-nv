"use client";

import { useMemo, useState } from "react";
import { Plane, TrainFront, Bus, Car, Clock, Landmark, Lightbulb } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { extractLabeled, formatInr, parseTollBreakdown } from "@/lib/parse-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";
import { cn } from "@/lib/utils";
import type { HowToReach, TransportMode } from "@/types";

interface HowToReachTabProps {
  destinationId: string;
  originCity: string;
}

const MODES: { value: TransportMode; label: string; emoji: string; icon: typeof Car }[] = [
  { value: "road", label: "By Road", emoji: "🚗", icon: Car },
  { value: "train", label: "By Train", emoji: "🚂", icon: TrainFront },
  { value: "air", label: "By Air", emoji: "✈️", icon: Plane },
  { value: "bus", label: "By Bus", emoji: "🚌", icon: Bus },
];

function parseOrigin(row: HowToReach): string {
  const match = /^From ([^:]+):\s*/.exec(row.description ?? "");
  return match ? match[1].trim() : "Hyderabad";
}

function stripOriginPrefix(text: string | null): string {
  if (!text) return "";
  const stripped = text.replace(/^From [^:]+:\s*/, "").trim();
  return stripped ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : stripped;
}

export function HowToReachTab({ destinationId, originCity }: HowToReachTabProps) {
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

  const modeRows = useMemo(
    () => routes.filter((r) => r.mode === mode),
    [routes, mode]
  );
  const roadOrigins = useMemo(
    () => routes.filter((r) => r.mode === "road").map(parseOrigin),
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

  return (
    <div className="flex flex-col gap-4">
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
        empty={modeRows.length === 0}
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
                      From {parseOrigin(route)}
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
