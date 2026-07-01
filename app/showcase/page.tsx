import { NavBar } from "@/components/NavBar";
import { StatusBadge } from "@/components/StatusBadge";
import { VideoPreview } from "@/components/VideoPreview";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { dayLabel, timeLabel } from "@/lib/format";
import type { Route } from "@/lib/types";

export const dynamic = "force-dynamic";

// A read-only feed of everyone's finished work — the community counterpart to the
// admin dashboard. No downloads or admin controls: employees can watch each
// other's exports (preview) and see who has contributed what.
export default async function ShowcasePage() {
  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data } = await admin
    .from("routes")
    .select("*")
    .in("status", ["uploaded", "done"])
    .order("uploaded_at", { ascending: false });

  const uploads = ((data ?? []) as Route[])
    .filter((r) => r.uploaded_at)
    .sort((a, b) => b.uploaded_at!.localeCompare(a.uploaded_at!));

  // Group by day.
  const groups: { date: string; items: Route[] }[] = [];
  for (const r of uploads) {
    const label = dayLabel(r.uploaded_at!);
    const g = groups.find((x) => x.date === label);
    if (g) g.items.push(r);
    else groups.push({ date: label, items: [r] });
  }

  // Per-person tally.
  const tally = new Map<string, number>();
  for (const r of uploads) {
    const who = r.assigned_to_name ?? r.assigned_to_email ?? "Unknown";
    tally.set(who, (tally.get(who) ?? 0) + 1);
  }
  const contributors = [...tally.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Showcase</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Exports the team has uploaded. Tap preview to watch anyone&apos;s map
          animation.
        </p>

        {contributors.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {contributors.map((c) => (
              <span
                key={c.name}
                className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-xs"
              >
                {c.name} · <b>{c.count}</b>
              </span>
            ))}
          </div>
        )}

        {groups.length === 0 ? (
          <p className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6 text-center text-sm text-[var(--muted)]">
            No exports yet. Be the first to claim a route and upload one!
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((g) => (
              <div key={g.date}>
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold">{g.date}</h2>
                  <span className="text-xs text-[var(--muted)]">
                    {g.items.length} upload{g.items.length === 1 ? "" : "s"}
                  </span>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <ul className="mt-3 space-y-2">
                  {g.items.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 text-sm"
                    >
                      <span className="w-12 shrink-0 text-xs text-[var(--muted)]">
                        {r.uploaded_at ? timeLabel(r.uploaded_at) : ""}
                      </span>
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)]/10 text-xs font-bold text-[var(--accent)]">
                        {(r.assigned_to_name ?? "?").charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium">
                          {r.assigned_to_name ?? r.assigned_to_email ?? "Unknown"}
                        </div>
                        <div className="truncate text-xs text-[var(--muted)]">
                          #{r.id} {r.title}
                        </div>
                      </div>
                      <span className="ml-auto flex items-center gap-2">
                        <StatusBadge status={r.status} />
                        {r.video_path && (
                          <VideoPreview
                            path={r.video_path}
                            title={`#${r.id} ${r.title}`}
                          />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
