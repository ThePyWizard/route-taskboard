# Content Calendar — "The Logbook"

A small, password-protected internal web app for managing the posting queue of the
**Maps of the World Routes** TikTok/social account. It shows a list of prepared
posts (caption + video), lets the operator copy captions, download the videos, and
mark each post as published. Data lives in Supabase.

The whole thing is one authenticated page with a travel-journal ("logbook") theme.

---

## Tech stack

- **Next.js 15** (App Router, React 19, TypeScript) — server components + server actions
- **Supabase** (`@supabase/supabase-js`) — Postgres table `contents` as the data store
- **Cookie-based password gate** via Next.js middleware (no user accounts)
- Google Drive video links, streamed through an internal proxy for direct download
- Google Fonts: Fraunces (display) + JetBrains Mono

No component library — styling is hand-written CSS in `app/globals.css`.

---

## Core functionality

### 1. Password gate (single shared passphrase)
- `middleware.ts` protects every route except `/login`. It checks for an
  `auth=1` httpOnly cookie; if missing, it redirects to `/login`.
- `/login` posts a passphrase to the `login` server action, which compares it to
  the `SITE_PASSWORD` env var. On success it sets the `auth` cookie (30-day expiry)
  and redirects home. On failure it redirects back with `?error=1`.
- `logout` deletes the cookie.
- This is intentionally simple — one shared password, not per-user auth.

### 2. Post list with two views
The home page (`app/page.tsx`) fetches all rows from the `contents` table
(ordered by `post_id` ascending) and splits them into:
- **Awaiting** — posts where `posted = false`
- **Catalogued** — posts where `posted = true`

A toggle (`?view=awaiting` / `?view=catalogued`) switches between the two lists,
with counts shown in the masthead and on each tab. Empty states are handled for
each view.

### 3. Post card actions (`app/components/PostCard.tsx`)
Each post renders as a "journal entry" card showing an entry number
(zero-padded `post_id`), the created date, and the caption. Actions:
- **Copy caption** — copies `post.caption` to the clipboard.
- **Download video ↓** — downloads the video through the internal proxy
  (see below) with a clean filename like `entry-001.mp4`.
- **Open in Drive ↗** — opens the raw Google Drive URL in a new tab.
- **Mark as posted / Move to awaiting** — a two-step confirm toggle (click once to
  arm, click again within 4s to confirm) that calls the `togglePosted` server
  action to flip the `posted` boolean, then revalidates the page.

### 4. Google Drive download proxy (`app/api/download/route.ts`)
Google Drive blocks direct downloads of large files behind a "can't scan for
viruses" HTML interstitial. This route:
- Extracts the Drive file id (`lib/drive.ts` → `driveFileId`),
- Fetches `https://drive.usercontent.google.com/download?id=...&confirm=t`
  (which bypasses the interstitial),
- Streams the response back with a forced `Content-Disposition: attachment`
  header so it downloads directly on the site instead of bouncing to Google.
- Fails loudly (502) if Drive returns its HTML warning page instead of the file.

---

## Data model — Supabase `contents` table

```ts
type Post = {
  id: string;          // uuid primary key
  post_id: number;     // human-facing sequential number, used for ordering + entry number
  caption: string;     // the post caption text
  video_url: string;   // Google Drive share URL to the video
  posted: boolean;     // false = awaiting, true = catalogued/published
  created_at: string;  // ISO timestamp
};
```

**RLS note:** the table needs both SELECT and UPDATE policies for the anon key.
`togglePosted` explicitly detects the "0 rows updated" case and warns that an
UPDATE policy is missing — worth replicating if you carry over the same table.

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
SITE_PASSWORD=                 # the shared login passphrase
```

---

## File map

| Path | Role |
| --- | --- |
| `middleware.ts` | Cookie-based auth gate for all routes except `/login` |
| `app/page.tsx` | Home page — fetches posts, awaiting/catalogued views |
| `app/components/PostCard.tsx` | Single post card + all client-side actions |
| `app/actions.ts` | Server actions: `togglePosted`, `login`, `logout` |
| `app/login/page.tsx` | Login form (passphrase) |
| `app/api/download/route.ts` | Google Drive download proxy |
| `lib/supabase.ts` | Supabase client + `Post` type |
| `lib/drive.ts` | Drive file-id parsing + proxy URL builder |
| `app/globals.css` | All styling (logbook theme) |
| `app/layout.tsx` | Root layout + fonts |

---

## Notes for embedding this as a subpage in another project

If you want to reuse this as a sub-section (e.g. `/content-calendar`) inside a
larger app rather than a standalone site:

- **Routing:** move `app/page.tsx` → `app/content-calendar/page.tsx`, the login to
  `app/content-calendar/login/page.tsx`, and the API route under
  `app/content-calendar/api/download/route.ts`. Update the `revalidatePath("/")`
  in `togglePosted` and the redirects in `login`/`logout` to the new base path.
- **Auth:** the middleware gate here guards the whole site. In a host app you
  probably already have auth — you can drop the passphrase gate entirely and rely
  on the host app's auth, or scope the middleware `matcher` to just the subpage.
- **Data:** point it at the same `contents` table (or a renamed one). The only DB
  requirements are the `Post` shape above plus SELECT + UPDATE RLS policies.
- **Download proxy:** the `/api/download` route has no dependency on the rest of
  the app — it just needs the file id. Copy it as-is; only the path changes.
- **Styling:** `globals.css` is global. If the host app has its own global styles,
  scope these rules (e.g. wrap in a container class) to avoid collisions.
- **Dependencies added:** `@supabase/supabase-js` and the two Google fonts.
```
