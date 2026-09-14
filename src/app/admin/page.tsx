"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Lock, Rocket, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [building, setBuilding] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  async function handleBuild() {
    if (!name.trim() || building) return;

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

      <Card>
        <CardContent className="flex flex-col gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dest-name">Destination name</Label>
            <Input
              id="dest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hampi"
              disabled={building}
            />
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
            disabled={!name.trim() || building}
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
    </div>
  );
}
