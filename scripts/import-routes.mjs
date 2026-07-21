// Bulk-import routes from a routes.json (the mapsoftheworldroutes format)
// into the Supabase `routes` table. Existing rows (same id) are updated but
// their assignment/status is preserved.
//
// Usage:
//   node scripts/import-routes.mjs [path-to-routes.json]
// Defaults to ./data/routes.json
//
// Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const file = process.argv[2] ?? "./data/routes.json";
const source = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(source)) {
  console.error(`${file} must contain a JSON array of routes.`);
  process.exit(1);
}

const rows = source.map((r) => ({
  id: r.id,
  title: r.title,
  subtitle: r.subtitle ?? null,
  origin: r.origin,
  destination: r.destination,
  waypoints: r.waypoints ?? [],
  script: r.script ?? null,
  google_maps_url: r.googleMapsUrl ?? null,
  why_trending: r.whyTrending ?? null,
  script_duration_seconds: r.scriptDurationSeconds ?? null,
  total_distance: r.totalDistance ?? null,
  caption_style: r.captionStyle ?? null,
  description: r.description ?? null,
  // status / assignment columns are intentionally omitted so upsert does not
  // clobber routes that employees have already claimed or uploaded.
}));

const supabase = createClient(url, key, { auth: { persistSession: false } });

const { error, count } = await supabase
  .from("routes")
  .upsert(rows, { onConflict: "id", ignoreDuplicates: false, count: "exact" });

if (error) {
  console.error("Import failed:", error.message);
  process.exit(1);
}
console.log(`Imported/updated ${count ?? rows.length} routes from ${file}.`);
