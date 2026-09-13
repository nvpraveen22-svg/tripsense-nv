// Curated YouTube video IDs per destination. No YouTube Data API key needed —
// these are static, hand-picked IDs (each verified to exist and be embeddable
// via YouTube's public oEmbed endpoint before being added here).
//
// Thumbnails are derived at render time via https://img.youtube.com/vi/{id}/...

export interface DestinationVideo {
  id: string;
  title: string;
  desc: string;
}

export const DESTINATION_VIDEOS: Record<string, DestinationVideo[]> = {
  dandeli: [
    {
      // Original id (VARwZYaWeKg) fails oEmbed verification (401, unembeddable) - swapped.
      id: "WIsETgk51g4",
      title: "Dandeli River Rafting Guide",
      desc: "Budget trip breakdown & rafting tips",
    },
    {
      id: "gEhdG2ftcOM",
      title: "Dandeli Girls Trip Honest Review",
      desc: "Real experience — what to expect",
    },
    {
      id: "uSyHWJUdLPc",
      title: "Top 10 Things to do in Dandeli",
      desc: "Tourist places & best rafting spots",
    },
  ],
  goa: [
    {
      id: "y2vAEIyFS6A",
      title: "Goa Best Tourist Places & Beaches",
      desc: "Complete Goa tour guide",
    },
    {
      // Original id (Q8FsTqhWU7A) fails oEmbed verification (401) - swapped.
      id: "siGjArO1dVY",
      title: "Goa Family Vlog",
      desc: "Real trip experience & tips",
    },
    {
      // Original id (aGF38lpeH0s) fails oEmbed verification (401) - swapped.
      id: "kBc7G9das94",
      title: "North Goa Hidden Places",
      desc: "Beyond the tourist trail",
    },
  ],
  gokarna: [
    {
      id: "ijRzKvri09E",
      title: "Gokarna — Hidden Gem Outside Goa",
      desc: "Why Gokarna beats Goa for peace",
    },
    {
      id: "27-5GFN29Qw",
      title: "4 Day Gokarna Complete Guide",
      desc: "All tourist places covered",
    },
    {
      id: "yp5yThfuBo4",
      title: "The Only Gokarna Vlog You Need",
      desc: "Best beaches & tips",
    },
  ],
  coorg: [
    {
      id: "te9Xkg0_72A",
      title: "Top 10 Places in Coorg",
      desc: "Madikeri travel guide",
    },
    {
      id: "xugkXYGT7uQ",
      title: "Mysore, Coorg & Ooty 8-Day Guide",
      desc: "Complete South India itinerary",
    },
    {
      id: "zCFJ2LRotoI",
      title: "Coorg-Ooty 5 Day Budget Itinerary",
      desc: "Complete travel guide with toy train",
    },
  ],
  ooty: [
    {
      id: "vQtNx8Kt1zI",
      title: "Ooty Mysore Coorg Tour Package",
      desc: "All tourist places covered",
    },
    {
      id: "UpWvHfHi-uU",
      title: "Ooty, Coonoor & Kodaikanal Guide",
      desc: "5-day South India trip from ₹12,850",
    },
    {
      id: "Vt2fKkjY9QA",
      title: "Ooty & Coonoor Complete Trip",
      desc: "Best places & budget tips in Hindi",
    },
  ],
  kodaikanal: [
    {
      id: "UpWvHfHi-uU",
      title: "Kodaikanal Complete Guide",
      desc: "5-day South India trip",
    },
    {
      id: "zCFJ2LRotoI",
      title: "Kodaikanal Budget Itinerary",
      desc: "Budget travel with best spots",
    },
    {
      id: "Vt2fKkjY9QA",
      title: "Hill Stations of South India",
      desc: "Ooty, Coonoor & Kodaikanal covered",
    },
  ],
  // Note: keyed "araku" (not "araku-valley") to match this app's actual
  // destinations.slug value - the other key would never match and silently
  // show zero videos for this destination.
  araku: [
    {
      id: "ttiK59Xd7SQ",
      title: "Araku Valley Complete Tour Plan",
      desc: "Borra Caves & Visakhapatnam to Araku",
    },
    {
      id: "iLmKjNdHNzw",
      title: "Araku Valley Vistadome Train Journey",
      desc: "Scenic train ride through Eastern Ghats",
    },
    {
      id: "rkx-Fo5hlNQ",
      title: "Vizag to Araku Road Trip",
      desc: "Borra Caves & Ananthagiri Coffee Garden",
    },
  ],
  vizag: [
    {
      id: "EHsTzpOBppk",
      title: "Visakhapatnam to Araku Train Journey",
      desc: "Borra Caves & Katiki Falls",
    },
    {
      id: "6N_pbNl0Kg8",
      title: "Vizag Road Trip — Araku Valley",
      desc: "Tribal Museum & Coffee Museum",
    },
    {
      id: "DV-Qqa23srY",
      title: "Exploring Vizag & Araku Valley",
      desc: "Borra Caves & scenic views",
    },
  ],
  pondicherry: [
    {
      id: "p7TtHzyQA8o",
      title: "Pondicherry Travel Guide 2024",
      desc: "Beaches, French Quarter & hidden gems",
    },
    {
      id: "1C8W5xcnzlA",
      title: "Must Visit Places in Pondicherry",
      desc: "Complete tourist vlog",
    },
    {
      // Original id (bmoffPZl-Ek) is actually titled "Gokarna Travel Vlog" -
      // wrong destination's video, swapped for a real Pondicherry one.
      id: "1ISRFpzMs_4",
      title: "Pondicherry Solo Travel Guide",
      desc: "Exploring French India",
    },
  ],
};
