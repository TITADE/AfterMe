# After Me — Marketing Website

Static landing page for After Me. Deploy to Vercel.

## Deploy to Vercel

### Option 1: Deploy from dashboard (recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project**
3. Import your Git repository (or upload the `web` folder)
4. Set **Root Directory** to `web`
5. Leave **Build Command** empty (static site, no build)
6. Click **Deploy**

### Option 2: Deploy via CLI

```bash
# From project root
cd web
vercel
```

If you have the Vercel CLI installed (`npm i -g vercel`), this deploys the `web` folder directly.

### Option 3: Deploy from project root

If deploying the whole repo with `web` as a subfolder:

1. In Vercel project settings, set **Root Directory** to `web`
2. Deploy as normal
