"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProfile, selectProfile } from "@/app/actions";
import type { Profile } from "@/lib/types";

export function JoinForm({ profiles }: { profiles: Pick<Profile, "id" | "name" | "email">[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await createProfile(name, email);
    setBusy(false);
    if (res?.error) return setError(res.error);
    router.push("/");
  }

  async function pick(id: string) {
    setBusy(true);
    const res = await selectProfile(id);
    setBusy(false);
    if (res?.error) return setError(res.error);
    router.push("/");
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8">
      <h1 className="text-2xl font-bold">Join the taskboard</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Create a profile so your claimed routes and uploads are tracked to you.
      </p>

      <div className="mt-6 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--muted)]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          type="email"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--muted)]"
        />
      </div>

      {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}

      <button
        onClick={create}
        disabled={busy || !name.trim()}
        className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-ink)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
      >
        {busy ? "…" : "Create profile & continue"}
      </button>

      {profiles.length > 0 && (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Or continue as
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p.id)}
                disabled={busy}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-left text-sm hover:border-[var(--muted)] disabled:opacity-50"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-xs text-[var(--muted)]">{p.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
