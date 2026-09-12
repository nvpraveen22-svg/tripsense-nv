// Curated, destination-specific facts that don't have a dedicated column in
// the schema (quick stats, notable photo spots). Keyed by destination slug —
// add an entry here as new destinations get this kind of editorial content.

export interface QuickStat {
  label: string;
  value: string;
  icon: "wildlife" | "forest" | "river" | "city";
}

export interface DestinationHighlights {
  quickStats: QuickStat[];
  photoSpots: string[];
}

export const DESTINATION_HIGHLIGHTS: Record<string, DestinationHighlights> = {
  dandeli: {
    quickStats: [
      { label: "Wildlife", value: "300+ bird species", icon: "wildlife" },
      { label: "Forest cover", value: "834 sq km", icon: "forest" },
      { label: "River", value: "Kali River", icon: "river" },
      { label: "Nearest city", value: "Hubli - 75km", icon: "city" },
    ],
    photoSpots: [
      "Syntheri Rocks",
      "Kali River Bridge",
      "Supa Dam",
      "Kavala Caves entrance",
    ],
  },
};
