export type RouteStatus = "available" | "claimed" | "uploaded" | "done";

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Route {
  id: number;
  title: string;
  subtitle: string | null;
  origin: string;
  destination: string;
  waypoints: string[];
  script: string | null;
  google_maps_url: string | null;
  why_trending: string | null;
  script_duration_seconds: number | null;
  total_distance: number | null;
  caption_style: number | null;
  description: string | null;
  status: RouteStatus;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  assigned_at: string | null;
  video_path: string | null;
  uploaded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// A row in the `contents` posting queue (migrated from the standalone Logbook).
export interface Content {
  id: string;
  created_at: string;
  video_url: string;
  caption: string;
  posted: boolean;
  post_id: number | null;
}

// Shape of an entry in mapsoftheworldroutes/routes.json (camelCase source of truth).
export interface SourceRoute {
  id: number;
  title: string;
  subtitle?: string;
  origin: string;
  destination: string;
  waypoints?: string[];
  script?: string;
  googleMapsUrl?: string;
  whyTrending?: string;
  scriptDurationSeconds?: number;
  totalDistance?: number;
  captionStyle?: number;
  description?: string;
}
