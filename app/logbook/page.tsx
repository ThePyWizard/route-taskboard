import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { PostCard } from "@/components/PostCard";
import { requireProfile } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Content } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LogbookPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const profile = await requireProfile();
  const { view } = await searchParams;
  const catalogued = view === "catalogued";

  const admin = createAdminClient();
  const { data } = await admin
    .from("contents")
    .select("*")
    .order("post_id", { ascending: true, nullsFirst: false });
  const all = (data ?? []) as Content[];
  const awaiting = all.filter((c) => !c.posted);
  const done = all.filter((c) => c.posted);
  const list = catalogued ? done : awaiting;

  const tab = (active: boolean) =>
    `rounded-md px-3 py-1.5 transition-colors ${
      active ? "bg-[var(--accent)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
    }`;

  return (
    <div>
      <NavBar name={profile.name} isAdmin={profile.is_admin} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Logbook</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Approved videos ready to post. Copy the caption, download the video,
          then mark it posted.
        </p>

        <div className="mt-4 inline-flex rounded-lg border border-[var(--border)] bg-[var(--panel)] p-1 text-sm">
          <Link href="/logbook" className={tab(!catalogued)}>
            Awaiting ({awaiting.length})
          </Link>
          <Link href="/logbook?view=catalogued" className={tab(catalogued)}>
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
            list.map((c) => <PostCard key={c.id} content={c} />)
          )}
        </div>
      </main>
    </div>
  );
}
