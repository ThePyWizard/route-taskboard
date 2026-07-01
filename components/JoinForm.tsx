"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProfile, continueByEmail, selectProfile } from "@/app/actions";

// Profiles this browser has signed in as, remembered locally so a returning
// user (especially one who never gave an email) can get back in with one tap.
// This is per-device — it never lists other people's profiles.
type Remembered = { id: string; name: string };
const LS_KEY = "rt_profiles";

function loadRemembered(): Remembered[] {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    return Array.isArray(arr) ? arr.filter((p) => p?.id && p?.name) : [];
  } catch {
    return [];
  }
}

function remember(p: Remembered) {
  try {
    const rest = loadRemembered().filter((x) => x.id !== p.id);
    localStorage.setItem(LS_KEY, JSON.stringify([p, ...rest].slice(0, 5)));
  } catch {
    /* ignore */
  }
}

function forget(id: string) {
  try {
    const rest = loadRemembered().filter((x) => x.id !== id);
    localStorage.setItem(LS_KEY, JSON.stringify(rest));
  } catch {
    /* ignore */
  }
}

export function JoinForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [returningEmail, setReturningEmail] = useState("");
  const [remembered, setRemembered] = useState<Remembered[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setRemembered(loadRemembered()), []);

  async function create() {
    setBusy(true);
    setError(null);
    const res = await createProfile(name, email);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    remember(res.profile);
    router.push("/");
  }

  async function reconnect() {
    setBusy(true);
    setError(null);
    const res = await continueByEmail(returningEmail);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    remember(res.profile);
    router.push("/");
  }

  async function quick(p: Remembered) {
    setBusy(true);
    setError(null);
    const res = await selectProfile(p.id);
    setBusy(false);
    if (!res.ok) {
      forget(p.id);
      setRemembered(loadRemembered());
      return setError(res.error);
    }
    remember(res.profile);
    router.push("/");
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8">
      <h1 className="text-2xl font-bold">Join the taskboard</h1>

      {/* One-tap return for profiles used on this device */}
      {remembered.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Continue as
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {remembered.map((p) => (
              <button
                key={p.id}
                onClick={() => quick(p)}
                disabled={busy}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5 text-left text-sm transition-colors hover:border-[var(--muted)] disabled:opacity-50"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)]/10 text-xs font-bold text-[var(--accent)]">
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  {p.name}
                </span>
                <span className="text-xs text-[var(--muted)]">Continue →</span>
              </button>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">or create a new profile</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
        </div>
      )}

      <p className="mt-4 text-sm text-[var(--muted)]">
        Create a profile so your claimed routes and uploads are tracked to you.
      </p>

      <div className="mt-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--muted)]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--muted)]"
        />
      </div>

      {error && <p className="mt-3 text-sm text-[var(--accent)]">{error}</p>}

      <button
        onClick={create}
        disabled={busy || !name.trim() || !email.trim()}
        className="mt-4 w-full rounded-xl bg-[var(--accent)] px-4 py-3 font-semibold text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--accent-ink)] hover:shadow-[var(--shadow-md)] disabled:opacity-50"
      >
        {busy ? "…" : "Create profile & continue"}
      </button>

      {/* Cross-device fallback: reconnect by the email you signed up with */}
      <div className="mt-6 border-t border-[var(--border)] pt-4">
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          On a new device?
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={returningEmail}
            onChange={(e) => setReturningEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && returningEmail.trim() && !busy) reconnect();
            }}
            placeholder="Email you signed up with"
            type="email"
            className="w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--muted)]"
          />
          <button
            onClick={reconnect}
            disabled={busy || !returningEmail.trim()}
            className="shrink-0 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium hover:border-[var(--muted)] disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
