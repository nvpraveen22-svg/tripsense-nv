import type { ReactNode } from "react";
import { RotateCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface TabStateProps {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  skeletonCount?: number;
  onRetry?: () => void;
  children: ReactNode;
}

export function TabState({
  loading,
  error,
  empty,
  emptyTitle = "Nothing here yet",
  emptyDescription = "We're still gathering this information.",
  skeletonCount = 3,
  onRetry,
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
        <AlertDescription className="flex flex-col gap-2">
          <span>{error}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              className="w-fit gap-1.5"
              onClick={onRetry}
            >
              <RotateCw className="size-3.5" />
              Retry
            </Button>
          )}
        </AlertDescription>
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
