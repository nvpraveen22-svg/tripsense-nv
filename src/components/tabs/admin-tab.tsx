"use client";

import { useEffect, useState } from "react";
import { Lock, RotateCw, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminTabProps {
  destination: Destination;
}

const TABLES = [
  { key: "attractions", label: "Attractions" },
  { key: "temples", label: "Temples" },
  { key: "how_to_reach", label: "How to Reach" },
  { key: "hotels", label: "Hotels" },
  { key: "activities", label: "Activities" },
  { key: "media", label: "Media" },
] as const;

export function AdminTab({ destination }: AdminTabProps) {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);

  async function loadCounts() {
    setCountsLoading(true);
    const entries = await Promise.all(
      TABLES.map(async ({ key }) => {
        const { count } = await supabase
          .from(key)
          .select("id", { count: "exact", head: true })
          .eq("destination_id", destination.id);
        return [key, count ?? 0] as const;
      })
    );
    setCounts(Object.fromEntries(entries));
    setCountsLoading(false);
  }

  useEffect(() => {
    if (verified) loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  async function handleVerify() {
    setVerifying(true);
    setPinError(null);
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.valid) {
        setVerified(true);
      } else {
        setPinError("Incorrect PIN.");
      }
    } catch {
      setPinError("Couldn't verify PIN. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleRefreshItineraries() {
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const res = await fetch("/api/admin/refresh-itineraries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin, destinationId: destination.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setRefreshResult(`Cleared ${data.cleared} cached itinerary(ies).`);
      } else {
        setRefreshResult(data.error ?? "Couldn't refresh itineraries.");
      }
    } catch {
      setRefreshResult("Couldn't refresh itineraries.");
    } finally {
      setRefreshing(false);
    }
  }

  if (!verified) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </span>
          <span className="text-sm font-medium text-foreground">Admin access</span>
          <p className="text-xs text-muted-foreground">
            Enter the 4-digit PIN to manage {destination.name}.
          </p>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && pin.length === 4 && handleVerify()}
            className="w-24 text-center text-lg tracking-[0.5em]"
            placeholder="••••"
          />
          {pinError && <p className="text-xs text-destructive">{pinError}</p>}
          <Button
            size="sm"
            disabled={pin.length !== 4 || verifying}
            onClick={handleVerify}
          >
            {verifying ? "Verifying..." : "Unlock"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>Admin unlocked</AlertTitle>
        <AlertDescription>Managing data for {destination.name}.</AlertDescription>
      </Alert>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Row counts
          </span>
          <div className="grid grid-cols-2 gap-2">
            {TABLES.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-muted px-2.5 py-1.5 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium text-foreground">
                  {countsLoading ? "…" : counts[key] ?? 0}
                </span>
              </div>
            ))}
          </div>
          <span className="pt-1 text-xs text-muted-foreground">
            Last updated: {new Date(destination.last_updated).toLocaleString()}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            AI itineraries
          </span>
          <Button
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            disabled={refreshing}
            onClick={handleRefreshItineraries}
          >
            <RotateCw className={refreshing ? "size-3.5 animate-spin" : "size-3.5"} />
            Refresh AI Itineraries
          </Button>
          {refreshResult && (
            <p className="text-xs text-muted-foreground">{refreshResult}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
