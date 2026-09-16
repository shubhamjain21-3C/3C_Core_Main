# Deployment Guide — 3C Core

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "feat: initial production build"
git push origin main
```

## Step 2 — Deploy to Vercel

1. Go to https://vercel.com → **New Project**
2. Import `shubhamjain21-3C/3C_Core` from GitHub
3. Framework preset: **Next.js** (auto-detected)
4. Add environment variables (copy from `.env.local.example`):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://3ccore.com` |
| `NEXT_PUBLIC_COMPANY_EMAIL` | `contactus@3ccore.com` |
| `RESEND_API_KEY` | Your Resend key |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://3ccore.com` |
| `PORTAL_ADMIN_EMAIL` | Portal login email |
| `PORTAL_ADMIN_PASSWORD` | Portal login password |

5. Click **Deploy** ✅

## Step 3 — Connect 3ccore.com (GoDaddy → Vercel)

### In Vercel → Project Settings → Domains:
- Add `3ccore.com`
- Add `www.3ccore.com`

### In GoDaddy DNS Manager:

| Type  | Host | Value                | TTL  |
|-------|------|----------------------|------|
| A     | @    | 76.76.21.21          | 600  |
| CNAME | www  | cname.vercel-dns.com | 3600 |

Wait 10–60 min for propagation. SSL auto-provisioned by Vercel ✅

## Branch Strategy

| Branch | Vercel Environment | Trigger |
|--------|--------------------|---------|
| `main` | Production         | Push to main |
| `dev`  | Preview            | Push to dev |

## Post-Deployment Checklist

- [ ] https://3ccore.com loads correctly
- [ ] https://www.3ccore.com redirects to apex
- [ ] SSL padlock visible
- [ ] Contact form sends email to contactus@3ccore.com
- [ ] Client portal login works
- [ ] All pages load without 404
- [ ] Mobile layout tested (375px, 768px, 1280px)
- [ ] OG image visible when shared on social

## Going Live Summary

| Item | Where | Cost |
|------|-------|------|
| Domain (3ccore.com) | GoDaddy ✅ Already purchased | — |
| Hosting | Vercel (GitHub integration) | Free tier |
| Email sending | Resend.com | Free / 3,000/mo |
| GitHub | Already have ✅ | Free |
| SSL | Auto via Vercel | Free |
| DNS | GoDaddy A record | Free |


---

## Function region (added 16 Sep 2026)

`vercel.json` pins serverless functions to London:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["lhr1"]
}
```

Without this, Vercel functions default to Washington DC (`iad1`). They handle UK
tenant and landlord personal data, so the region belongs in the repository
rather than in dashboard settings that nobody can audit.

Verify after deploying: the Vercel deployment summary lists the function region,
and `GET /api/health` echoes `VERCEL_REGION`.

## Health check

`GET /api/health` → `{ "status": "ok", "db": "ok" | "unavailable", "region": "lhr1" }`

No authentication, `Cache-Control: no-store`, and deliberately no error detail.
Always HTTP 200 so an uptime check can tell "app up, database down" from
"app down".
