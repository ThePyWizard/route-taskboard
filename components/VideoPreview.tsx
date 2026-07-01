"use client";

import { useEffect, useState } from "react";
import { getPreviewUrl } from "@/app/actions";

// Watch an uploaded export inline (a 9:16 vertical .mp4) without downloading it.
// Fetches a short-lived, inline-disposition presigned R2 URL on open.
export function VideoPreview({
  path,
  label = "▶ Preview",
  title,
}: {
  path: string;
  label?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPreview() {
    setOpen(true);
    if (url) return; // already fetched this session
    setBusy(true);
    setError(null);
    const res = await getPreviewUrl(path);
    setBusy(false);
    if ("error" in res) setError(String(res.error));
    else setUrl(res.url);
  }

  // Close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={openPreview}
        className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-xs text-[var(--text)] transition-colors hover:text-[var(--ink)]"
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-[var(--shadow-md)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
              <span className="truncate text-sm font-medium">
                {title ?? "Preview"}
              </span>
              <button
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
              >
                ✕ Close
              </button>
            </div>
            <div className="flex min-h-[50vh] items-center justify-center bg-black">
              {busy && <span className="text-sm text-white/70">Loading…</span>}
              {error && <span className="p-4 text-sm text-white/70">{error}</span>}
              {url && (
                <video
                  src={url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[75vh] w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
