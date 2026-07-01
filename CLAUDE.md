# Route Taskboard

You are working on **Route Taskboard**, an internal web app for Lascade LLC that
crowdsources one manual step of the `@mapsoftheworldroutes` TikTok video pipeline.

## What this app is for

The parent project (`../mapsoftheworldroutes`) turns a **TravelAnimator map
animation** + voiceover into a finished vertical video using Remotion. The one
step that can't be automated is the **TravelAnimator map export**, which needs a
person tapping through the phone app.

This app distributes that step across the whole company:

1. **Admin (Jishnu)** researches routes ahead of time (title, origin/destination,
   voiceover script, captions, Google Maps link) and imports them here.
2. **Employees** open the site, create a profile, **claim** an available route,
   open TravelAnimator, plot the route from the Google Maps link, export the map
   animation following the on-screen export spec, and **upload** the `.mp4` here.
3. **Admin** downloads each uploaded export from the Admin dashboard, drops it
   into `mapsoftheworldroutes/public/`, and runs the Remotion render.

**v1 scope is upload-only.** This app's job ends when the raw export is uploaded
and downloadable by the admin. It does NOT run TTS, captions, or Remotion — that
stays in the `mapsoftheworldroutes` project. Do not add rendering here unless the
user explicitly asks to expand scope.

## Stack

- **Next.js 15** (App Router, TypeScript, React 19) — deploy target: **Vercel**
- **Supabase** — Postgres only (routes + profiles). **Supabase Auth and Supabase
  Storage are NOT used.**
- **Cloudflare R2** — stores the uploaded video exports (S3-compatible; far larger
  free tier than Supabase Storage and no per-file size cap).
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)

## Identity model — NO AUTH (important)

There is deliberately **no login/OAuth/password**. Identity is a lightweight
`profiles` row (name + optional email) created on first visit and remembered in an
**httpOnly `profile_id` cookie**.

- `middleware.ts` only checks that the cookie exists; if not, it redirects to
  `/join`. It does no auth and imports nothing heavy (edge runtime) — it reads the
  cookie name from `lib/constants.ts`.
- `lib/session.ts` resolves the cookie → the `profiles` row (`getProfile`,
  `requireProfile`).
- **Admin** is just `profiles.is_admin`, auto-set when a profile is created with an
  email listed in the `ADMIN_EMAILS` env var. This is honor-system (cookies are
  spoofable) — acceptable for an internal, no-auth tool. Do not present it as a
  security boundary.

## Server-side data access

**The browser never queries the database.** All reads (in Server Components) and
all writes (in `app/actions.ts` server actions) use the **service-role client**
(`lib/supabase/admin.ts`), which bypasses RLS. RLS is enabled on both tables with
**no policies**, so the anon key is inert. Identity for each action comes from the
`profile_id` cookie via `requireProfile()` / `requireAdmin()`.

The browser never uses Supabase at all; its only external call is the direct file
PUT to R2 (see below).

## Data model (`supabase/schema.sql`)

- `profiles`: `id` (uuid), `name`, `email`, `is_admin`, `created_at`.
- `routes`: content columns mirror `mapsoftheworldroutes/routes.json`
  (camelCase → snake_case), plus `status`
  (`available` → `claimed` → `uploaded` → `done`), `assigned_to` (→ profiles),
  `assigned_to_name`, `assigned_to_email`, `assigned_at`, `video_path`,
  `uploaded_at`, `notes`.

**Atomic claiming** is done in `claimRoute` via a single
`UPDATE ... WHERE id = ? AND status = 'available'` and checking that a row came
back — two employees can never grab the same route (the second update matches 0
rows).

## How large video uploads work (important)

Exported videos are 50–300 MB. They upload **directly from the browser to
Cloudflare R2**, never through a server action (that would hit Vercel's body
limit). Flow: `createUploadUrl` (server, `lib/r2.ts`) presigns an R2 **PUT** URL →
`UploadWidget` (client) `PUT`s the file to that URL via `XMLHttpRequest` (for a
real progress bar) → `markUploaded` records the R2 object key in
`routes.video_path`. Admin downloads use a presigned **GET** URL (`getDownloadUrl`).
Keep this pattern if you touch uploads.

Do NOT set a Content-Type header on the browser PUT: the presigned URL only signs
`host`, so the browser's automatic Content-Type is accepted without a signature
mismatch. R2 needs a CORS rule allowing `PUT` from the app origin (see setup).

## File map

```
app/
  page.tsx                 Browse available routes
  routes/[id]/page.tsx     Route detail: script, gmaps link, export spec, claim + upload
  my/page.tsx              A profile's claimed/uploaded/done routes
  admin/page.tsx           Admin-only: status table, download, mark done, release, import
  join/page.tsx            Create a profile / continue as an existing one
  actions.ts               ALL server actions (profile, claim/release/upload, admin)
lib/
  constants.ts             PROFILE_COOKIE (edge-safe, imported by middleware)
  session.ts               getProfile() / requireProfile()
  r2.ts                    Cloudflare R2 S3 client + bucket name
  supabase/admin.ts        Service-role Postgres client + adminEmails()
  types.ts                 Profile + Route + SourceRoute types
middleware.ts              Redirects to /join when no profile cookie
components/                RouteCard, StatusBadge, ClaimButton, UploadWidget,
                           CopyButton, ExportSpec, AdminRow, ImportPanel, JoinForm, NavBar
supabase/schema.sql        Run this in the Supabase SQL editor (tables, RLS, bucket)
scripts/import-routes.mjs  CLI bulk import from data/routes.json
data/routes.json           Seed copy of mapsoftheworldroutes routes
```

## First-time setup

1. `npm install`
2. Create a Supabase project. In **SQL Editor**, paste and run `supabase/schema.sql`.
3. Create a Cloudflare R2 bucket + an R2 API token (Object Read & Write), and add a
   CORS rule to the bucket allowing `PUT`/`GET` from your app origin, e.g.:
   ```json
   [{ "AllowedOrigins": ["http://localhost:3000"], "AllowedMethods": ["PUT","GET"],
      "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 }]
   ```
4. Copy `.env.example` → `.env.local`, fill in the Supabase keys, `ADMIN_EMAILS`,
   and the four `R2_*` values. (No Google/OAuth setup needed.)
5. Seed routes: `npm run import-routes` (reads `data/routes.json`), or use the
   Admin → Import panel after joining as an admin.
6. `npm run dev` → http://localhost:3000 → you'll land on `/join`. Create a profile
   with an email in `ADMIN_EMAILS` to get the Admin tab.

## Deploy (Vercel)

Push to GitHub, import into Vercel, set the same env vars in Vercel. No auth
redirect URLs to configure. Add your Vercel origin (e.g.
`https://your-app.vercel.app`) to the R2 bucket's CORS `AllowedOrigins`, or
uploads will fail in production with a CORS error.

## Editing the export spec

The locked TravelAnimator settings employees must follow live in
`components/ExportSpec.tsx`. Keep in sync with the `mapsoftheworldroutes` brand
defaults (Terrain / Mercator / HD / red AUTO line / chat label / 9:16).

## Conventions

- Keep all mutations in server actions; the browser never writes to the DB.
- New route fields: add to `supabase/schema.sql`, `lib/types.ts`,
  `scripts/import-routes.mjs`, and `adminImportRoutes` together.
- Match the existing look: warm light "atlas paper" theme with CSS vars in
  `app/globals.css` (`--bg/--panel/--ink/--muted/--accent` red, `--maps` emerald).
  Fonts are loaded in `app/layout.tsx` — **Fraunces** (display, via `.font-display`
  and global `h1/h2`) + **Plus Jakarta Sans** (body). Use `text-[var(--ink)]` for
  strong text (never `text-white` except on the red/emerald buttons). The Google
  Maps CTA is the emerald `MapsButton`.
