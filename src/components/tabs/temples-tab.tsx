import Image from "next/image";
import { Clock, Shirt } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabState } from "@/components/tabs/tab-state";

interface TemplesTabProps {
  destinationId: string;
}

export function TemplesTab({ destinationId }: TemplesTabProps) {
  const { data, loading, error } = useDestinationTable("temples", destinationId);

  return (
    <TabState
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyTitle="No temples listed yet"
      emptyDescription="We're curating temple information for this destination."
    >
      <div className="flex flex-col gap-3">
        {data.map((temple) => (
          <Card key={temple.id} className="overflow-hidden">
            {temple.image_url && (
              <div className="relative h-32 w-full bg-muted">
                <Image
                  src={temple.image_url}
                  alt={temple.name}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
              </div>
            )}
            <CardContent className="flex flex-col gap-1.5 pt-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {temple.name}
                </span>
                {temple.deity && (
                  <Badge variant="secondary">{temple.deity}</Badge>
                )}
              </div>
              {temple.significance && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {temple.significance}
                </p>
              )}
              <div className="flex flex-wrap gap-3 pt-1 text-xs text-muted-foreground">
                {temple.timings && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {temple.timings}
                  </span>
                )}
                {temple.dress_code && (
                  <span className="flex items-center gap-1">
                    <Shirt className="size-3" />
                    {temple.dress_code}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TabState>
  );
}
