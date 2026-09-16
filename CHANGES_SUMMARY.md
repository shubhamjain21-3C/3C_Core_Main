# Changes Summary

Last updated: 2026-06-21 (Batch 9)

This is a chronological log of substantial changes shipped on the website. Each batch corresponds to a merge to `main`. The most recent batch is at the top.

For the current overall architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

# Batch 9 — Journey flow reversal, Others role, download-app, UX polish, icon removal

Four related changes shipped together on 2026-06-21:

### 1. Reversed user journey flow

The landing page at `/` is now a "Who are you?" role selector. Choosing a role goes to `/what-are-you-looking-for` (intent selector), then to `/services` (filtered service list). Previously the flow started at `/who-are-you` — that page is now dead code kept for reference.

`sessionStorage['3c_user_role']` and `sessionStorage['3c_journey_intent']` carry state through the flow.

### 2. Others role + portal restructure

- **Migration 023** adds `others` (id 6, sort_order 6) to `ref_portal_roles`.
- Portal selection page (`/portal`) now shows 4 cards: **PM/Landlord**, **Tenant**, **Student**, **Others** — each with its own accent colour.
- Admin is no longer a card. A small "Login for Admin access" link sits below the "Create a free account" line on both the portal selection and login pages.
- RegisterForm role selector includes Others (via API fetch with admin filtered out, or fallback constant).
- All Lucide icons removed from portal pages (selection cards, login header, register role buttons, both admin login pages). Only the `ArrowLeft` back-navigation icon remains.

### 3. Download App page

New `/download-app` page with iOS/Android toggle. App Store and Google Play URLs are placeholders (`#`) until the mobile app is published.

### 4. UX fixes

- Guest checkout: unauthenticated users on service booking pages see a Login / Register / Continue as Guest panel before the booking form.
- `ComingSoonWidget` shrunk from a full chat panel to a small circular toggle.
- Restored original "Connected | Consistent | Confident" tagline on landing and intent pages.
- Fixed page overflow issues on landing and intent pages.

### Files

Added
- `app/download-app/page.tsx`
- `supabase/migrations/023_add_others_portal_role.sql`

Updated
- `app/page.tsx` — role selector landing, tagline, overflow fix
- `app/what-are-you-looking-for/page.tsx` — intent selector, tagline, overflow fix
- `app/services/page.tsx` — receives role from sessionStorage
- `app/portal/page.tsx` — 4 cards + admin link
- `app/portal/login/page.tsx` — Others label + admin link, icons removed
- `app/portal/admin-login/page.tsx` — icons removed
- `app/portal/admin/login/page.tsx` — icons removed
- `components/portal/RegisterForm.tsx` — Others in fallback roles, icons removed
- `components/portal/LoginForm.tsx` — post-login redirects to `/what-are-you-looking-for`
- `components/booking/ServiceBookingForm.tsx` — guest checkout panel
- `components/layout/ServicePageHeader.tsx` — updated for new flow
- `components/ui/ComingSoonWidget.tsx` — compact toggle
- `app/portal/customer/dashboard/page.tsx`
- `ARCHITECTURE.md`

### Required after deploy

Run **migration 023** in the Supabase SQL Editor (adds `others` to `ref_portal_roles`).

---

# Batch 8 — Unified Amber/Gold palette

Shipped 2026-06-14. Migrated the entire front-end from the original navy/blue colour scheme (`#0f1c3f`, `#1a2744`, Tailwind `blue-500`/`blue-600`) to the unified Amber/Gold palette:

| Swatch | Hex | Usage |
|---|---|---|
| Deep Amber | `#D4860A` | Primary accent, CTAs, links |
| Bright Amber | `#F0A830` | Hover states, highlights |
| Cream | `#FDE8B0` | Light backgrounds |
| Warm Brown | `#8B3A2A` | Body text, subdued labels |
| Dark Brown | `#2C1F14` | Headings, dark backgrounds |
| Forest Green | `#2D5016` | Tenant accent |
| Warm White | `#FFF8EE` | Page backgrounds |
| Steel Blue | `#4A6FA5` | Student accent |

### Files updated (24)

- `tailwind.config.ts`, `styles/globals.css`
- `components/layout/Navbar.tsx`, `components/layout/Footer.tsx`
- `components/home/HeroSection.tsx`, `CTABanner.tsx`, `ServicesPreview.tsx`, `StatsSection.tsx`, `Testimonials.tsx`, `WhyUs.tsx`
- `components/about/CompanyTimeline.tsx`, `MissionVision.tsx`, `TeamGrid.tsx`
- `components/contact/ContactForm.tsx`
- `components/services/ServiceCard.tsx`
- `components/ui/Card.tsx`, `CircuitDecor.tsx`, `SectionHeading.tsx`
- `components/ChatbotToggle.tsx`
- `app/portfolio/page.tsx`, `app/portfolio/[slug]/page.tsx`
- `app/services/[slug]/page.tsx`
- `lib/email.ts` (email template colours)

---

# Batch 7 — Portal customer pages read from Supabase + registration hardening

Five fixes shipped 2026-06-09:

1. **Customer portal pages now read profile from Supabase.** Dashboard and Account pages fetch the user's profile from `public.users` instead of relying on the in-memory store. This means profile data (name, phone, company) survives cold starts.

2. **`verifyOtp` tries multiple OTP types.** Registration and forgot-password now try `email`, `magiclink`, and `signup` types as fallbacks when verifying a Supabase OTP code — avoids failures when Supabase categorises the OTP differently.

3. **Registration surfaces real errors.** The `/api/auth/register` route now returns the actual Supabase `verifyOtp` error message and Zod field-level validation messages to the client, making debugging registration failures much easier.

4. **`landlord` accepted as a valid portal role.** The register schema and `writeCustomerProfile` now accept `landlord` in addition to `property_manager`, resolving a Zod validation error when users who chose "Property Manager / Landlord" on the portal selection page were redirected with `role=landlord`.

### Files

Updated
- `app/portal/customer/account/page.tsx`
- `app/portal/customer/dashboard/page.tsx`
- `app/portal/customer/layout.tsx`
- `lib/users-db.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/forgot-password/reset/route.ts`
- `types/index.ts`

---

# Batch 6 — bcrypt passwords + fix Lastname/Phone/Company not saving

Two related issues:

### Issue 1 — SHA-256 was too weak

Previous scheme: `sha256(password + "salt_3ccore")`. Fixed pepper, no per-user salt, no work factor — modern GPUs can crack ~100 billion SHA-256 hashes per second, so a leaked DB would be brute-forceable.

**Fix:** moved to **bcrypt** (cost factor 12, ~150 ms per hash) using `bcryptjs` (pure JS, deploys on Vercel without native-binding worries).

- `lib/store.ts` now exports `hashPassword` (async), `verifyPassword` (async, handles both formats), and `isLegacyHash`. The old sync `hash` is retained as an alias only for the 9 seeded demo accounts and the legacy-verify path.
- `verifyPassword` does **timing-safe** comparison for the legacy SHA-256 path.
- **Lazy migration on login.** The NextAuth `customer-login` provider detects SHA-256 hashes and re-hashes the password with bcrypt on first successful login, transparently. Existing users don't have to reset.

### Issue 2 — `Lastname`, `Phone`, `Company` weren't saving on `public.users`

Root cause: `/api/auth/register` was calling `emailExists` to guard against duplicates **after** our own `signInWithOtp` had already triggered the `handle_new_user` trigger and created a stub `public.users` row. The duplicate check then saw that stub row and returned 409 **before** our `writeCustomerProfile` UPDATE ran. So every new user got blocked at the very last step and the table was left with only the trigger defaults (FirstName = email local part, everything else NULL/empty).

**Fix:** new `isFullyRegistered(email)` helper in `lib/email-exists.ts` that returns true only when `public.users.password_hash` or `Lastname` is populated — i.e. when a previous registration actually finished. Swapped into:
- `/api/auth/check-email` — step-1 fail-fast for the registration form
- `/api/auth/otp/send` — step-2 safety net
- `/api/auth/register` — final safety net at OTP-verify time (no longer 409s against its own stub)
- `/api/auth/forgot-password/start` and `/reset` — only send reset OTPs to fully-registered accounts

After this fix, every `public.users` row written by a new customer will have **FirstName, MiddleName, Lastname, Phone, Company, password_hash, portal_role_id** all populated as typed by the user (subject to case-insensitive `Email` matching via `ILIKE` — Supabase normalises emails to lowercase, names keep their original case).

### Files

Added
- `package.json` — `bcryptjs` + `@types/bcryptjs`

Updated
- `lib/store.ts` — bcrypt helpers + deprecated sync `hash` alias
- `lib/email-exists.ts` — split into `emailExists` (broad) + `isFullyRegistered` (strict)
- `lib/auth.ts` — async customer-login with lazy hash upgrade
- `app/api/auth/register/route.ts` — bcrypt + strict duplicate check
- `app/api/auth/check-email/route.ts` — strict check
- `app/api/auth/otp/send/route.ts` — strict check
- `app/api/auth/forgot-password/start/route.ts` — strict check
- `app/api/auth/forgot-password/reset/route.ts` — bcrypt + strict check

### Acceptance

- [x] Register a fresh account → `public.users` row has FirstName / Lastname / Phone / Company / password_hash all populated
- [x] Password hash starts with `$2b$12$` (bcrypt)
- [x] Login an existing SHA-256 account → succeeds, hash silently upgraded to bcrypt in the same request
- [x] Try to register the same email twice → blocked at step 1 with the amber banner
- [x] Try to register an email that's mid-flow (signInWithOtp created the stub but the form was abandoned) → allowed to retry
- [x] Forgot-password only sends OTP to fully-registered accounts
- [x] `npm run build` passes

### No new SQL required

Migration 022 from Batch 5 is sufficient — we still store the hash in `public.users.password_hash` (it's a `text` column either way). If you've already run 022, you're good.

---

# Batch 5 — Persistent customer profile + password on `public.users`

**Why:** The in-memory `lib/store.ts` is reset on every Vercel serverless cold start. That meant:

1. A customer who registered, logged out, then tried to log in again from a fresh function instance got "invalid credentials" — their password hash was gone.
2. Forgot-password silently no-op'd for the same reason: `findUserByEmail` returned null, so no OTP was sent.
3. `public.users` was missing `Lastname`, `MiddleName`, `Phone`, `Company`, and had no password at all — the Supabase trigger only set `FirstName` (defaulting to the email local part) and `Email`.

**Fix:** new migration `022_persistent_user_profile_and_password.sql` and a new helper `lib/users-db.ts`.

### Database

- **Migration 022** adds `password_hash text` to `public.users` and a case-insensitive index `idx_users_email_ci on lower("Email")`.
- The existing `Lastname`, `MiddleName`, `Phone`, `Company`, `portal_role_id` columns are now actually populated by the application.
- Service role bypasses RLS for writes; the existing "Users update own row" policy still works for authenticated browser updates.

### Application code

| Flow | Before | After |
|---|---|---|
| **Register** (`/api/auth/register`) | wrote name+pw to in-memory only; `public.users` had stub from trigger | also calls `writeCustomerProfile` to UPDATE `public.users` with full profile + `password_hash` + `portal_role_id` |
| **Customer login** (NextAuth `customer-login`) | only checked in-memory | checks Supabase `public.users` first; falls back to in-memory for the 9 seeded demo accounts |
| **Forgot-password start** | only sent OTP if email was in in-memory store | uses `lib/email-exists` (in-memory ∪ Supabase) — OTP now goes out for any registered email |
| **Forgot-password reset** | updated in-memory only | calls `updateCustomerPassword` to set `password_hash` in Supabase, plus in-memory for the current instance |

### Files

Added
- `supabase/migrations/022_persistent_user_profile_and_password.sql`
- `lib/users-db.ts` (read / write / update password helpers)
- `ARCHITECTURE.md` rewritten

Updated
- `lib/auth.ts` — customer-login provider now hits Supabase first
- `app/api/auth/register/route.ts` — persists full profile + hash
- `app/api/auth/forgot-password/start/route.ts` — uses `emailExists`
- `app/api/auth/forgot-password/reset/route.ts` — updates Supabase password

### Required steps after deploy

**Run migration 022 in the Supabase SQL Editor** before the next deploy is exercised. Without `password_hash`, the new register / login / reset code paths will silently fall back to "no Supabase persistence" and you're back where you started.

### Acceptance

- [x] New customer registers → `public.users` row has FirstName, Lastname, Phone, Company, password_hash, portal_role_id correctly set
- [x] Same customer logs out, lands on a cold Vercel instance, logs back in with their password — works
- [x] Same customer hits Forgot password → receives an OTP, resets, new password works on a different cold instance
- [x] Existing seeded demo accounts (Shubham/Irfan/Adamya × roles) still log in (in-memory fallback path)
- [x] `npm run build` passes

---

# Batch 4 — Duplicate-email guard + forgot-password unblock

Pushed two fixes:

1. **Forgot-password page was unreachable.** The `withAuth` middleware in `middleware.ts` only allowed `/portal`, `/portal/login`, `/portal/register`, `/portal/admin-login` without a token. Clicking "Forgot password?" was bouncing back to `/portal/login` (looked like a refresh). Added `/portal/forgot-password` to the allow-list.

2. **Duplicate-email guard now persistent.** New `lib/email-exists.ts` helper checks both the in-memory store and Supabase `public.users`. Used by:
   - `/api/auth/check-email` — called by RegisterForm step 1 to fail fast before any OTP
   - `/api/auth/otp/send` — refuses to send if email exists, returns 409 with `code: 'EMAIL_EXISTS'`
   - `/api/auth/register` — final safety net at OTP-verify time

3. **RegisterForm UX:** if the email exists, an amber banner appears with two clickable actions — "sign in to your existing account" or "reset your password if you've forgotten it". Banner clears when the user edits the email field.

4. **Forgot-password link defensiveness:** swapped `next/link` for a plain `<a href>` on the customer login form to force a real browser navigation (bypasses any stale client bundle).

5. **Post-registration redirect** changed from `/portal/customer/dashboard` to `/services?role=<role>` so new customers pick a service first (matching the post-login redirect).

---

# Batch 3 — Admin OTP login + customer forgot-password

Admin login is now 2-step:
- Step 1: email + password → `/api/auth/admin/start-login` validates the password and triggers a Supabase OTP email to the admin address
- Step 2: 6-digit code → the NextAuth `admin-login` provider re-checks the password AND calls `supabase.auth.verifyOtp({ type: 'email' })` before issuing a session

Customer forgot-password (`/portal/forgot-password`):
- 3-step UI: email → code + new password → success
- `/api/auth/forgot-password/start` sends an OTP via Supabase (returns generic success whether the email is registered or not, so attackers can't probe for accounts)
- `/api/auth/forgot-password/reset` verifies the OTP and updates the password hash

`LoginForm` was split into `CustomerLoginForm` + `AdminLoginForm` under the same exported component so the existing admin login pages keep working unchanged.

---

# Batch 2 — DIY Inventory Report

New route `/services/inventory/diy` — 4-step tool:

1. Property + report meta → creates `inventory_reports` draft
2. Rooms + media — add/reorder/remove, upload + live camera, optional items
3. Review + AI analysis (flag-gated stub)
4. Real PDF download with 3C Core branding + signature blocks

APIs added/rewritten:
- `/api/inventory/reports` POST/PATCH
- `/api/inventory/rooms` POST/DELETE
- `/api/inventory/items` POST/DELETE
- `/api/inventory/upload` multipart → `inventory-media` bucket + `media` row (`auto_delete_at = NULL`)
- `/api/inventory/analyse` — flag-gated stub behind `NEXT_PUBLIC_AI_ANALYSIS_ENABLED`
- `/api/inventory/generate-pdf` — real jspdf builder, saves to `inventory-reports` bucket, writes `pdf_url`

New components:
- `components/inventory/CameraCapture.tsx` — live `getUserMedia` with front/back switch, preview/retake, file-input fallback when permission denied
- `lib/anthropic.ts` exposes `AI_ANALYSIS_ENABLED`, `hasAnthropicKey`, `CLAUDE_MODEL`

Autosave: `localStorage` + server PATCH (both debounced). Anonymous-user CTA to create an account before download.

---

# Batch 1 — OTP fix + Service Navigation Rework

- Email OTP standardised on Supabase Auth (`signInWithOtp` / `verifyOtp({ type: 'email' })`)
- Phone OTP gated behind `NEXT_PUBLIC_PHONE_OTP_ENABLED` (default false)
- Custom `lib/otp-store.ts` removed
- Old 4-tab (Description / FAQs / Prices / Book Now) page removed from every service
- New shared `ServiceBookingForm` modal with auto-filled role / name / service type
- `/api/service-bookings` persists to `service_bookings` and emails `contactus@3ccore.com`
- Migration `021_service_bookings_and_maintenance_types.sql` adds `ref_maintenance_types` + `service_bookings`

Per-service routing:
- **Inventory** → DIY vs Book-an-Agent chooser
- **Maintenance** → maintenance-type select first, then booking
- **Midterm / Dispute / Deposit** → straight to booking form
- **Letting** → available listings + Schedule a Callback

---

# Required Supabase Dashboard configuration

(One-time, in order):

1. **Run migrations** in SQL Editor — `020_finalised_schema_with_lookups.sql`, then `021_service_bookings_and_maintenance_types.sql`, then `022_persistent_user_profile_and_password.sql`, then `023_add_others_portal_role.sql`.
2. **Authentication → Providers → Email** — enabled.
3. **Authentication → URL Configuration** —
   - Site URL: `https://3ccore.com`
   - Redirect URLs: `https://3ccore.com`, `https://3ccore.com/**`, your Vercel preview URLs, `http://localhost:3000`, `http://localhost:3000/**`
4. **Authentication → Emails → SMTP Settings** — custom SMTP via Resend (`smtp.resend.com:465`, user `resend`, password = Resend API key, sender from a verified Resend domain).
5. **Authentication → Email Templates** — both **Confirm signup** AND **Magic Link or OTP** updated to render `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.

---

# Required Vercel environment variables

| Key | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | **Sensitive** — backend only |
| `NEXTAUTH_SECRET` | **Sensitive** — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://3ccore.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://3ccore.com` — used in `emailRedirectTo` |
| `PORTAL_ADMIN_EMAIL` | identity for admin 2FA |
| `PORTAL_ADMIN_PASSWORD` | **Sensitive** |
| `RESEND_API_KEY` | **Sensitive** — also used in Supabase SMTP |
| `RESEND_FROM_EMAIL` | optional |
| `NEXT_PUBLIC_PHONE_OTP_ENABLED` | default `false` |
| `NEXT_PUBLIC_AI_ANALYSIS_ENABLED` | default `false` |
| `ANTHROPIC_API_KEY` | required only when AI analysis is enabled |
| `ANTHROPIC_MODEL` | optional — defaults to `claude-sonnet-4-6` |
| `NEXT_PUBLIC_COMPANY_EMAIL` | optional — overrides booking-email recipient |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | when Stripe goes live |
| `STRIPE_SECRET_KEY` | **Sensitive** — when Stripe goes live |
| `STRIPE_WEBHOOK_SECRET` | **Sensitive** — when Stripe goes live |

---

## Batch 10 — Submission readiness (16 Sep 2026)

Branch `fix/submission-readiness`. Three themes: remove untrue content, close the
open API surface, and pin hosting to the UK.

### Removed template content

The site was built from a template whose placeholder marketing copy had never
been replaced. None of it was true, so all of it is gone rather than restated
with different numbers.

| Removed | Was |
|---|---|
| `app/portfolio/**`, `data/caseStudies.ts` | Invented case studies ("Real results for real clients"). `/portfolio` now redirects to `/services`. |
| Stats strip on `/services` | "1,000+ Reports Generated · 50,000+ Items Catalogued · Under 3 mins Avg Report Time" |
| `STATS` in `lib/constants.ts` | "250+ Properties Managed · 15+ Years Experience · 180+ Happy Landlords · 96% Tenant Satisfaction" — the company was incorporated in Feb 2026 |
| `data/testimonials.ts`, `components/home/Testimonials.tsx` | Fabricated customer quotes |
| `data/team.ts`, `components/about/TeamGrid.tsx`, `CompanyTimeline.tsx` | Invented staff and a company history starting in 2009 |
| `app/services/[slug]`, six template services in `data/services.ts` | Rent collection, 24/7 emergency response, investment advisory, lettings consultancy, tenant relations, compliance — none of which 3C Core offers. Old slugs redirect to `/services`. |
| `SAMPLE` in `app/api/lettings/available/route.ts` | Three fictional addresses shown as real listings whenever the database was unreachable |
| App Store / Google Play badges on `/download-app` | No app exists |
| Unused components: `StatsSection`, `CTABanner`, `HeroSection`, `ServicesPreview`, `WhyUs`, `MissionVision`, `CircuitDecor`, `Badge`, `ServiceCard` | Orphaned once the above were removed |

`data/services.ts` now lists only the six real services, each mapping to a page
that exists. `components/layout/Footer.tsx` and the portal property pages read
from it, so footer links can no longer point at pages that 404.

### Reworded claims

- Inventory page: "legally sound" / "legally defensible" removed; "our AI tool"
  → "our online tool".
- DIY wizard: when `NEXT_PUBLIC_AI_ANALYSIS_ENABLED` is off (always, today) the
  review step states plainly that AI analysis is not yet available and the
  report uses the user's own notes. The "Generate Report with AI" button is
  hidden entirely rather than producing a stub that looks like AI output.
- About page: "AI-powered inventory tools" → "new inventory tools".
- Chatbot widget: "Our AI assistant will…" → "We're building an assistant to
  answer property questions. Coming soon."
- Inventory PDF header now prints the registered office from `COMPANY.address`
  instead of a Derby address the company has never traded from.

### Security

See `ARCHITECTURE.md` → Authorisation, and the fix report.

### Hosting

`vercel.json` pins functions to `lhr1` (London). New `GET /api/health` reports
`{ status, db, region }` with no error detail.
