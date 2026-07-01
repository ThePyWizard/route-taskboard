import type { Route } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { DownloadButton } from "./DownloadButton";
import { timeLabel } from "@/lib/format";

export interface DayGroup {
  date: string;
  items: Route[];
}

export function ActivityPanel({
  groups,
  contributors,
  todayCount,
}: {
  groups: DayGroup[];
  contributors: { name: string; count: number }[];
  todayCount: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Upload activity</h2>
        <span className="text-sm text-[var(--muted)]">
          <b className="text-[var(--ink)]">{todayCount}</b> today
        </span>
      </div>

      {/* Per-person tally */}
      {contributors.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {contributors.map((c) => (
            <span
              key={c.name}
              className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs"
            >
              {c.name} · <b>{c.count}</b>
            </span>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--muted)]">No uploads yet.</p>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((g) => (
            <div key={g.date}>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold">{g.date}</h3>
                <span className="text-xs text-[var(--muted)]">
                  {g.items.length} upload{g.items.length === 1 ? "" : "s"}
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>
              <ul className="mt-2 space-y-1.5">
                {g.items.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
                  >
                    <span className="w-12 shrink-0 text-xs text-[var(--muted)]">
                      {r.uploaded_at ? timeLabel(r.uploaded_at) : ""}
                    </span>
                    <span className="font-medium">
                      {r.assigned_to_name ?? r.assigned_to_email ?? "Unknown"}
                    </span>
                    <span className="text-[var(--muted)]">
                      #{r.id} {r.title}
                    </span>
                    <span className="ml-auto flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {r.video_path && <DownloadButton path={r.video_path} />}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
