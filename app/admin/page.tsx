import { redirect } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { AdminRow } from "@/components/AdminRow";
import { ImportPanel } from "@/components/ImportPanel";
import { ActivityPanel, type DayGroup } from "@/components/ActivityPanel";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { dayLabel } from "@/lib/format";
import type { Route, RouteStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const ORDER: Record<RouteStatus, number> = {
  uploaded: 0,
  claimed: 1,
  available: 2,
  done: 3,
};

export default async function AdminPage() {
  const profile = await requireProfile();
  if (!profile.is_admin) redirect("/");

  const admin = createAdminClient();
  const { data } = await admin.from("routes").select("*").order("id");
  const routes = ((data ?? []) as Route[]).sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || a.id - b.id
  );

  const counts = routes.reduce(
    (acc, r) => ((acc[r.status] = (acc[r.status] ?? 0) + 1), acc),
    {} as Record<RouteStatus, number>
  );

  // --- Upload activity (routes that have been uploaded, newest first) ---
  const uploads = routes
    .filter((r) => r.uploaded_at)
    .sort((a, b) => b.uploaded_at!.localeCompare(a.uploaded_at!));

  const groups: DayGroup[] = [];
  for (const r of uploads) {
    const label = dayLabel(r.uploaded_at!);
    const g = groups.find((x) => x.date === label);
    if (g) g.items.push(r);
    else groups.push({ date: label, items: [r] });
  }

  const tally = new Map<string, number>();
  for (const r of uploads) {
    const who = r.assigned_to_name ?? r.assigned_to_email ?? "Unknown";
    tally.set(who, (tally.get(who) ?? 0) + 1);
  }
  const contributors = [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const todayLabel = dayLabel(new Date().toISOString());
  const todayCount = groups.find((g) => g.date === todayLabel)?.items.length ?? 0;

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Admin</h1>

        <div className="mt-4 grid grid-cols-4 gap-3">
          {(["uploaded", "claimed", "available", "done"] as RouteStatus[]).map((s) => (
            <div
              key={s}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4"
            >
              <div className="text-2xl font-bold">{counts[s] ?? 0}</div>
              <div className="text-xs capitalize text-[var(--muted)]">{s}</div>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <ActivityPanel
            groups={groups}
            contributors={contributors}
            todayCount={todayCount}
          />
        </div>

        <div className="mt-6">
          <ImportPanel />
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Route / assignee</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <AdminRow key={r.id} route={r} />
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
