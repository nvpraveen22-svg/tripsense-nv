"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Destination } from "@/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OverviewTab } from "@/components/tabs/overview-tab";
import { AttractionsTab } from "@/components/tabs/attractions-tab";
import { TemplesTab } from "@/components/tabs/temples-tab";
import { HowToReachTab } from "@/components/tabs/how-to-reach-tab";
import { StayTab } from "@/components/tabs/stay-tab";
import { ActivitiesTab } from "@/components/tabs/activities-tab";
import { BudgetTab } from "@/components/tabs/budget-tab";
import { MediaTab } from "@/components/tabs/media-tab";
import { AiPlanTab } from "@/components/tabs/ai-plan-tab";
import { InsightsTab } from "@/components/tabs/insights-tab";
import { AdminTab } from "@/components/tabs/admin-tab";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "attractions", label: "Attractions" },
  { value: "temples", label: "Temples" },
  { value: "how-to-reach", label: "How to Reach" },
  { value: "stay", label: "Stay" },
  { value: "activities", label: "Activities" },
  { value: "budget", label: "Budget" },
  { value: "media", label: "Media" },
  { value: "ai-plan", label: "AI Plan" },
  { value: "insights", label: "Insights" },
  { value: "admin", label: "Admin" },
] as const;

interface DestinationPageProps {
  params: { slug: string };
  searchParams: { origin?: string };
}

export default function DestinationPage({
  params,
  searchParams,
}: DestinationPageProps) {
  const { slug } = params;
  const originCity = searchParams.origin || "Hyderabad";

  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDestination() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("destinations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (cancelled) return;

      if (fetchError) {
        setError("We couldn't load this destination. Please try again.");
      } else if (!data) {
        setError("This destination doesn't exist.");
      } else {
        setDestination(data);
      }
      setLoading(false);
    }

    loadDestination();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6">
        <Skeleton className="h-[280px] w-full rounded-2xl" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-6">
        <Link
          href="/"
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back home
        </Link>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-8">
      <section className="relative h-[280px] w-full overflow-hidden bg-gradient-to-br from-primary to-secondary">
        {(destination.hero_url ?? destination.cover_image_url) && (
          <Image
            src={destination.hero_url ?? destination.cover_image_url!}
            alt={destination.name}
            fill
            priority
            sizes="480px"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        <Link
          href="/"
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 px-4 pb-4">
          <div className="flex items-center gap-1 text-xs font-medium text-white/90">
            <MapPin className="size-3.5" />
            {destination.state}
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {destination.name}
          </h1>
          {destination.tagline && (
            <p className="text-sm text-white/85">{destination.tagline}</p>
          )}
        </div>
      </section>

      <Tabs defaultValue="overview" className="flex-1">
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
          <TabsList
            variant="line"
            className="h-auto w-full justify-start gap-0 overflow-x-auto px-2 py-1.5"
          >
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-none whitespace-nowrap px-3 py-1.5"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <TabsContent value="overview">
            <OverviewTab destination={destination} />
          </TabsContent>
          <TabsContent value="attractions">
            <AttractionsTab destinationId={destination.id} />
          </TabsContent>
          <TabsContent value="temples">
            <TemplesTab destinationId={destination.id} />
          </TabsContent>
          <TabsContent value="how-to-reach">
            <HowToReachTab destination={destination} originCity={originCity} />
          </TabsContent>
          <TabsContent value="stay">
            <StayTab destinationId={destination.id} />
          </TabsContent>
          <TabsContent value="activities">
            <ActivitiesTab destinationId={destination.id} />
          </TabsContent>
          <TabsContent value="budget">
            <BudgetTab destination={destination} originCity={originCity} />
          </TabsContent>
          <TabsContent value="media">
            <MediaTab
              destinationId={destination.id}
              destinationName={destination.name}
              destinationSlug={destination.slug}
            />
          </TabsContent>
          <TabsContent value="ai-plan">
            <AiPlanTab
              destinationId={destination.id}
              destinationName={destination.name}
              originCity={originCity}
            />
          </TabsContent>
          <TabsContent value="insights">
            <InsightsTab destinationSlug={destination.slug} />
          </TabsContent>
          <TabsContent value="admin">
            <AdminTab destination={destination} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
