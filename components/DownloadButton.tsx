"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/app/actions";

export function DownloadButton({
  path,
  label = "⬇ Download",
}: {
  path: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const res = await getDownloadUrl(path);
    setBusy(false);
    if ("error" in res) return alert(res.error);
    window.open(res.url, "_blank");
  }
  return (
    <button
      onClick={go}
      disabled={busy}
      className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-xs text-[var(--text)] transition-colors hover:text-[var(--ink)] disabled:opacity-50"
    >
      {busy ? "…" : label}
    </button>
  );
}
