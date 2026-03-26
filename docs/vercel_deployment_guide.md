# After Me — Vercel Deployment Guide

## Overview

The website (`web/` folder) is deployed via GitHub → Vercel automatic integration.
Every push to the `main` branch on GitHub triggers an automatic deployment.
No manual steps are needed after initial setup.

---

## Initial Setup (one-time)

### Step 1 — Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up or log in using **"Continue with GitHub"** — this links both accounts in one step
3. On your dashboard click **Add New… → Project**
4. Find the `ProjectDie` repository and click **Import**
   - If it doesn't appear, click **"Adjust GitHub App Permissions"** and grant Vercel access to `ProjectDie`

### Step 2 — Configure the project

On the "Configure Project" screen:

| Setting | Value |
|---|---|
| **Root Directory** | `web` |
| **Framework Preset** | Other |
| **Build Command** | *(leave blank)* |
| **Output Directory** | *(leave blank)* |

> The Root Directory setting is critical. The website lives in `web/`, not the repo root.
> Vercel must be pointed at `web/` or it will try to deploy the entire monorepo.

Click **Deploy**. Vercel will build and give you a preview URL (e.g. `projectdie.vercel.app`).
Open it to confirm the site looks correct before adding the custom domain.

---

### Step 3 — Add your custom domain

1. In the Vercel dashboard, open the project → **Settings → Domains**
2. Add `myafterme.co.uk` and click **Add**
3. Add `www.myafterme.co.uk` and click **Add**

Vercel will display the DNS records you need:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

### Step 4 — Update DNS at your registrar

1. Log in to your domain registrar (wherever `myafterme.co.uk` was purchased)
2. Go to **DNS Settings / Zone Editor / Manage DNS**
3. Delete any existing `A` record for `@` — replace it with `76.76.21.21`
4. Delete any existing `CNAME` for `www` — replace it with `cname.vercel-dns.com`
5. Save changes

DNS propagation typically takes **5–30 minutes** for `.co.uk` domains (up to 2 hours maximum).

### Step 5 — SSL certificate

Once Vercel detects the correct DNS records, the domain status turns green.
A free SSL certificate (HTTPS) is issued automatically via Let's Encrypt — no action required.

---

## Day-to-Day Workflow

To update the live website, simply edit files in the `web/` folder and push to `main`:

```bash
cd /Users/luffy/ProjectDie
git add web/
git commit -m "update website copy"
git push
```

Vercel detects the push and deploys in under 30 seconds.
The live site at `myafterme.co.uk` is updated automatically.

### Preview deployments

Pushing to any branch other than `main` creates a **preview URL** — a temporary live version of the site you can review before it goes live.
Nothing is published to `myafterme.co.uk` until the branch is merged into `main`.

---

## Current git status

The `web/` folder is fully tracked in the `ProjectDie` git repository.
All website files are committed and pushed to `origin/main`.

Files currently modified and awaiting commit:
- `web/index.html` — updated hero, phone mockup, Family Kit steps, CTAs, free tier copy
- `web/how-it-works.html` — updated survivor steps, findFile guidance, handoff checklist references

Run the following to commit these before setting up Vercel:

```bash
cd /Users/luffy/ProjectDie
git add web/index.html web/how-it-works.html
git commit -m "update website to reflect new app flow and April 2026 launch framing"
git push
```

---

## Key URLs

| URL | Purpose |
|---|---|
| `https://myafterme.co.uk` | Live site (once domain is connected) |
| `https://myafterme.co.uk/how-it-works` | How the Family Kit and survivor flow works |
| `https://myafterme.co.uk/privacy` | Privacy policy (required for ICO registration) |
| `https://myafterme.co.uk/terms` | Terms of service |
| `https://myafterme.co.uk/support` | Support page |
| `https://myafterme.co.uk/format-spec` | Open .afterme format specification |
| `https://myafterme.co.uk/blog/` | Blog index |

---

## Notes

- The `vercel.json` file in `web/` is already configured with security headers, HTTPS caching rules, and clean URLs. No changes needed.
- ICO registration note: the privacy policy at `myafterme.co.uk/privacy` will be the reference URL in your ICO application. Confirm that page is accurate before submitting.
- `cleanUrls: true` in `vercel.json` means URLs work without `.html` extensions (e.g. `/how-it-works` not `/how-it-works.html`).
