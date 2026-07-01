import { NavBar } from "@/components/NavBar";
import { RouteCard } from "@/components/RouteCard";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Route } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data: available } = await admin
    .from("routes")
    .select("*")
    .eq("status", "available")
    .order("id");

  const { count: mineCount } = await admin
    .from("routes")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", profile.id)
    .in("status", ["claimed", "uploaded"]);

  const routes = (available ?? []) as Route[];

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Available routes</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Pick one, export the map animation in TravelAnimator, and upload it.
            </p>
          </div>
          <div className="text-right text-sm text-[var(--muted)]">
            <div className="font-display text-3xl font-semibold text-[var(--ink)]">
              {routes.length}
            </div>
            open
            {mineCount ? <div className="mt-1">· {mineCount} assigned to you</div> : null}
          </div>
        </div>

        {routes.length === 0 ? (
          <p className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center text-[var(--muted)]">
            No routes available right now. Check back after the next batch is added.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
