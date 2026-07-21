-- =====================================================================
-- Route Taskboard - database schema (NO-AUTH version)
-- Identity is a lightweight `profiles` row remembered in a cookie.
-- All reads/writes happen server-side with the service-role key, so RLS is
-- enabled with NO policies (anon/browser cannot touch these tables directly;
-- the service role bypasses RLS).
-- Run this in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

-- ---------- enum ----------
do $$ begin
  create type route_status as enum ('available', 'claimed', 'uploaded', 'done');
exception when duplicate_object then null; end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- routes ----------
create table if not exists public.routes (
  id                      integer primary key,
  title                   text not null,
  subtitle                text,
  origin                  text not null,
  destination             text not null,
  waypoints               jsonb not null default '[]'::jsonb,
  script                  text,
  google_maps_url         text,
  why_trending            text,
  script_duration_seconds integer,
  total_distance          integer,
  caption_style           integer,
  status                  route_status not null default 'available',
  assigned_to             uuid references public.profiles(id) on delete set null,
  assigned_to_name        text,
  assigned_to_email       text,
  assigned_at             timestamptz,
  video_path              text,
  uploaded_at             timestamptz,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Additive migrations for tables that already exist (idempotent).
alter table public.routes add column if not exists subtitle text;
-- TikTok caption for this route (used as contents.caption when approved).
alter table public.routes add column if not exists description text;

create index if not exists routes_status_idx on public.routes (status);
create index if not exists routes_assigned_idx on public.routes (assigned_to);

-- ---------- lock the tables to server-side (service role) only ----------
alter table public.profiles enable row level security;
alter table public.routes   enable row level security;
-- (No policies on purpose. The anon key cannot read/write; the service-role
--  key used by the server actions bypasses RLS.)

-- ---------- contents (posting queue / "logbook") ----------
-- Approved videos ready to be posted to the TikTok account. Mirrors the schema
-- from the standalone "Logbook" app (see previous_prject.md) so its rows migrate
-- in unchanged. Read/written server-side with the service role, same as routes.
create table if not exists public.contents (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  video_url  text default ''::text,
  caption    text default ''::text,
  posted     boolean default false,
  post_id    integer
);

create index if not exists contents_posted_idx  on public.contents (posted);
create index if not exists contents_post_id_idx on public.contents (post_id);

alter table public.contents enable row level security;
-- (No policies on purpose — service-role only, like profiles/routes. The old
--  Logbook app needed anon SELECT/UPDATE policies because it queried from the
--  browser; this app never does, so leave contents policy-free.)

-- ---------- file storage ----------
-- Uploaded exports live in Cloudflare R2, NOT Supabase Storage (R2 has a far
-- larger free tier and no per-file 50 MB cap). The app presigns R2 PUT/GET URLs
-- server-side; see lib/r2.ts and app/actions.ts. Nothing to configure here.
