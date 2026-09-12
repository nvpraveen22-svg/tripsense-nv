import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { useDestinationTable } from "@/hooks/use-destination-table";
import { TabState } from "@/components/tabs/tab-state";

interface MediaTabProps {
  destinationId: string;
}

export function MediaTab({ destinationId }: MediaTabProps) {
  const { data, loading, error } = useDestinationTable("media", destinationId);

  return (
    <TabState
      loading={loading}
      error={error}
      empty={data.length === 0}
      emptyTitle="No media yet"
      emptyDescription="Photos and videos for this destination are coming soon."
      skeletonCount={6}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {data.map((item) => (
          <figure
            key={item.id}
            className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
          >
            <Image
              src={item.thumbnail_url ?? item.url}
              alt={item.caption ?? "Destination media"}
              fill
              sizes="(max-width: 480px) 50vw, 200px"
              className="object-cover"
            />
            {item.media_type === "video" && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                <PlayCircle className="size-8 text-white drop-shadow" />
              </span>
            )}
            {item.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-xs text-white">
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </TabState>
  );
}
