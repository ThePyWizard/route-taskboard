"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimRoute, releaseRoute } from "@/app/actions";

export function ClaimButton({
  routeId,
  mode,
}: {
  routeId: number;
  mode: "claim" | "release";
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run() {
    startTransition(async () => {
      const res =
        mode === "claim"
          ? await claimRoute(routeId)
          : await releaseRoute(routeId);
      if (res?.error) {
        alert(res.error);
        router.refresh();
        return;
      }
      if (mode === "claim") router.push(`/routes/${routeId}`);
      else router.refresh();
    });
  }

  if (mode === "claim") {
    return (
      <button
        onClick={run}
        disabled={pending}
        className="rounded-xl bg-[var(--accent)] px-5 py-2.5 font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-ink)] hover:shadow-[var(--shadow-md)] disabled:opacity-60"
      >
        {pending ? "Claiming…" : "Claim this route"}
      </button>
    );
  }

  return (
    <button
      onClick={run}
      disabled={pending}
      className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:opacity-60"
    >
      {pending ? "Releasing…" : "Release"}
    </button>
  );
}
