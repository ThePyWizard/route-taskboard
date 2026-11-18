-- =====================================================================
-- 003 - Optional thumbnail per account post (ADDITIVE ONLY)
--
-- Uploaded through the same /api/uploads/* flow as the video
-- (init with kind="thumbnail", PUT, then pass thumbnail_key to /complete).
-- The Logbook shows a "Thumbnail" download button when it is set.
--
-- Run in the Supabase SQL editor. Safe to re-run.
-- =====================================================================

alter table public.account_posts
  add column if not exists thumbnail_key text;   -- Cloudflare R2 object key (image)
