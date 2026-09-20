-- 024_email_lowercase_unique.sql
--
-- Purpose: make email an exact, case-insensitive-unique identity column.
--
-- Background: identity lookups used `.ilike('Email', <user input>)`, which
-- treats `%` and `_` in the supplied value as wildcards — a crafted value could
-- match a different account's row. Application code now uses
-- `.eq('Email', normaliseEmail(...))` (lib/normalise-email.ts). This migration
-- makes the data match that assumption.
--
-- DO NOT RUN AUTOMATICALLY. SJ applies this by hand in the Supabase SQL editor
-- after reviewing the output of step 1. Steps 2 and 3 are destructive-ish:
-- take a backup first.

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — INSPECT FIRST. Run on its own and read the result.
-- Lists any addresses that differ only by case. Each group must be merged by
-- hand (decide which row is authoritative, move any child records, delete the
-- rest) BEFORE the unique index in step 3 can be created.
-- ─────────────────────────────────────────────────────────────────────────────
select
  lower("Email")            as normalised_email,
  count(*)                  as row_count,
  array_agg("User_id")      as user_ids,
  array_agg("Email")        as raw_emails
from public.users
group by lower("Email")
having count(*) > 1
order by row_count desc;

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — Normalise existing values. Safe to run once step 1 returns no rows.
-- ─────────────────────────────────────────────────────────────────────────────
-- update public.users
--    set "Email" = lower(btrim("Email"))
--  where "Email" <> lower(btrim("Email"));

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — Enforce uniqueness on the normalised form.
-- Fails if step 1 still returns duplicates.
-- ─────────────────────────────────────────────────────────────────────────────
-- create unique index concurrently if not exists users_email_lower_key
--   on public.users (lower("Email"));

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 — Verify.
-- ─────────────────────────────────────────────────────────────────────────────
-- select count(*) as non_normalised
--   from public.users
--  where "Email" <> lower(btrim("Email"));   -- expect 0
