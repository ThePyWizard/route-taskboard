import { NavBar } from "@/components/NavBar";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isThisWeek, weekRangeLabel } from "@/lib/week";
import type { Profile, Route } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Standing {
  id: string;
  name: string;
  isAdmin: boolean;
  thisWeek: number;
  allTime: number;
  lastUpload: string | null;
}

export default async function LeaderboardPage() {
  const profile = await requireProfile();
  const admin = createAdminClient();

  const [{ data: profilesData }, { data: routesData }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: true }),
    admin.from("routes").select("*").not("uploaded_at", "is", null),
  ]);

  const profiles = (profilesData ?? []) as Profile[];
  const uploads = (routesData ?? []) as Route[];

  // Tally uploads per profile (a "video created" = a route with uploaded_at set,
  // attributed to whoever it was assigned to).
  const weekCount = new Map<string, number>();
  const allCount = new Map<string, number>();
  const last = new Map<string, string>();
  for (const r of uploads) {
    const who = r.assigned_to;
    if (!who) continue;
    allCount.set(who, (allCount.get(who) ?? 0) + 1);
    if (r.uploaded_at && isThisWeek(r.uploaded_at)) {
      weekCount.set(who, (weekCount.get(who) ?? 0) + 1);
    }
    if (r.uploaded_at && (!last.get(who) || r.uploaded_at > last.get(who)!)) {
      last.set(who, r.uploaded_at);
    }
  }

  // Roster is the employees expected to hit the weekly quota. The admin
  // researches/imports routes rather than creating videos, so exclude admins to
  // avoid flagging them as "missing" every single week.
  const roster: Standing[] = profiles
    .filter((p) => !p.is_admin)
    .map((p) => ({
      id: p.id,
      name: p.name,
      isAdmin: p.is_admin,
      thisWeek: weekCount.get(p.id) ?? 0,
      allTime: allCount.get(p.id) ?? 0,
      lastUpload: last.get(p.id) ?? null,
    }));

  const missing = roster
    .filter((s) => s.thisWeek === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const ranked = [...roster].sort(
    (a, b) =>
      b.thisWeek - a.thisWeek ||
      b.allTime - a.allTime ||
      a.name.localeCompare(b.name)
  );

  const done = roster.length - missing.length;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">Weekly leaderboard</h1>
          <span className="text-sm text-[var(--muted)]">
            Week of <b className="text-[var(--ink)]">{weekRangeLabel()}</b>
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Everyone posts at least one video each week — the week resets on
          Tuesday.
        </p>

        {/* --- The highlight: who still owes a video this week --- */}
        {roster.length === 0 ? (
          <p className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6 text-center text-[var(--muted)]">
            No employees have joined yet.
          </p>
        ) : missing.length === 0 ? (
          <div className="mt-6 rounded-xl border border-[var(--maps)]/30 bg-[var(--maps)]/5 p-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <h2 className="text-[var(--maps-ink)]">Everyone&apos;s in!</h2>
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              All {roster.length} employees have posted a video this week. 🎉
            </p>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h2 className="text-[var(--accent-ink)]">
                  Haven&apos;t posted this week
                </h2>
              </div>
              <span className="text-sm font-medium text-[var(--accent-ink)]">
                {missing.length} of {roster.length} still to go
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {missing.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--panel)] px-3 py-1.5 text-sm font-medium text-[var(--ink)]"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)]/10 text-xs font-bold text-[var(--accent)]">
                    {s.name.charAt(0).toUpperCase()}
                  </span>
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* --- Full standings --- */}
        {roster.length > 0 && (
          <>
            <div className="mt-8 flex items-center gap-3">
              <h2 className="font-body text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">
                Standings
              </h2>
              <span className="text-xs text-[var(--muted)]">
                {done}/{roster.length} on track
              </span>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            <ol className="mt-3 space-y-2">
              {ranked.map((s, i) => {
                const owes = s.thisWeek === 0;
                const rank = medals[i] ?? `#${i + 1}`;
                return (
                  <li
                    key={s.id}
                    className={`flex items-center gap-4 rounded-xl border bg-[var(--panel)] p-4 ${
                      owes
                        ? "border-[var(--accent)]/30"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <span className="w-8 shrink-0 text-center text-lg font-bold text-[var(--muted)]">
                      {rank}
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-[var(--ink)]">
                        {s.name}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {owes ? (
                          <span className="text-[var(--accent-ink)]">
                            No video yet this week
                          </span>
                        ) : (
                          `${s.allTime} all-time`
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-2xl font-bold ${
                          owes ? "text-[var(--accent)]" : "text-[var(--ink)]"
                        }`}
                      >
                        {s.thisWeek}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                        this week
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
