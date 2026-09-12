// Curated YouTube video IDs per destination. No YouTube Data API key needed —
// these are static, hand-picked IDs (each verified to exist and be embeddable
// via YouTube's public oEmbed endpoint before being added here). Titles are
// the videos' real titles, not invented ones.
//
// Thumbnails are derived at render time via https://img.youtube.com/vi/{id}/...

export interface DestinationVideo {
  id: string;
  title: string;
}

export const DESTINATION_VIDEOS: Record<string, DestinationVideo[]> = {
  dandeli: [
    {
      id: "WIsETgk51g4",
      title: "Dandeli River Rafting Complete Details in Telugu Budget Trip",
    },
    {
      id: "gEhdG2ftcOM",
      title: "Dandeli Travel Vlog | Girls Trip to Dandeli",
    },
    {
      id: "eLydfFuVcio",
      title: "Dandeli Supa Dam | Kayaking | Travel Vlog | Things to do in Dandeli",
    },
  ],
  goa: [
    { id: "siGjArO1dVY", title: "Goa Vlog 2023 - Travelling To Goa With My Mom & Brother" },
    {
      id: "y2vAEIyFS6A",
      title: "Goa Vlog | Goa Trip | Best Tourist Places & Beaches to Visit in Goa",
    },
    { id: "kBc7G9das94", title: "North Goa Places To Visit | Goa Travel Guide | Hidden Places" },
  ],
  coorg: [
    { id: "W6oFD9PKsmQ", title: "Exploring Coorg | The Scotland of India | Complete Travel Vlog" },
    { id: "7uPD4cofnU8", title: "Coorg Travel Vlog 2023 Monsoon | South India Tour" },
    {
      id: "Qg2l6G_xnl0",
      title: "Coorg Vlog | Complete Travel Guide - Best Places to Visit in Coorg",
    },
  ],
  ooty: [
    { id: "-V8bNvnQUps", title: "Ooty - Complete Travel Guide with Cost | 3 Days / 2 Night Itinerary" },
    { id: "y0CGwjTvCao", title: "Ooty-Coonoor Travel Vlog - Toy Train, Tea Estates, Zipline & More" },
    { id: "u2qJGxrdA2g", title: "Ooty Trip Day-1 Vlog | Queen of Hills" },
  ],
  gokarna: [
    {
      id: "h_vX-teGlk4",
      title: "Om Beach Gokarna | Best Beach in Gokarna | Kudle & Paradise Beach Travel Vlog",
    },
    {
      id: "CxUJJ6tPwyg",
      title: "Gokarna Beach Trek Travel Vlog | Best Thing to Do in Gokarna | Hidden Beaches",
    },
    { id: "27-5GFN29Qw", title: "4 Day Trip To Gokarna | Complete Travel Guide | Gokarna Vlog" },
  ],
  kodaikanal: [
    {
      id: "8E5McRjpKz8",
      title: "Kodaikanal Local Secrets in Our Travel Vlog | Sightseeing & Travel Tips",
    },
    { id: "h2r6f6t2AMs", title: "Kodaikanal Tourist Places | Kodaikanal Trip | Tamil Travel Vlog" },
    { id: "k-rmJ-2NK4U", title: "Beautiful Kodaikanal Trip Day 1 Vlog" },
  ],
  araku: [
    {
      id: "b13OSzy6woo",
      title: "Exploring Araku Valley - Hidden Paradise of Andhra Pradesh | Travel Vlog",
    },
    {
      id: "yCjKuwiGWrE",
      title: "Araku Valley Travel Guide | Best & Unexplored Places in South India",
    },
    { id: "NWiBFTd5aD0", title: "Ultimate Araku Valley Travel Guide: Top Things to Do and See" },
  ],
  vizag: [
    {
      id: "4QePvC9FSY0",
      title: "Vizag Tour: Submarine Museum, RK Beach & Rishikonda Beach Full Travel Guide",
    },
    { id: "Cn2Gg4qPa-4", title: "Vizag Tour Plan Vlog | RK Beach Visakhapatnam | Sunset Views & Tourist Guide" },
    { id: "tQC7qjZDkoU", title: "Vizag Travel Guide | Vizag Itinerary | Vizag Tour Guide" },
  ],
  pondicherry: [
    {
      id: "p7TtHzyQA8o",
      title: "Pondicherry Travel Guide: Best Beaches, French Quarter, Temples & Hidden Gems",
    },
    { id: "1ISRFpzMs_4", title: "Pondicherry: Exploring French India | Solo India Travel Vlog" },
    {
      id: "1C8W5xcnzlA",
      title: "Explore the Amazing Must Visit Places in Pondicherry | Stay in Pondy",
    },
  ],
};
