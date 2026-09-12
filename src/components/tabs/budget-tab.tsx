"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { Destination } from "@/types";

interface BudgetTabProps {
  destination: Destination;
}

const FOOD_PER_DAY_PER_PERSON = 800;
const ACTIVITIES_PER_DAY_PER_PERSON = 500;

function averagePrice(min: number | null, max: number | null): number {
  if (min != null && max != null) return (min + max) / 2;
  if (min != null) return min;
  if (max != null) return max;
  return 2500;
}

function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function BudgetTab({ destination }: BudgetTabProps) {
  const { data: hotels, loading } = useDestinationTable(
    "hotels",
    destination.id
  );

  const [days, setDays] = useState(
    destination.ideal_trip_days_min ?? destination.ideal_trip_days_max ?? 3
  );
  const [travelers, setTravelers] = useState(2);

  const avgHotelPrice = useMemo(() => {
    if (hotels.length === 0) return 2500;
    const sum = hotels.reduce(
      (acc, hotel) =>
        acc + averagePrice(hotel.price_per_night_min, hotel.price_per_night_max),
      0
    );
    return sum / hotels.length;
  }, [hotels]);

  const rooms = Math.max(1, Math.ceil(travelers / 2));
  const nights = Math.max(1, days - 1);

  const accommodationCost = avgHotelPrice * nights * rooms;
  const foodCost = FOOD_PER_DAY_PER_PERSON * days * travelers;
  const activitiesCost = ACTIVITIES_PER_DAY_PER_PERSON * days * travelers;
  const total = accommodationCost + foodCost + activitiesCost;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-days">Trip days</Label>
              <Input
                id="budget-days"
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) =>
                  setDays(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budget-travelers">Travelers</Label>
              <Input
                id="budget-travelers"
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={(e) =>
                  setTravelers(Math.max(1, Number(e.target.value) || 1))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estimated budget
            </span>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Accommodation ({nights} nights, {rooms} room{rooms > 1 ? "s" : ""})
                </span>
                <span className="font-medium text-foreground">
                  {formatInr(accommodationCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Food</span>
                <span className="font-medium text-foreground">
                  {formatInr(foodCost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Activities & local travel</span>
                <span className="font-medium text-foreground">
                  {formatInr(activitiesCost)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                <span className="font-medium text-foreground">Total estimate</span>
                <span className="text-lg font-semibold text-primary">
                  {formatInr(total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Info className="size-4" />
        <AlertDescription>
          This is a rough estimate excluding inter-city travel to{" "}
          {destination.name}. Check the &quot;How to Reach&quot; tab for
          transport costs.
        </AlertDescription>
      </Alert>
    </div>
  );
}
