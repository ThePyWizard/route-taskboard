"use client";

import { useState } from "react";

// Shows the ready-to-paste `motwr` CLI command that renders the finished,
// branded short from a TravelAnimator base video + this route's job JSON.
// The job JSON is served publicly at `jobUrl` (see app/jobs/[id]/route.ts).
export function JobCommand({ jobUrl }: { jobUrl: string }) {
  const [os, setOs] = useState<"unix" | "win">("unix");
  const [copied, setCopied] = useState(false);

  const bin = os === "win" ? ".\\motwr.exe" : "./motwr";
  const command = `${bin} -job "${jobUrl}" -video route.mp4 -o finished.mp4`;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
            Render the finished video
          </h3>
          <p className="text-sm text-[var(--muted)]">
            Run this in the <code className="text-[var(--ink)]">motwr</code>{" "}
            folder, with your TravelAnimator export saved as{" "}
            <code className="text-[var(--ink)]">route.mp4</code>.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--panel-2)] p-0.5 text-xs">
          {(
            [
              ["unix", "Mac / Linux"],
              ["win", "Windows"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setOs(value)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                os === value
                  ? "bg-[var(--panel)] font-medium text-[var(--ink)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-stretch gap-2">
        <pre className="flex-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text)]">
          <code>{command}</code>
        </pre>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(command);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="shrink-0 self-start rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]">
        Needs ffmpeg installed and an internet connection (the voiceover is
        generated online). The job link carries this route&apos;s title, script,
        and vehicle — nothing to edit.
      </p>
    </div>
  );
}
