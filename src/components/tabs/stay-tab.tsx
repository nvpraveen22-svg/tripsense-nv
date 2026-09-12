import Image from "next/image";
import { Star } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";

interface StayTabProps {
  destinationId: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  budget: "Budget",
  mid_range: "Mid-range",
  luxury: "Luxury",
  homestay: "Homestay",
  resort: "Resort",
};

export function StayTab({ destinationId }: StayTabProps) {
  const { data, loading, error } = useDestinationTable("hotels", destinationId);

  return (
    <TabState
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyTitle="No stays listed yet"
      emptyDescription="We're curating places to stay for this destination."
    >
      <div className="flex flex-col gap-3">
        {data.map((hotel) => (
          <Card key={hotel.id} className="overflow-hidden">
            {hotel.image_url && (
              <div className="relative h-32 w-full bg-muted">
                <Image
                  src={hotel.image_url}
                  alt={hotel.name}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="flex flex-col gap-1.5 pt-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {hotel.name}
                </span>
                {hotel.rating != null && (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-accent-foreground">
                    <Star className="size-3 fill-current" />
                    {hotel.rating}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hotel.category && (
                  <Badge variant="secondary">
                    {CATEGORY_LABEL[hotel.category] ?? hotel.category}
                  </Badge>
                )}
                {(hotel.price_per_night_min != null ||
                  hotel.price_per_night_max != null) && (
                  <span className="text-xs font-medium text-foreground">
                    ₹{hotel.price_per_night_min ?? "—"}
                    {hotel.price_per_night_max != null &&
                      ` – ₹${hotel.price_per_night_max}`}{" "}
                    <span className="font-normal text-muted-foreground">
                      / night
                    </span>
                  </span>
                )}
              </div>
              {hotel.address && (
                <p className="text-xs text-muted-foreground">{hotel.address}</p>
              )}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {hotel.amenities.slice(0, 4).map((amenity) => (
                    <Badge key={amenity} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TabState>
  );
}
