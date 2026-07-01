"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUploadUrl, markUploaded } from "@/app/actions";

// PUT the file straight to R2 with a real upload progress bar (XHR gives us
// upload progress events that fetch does not).
function putWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload"));
    // Do not set Content-Type manually: the presigned URL only signs `host`,
    // so the browser's auto Content-Type is accepted without a signature clash.
    xhr.send(file);
  });
}

export function UploadWidget({
  routeId,
  hasExisting,
}: {
  routeId: number;
  hasExisting: boolean;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  async function upload() {
    if (!file) return;
    setError(null);
    setSuccess(false);
    setBusy(true);
    setProgress(0);
    try {
      // 1. Ask the server for a presigned R2 upload URL.
      const signed = await createUploadUrl(routeId, file.name);
      if ("error" in signed) throw new Error(signed.error);

      // 2. Upload the big file straight to R2 (not through Next.js).
      await putWithProgress(signed.url, file, setProgress);

      // 3. Record the object key against the route.
      const res = await markUploaded(routeId, signed.key, notes);
      if (res?.error) throw new Error(res.error);

      setSuccess(true);
      setProgress(null);
      setFile(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="font-semibold">
        {hasExisting ? "Re-upload export" : "Upload your export"}
      </h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Upload the finished map animation (.mp4) exported from TravelAnimator.
      </p>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-8 text-center hover:border-[var(--muted)]">
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/*"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setSuccess(false);
          }}
        />
        <span className="text-sm">
          {file ? <b>{file.name}</b> : <>Click to choose a video file</>}
        </span>
        {file && (
          <span className="mt-1 text-xs text-[var(--muted)]">
            {(file.size / 1024 / 1024).toFixed(1)} MB
          </span>
        )}
      </label>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional note to the editor (e.g. anything unusual about this export)"
        className="mt-3 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 text-sm outline-none focus:border-[var(--muted)]"
        rows={2}
      />

      {progress !== null && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full bg-[var(--accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-[var(--muted)]">
            {progress}%
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}

      {success && (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-600/20 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          <span>✓</span>
          Upload successful — the editor has your export. Thank you!
        </p>
      )}

      <button
        onClick={upload}
        disabled={!file || busy}
        className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-ink)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
      >
        {busy
          ? "Uploading…"
          : success
            ? "Uploaded ✓"
            : hasExisting
              ? "Replace export"
              : "Upload export"}
      </button>
    </div>
  );
}
