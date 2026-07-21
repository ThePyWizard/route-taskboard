"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Content } from "@/lib/types";
import { togglePosted, getContentDownloadUrl, getPreviewUrl } from "@/app/actions";
import { isDriveUrl } from "@/lib/drive";

const btn =
  "rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:opacity-50";

export function PostCard({ content }: { content: Content }) {
  const [copied, setCopied] = useState(false);
  const [armed, setArmed] = useState(false);
  const [dlState, setDlState] = useState<"idle" | "busy" | "done">("idle");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const entry =
    content.post_id != null ? String(content.post_id).padStart(3, "0") : "—";
  const url = content.video_url;
  // Migrated rows hold an http(s) link (Google Drive); rows queued by this app
  // hold an R2 object key, which we presign on click.
  const external = /^https?:\/\//i.test(url);
  const drive = external && isDriveUrl(url);
  const externalDownloadHref = drive
    ? `/api/download?url=${encodeURIComponent(url)}&name=entry-${entry}.mp4`
    : url;

  // Brief visual confirmation that the tap registered (matters on mobile, no hover).
  function flashDownloaded() {
    setDlState("done");
    setTimeout(() => setDlState("idle"), 2000);
  }

  async function downloadR2() {
    setDlState("busy");
    const res = await getContentDownloadUrl(url);
    if ("error" in res) {
      setDlState("idle");
      return alert(res.error);
    }
    window.open(res.url, "_blank");
    flashDownloaded();
  }

  const dlClass =
    dlState === "idle"
      ? btn
      : "rounded-lg px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 transition-colors";
  const dlLabel =
    dlState === "busy" ? "…" : dlState === "done" ? "Downloaded ✓" : "⬇ Download";

  async function openR2() {
    const res = await getPreviewUrl(url);
    window.open(res.url, "_blank");
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(content.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Two-step confirm: first click arms for 4s, second click commits.
  function toggle() {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    setArmed(false);
    startTransition(async () => {
      const res = await togglePosted(content.id, !content.posted);
      if (res?.error) alert(res.error);
      router.refresh();
    });
  }

  const postLabel = content.posted
    ? armed
      ? "Confirm ↩"
      : "Move to awaiting"
    : armed
      ? "Confirm ✓"
      : "Mark as posted";

  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold text-[var(--muted)]">
          Entry #{entry}
        </span>
        {content.posted && (
          <span className="rounded-full bg-[var(--maps)]/10 px-2 py-0.5 text-xs font-medium text-[var(--maps)]">
            Posted
          </span>
        )}
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">
        {content.caption || <span className="text-[var(--muted)]">(no caption)</span>}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button onClick={copyCaption} className={btn}>
          {copied ? "Copied ✓" : "Copy caption"}
        </button>

        {url &&
          (external ? (
            <a
              href={externalDownloadHref}
              target={drive ? undefined : "_blank"}
              rel="noreferrer"
              onClick={flashDownloaded}
              className={dlClass}
            >
              {dlLabel}
            </a>
          ) : (
            <button
              onClick={downloadR2}
              disabled={dlState === "busy"}
              className={dlClass}
            >
              {dlLabel}
            </button>
          ))}

        {url &&
          (external ? (
            <a href={url} target="_blank" rel="noreferrer" className={btn}>
              Open ↗
            </a>
          ) : (
            <button onClick={openR2} className={btn}>
              Open ↗
            </button>
          ))}

        <button
          onClick={toggle}
          disabled={pending}
          className={
            content.posted
              ? `${btn} ml-auto`
              : `ml-auto rounded-lg px-2.5 py-1 text-xs font-medium text-white transition-colors disabled:opacity-50 ${
                  armed
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`
          }
        >
          {pending ? "…" : postLabel}
        </button>
      </div>
    </article>
  );
}
