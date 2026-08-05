# Deployment Plan — Rushi & Vinally Wedding Website

## Overview
This document outlines the architecture and steps to deploy the Next.js wedding website to the internet. All pieces are already configured in code; this plan handles the hosting layer and wiring them together.

---

## 0. Get Code on GitHub

**What:** GitHub is the version control platform that Vercel watches for changes. Every push to GitHub triggers a new deployment.

**Setup steps:**

### 0a. Create a GitHub Repository
1. Go to https://github.com/new
2. Sign up (if you don't have an account) or log in
3. Create a new repository:
   - **Repository name:** `rushivinally-wedding` (or whatever you prefer)
   - **Description:** "Rushi & Vinally's Wedding Website"
   - **Visibility:** Public (required for free Vercel tier) or Private (if you have a paid Vercel account)
   - Do NOT initialize with README/gitignore — you already have one locally
4. Click "Create repository"
5. GitHub shows you a quick setup guide; follow the **"…or push an existing repository from the command line"** section

### 0b. Push Local Code to GitHub
From your project directory (`/Users/rushi/Downloads/Projects/rushivinally_wedding`), run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/rushivinally-wedding.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

**What this does:**
- `git remote add origin` — tells Git where to send your code
- `git branch -M main` — renames your branch to `main` (if needed)
- `git push -u origin main` — uploads all your commits to GitHub

### 0c. Verify on GitHub
1. Go to https://github.com/YOUR_USERNAME/rushivinally-wedding
2. You should see all your project files (src/, public/, package.json, etc.)
3. Done! Your code is now on GitHub.

**Future workflow:** Every time you make changes locally:
```bash
git add .
git commit -m "Your change description"
git push
```
GitHub will notify Vercel, which auto-deploys to the internet.

---

## 1. Frontend Hosting — Vercel

**What:** Vercel is the official Next.js hosting platform. It handles building, deploying, and serving the Next.js app with zero configuration.

**Setup steps:**
1. Create a Vercel account at https://vercel.com
2. Connect your GitHub repository (or GitLab/Bitbucket)
3. Select the repository containing this project
4. Vercel auto-detects Next.js and asks for environment variables (see section below)
5. Click Deploy
6. Every push to your main branch auto-deploys

**Why Vercel:**
- Optimizes Next.js automatically (Image, Font, etc.)
- Free tier supports small projects
- Instant deployments, built-in CI/CD
- Serverless functions if we add API routes later

---

## 2. Environment Variables

**What:** Secrets and config that shouldn't be in source code (API keys, database URLs, etc.).

**Variables needed (create in Vercel dashboard > Settings > Environment Variables):**

| Variable | Source | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | Public endpoint for database queries |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings | Public key for client-side DB access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings | Private key for server-side DB access (if needed) |
| `RESEND_API_KEY` | Resend dashboard | API key for sending emails |
| `NEXT_PUBLIC_MAPLIBRE_STYLE_URL` | Stadia Maps or Carto account | Vector tile style URL for maps |

**How to get each:**
1. **Supabase:** Log in to your Supabase project → Settings → API
2. **Resend:** Create account at https://resend.com → Dashboard → API Keys
3. **MapLibre:** If using Stadia Maps or Carto, grab the style URL from their dashboard

---

## 3. Database — Supabase (PostgreSQL)

**Current state:** Code has `lib/supabaseClient.ts` stub ready to connect.

**Setup steps:**
1. Create Supabase account at https://supabase.com
2. Create a new project (free tier available)
3. Go to Settings → API to copy your URL and keys
4. (Optional) Create database tables if you plan to store RSVP data, guest list, etc. — currently the site reads from `src/data/weddingDetails.ts` (hardcoded)
5. Add the Supabase URL and keys to Vercel environment variables (see section 2)

**Current usage:** None yet — the site is read-only (no forms saving data). If you add an RSVP form later, this is where guest responses go.

---

## 4. Email Service — Resend

**Current state:** Code has `lib/resend.ts` stub ready.

**Setup steps:**
1. Create Resend account at https://resend.com
2. Verify your domain (or use a Resend subdomain for testing)
3. Go to Dashboard → API Keys and copy your API key
4. Add `RESEND_API_KEY` to Vercel environment variables (see section 2)

**Current usage:** None yet — the site has no email forms. If you add a contact form or RSVP email confirmation, this is what sends them.

**Domain verification:** To send from `@yourweddingdomain.com`, add the verification records Resend gives you to your domain's DNS.

---

## 5. Maps — MapLibre GL JS (already working)

**Current state:** Fully integrated. Uses Carto or Stadia Maps vector tiles.

**Setup steps:**
1. Determine which tile provider you want:
   - **Carto (free tier):** https://carto.com/developers/
   - **Stadia Maps (free tier):** https://stadiamaps.com/
2. Sign up and grab your style URL
3. Add to Vercel as `NEXT_PUBLIC_MAPLIBRE_STYLE_URL`

**Note:** Worker files (`public/vendor/maplibre-gl-*.mjs`) are already in place for the map to work.

---

## 6. Audio & Static Assets

**Current state:** Audio file at `public/audio/ghar music only.mp3` and hero images at `public/images/hero/`.

**Setup:** Vercel serves these automatically from the `public/` directory — no additional config needed.

---

## 7. Domain & DNS

**What:** Point your custom domain (e.g., `rushivinally.com`) to Vercel.

**Setup steps:**
1. Buy domain from any registrar (GoDaddy, Namecheap, Google Domains, etc.)
2. In Vercel dashboard → Project Settings → Domains
3. Add your domain
4. Vercel shows you the DNS records to add to your registrar
5. Update your registrar's DNS settings with those records
6. Wait 24–48 hours for DNS to propagate
7. HTTPS (SSL) is automatic via Vercel

**Timeline:** This is the main blocker for launch. Domain setup takes 1–2 days.

---

## 8. Deployment Workflow

**Local → GitHub → Vercel:**
1. Make changes locally, test on `npm run dev`
2. Commit and push to main branch: `git push origin main`
3. GitHub sends webhook to Vercel
4. Vercel auto-builds and deploys
5. Site goes live at your domain in ~2–5 minutes

**Rollback:** If something breaks, revert the commit on GitHub and push — Vercel redeploys the previous version automatically.

---

## 9. Monitoring & Debugging

**Vercel dashboard:**
- **Deployments:** See all past deploys, logs, errors
- **Analytics:** Page views, performance metrics
- **Edge Network:** See which regions served requests

**Client-side errors:** Add Sentry or similar (not yet in the code).

---

## 10. Checklist Before Launch

- [ ] Vercel account created, GitHub connected
- [ ] `.env.local` updated with all secrets (Supabase, Resend, MapLibre keys)
- [ ] Vercel environment variables filled in (same keys)
- [ ] Domain registered
- [ ] Domain DNS records added to Vercel
- [ ] Test deploy to staging (Vercel Preview URL)
- [ ] Verify all links, images, map, audio play
- [ ] Set up monitoring/error tracking (optional)
- [ ] Domain DNS propagated (can take 24–48 hours)

---

## 11. Post-Launch Maintenance

**Regular tasks:**
- Keep `node_modules` and Next.js up to date (`npm outdated`)
- Monitor Vercel dashboard for errors
- Backup Supabase data periodically (if storing guest data)
- Renew domain before expiration

**Future features:**
- RSVP form → saves to Supabase
- Contact form → sends email via Resend
- Guest list admin dashboard → queries Supabase
- Analytics dashboard → display attendance data

---

## Cost Estimate (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Vercel | Up to 100k serverless function invocations/month | $20+/month for higher limits |
| Supabase | 500 MB storage, 2 GB bandwidth/month | $25+/month for more |
| Resend | 100 emails/day | $20+/month for unlimited |
| Domain | $10–15/year | Varies by registrar |
| MapLibre (Carto/Stadia) | Free tier | $50–100+/month for high volume |

**Total for a simple wedding site:** $0–10/month (free tiers sufficient for typical traffic).

---

## Summary

**The order you need to do this:**
1. **Push code to GitHub** (Section 0 — do this first!)
   - Create GitHub repo
   - Run `git push` to upload your code
2. Register domain (parallel with step 3)
3. Set up Supabase, Resend, MapLibre accounts → copy API keys
4. Create Vercel account and connect to GitHub repo
5. Add environment variables to Vercel
6. Verify domain DNS records in Vercel
7. Test the live site at your domain
8. Launch!

**Estimated time:** 1 hour for GitHub setup + 1–2 hours for Vercel/services setup + 24–48 hours waiting for DNS.

**Critical path:** GitHub → Vercel → Domain DNS (everything else can happen in parallel).
