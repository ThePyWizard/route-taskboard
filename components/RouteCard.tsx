import Link from "next/link";
import type { Route } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

export function RouteCard({ route }: { route: Route }) {
  return (
    <Link
      href={`/routes/${route.id}`}
      className="group block rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-display text-xs text-[var(--muted)]">
          No. {route.id}
        </span>
        <StatusBadge status={route.status} />
      </div>

      <h3 className="font-display mt-2 text-lg font-semibold leading-snug text-[var(--ink)]">
        {route.title}
      </h3>

      <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
        <span>{route.origin}</span>
        <span className="text-[var(--accent)]">→</span>
        <span>{route.destination}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted)]">
        {route.total_distance != null && (
          <span className="font-medium">{route.total_distance} mi</span>
        )}
        {route.script_duration_seconds != null && (
          <span>{route.script_duration_seconds}s script</span>
        )}
        {route.assigned_to_name && route.status !== "available" && (
          <span className="ml-auto rounded-full bg-[var(--panel-2)] px-2 py-0.5">
            {route.assigned_to_name}
          </span>
        )}
      </div>
    </Link>
  );
}
