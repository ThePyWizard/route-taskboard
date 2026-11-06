import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccountPost, Content, SocialAccount } from "@/lib/types";

export const dynamic = "force-dynamic";

// The original @mapsoftheworldroutes queue lives in `contents` and is the
// default tab. Every other tab is a social_accounts row whose videos live in
// `account_posts` (uploaded by the employee Claude skill via /api/uploads/*).
const MOTWR = "mapsoftheworldroutes";

type Item = {
  content: Content;
  kind: "content" | "account";
  label?: string;
  meta?: string;
  downloadName?: string;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function LogbookPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; account?: string }>;
}) {
  const profile = await requireProfile();
  const { view, account: accountParam } = await searchParams;
  const catalogued = view === "catalogued";

  const admin = createAdminClient();
  const { data: accData } = await admin
    .from("social_accounts")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  const accounts = (accData ?? []) as SocialAccount[];

  const current = accounts.find((a) => a.handle === accountParam) ?? null;
  const handle = current?.handle ?? MOTWR;

  // Awaiting counts per account, for the tab badges.
  const { data: pendingRows } = await admin
    .from("account_posts")
    .select("account_id")
    .eq("posted", false);
  const pendingBy = new Map<string, number>();
  for (const r of pendingRows ?? [])
    pendingBy.set(r.account_id, (pendingBy.get(r.account_id) ?? 0) + 1);
  const { count: motwrPending } = await admin
    .from("contents")
    .select("id", { count: "exact", head: true })
    .eq("posted", false);

  let items: Item[];
  if (!current) {
    const { data } = await admin
      .from("contents")
      .select("*")
      .order("post_id", { ascending: true, nullsFirst: false });
    items = ((data ?? []) as Content[]).map((c) => ({ content: c, kind: "content" }));
  } else {
    const { data } = await admin
      .from("account_posts")
      .select("*")
      .eq("account_id", current.id)
      .order("created_at", { ascending: true });
    const posts = (data ?? []) as AccountPost[];
    items = posts.map((p, i) => {
      const n = String(i + 1).padStart(3, "0");
      const ext = p.video_key.split(".").pop() ?? "mp4";
      const metaParts = [
        `Uploaded ${fmt(p.created_at)}${p.uploaded_by ? ` by ${p.uploaded_by}` : ""}`,
        p.posted && p.posted_at
          ? `posted ${fmt(p.posted_at)}${p.posted_by_name ? ` by ${p.posted_by_name}` : ""}`
          : null,
      ].filter(Boolean);
      return {
        kind: "account",
        label: p.title ? `#${n} · ${p.title}` : `Entry #${n}`,
        meta: metaParts.join(" · "),
        downloadName: `${current.handle}-${n}.${ext}`,
        content: {
          id: p.id,
          created_at: p.created_at,
          video_url: p.video_key,
          caption: p.caption,
          posted: p.posted,
          post_id: i + 1,
        },
      };
    });
  }

  const awaiting = items.filter((i) => !i.content.posted);
  const done = items.filter((i) => i.content.posted);
  // Account tabs: newest posted first; awaiting stays oldest-first (post in
  // upload order). The original tab keeps its post_id order unchanged.
  const list = catalogued ? (current ? [...done].reverse() : done) : awaiting;
  const qs = (h: string, v?: string) => {
    const p = new URLSearchParams();
    if (h !== MOTWR) p.set("account", h);
    if (v) p.set("view", v);
    const s = p.toString();
    return s ? `/logbook?${s}` : "/logbook";
  };

  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 transition-colors ${
      active ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
    }`;
  const accTab = (active: boolean) =>
    `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition-colors ${
      active
        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--panel)]"
        : "border-[var(--border)] bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--ink)]"
    }`;
  const badge = (n: number, active: boolean) =>
    n > 0 ? (
      <span
        className={`rounded-full px-1.5 text-xs font-semibold ${
          active ? "bg-[var(--panel)] text-[var(--ink)]" : "bg-[var(--accent)] text-white"
        }`}
      >
        {n}
      </span>
    ) : null;

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Logbook</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Approved videos ready to post. Pick the account, copy the caption,
          download the video, then mark it posted.
        </p>

        <nav className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href={qs(MOTWR)} className={accTab(!current)}>
            @{MOTWR} {badge(motwrPending ?? 0, !current)}
          </Link>
          {accounts.map((a) => {
            const active = current?.id === a.id;
            return (
              <Link key={a.id} href={qs(a.handle)} className={accTab(active)}>
                @{a.handle} {badge(pendingBy.get(a.id) ?? 0, active)}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 inline-flex rounded-lg border border-[var(--border)] bg-[var(--panel)] p-1 text-sm">
          <Link href={qs(handle)} className={tab(!catalogued)}>
            Awaiting ({awaiting.length})
          </Link>
          <Link href={qs(handle, "catalogued")} className={tab(catalogued)}>
            Posted ({done.length})
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          {list.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-8 text-center text-[var(--muted)]">
              {catalogued
                ? "Nothing posted yet."
                : "No videos awaiting — the queue is clear."}
            </div>
          ) : (
            list.map((i) => (
              <PostCard
                key={i.content.id}
                content={i.content}
                kind={i.kind}
                label={i.label}
                meta={i.meta}
                downloadName={i.downloadName}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
