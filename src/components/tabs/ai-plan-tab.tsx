"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ItineraryPlan } from "@/types";

interface AiPlanTabProps {
  destinationId: string;
  destinationName: string;
  originCity: string;
}

const GROUP_TYPES = ["Solo", "Couple", "Family with Kids", "Friends Group"];
const INTERESTS = ["Adventure", "Wildlife", "Temples", "Nature", "Relaxation"];
const BUDGET_LEVELS = ["Budget", "Moderate", "Luxury"];

const SLOT_LABEL: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
};

export function AiPlanTab({ destinationId, destinationName, originCity }: AiPlanTabProps) {
  const [days, setDays] = useState(2);
  const [groupType, setGroupType] = useState(GROUP_TYPES[0]);
  const [interests, setInterests] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState(BUDGET_LEVELS[1]);
  const [startingFrom, setStartingFrom] = useState(originCity);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/ai-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationId,
          destinationName,
          days,
          groupType,
          interests,
          budgetLevel,
          startingFrom: startingFrom || originCity,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Couldn't generate an itinerary.");
      }

      const data = await res.json();
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-secondary/30 bg-secondary/5">
        <CardContent className="flex flex-col gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-secondary">
            <Sparkles className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              AI itinerary
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Number of days</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    days === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="group-type">Group type</Label>
            <select
              id="group-type"
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {GROUP_TYPES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    interests.includes(interest)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget-level">Budget level</Label>
            <select
              id="budget-level"
              value={budgetLevel}
              onChange={(e) => setBudgetLevel(e.target.value)}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {BUDGET_LEVELS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="starting-from">Starting from</Label>
            <Input
              id="starting-from"
              value={startingFrom}
              onChange={(e) => setStartingFrom(e.target.value)}
              placeholder="Hyderabad"
            />
          </div>

          <Button
            className="w-full gap-1.5"
            disabled={loading}
            onClick={handleGenerate}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wand2 className="size-4" />
            )}
            {loading ? "Generating..." : "Generate itinerary"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t generate itinerary</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {plan && (
        <div className="flex flex-col gap-3">
          {plan.summary && (
            <p className="text-sm leading-relaxed text-foreground">{plan.summary}</p>
          )}

          {plan.days.map((day) => (
            <Card key={day.day}>
              <CardContent className="flex flex-col gap-2 pt-1">
                <span className="text-sm font-semibold text-foreground">
                  Day {day.day}: {day.title}
                </span>
                <div className="flex flex-col gap-2">
                  {day.slots.map((slot, i) => (
                    <div key={i} className="flex gap-2">
                      <Badge variant="secondary" className="h-fit shrink-0">
                        {SLOT_LABEL[slot.time_of_day] ?? slot.time_of_day}
                      </Badge>
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{slot.activity}</span>
                        {slot.notes && (
                          <span className="text-xs text-muted-foreground">
                            {slot.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
