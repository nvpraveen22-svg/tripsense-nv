"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Compass,
  Lightbulb,
  Loader2,
  MinusCircle,
  RotateCw,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { AiInsightsContent, InsightActivityTag } from "@/types";

interface InsightsTabProps {
  destinationSlug: string;
}

function daysAgoLabel(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function ActivityTagList({
  items,
  emptyLabel,
}: {
  items: InsightActivityTag[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.name} className="rounded-lg bg-muted px-2.5 py-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{item.name}</span>
            {item.familyFriendly && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Family-friendly
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{item.reason}</p>
          {item.realPricing && (
            <p className="mt-1 text-xs text-accent-foreground">💰 {item.realPricing}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function InsightsTab({ destinationSlug }: InsightsTabProps) {
  const [content, setContent] = useState<AiInsightsContent | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ai-insights/${destinationSlug}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? "Couldn't load insights.");
        } else if (data.exists) {
          setContent(data.content);
          setGeneratedAt(data.generated_at);
        }
      } catch {
        if (!cancelled) setError("Couldn't load insights.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [destinationSlug]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-insights/${destinationSlug}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't generate insights.");
      }
      setContent(data.content);
      setGeneratedAt(data.generated_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="size-5" />
            </span>
            <span className="text-sm font-medium text-foreground">
              No AI insights yet
            </span>
            <p className="max-w-xs text-xs text-muted-foreground">
              Generate honest, research-backed insights on stays, activities, and
              practical warnings for this destination.
            </p>
            <Button className="mt-1 gap-1.5" disabled={generating} onClick={handleGenerate}>
              {generating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {generating ? "Generating..." : "Generate Insights"}
            </Button>
          </CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t generate insights</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {generatedAt && `Last updated ${daysAgoLabel(generatedAt)}`}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={generating}
          onClick={handleGenerate}
        >
          <RotateCw className={cn("size-3.5", generating && "animate-spin")} />
          {generating ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t refresh insights</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {content.stayRecommendations.length > 0 && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-primary">
              <BedDouble className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Stay recommendations
              </span>
            </div>
            {content.stayRecommendations.map((hotel) => (
              <div key={hotel.name} className="flex flex-col gap-1 border-t border-border pt-3 first:border-0 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{hotel.name}</span>
                  {hotel.bookInAdvance && (
                    <Badge variant="destructive" className="shrink-0 text-[10px]">
                      Book ahead
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{hotel.verdict}</p>
                <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    {hotel.pros.map((pro) => (
                      <span key={pro} className="flex items-start gap-1.5 text-xs text-foreground">
                        <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-500" />
                        {pro}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    {hotel.cons.map((con) => (
                      <span key={con} className="flex items-start gap-1.5 text-xs text-foreground">
                        <XCircle className="mt-0.5 size-3 shrink-0 text-red-500" />
                        {con}
                      </span>
                    ))}
                  </div>
                </div>
                {hotel.bookInAdvanceNote && (
                  <p className="rounded-lg bg-accent px-2 py-1.5 text-xs text-accent-foreground">
                    ⏰ {hotel.bookInAdvanceNote}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-primary">
            <Compass className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Activities</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              Must-do
            </span>
            <ActivityTagList items={content.activities.mustDo} emptyLabel="Nothing flagged." />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <MinusCircle className="size-3.5" />
              Optional
            </span>
            <ActivityTagList items={content.activities.optional} emptyLabel="Nothing flagged." />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
              <XCircle className="size-3.5" />
              Skip
            </span>
            <ActivityTagList items={content.activities.skip} emptyLabel="Nothing flagged." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-primary">
            <AlertTriangle className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Practical warnings
            </span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {content.practicalWarnings.map((warning) => (
              <li key={warning} className="flex items-start gap-1.5 text-xs text-foreground">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                {warning}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-primary">
            <Wallet className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Budget reality check
            </span>
          </div>
          <Badge
            variant={content.budgetRealityCheck.realistic ? "secondary" : "destructive"}
            className="w-fit"
          >
            {content.budgetRealityCheck.realistic ? "Realistic" : "Often underestimated"}
          </Badge>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {content.budgetRealityCheck.verdict}
          </p>
          {content.budgetRealityCheck.costSpikes.length > 0 && (
            <div className="flex flex-col gap-1 pt-1">
              <span className="text-xs font-medium text-foreground">
                Where costs spike:
              </span>
              <ul className="flex flex-col gap-1">
                {content.budgetRealityCheck.costSpikes.map((spike) => (
                  <li key={spike} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                    {spike}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-primary">
            <Lightbulb className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Local tips</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {content.localTips.map((tip) => (
              <li key={tip} className="flex items-start gap-1.5 text-xs text-foreground">
                <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
