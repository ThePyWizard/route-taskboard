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

// An Instagram account with its own posting queue (supabase/migrations/002).
export interface SocialAccount {
  id: string;
  handle: string;
  display_name: string | null;
  platform: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

// A video uploaded via /api/uploads/* waiting to be posted on a SocialAccount.
export interface AccountPost {
  id: string;
  account_id: string;
  title: string | null;
  caption: string;
  video_key: string;
  video_bytes: number | null;
  uploaded_by: string | null;
  notes: string | null;
  posted: boolean;
  posted_at: string | null;
  posted_by: string | null;
  posted_by_name: string | null;
  created_at: string;
}
