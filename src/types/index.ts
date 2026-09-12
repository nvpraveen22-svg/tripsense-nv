// Core domain types for TripSense AI, mirroring the Supabase schema.

export interface Destination {
  id: string;
  name: string;
  slug: string;
  state: string;
  tagline: string | null;
  description: string | null;
  best_time_to_visit: string | null;
  ideal_trip_days_min: number | null;
  ideal_trip_days_max: number | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attraction {
  id: string;
  destination_id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  entry_fee: string | null;
  opening_hours: string | null;
  visit_duration_minutes: number | null;
  rating: number | null;
  display_order: number | null;
  created_at: string;
}

export interface Temple {
  id: string;
  destination_id: string;
  name: string;
  deity: string | null;
  description: string | null;
  image_url: string | null;
  significance: string | null;
  timings: string | null;
  dress_code: string | null;
  best_time_to_visit: string | null;
  latitude: number | null;
  longitude: number | null;
  display_order: number | null;
  created_at: string;
}

export type TransportMode = "flight" | "train" | "bus" | "car" | "ferry";

export interface HowToReach {
  id: string;
  destination_id: string;
  mode: TransportMode;
  title: string;
  description: string | null;
  nearest_hub: string | null;
  distance_km: number | null;
  estimated_duration: string | null;
  estimated_cost: string | null;
  display_order: number | null;
  created_at: string;
}

export type HotelCategory = "budget" | "mid_range" | "luxury" | "homestay" | "resort";

export interface Hotel {
  id: string;
  destination_id: string;
  name: string;
  category: HotelCategory | null;
  description: string | null;
  image_url: string | null;
  price_per_night_min: number | null;
  price_per_night_max: number | null;
  rating: number | null;
  address: string | null;
  amenities: string[] | null;
  booking_url: string | null;
  display_order: number | null;
  created_at: string;
}

export interface Activity {
  id: string;
  destination_id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  duration: string | null;
  price_range: string | null;
  difficulty_level: string | null;
  display_order: number | null;
  created_at: string;
}

export type MediaType = "image" | "video";

export interface Media {
  id: string;
  destination_id: string;
  media_type: MediaType;
  url: string;
  thumbnail_url: string | null;
  caption: string | null;
  credit: string | null;
  display_order: number | null;
  created_at: string;
}

export interface AiItinerary {
  id: string;
  destination_id: string;
  origin_city: string | null;
  trip_days: number | null;
  travelers_count: number | null;
  budget_level: string | null;
  itinerary_json: Record<string, unknown> | null;
  generated_at: string;
  created_at: string;
}

export interface TollRoute {
  id: string;
  destination_id: string;
  origin_city: string;
  route_name: string | null;
  distance_km: number | null;
  toll_cost: number | null;
  vehicle_type: string | null;
  created_at: string;
}

interface TableDef<Row> {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
}

// Supabase generated-style Database type for typed client usage.
export interface Database {
  public: {
    Tables: {
      destinations: TableDef<Destination>;
      attractions: TableDef<Attraction>;
      temples: TableDef<Temple>;
      how_to_reach: TableDef<HowToReach>;
      hotels: TableDef<Hotel>;
      activities: TableDef<Activity>;
      media: TableDef<Media>;
      ai_itineraries: TableDef<AiItinerary>;
      toll_routes: TableDef<TollRoute>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
