-- =====================================================================
-- 002 - Multi-account posting queues (ADDITIVE ONLY)
--
-- Adds per-Instagram-account posting queues for videos that employees make
-- with Claude and upload through the public API (/api/uploads/*).
-- Does NOT alter profiles / routes / contents - the original
-- @mapsoftheworldroutes logbook keeps using `contents` exactly as before.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- =====================================================================

-- ---------- social_accounts ----------
-- One row per Instagram account the team posts to.
create table if not exists public.social_accounts (
  id           uuid primary key default gen_random_uuid(),
  handle       text not null unique,          -- without the "@", lowercase
  display_name text,
  platform     text not null default 'instagram',
  active       boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------- account_posts ----------
-- One row per uploaded video waiting to be (or already) posted on an account.
create table if not exists public.account_posts (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.social_accounts(id) on delete restrict,
  title          text,
  caption        text not null default '',
  video_key      text not null,               -- Cloudflare R2 object key
  video_bytes    bigint,
  uploaded_by    text,                        -- free-text name sent by the uploader
  notes          text,
  posted         boolean not null default false,
  posted_at      timestamptz,
  posted_by      uuid references public.profiles(id) on delete set null,
  posted_by_name text,
  created_at     timestamptz not null default now()
);

create index if not exists account_posts_account_idx on public.account_posts (account_id, posted, created_at);
create unique index if not exists account_posts_video_key_uq on public.account_posts (video_key);

-- Service-role only, like every other table in this app.
alter table public.social_accounts enable row level security;
alter table public.account_posts   enable row level security;

-- ---------- seed ----------
insert into public.social_accounts (handle, display_name, sort_order) values
  ('bygeoanimator',       'GeoAnimator',          1),
  ('travelanimator.usa',  'TravelAnimator USA',   2),
  ('geostories.daily',    'GeoStories Daily',     3)
on conflict (handle) do nothing;
