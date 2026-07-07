import Link from "next/link";
import { switchProfile } from "@/app/actions";

export function NavBar({
  name,
  isAdmin,
}: {
  name: string;
  isAdmin: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="h-[3px] w-full bg-[var(--accent)]" />
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="font-display text-lg font-semibold text-[var(--ink)]">
            <span className="mr-1.5">🗺️</span> Route Taskboard
          </Link>
          {/* Browse, Showcase and Admin are hidden on mobile to keep the bar from
              stretching; My routes + Leaderboard stay visible on every screen. */}
          <Link href="/" className="hidden text-[var(--muted)] transition-colors hover:text-[var(--ink)] sm:inline">
            Browse
          </Link>
          <Link href="/my" className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            My routes
          </Link>
          <Link href="/showcase" className="hidden text-[var(--muted)] transition-colors hover:text-[var(--ink)] sm:inline">
            Showcase
          </Link>
          <Link href="/leaderboard" className="text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
            Leaderboard
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden text-[var(--muted)] transition-colors hover:text-[var(--ink)] sm:inline"
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden items-center gap-2 text-[var(--muted)] sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)]/10 text-xs font-bold text-[var(--accent)]">
              {name.charAt(0).toUpperCase()}
            </span>
            {name}
          </span>
          <form action={switchProfile}>
            <button className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
              Switch
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
