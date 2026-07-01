import type { RouteStatus } from "@/lib/types";

const STYLES: Record<RouteStatus, string> = {
  available: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  claimed: "bg-amber-50 text-amber-700 ring-amber-600/20",
  uploaded: "bg-sky-50 text-sky-700 ring-sky-600/20",
  done: "bg-stone-100 text-stone-500 ring-stone-500/20",
};

const LABELS: Record<RouteStatus, string> = {
  available: "Available",
  claimed: "Claimed",
  uploaded: "Uploaded",
  done: "Done",
};

export function StatusBadge({ status }: { status: RouteStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
