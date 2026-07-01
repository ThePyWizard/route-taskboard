"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { DownloadButton } from "./DownloadButton";
import { adminMarkDone, adminReleaseRoute } from "@/app/actions";

export function AdminRow({ route }: { route: Route }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function markDone() {
    startTransition(async () => {
      const res = await adminMarkDone(route.id);
      if (res?.error) alert(res.error);
      router.refresh();
    });
  }

  function release() {
    if (!confirm(`Release route #${route.id} back to the pool?`)) return;
    startTransition(async () => {
      const res = await adminReleaseRoute(route.id);
      if (res?.error) alert(res.error);
      router.refresh();
    });
  }

  return (
    <tr className="border-b border-[var(--border)]">
      <td className="py-2 pr-2 text-[var(--muted)]">#{route.id}</td>
      <td className="py-2 pr-2">
        <div className="font-medium">{route.title}</div>
        <div className="text-xs text-[var(--muted)]">
          {route.assigned_to_name ?? route.assigned_to_email ?? "—"}
        </div>
      </td>
      <td className="py-2 pr-2">
        <StatusBadge status={route.status} />
      </td>
      <td className="py-2 pr-2 text-right">
        <div className="flex justify-end gap-2">
          {route.video_path && <DownloadButton path={route.video_path} />}
          {route.status === "uploaded" && (
            <button
              onClick={markDone}
              disabled={pending}
              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              Mark done
            </button>
          )}
          {route.status !== "available" && (
            <button
              onClick={release}
              disabled={pending}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:opacity-50"
            >
              Release
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
