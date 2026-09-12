import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TabStateProps {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonCount?: number;
  children: ReactNode;
}

export function TabState({
  loading,
  error,
  empty,
  emptyTitle = "Nothing here yet",
  emptyDescription = "We're still gathering this information.",
  skeletonCount = 3,
  children,
}: TabStateProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (empty) {
    return (
      <Alert>
        <AlertTitle>{emptyTitle}</AlertTitle>
        <AlertDescription>{emptyDescription}</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
