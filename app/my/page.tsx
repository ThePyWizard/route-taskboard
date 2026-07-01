import { NavBar } from "@/components/NavBar";
import { RouteCard } from "@/components/RouteCard";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Route } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MyRoutesPage() {
  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data } = await admin
    .from("routes")
    .select("*")
    .eq("assigned_to", profile.id)
    .order("updated_at", { ascending: false });

  const routes = (data ?? []) as Route[];
  const active = routes.filter((r) => r.status !== "done");
  const done = routes.filter((r) => r.status === "done");

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">My routes</h1>

        {routes.length === 0 ? (
          <p className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center text-[var(--muted)]">
            You haven&apos;t claimed any routes yet. Head to{" "}
            <a href="/" className="text-[var(--accent)]">
              Browse
            </a>{" "}
            to pick one.
          </p>
        ) : (
          <>
            <h2 className="font-body mt-6 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
              In progress
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((r) => (
                <RouteCard key={r.id} route={r} />
              ))}
              {active.length === 0 && (
                <p className="text-sm text-[var(--muted)]">Nothing in progress.</p>
              )}
            </div>

            {done.length > 0 && (
              <>
                <h2 className="font-body mt-8 text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Completed
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {done.map((r) => (
                    <RouteCard key={r.id} route={r} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
