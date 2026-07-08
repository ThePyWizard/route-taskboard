import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Route } from "@/lib/types";

export const dynamic = "force-dynamic";

// Public endpoint consumed by the `motwr` CLI (../ other project) as its `-job`
// URL. It maps a route row to the job JSON shape motwr expects:
//   { title, subtitle, script, vehicle }
// No profile cookie is required (see middleware) — the CLI fetches it directly.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Accept both /jobs/123 and /jobs/123.json (motwr's examples use .json).
  const routeId = Number(id.replace(/\.json$/, ""));
  if (!Number.isInteger(routeId)) {
    return NextResponse.json({ error: "invalid job id" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("routes")
    .select("*")
    .eq("id", routeId)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }
  const route = data as Route;

  const job = {
    title: route.title,
    // Prefer the authored subtitle; fall back to distance, then origin→dest.
    subtitle:
      route.subtitle?.trim() ||
      (route.total_distance != null
        ? `${route.total_distance.toLocaleString("en-US")} mi`
        : `${route.origin} → ${route.destination}`),
    script: route.script ?? "",
    // No vehicle column: every route is a road trip, so default to "car".
    vehicle: "car",
  };

  return NextResponse.json(job, {
    // Small cache; the CLI reads this once per render.
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
