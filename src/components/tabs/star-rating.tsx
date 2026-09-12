import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  className?: string;
  showValue?: boolean;
}

export function StarRating({ value, className, showValue = true }: StarRatingProps) {
  const rounded = Math.round(value);
  return (
    <span className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < rounded ? "fill-primary text-primary" : "text-muted-foreground/30"
          )}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-xs font-medium text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}
