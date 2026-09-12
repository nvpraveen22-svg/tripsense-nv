"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Compass, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originCity, setOriginCity] = useState("Hyderabad");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDestinations() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("destinations")
        .select("*")
        .order("name", { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError("We couldn't load destinations. Please try again.");
        setDestinations([]);
      } else {
        setDestinations(data ?? []);
      }
      setLoading(false);
    }

    loadDestinations();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelect(slug: string) {
    setSelectedSlug(slug);
    const params = new URLSearchParams({ origin: originCity || "Hyderabad" });
    router.push(`/destination/${slug}?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MapPin className="size-5" strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="font-heading text-lg font-semibold leading-tight text-foreground">
              TripSense AI
            </h1>
            <p className="text-xs text-muted-foreground">
              Smart trip planning for India
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">
        <section className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-secondary">
            <Sparkles className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Plan your next journey
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Where do you want to go?
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a destination and we&apos;ll help you plan attractions, stays,
            and an AI-crafted itinerary.
          </p>
        </section>

        <Card>
          <CardContent className="flex flex-col gap-5 pt-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="origin-city">Origin city</Label>
              <Input
                id="origin-city"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                placeholder="Hyderabad"
                autoComplete="address-level2"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="destination-select">Destination</Label>
              {loading ? (
                <Skeleton className="h-9 w-full rounded-lg" />
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : destinations.length === 0 ? (
                <Alert>
                  <AlertTitle>No destinations yet</AlertTitle>
                  <AlertDescription>
                    Check back soon — we&apos;re adding destinations.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedSlug ?? undefined}
                  onValueChange={(value) => {
                    if (typeof value === "string") handleSelect(value);
                  }}
                >
                  <SelectTrigger id="destination-select" className="w-full">
                    <SelectValue placeholder="Choose a destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((destination) => (
                      <SelectItem key={destination.id} value={destination.slug}>
                        <div className="flex flex-col">
                          <span>{destination.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {destination.state}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {!loading && !error && destinations.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Compass className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Popular destinations
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {destinations.slice(0, 6).map((destination) => (
                <button
                  key={destination.id}
                  onClick={() => handleSelect(destination.slug)}
                  className="flex flex-col items-start gap-1 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-accent"
                >
                  <span className="text-sm font-medium text-foreground">
                    {destination.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {destination.state}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
