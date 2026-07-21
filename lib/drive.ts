// Helpers for the Google Drive video links stored in `contents.video_url`
// (carried over from the standalone Logbook app). Migrated rows are Drive share
// links; new rows may hold any URL, so callers should guard with isDriveUrl().

export function driveFileId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/, // .../file/d/<ID>/view
    /[?&]id=([a-zA-Z0-9_-]+)/, // ...?id=<ID>
    /\/d\/([a-zA-Z0-9_-]+)/, // .../d/<ID>
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function isDriveUrl(url: string | null | undefined): boolean {
  return /drive\.google\.com|drive\.usercontent\.google\.com/.test(url ?? "");
}
