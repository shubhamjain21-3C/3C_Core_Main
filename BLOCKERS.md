# 3C Core — Blockers & Pending Setup

This document tracks items that are blocked pending external credentials,
third-party setup, or architectural decisions.

---

## STATUS UPDATE — 16 September 2026

The live site returned `TypeError: fetch failed` from `/api/lookups` on
16 Sep 2026, which is consistent with BLOCKER 1 below never having been cleared
(or the Supabase project having been paused since).

Diagnosis is now one request: **`GET /api/health`** returns
`{ status, db, region }`. `db: "unavailable"` means the app is up but cannot
reach Postgres. `region` confirms the function ran in London.

Order of work for SJ:

1. Supabase dashboard → 3C Core project. If it shows **Paused**, click
   **Restore**. Note the region under Project Settings → General (London is
   `eu-west-2`).
2. Project Settings → API — confirm the Project URL and keys.
3. Vercel → Settings → Environment Variables (Production) — confirm
   `NEXT_PUBLIC_SUPABASE_URL` (starts `https://`, no trailing space),
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://3ccore.com`, `RESEND_API_KEY`,
   `RESEND_FROM_EMAIL`. **Do not** add `ENABLE_DEMO_ACCOUNTS` in Production.
4. Supabase SQL editor — `select count(*) from ref_portal_roles;`. If the table
   is missing, apply `020`, `021`, `022`, `023` in order, then `024` after
   reading its step 1 output.
5. Redeploy, then check `https://3ccore.com/api/health`.
6. Vercel Hobby is for non-commercial personal use — move the project to a
   company-owned Pro team.

---

## BLOCKER 5: Migration 024 — email uniqueness (added 16 Sep 2026)

**Status:** Written, NOT run. Requires manual review first.

`supabase/migrations/024_email_lowercase_unique.sql` normalises `users."Email"`
to lowercase and adds a unique index on `lower("Email")`. Application code
already matches exactly via `normaliseEmail()`.

Step 1 of the migration is a read-only query listing addresses that differ only
by case. Those groups must be merged by hand before steps 2 and 3 will succeed.
Take a backup first.

---

## BLOCKER 1: Supabase — Run Migration 020

**Status:** Credentials collected ✓ — Migration NOT YET RUN in Supabase  
**Blocks:** All live database features  

**Required action — one step:**
1. Go to Supabase Dashboard → SQL Editor → New Query
2. Open `supabase/migrations/020_finalised_schema_with_lookups.sql` in VS Code
3. Copy entire file → paste into SQL Editor → click Run

**This creates:**
- 16 `ref_*` lookup tables (seeded)
- 11 core tables (users, properties, tenancies, lettings, inventory, media, services, chat)
- RLS on all tables
- 3 storage buckets (inventory-media, inventory-reports, portal-media)

**Superseded migrations (010–018):** Never applied. Replaced by 020. Do not run.
**Migration 000_complete_schema.sql:** Draft. Superseded by 020. Do not run.

---

## BLOCKER 2: Auth Migration — NextAuth → Supabase Auth

**Status:** NextAuth in use. Supabase Auth wired in migration 020 (trigger ready).  
**Blocks:** Live user accounts persisted in Supabase  

Current state: NextAuth + `lib/store.ts` (in-memory demo).
Migration 020 installs `handle_new_user()` trigger on `auth.users`.

Next steps when ready:
1. Enable Supabase Auth email/password provider (Authentication → Providers)
2. Replace `lib/store.ts` queries with `lib/supabase.ts` queries in API routes
3. Update `lib/auth.ts` NextAuth authorize to call Supabase instead of `findUserByEmail`
4. Replace `useSession()` with Supabase session where needed
5. Remove `next-auth` once fully migrated

**Do not break** existing portal login flow until steps 1-4 are complete.

---

## BLOCKER 3: Anthropic API Key (Production)

**Status:** Not added to Vercel  
**Blocks:** AI Inventory DIY tool (`/services/inventory/diy`)  

- Add `ANTHROPIC_API_KEY` to Vercel environment variables (Production + Preview)
- The route `/api/inventory/analyse` returns 503 when key is absent

---

## BLOCKER 4: Stripe Live Keys

**Status:** Not obtained  
**Blocks:** Payment processing  

- Obtain Stripe live publishable + secret keys from stripe.com dashboard
- Add to Vercel: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
- Configure webhook: `STRIPE_WEBHOOK_SECRET` (from Stripe dashboard → Webhooks)
- Webhook endpoint URL: `https://3ccore.com/api/payments/webhook`

---

## BLOCKER 5: PDF Report Generation

**Status:** Stub only (returns 501)  
**Blocks:** Inventory report download as PDF  

- Route `/api/inventory/generate-pdf` currently returns 501
- Requires: `@react-pdf/renderer` or Puppeteer for server-side PDF generation
- Install: `npm install @react-pdf/renderer`
- Alternative: generate HTML, use headless Chrome via Vercel serverless

---

## BLOCKER 6: Resend Domain Verification

**Status:** DNS records added — pending propagation confirmation  
**Blocks:** Sending from `contactus@3ccore.com`  

- Until verified, fallback sender is `onboarding@resend.dev`
- Check status: Resend dashboard → Domains → 3ccore.com
- Once verified, set `RESEND_FROM_EMAIL=contactus@3ccore.com` in Vercel

---

## Non-blocking TODOs

- Dashboard (`app/portal/customer/dashboard/page.tsx`): role-specific sections
- Subscription plan pages
- Property listing integration (Rightmove/Zoopla API)
- `npx supabase gen types typescript` — generate TypeScript types from schema
