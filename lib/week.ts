// The weekly video quota is Tuesday-anchored: every employee should upload at
// least one video per week, and the week resets on Tuesday. These helpers use
// the server's timezone (your machine in dev, UTC on Vercel) — good enough for a
// weekly cadence.

const TUESDAY = 2; // JS getDay(): Sun=0 … Tue=2 … Sat=6

// Most recent Tuesday 00:00 on or before `now` — the start of the current week.
export function weekStart(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const daysSinceTue = (d.getDay() - TUESDAY + 7) % 7;
  d.setDate(d.getDate() - daysSinceTue);
  return d;
}

// Exclusive end of the current week (next Tuesday 00:00).
export function weekEnd(now: Date = new Date()): Date {
  const end = weekStart(now);
  end.setDate(end.getDate() + 7);
  return end;
}

// True if `iso` falls within the current Tuesday→Monday week.
export function isThisWeek(iso: string, now: Date = new Date()): boolean {
  const t = new Date(iso).getTime();
  return t >= weekStart(now).getTime() && t < weekEnd(now).getTime();
}

// e.g. "Jul 7 – Jul 13" (inclusive last day = the Monday before reset).
export function weekRangeLabel(now: Date = new Date()): string {
  const start = weekStart(now);
  const lastDay = weekEnd(now);
  lastDay.setDate(lastDay.getDate() - 1);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(lastDay)}`;
}
