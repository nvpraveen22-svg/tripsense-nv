"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  Loader2,
  PartyPopper,
  RotateCw,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { daysAgoLabel } from "@/lib/format-time";
import type { AiSeasonalContent, SeasonalRecommendation } from "@/types";

interface SeasonalSnapshotProps {
  destinationSlug: string;
}

const RECOMMENDATION_LABEL: Record<SeasonalRecommendation, string> = {
  go_now: "Go now",
  wait: "Wait for a better window",
  book_ahead: "Good time — book ahead",
};

const RECOMMENDATION_STYLE: Record<SeasonalRecommendation, string> = {
  go_now: "bg-emerald-500 text-white",
  wait: "bg-red-500 text-white",
  book_ahead: "bg-amber-400 text-amber-950",
};

export function SeasonalSnapshot({ destinationSlug }: SeasonalSnapshotProps) {
  const [content, setContent] = useState<AiSeasonalContent | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-seasonal/${destinationSlug}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't generate the seasonal snapshot.");
      setContent(data.content);
      setGeneratedAt(data.generated_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/ai-seasonal/${destinationSlug}`);
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? "Couldn't load the seasonal snapshot.");
          setLoading(false);
          return;
        }

        if (data.exists) {
          setContent(data.content);
          setGeneratedAt(data.generated_at);
          setLoading(false);
        } else {
          // No cache yet - auto-generate on first load.
          setLoading(false);
          await generate();
        }
      } catch {
        if (!cancelled) {
          setError("Couldn't load the seasonal snapshot.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationSlug]);

  const busy = loading || generating;

  return (
    <Card className="border-secondary/30 bg-secondary/5">
      <CardContent className="flex flex-col gap-3 pt-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-secondary">
            <Bot className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              AI Seasonal Snapshot
            </span>
          </div>
          {!loading && content && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={generating}
              onClick={generate}
            >
              <RotateCw className={cn("size-3.5", generating && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>

        {busy && !content ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" />
              Generating a fresh seasonal read...
            </div>
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : error && !content ? (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t load this</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error}</span>
              <Button variant="outline" size="sm" className="w-fit" onClick={generate}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : content ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Badge className={cn("w-fit", RECOMMENDATION_STYLE[content.recommendation])}>
                {RECOMMENDATION_LABEL[content.recommendation]}
              </Badge>
              <p className="text-sm leading-relaxed text-foreground">
                {content.recommendationReason}
              </p>
            </div>

            {content.upcomingEvents.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <PartyPopper className="size-3.5" />
                  Upcoming in the next 60 days
                </span>
                {content.upcomingEvents.map((event) => (
                  <div
                    key={event.name}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-foreground">{event.name}</span>
                    <span className="text-muted-foreground">{event.timing}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Lightbulb className="size-3.5" />
                Right now
              </span>
              <ul className="flex flex-col gap-1">
                {content.currentSeasonTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-1.5 text-xs text-foreground">
                    <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {content.openNow.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    Open now
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {content.openNow.map((item) => (
                      <Badge key={item} variant="outline" className="text-[10px]">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {content.closedNow.length > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                    <XCircle className="size-3.5" />
                    Closed / reduced
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {content.closedNow.map((item) => (
                      <Badge key={item} variant="outline" className="text-[10px]">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {generatedAt && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarClock className="size-3" />
                Last updated {daysAgoLabel(generatedAt)}
              </span>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
