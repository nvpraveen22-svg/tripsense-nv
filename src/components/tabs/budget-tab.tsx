"use client";

import { useMemo, useState } from "react";
import {
  BedDouble,
  Car,
  Compass,
  Plane,
  TrainFront,
  UtensilsCrossed,
} from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import {
  extractLabeled,
  formatInr,
  parseCostRange,
  parseTaxiAddon,
} from "@/lib/parse-notes";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Destination, HowToReach } from "@/types";
import { Info } from "lucide-react";

interface BudgetTabProps {
  destination: Destination;
  originCity: string;
}

type AccommodationType = "budget" | "premium";
type TravelMode = "car" | "train" | "flight";
type OriginOption = "Hyderabad" | "Bangalore" | "Mumbai" | "Other";

const FALLBACK_DISTANCE_KM: Record<string, number> = { Mumbai: 520, Other: 600 };
const FALLBACK_PER_PERSON: Record<TravelMode, number> = {
  car: 0,
  train: 800,
  flight: 6000,
};

function findOriginOption(city: string): OriginOption {
  if (city === "Hyderabad" || city === "Bangalore" || city === "Mumbai") return city;
  return "Other";
}

function parseOrigin(row: HowToReach): string {
  const match = /^From ([^:]+):\s*/.exec(row.description ?? "");
  return match ? match[1].trim() : "Hyderabad";
}

export function BudgetTab({ destination, originCity }: BudgetTabProps) {
  const { data: tollRoutes, loading: loadingToll } = useDestinationTable(
    "toll_routes",
    destination.id,
    "created_at"
  );
  const { data: howToReach, loading: loadingH2R } = useDestinationTable(
    "how_to_reach",
    destination.id,
    "created_at"
  );

  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(
    destination.ideal_trip_days_min ?? destination.ideal_trip_days_max ?? 3
  );
  const [accommodationType, setAccommodationType] = useState<AccommodationType>("budget");
  const [travelMode, setTravelMode] = useState<TravelMode>("car");
  const [origin, setOrigin] = useState<OriginOption>(findOriginOption(originCity));
  const [customOrigin, setCustomOrigin] = useState(
    findOriginOption(originCity) === "Other" ? originCity : ""
  );

  const loading = loadingToll || loadingH2R;

  const breakdown = useMemo(() => {
    const rooms = Math.max(1, Math.ceil(people / 2));
    const nights = Math.max(1, days - 1);
    const accommodationRate = accommodationType === "budget" ? 3000 : 9000;
    const accommodationCost = rooms * nights * accommodationRate;

    const foodRate = accommodationType === "budget" ? 500 : 800;
    const foodCost = foodRate * people * days;

    const activitiesCost = Math.round(2000 * (days / 2)) * people;

    let travelCost = 0;
    let travelNote: string | null = null;

    if (travelMode === "car") {
      const tollRoute = tollRoutes.find((t) => t.origin_city === origin);
      const cars = Math.max(1, Math.ceil(people / 4));
      const distance = tollRoute?.distance_km ?? FALLBACK_DISTANCE_KM[origin] ?? 600;
      const tollCost = tollRoute?.toll_estimate_rs ?? 0;
      const fuelCost = (distance / 14) * 105 * cars;
      travelCost = fuelCost + tollCost * cars;
      if (!tollRoute) {
        travelNote = "Approximate — exact toll data isn't available for this origin.";
      }
    } else {
      const row = howToReach.find(
        (r) => r.mode === travelMode && parseOrigin(r) === origin
      );
      if (row) {
        const { value: costText } = extractLabeled(row.description, "Estimated cost");
        const range = parseCostRange(costText);
        const taxi = parseTaxiAddon(costText);
        const perPerson = range ? (range.min + range.max) / 2 + taxi : FALLBACK_PER_PERSON[travelMode];
        travelCost = perPerson * people;
      } else {
        travelCost = FALLBACK_PER_PERSON[travelMode] * people;
        travelNote = "Approximate — exact fare data isn't available for this origin.";
      }
    }

    const total = travelCost + accommodationCost + foodCost + activitiesCost;

    return {
      rooms,
      nights,
      accommodationCost,
      foodCost,
      activitiesCost,
      travelCost,
      travelNote,
      total,
      perPerson: total / people,
    };
  }, [people, days, accommodationType, travelMode, origin, tollRoutes, howToReach]);

  const TravelIcon = travelMode === "car" ? Car : travelMode === "train" ? TrainFront : Plane;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-people">People (1-8)</Label>
              <Input
                id="budget-people"
                type="number"
                min={1}
                max={8}
                value={people}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setPeople(1);
                    return;
                  }
                  const parsed = Number(raw);
                  if (Number.isNaN(parsed)) return;
                  setPeople(Math.min(8, Math.max(1, parsed)));
                }}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-days">Days (1-7)</Label>
              <Input
                id="budget-days"
                type="number"
                min={1}
                max={7}
                value={days}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setDays(1);
                    return;
                  }
                  const parsed = Number(raw);
                  if (Number.isNaN(parsed)) return;
                  setDays(Math.min(7, Math.max(1, parsed)));
                }}
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Accommodation type</Label>
            <div className="flex gap-1.5">
              {(["budget", "premium"] as AccommodationType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setAccommodationType(type)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
                    accommodationType === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type} {type === "budget" ? "(₹3000/night avg)" : "(₹9000/night avg)"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Travel mode</Label>
            <div className="flex gap-1.5">
              {(["car", "train", "flight"] as TravelMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTravelMode(mode)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
                    travelMode === mode
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "car" ? "Own Car" : mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-origin">Origin city</Label>
            <select
              id="budget-origin"
              value={origin}
              onChange={(e) => setOrigin(e.target.value as OriginOption)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Other">Other</option>
            </select>
            {origin === "Other" && (
              <Input
                placeholder="Enter your city"
                value={customOrigin}
                onChange={(e) => setCustomOrigin(e.target.value)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardContent className="flex flex-col gap-1 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TravelIcon className="size-3.5" />
                  Travel{origin === "Other" && customOrigin ? ` (${customOrigin})` : ` (${origin})`}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatInr(breakdown.travelCost)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BedDouble className="size-3.5" />
                  Stay ({breakdown.rooms} room{breakdown.rooms > 1 ? "s" : ""}, {breakdown.nights}n)
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatInr(breakdown.accommodationCost)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UtensilsCrossed className="size-3.5" />
                  Food
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatInr(breakdown.foodCost)}
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex flex-col gap-1 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Compass className="size-3.5" />
                  Activities
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {formatInr(breakdown.activitiesCost)}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary text-primary-foreground">
            <CardContent className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="text-xs opacity-90">Total trip cost</span>
                <span className="text-xl font-semibold">
                  {formatInr(breakdown.total)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs opacity-90">Per person</span>
                <span className="text-lg font-semibold">
                  {formatInr(breakdown.perPerson)}
                </span>
              </div>
            </CardContent>
          </Card>

          {breakdown.travelNote && (
            <Alert>
              <Info className="size-4" />
              <AlertDescription>{breakdown.travelNote}</AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
