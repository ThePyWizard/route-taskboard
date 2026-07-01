"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminImportRoutes } from "@/app/actions";

export function ImportPanel() {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function run() {
    setBusy(true);
    setMsg(null);
    const res = await adminImportRoutes(json);
    setBusy(false);
    if (res?.error) return setMsg(`Error: ${res.error}`);
    setMsg(`Imported/updated ${res.count} routes.`);
    setJson("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between font-semibold"
      >
        Import routes from JSON
        <span className="text-[var(--muted)]">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-4">
          <p className="text-sm text-[var(--muted)]">
            Paste an array of route objects (the <code>routes.json</code> format).
            Existing routes with the same id are updated; assignments are kept.
          </p>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='[{ "id": 102, "title": "…", "origin": "…", "destination": "…", "script": "…", "googleMapsUrl": "…" }]'
            className="mt-3 h-48 w-full rounded-lg border border-[var(--border)] bg-transparent p-3 font-mono text-xs outline-none focus:border-[var(--muted)]"
          />
          {msg && <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p>}
          <button
            onClick={run}
            disabled={busy || !json.trim()}
            className="mt-3 rounded-xl bg-[var(--accent)] px-4 py-2 font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-ink)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
          >
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      )}
    </div>
  );
}
