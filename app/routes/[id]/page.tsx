import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { StatusBadge } from "@/components/StatusBadge";
import { ClaimButton } from "@/components/ClaimButton";
import { UploadWidget } from "@/components/UploadWidget";
import { CopyButton } from "@/components/CopyButton";
import { JobCommand } from "@/components/JobCommand";
import { ExportSpec } from "@/components/ExportSpec";
import { MapsButton } from "@/components/MapsButton";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Route } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RouteDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data } = await admin
    .from("routes")
    .select("*")
    .eq("id", Number(id))
    .maybeSingle();

  if (!data) notFound();
  const route = data as Route;

  // Absolute base URL for the public job JSON the motwr CLI fetches.
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  const jobUrl = `${proto}://${host}/jobs/${route.id}.json`;

  const mine = route.assigned_to === profile.id;
  const isAvailable = route.status === "available";
  const canUpload = mine && (route.status === "claimed" || route.status === "uploaded");

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
        >
          ← Back to routes
        </Link>

        {/* Header */}
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <div className="font-display text-sm text-[var(--muted)]">
              Route No. {route.id}
            </div>
            <h1 className="mt-1 text-4xl font-semibold leading-tight">
              {route.title}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[var(--muted)]">
              <span>{route.origin}</span>
              <span className="text-[var(--accent)]">→</span>
              <span>{route.destination}</span>
            </p>
          </div>
          <StatusBadge status={route.status} />
        </div>

        {/* Meta + prominent Maps CTA */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {route.google_maps_url && <MapsButton url={route.google_maps_url} />}
          {route.total_distance != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)]">
              📏 {route.total_distance} mi
            </span>
          )}
          {route.script_duration_seconds != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--text)]">
              🎙️ {route.script_duration_seconds}s voiceover
            </span>
          )}
        </div>

        {/* Status banners */}
        {route.status === "uploaded" && mine && (
          <p className="mt-5 rounded-xl border border-sky-600/20 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            ✓ Export uploaded. The editor will take it from here — thank you! You
            can replace it below if you need to.
          </p>
        )}
        {route.status === "done" && (
          <p className="mt-5 rounded-xl border border-stone-500/20 bg-stone-100 px-4 py-3 text-sm text-stone-600">
            This route has been rendered and completed.
          </p>
        )}
        {!isAvailable && !mine && route.status !== "done" && (
          <p className="mt-5 rounded-xl border border-amber-600/20 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Claimed by {route.assigned_to_name ?? route.assigned_to_email}.
          </p>
        )}

        {route.waypoints?.length > 0 && (
          <p className="mt-5 text-sm text-[var(--muted)]">
            <b className="text-[var(--ink)]">Waypoints:</b>{" "}
            {route.waypoints.join(" · ")}
          </p>
        )}

        {route.why_trending && (
          <p className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm text-[var(--text)]">
            <b className="text-[var(--ink)]">Why it&apos;s trending:</b>{" "}
            {route.why_trending}
          </p>
        )}

        {/* Claim (Take this route) — sits just above the voiceover script */}
        {isAvailable && (
          <section className="mt-7">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                  Take this route
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  It&apos;s yours until you upload or release it.
                </p>
              </div>
              <ClaimButton routeId={route.id} mode="claim" />
            </div>
          </section>
        )}

        {/* Voiceover script */}
        {route.script && (
          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Voiceover script</h2>
              <CopyButton text={route.script} label="Copy script" />
            </div>
            <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 text-[15px] leading-relaxed text-[var(--text)]">
              {route.script}
            </p>
          </section>
        )}

        {/* Finished-video render command (motwr CLI) — below the claim option */}
        <section className="mt-7">
          <JobCommand jobUrl={jobUrl} routeId={route.id} />
        </section>

        {/* Upload area */}
        {canUpload && (
          <section className="mt-8 space-y-4">
            <ExportSpec />
            <UploadWidget
              routeId={route.id}
              hasExisting={route.status === "uploaded"}
            />
            <div className="flex justify-end">
              <ClaimButton routeId={route.id} mode="release" />
            </div>
          </section>
        )}

        <div className="mt-10 border-t border-[var(--border)] pt-6">
          <Link
            href="/"
            className="text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            ← Back to routes
          </Link>
        </div>
      </main>
    </div>
  );
}
