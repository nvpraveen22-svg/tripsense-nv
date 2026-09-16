"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ImageIcon,
  Loader2,
  Lock,
  Rocket,
  ArrowRight,
  MapPin,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DestinationAutocomplete,
  type DestinationSuggestion,
} from "@/components/destination-autocomplete";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const STEPS = [
  "Generating data with AI...",
  "Creating destination...",
  "Adding attractions...",
  "Adding hotels...",
  "Adding activities...",
  "Adding how-to-reach info...",
  "Done!",
];

interface BuildResult {
  slug: string;
  destinationId: string;
  counts: {
    attractions: number;
    hotels: number;
    activities: number;
    howToReach: number;
    temples: number;
  };
}

interface SyncResult {
  synced: { photos: number; images: number; videos: number };
  skipped: number;
}

interface EnrichResult {
  enriched: { hotels: number; attractions: number; temples: number };
  skipped: number;
  noMatch: number;
  errors: number;
}

interface ManagedDestination {
  id: string;
  name: string;
  state: string;
  slug: string;
  is_active: boolean;
}

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [nameExists, setNameExists] = useState(false);
  const [building, setBuilding] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [enrichDestName, setEnrichDestName] = useState("");
  const [enrichDestSlug, setEnrichDestSlug] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<EnrichResult | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);

  const [destinations, setDestinations] = useState<ManagedDestination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [flashUpdatedId, setFlashUpdatedId] = useState<string | null>(null);
  const [fadingOutId, setFadingOutId] = useState<string | null>(null);

  async function loadDestinations() {
    setDestinationsLoading(true);
    setDestinationsError(null);
    const { data, error: fetchError } = await supabase
      .from("destinations")
      .select("id, name, state, slug, is_active")
      .order("name", { ascending: true });
    if (fetchError) {
      setDestinationsError("Couldn't load destinations.");
    } else {
      setDestinations(data ?? []);
    }
    setDestinationsLoading(false);
  }

  useEffect(() => {
    if (verified) {
      loadDestinations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]);

  async function handleToggleDestination(destination: ManagedDestination) {
    if (rowBusyId) return;
    setRowBusyId(destination.id);
    setDestinationsError(null);
    try {
      const res = await fetch("/api/admin/toggle-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          destinationId: destination.id,
          isActive: !destination.is_active,
        }),
      });
      const data = await res.json();
      if (res.ok && data.updated) {
        await loadDestinations();
        setFlashUpdatedId(destination.id);
        setTimeout(() => setFlashUpdatedId(null), 2000);
      } else {
        setDestinationsError(data.error ?? "Couldn't update destination.");
      }
    } catch {
      setDestinationsError("Couldn't update destination. Please try again.");
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleDeleteDestination(destination: ManagedDestination) {
    if (rowBusyId) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${destination.name}? All attractions, hotels, temples, media and itineraries will be lost. This cannot be undone.`
    );
    if (!confirmed) return;

    setRowBusyId(destination.id);
    setDestinationsError(null);
    try {
      const res = await fetch("/api/admin/delete-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          destinationId: destination.id,
          destinationSlug: destination.slug,
        }),
      });
      const data = await res.json();
      if (res.ok && data.deleted) {
        setFadingOutId(destination.id);
        setTimeout(() => {
          setDestinations((prev) => prev.filter((d) => d.id !== destination.id));
          setFadingOutId(null);
        }, 300);
      } else {
        setDestinationsError(data.error ?? "Couldn't delete destination.");
      }
    } catch {
      setDestinationsError("Couldn't delete destination. Please try again.");
    } finally {
      setRowBusyId(null);
    }
  }

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

  function handleNameChange(value: string) {
    setName(value);
    setNameExists(false);
  }

  function handleSelectExisting(destination: DestinationSuggestion) {
    setName(destination.name);
    setState(destination.state);
    setNameExists(true);
  }

  function handleSelectNew(value: string) {
    setName(value);
    setNameExists(false);
  }

  async function handleBuild() {
    if (!name.trim() || building || nameExists) return;

    setBuilding(true);
    setBuildError(null);
    setResult(null);
    setStepIndex(0);

    intervalRef.current = setInterval(() => {
      setStepIndex((i) => (i < STEPS.length - 2 ? i + 1 : i));
    }, 2000);

    try {
      const res = await fetch("/api/admin/build-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          name: name.trim(),
          state: state.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStepIndex(STEPS.length - 1);
        setResult(data);
      } else {
        setBuildError(data.error ?? "Something went wrong.");
      }
    } catch {
      setBuildError("Something went wrong. Please try again.");
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setBuilding(false);
    }
  }

  async function handleSyncMedia() {
    if (syncing) return;
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/sync-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.synced) {
        setSyncResult(data);
      } else {
        setSyncError(data.error ?? "Something went wrong.");
      }
    } catch {
      setSyncError("Something went wrong. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  function handleEnrichDestNameChange(value: string) {
    setEnrichDestName(value);
    setEnrichDestSlug(null);
  }

  async function handleEnrichPlaces() {
    if (enriching) return;
    setEnriching(true);
    setEnrichError(null);
    setEnrichResult(null);
    try {
      const res = await fetch("/api/admin/enrich-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin,
          type: "all",
          destinationSlug: enrichDestSlug ?? undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.enriched) {
        setEnrichResult(data);
      } else {
        setEnrichError(data.error ?? "Something went wrong.");
      }
    } catch {
      setEnrichError("Something went wrong. Please try again.");
    } finally {
      setEnriching(false);
    }
  }

  if (!verified) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-4 px-4">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Lock className="size-5" />
            </span>
            <span className="text-sm font-medium text-foreground">Admin access</span>
            <p className="text-xs text-muted-foreground">
              Enter the admin PIN to build a new destination.
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
            <Button size="sm" disabled={pin.length !== 4 || verifying} onClick={handleVerify}>
              {verifying ? "Verifying..." : "Unlock"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-4 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">AI Destination Builder</h1>
        <p className="text-sm text-muted-foreground">
          Generate a complete destination guide — attractions, hotels, activities, and
          how-to-reach info — with one click.
        </p>
      </div>

      <Card className="overflow-visible">
        <CardContent className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dest-name">Destination name</Label>
            <DestinationAutocomplete
              id="dest-name"
              value={name}
              onChange={handleNameChange}
              onSelectExisting={handleSelectExisting}
              onSelectNew={handleSelectNew}
              placeholder="e.g. Hampi"
              disabled={building}
            />
            {nameExists && (
              <Badge className="w-fit gap-1 border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                Already exists ✓
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dest-state">State (optional — AI will infer)</Label>
            <Input
              id="dest-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g. Karnataka"
              disabled={building}
            />
          </div>
          <Button
            onClick={handleBuild}
            disabled={!name.trim() || building || nameExists}
            className="gap-1.5"
          >
            {building ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
            Build with AI
          </Button>
        </CardContent>
      </Card>

      {building && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-1">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2 text-sm">
                {i < stepIndex ? (
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                ) : i === stepIndex ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    i <= stepIndex ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {buildError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t build destination</AlertTitle>
          <AlertDescription>{buildError}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>{name} is live</AlertTitle>
          <AlertDescription className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{result.counts.attractions} attractions</Badge>
              <Badge variant="secondary">{result.counts.hotels} hotels</Badge>
              <Badge variant="secondary">{result.counts.activities} activities</Badge>
              <Badge variant="secondary">{result.counts.howToReach} how-to-reach</Badge>
              <Badge variant="secondary">{result.counts.temples} temples</Badge>
            </div>
            <Link
              href={`/destination/${result.slug}`}
              className="flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View {name} live
              <ArrowRight className="size-3.5" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1 pt-2">
        <h2 className="text-base font-semibold text-foreground">Sync Photos & Videos</h2>
        <p className="text-sm text-muted-foreground">
          Backfill missing destination photos and media (images/videos) from Unsplash and
          YouTube for any destination that&apos;s missing them.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-1">
          <Button
            variant="outline"
            onClick={handleSyncMedia}
            disabled={syncing}
            className="gap-1.5"
          >
            {syncing ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
            🖼️ Sync Photos & Videos
          </Button>
          {syncing && (
            <p className="text-xs text-muted-foreground">
              Syncing destinations with missing media...
            </p>
          )}
        </CardContent>
      </Card>

      {syncError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t sync media</AlertTitle>
          <AlertDescription>{syncError}</AlertDescription>
        </Alert>
      )}

      {syncResult && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>Synced</AlertTitle>
          <AlertDescription className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{syncResult.synced.photos} destination photos</Badge>
            <Badge variant="secondary">{syncResult.synced.images} images</Badge>
            <Badge variant="secondary">{syncResult.synced.videos} videos</Badge>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1 pt-2">
        <h2 className="text-base font-semibold text-foreground">
          📍 Google Places Enrichment
        </h2>
        <p className="text-sm text-muted-foreground">
          Updates hotel ratings, phone numbers, and websites, plus real ratings for
          attractions and temples, from Google.
        </p>
      </div>

      <Card className="overflow-visible">
        <CardContent className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="enrich-dest-name">
              Destination filter (optional — leave blank for all)
            </Label>
            <DestinationAutocomplete
              id="enrich-dest-name"
              value={enrichDestName}
              onChange={handleEnrichDestNameChange}
              onSelectExisting={(destination) => {
                setEnrichDestName(destination.name);
                setEnrichDestSlug(destination.slug);
              }}
              onSelectNew={(value) => {
                setEnrichDestName(value);
                setEnrichDestSlug(null);
              }}
              placeholder="e.g. Chirala"
              disabled={enriching}
            />
          </div>
          <Button
            variant="outline"
            onClick={handleEnrichPlaces}
            disabled={enriching}
            className="gap-1.5"
          >
            {enriching ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
            {enrichDestSlug ? `Enrich ${enrichDestName}` : "Enrich All Destinations"}
          </Button>
          {enriching && (
            <p className="text-xs text-muted-foreground">
              Looking up Google Places data — this can take a minute...
            </p>
          )}
        </CardContent>
      </Card>

      {enrichError && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t enrich places</AlertTitle>
          <AlertDescription>{enrichError}</AlertDescription>
        </Alert>
      )}

      {enrichResult && (
        <Alert>
          <CheckCircle2 className="size-4" />
          <AlertTitle>
            Enriched {enrichResult.enriched.hotels} hotels, {enrichResult.enriched.attractions}{" "}
            attractions, {enrichResult.enriched.temples} temples
          </AlertTitle>
          <AlertDescription className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{enrichResult.skipped} skipped (recently enriched)</Badge>
            {enrichResult.noMatch > 0 && (
              <Badge variant="secondary">{enrichResult.noMatch} no Google match</Badge>
            )}
            {enrichResult.errors > 0 && (
              <Badge variant="destructive">{enrichResult.errors} errors</Badge>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1 pt-2">
        <h2 className="text-base font-semibold text-foreground">📋 Manage Destinations</h2>
        <p className="text-sm text-muted-foreground">
          Activate, deactivate, or permanently delete destinations. Inactive destinations are
          hidden from the public site but kept in the database.
        </p>
      </div>

      <Card className="w-full rounded-xl bg-background shadow-sm">
        <CardContent className="flex flex-col gap-1 pt-1">
          {destinationsLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading destinations...
            </div>
          ) : (
            <>
              <p className="pb-2 text-xs font-medium text-muted-foreground">
                {destinations.filter((d) => d.is_active).length} active ·{" "}
                {destinations.filter((d) => !d.is_active).length} inactive
              </p>
              {destinations.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">No destinations yet.</p>
              ) : (
                destinations.map((destination) => (
                  <div
                    key={destination.id}
                    className={cn(
                      "flex flex-wrap items-center gap-2 border-b border-border py-2.5 last:border-b-0 transition-opacity duration-300",
                      !destination.is_active && "opacity-60",
                      fadingOutId === destination.id && "opacity-0"
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {destination.name}
                        <span className="text-muted-foreground"> — {destination.state}</span>
                      </span>
                    </div>

                    {destination.is_active ? (
                      <Badge className="gap-1 border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400">
                        ● Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        ● Inactive
                      </Badge>
                    )}

                    {flashUpdatedId === destination.id && (
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        ✓ Updated
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      {destination.is_active ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                          disabled={rowBusyId === destination.id}
                          onClick={() => handleToggleDestination(destination)}
                        >
                          <Pause className="size-3" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          disabled={rowBusyId === destination.id}
                          onClick={() => handleToggleDestination(destination)}
                        >
                          <Play className="size-3" />
                          Activate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 px-2 text-xs border-destructive text-destructive hover:bg-destructive/10"
                        disabled={rowBusyId === destination.id}
                        onClick={() => handleDeleteDestination(destination)}
                      >
                        {rowBusyId === destination.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Trash2 className="size-3" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </CardContent>
      </Card>

      {destinationsError && (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{destinationsError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
