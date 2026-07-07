import Link from "next/link";
import { switchProfile } from "@/app/actions";

// Shared "pill" styling so every nav control reads as a tappable button.
const pill =
  "rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-[var(--muted)] transition-colors hover:text-[var(--ink)]";

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
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
        <Link href="/" className="font-display text-lg font-semibold text-[var(--ink)]">
          MOTWR
        </Link>

        {/* Buttons spread evenly across the row on mobile (justify-between); on
            larger screens they group to the right. Browse/Showcase/Admin are
            hidden on mobile so the bar doesn't stretch. */}
        <nav className="flex flex-1 items-center justify-between gap-2 text-sm font-medium sm:justify-end sm:gap-3">
          <Link href="/" className={`hidden ${pill} sm:inline-block`}>
            Browse
          </Link>
          <Link href="/my" className={pill}>
            Exports
          </Link>
          <Link href="/showcase" className={`hidden ${pill} sm:inline-block`}>
            Showcase
          </Link>
          <Link href="/leaderboard" className={pill}>
            Leaderboard
          </Link>
          {isAdmin && (
            <Link href="/admin" className={`hidden ${pill} sm:inline-block`}>
              Admin
            </Link>
          )}
          <span className="hidden items-center gap-2 text-[var(--muted)] sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)]/10 text-xs font-bold text-[var(--accent)]">
              {name.charAt(0).toUpperCase()}
            </span>
            {name}
          </span>
          <form action={switchProfile}>
            <button className={pill}>Switch</button>
          </form>
        </nav>
      </div>
    </header>
  );
}
