# Route Taskboard

Internal web app for Lascade LLC. Employees claim a route from a pre-researched
list, export the map animation in TravelAnimator, and upload it. The admin
downloads the raw export and renders the final `@mapsoftheworldroutes` video
separately with Remotion.

- **Stack:** Next.js 15 · Supabase (Postgres + Auth + Storage) · Tailwind v4 · Vercel
- **Auth:** Google sign-in restricted to `@lascade.com`
- **Scope (v1):** upload-only. Rendering stays in the `mapsoftheworldroutes` project.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture.

## Setup

```bash
npm install

# 1. Create a Supabase project, then run supabase/schema.sql in the SQL editor.
# 2. Enable Google auth in Supabase (add /auth/callback redirect URLs).
# 3. Configure env:
cp .env.example .env.local        # fill in Supabase keys + ADMIN_EMAILS

# 4. Seed routes from data/routes.json:
npm run import-routes

# 5. Run:
npm run dev                       # http://localhost:3000
```

## Adding the next batch of routes

Either run `npm run import-routes path/to/routes.json`, or paste the JSON array
into the **Admin → Import routes** panel in the UI. Existing routes (same `id`)
are updated without disturbing assignments.
