# Deploy Askify Website to Vercel

> Quick guide for deploying the website to Vercel

---

## Option 1: Deploy via Vercel CLI (Recommended)

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Navigate to web directory

```bash
cd web
```

### 3. Deploy

```bash
# First deployment (will prompt for configuration)
vercel

# Production deployment
vercel --prod
```

### 4. Follow prompts

- Set up and deploy: **Y**
- Which scope: Choose your account
- Link to existing project: **N**
- Project name: **askify** (or your preferred name)
- Directory: **.** (current directory)
- Override settings: **N**

Vercel will automatically:
- Detect TanStack Start
- Run `npm run build`
- Deploy to a preview URL

---

## Option 2: Deploy via Vercel Dashboard

### 1. Push to GitHub

Ensure your `website` branch is pushed:
```bash
git push origin website
```

### 2. Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository: `jnahian/askify-bot`
3. Configure project:
   - **Project Name:** askify-web
   - **Framework Preset:** Other
   - **Root Directory:** `web`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`

4. Click **Deploy**

> **Note:** Vercel will automatically detect the `api/index.js` serverless function and the `vercel.json` configuration. No need to set an output directory.

### 3. Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain (e.g., `askify.app`)
3. Update DNS records as instructed
4. Vercel handles SSL automatically

---

## Environment Variables

No environment variables needed for the website! It's completely static.

If you want to customize the site URL (for SEO/OG tags), you can set:

- **Key:** `VITE_SITE_URL`
- **Value:** `https://askify.jnahian.me`

Then update `src/lib/seo.ts` to use:
```typescript
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://askify.jnahian.me'
```

---

## Vercel Configuration

The `vercel.json` file is configured to deploy the TanStack Start SSR application:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

The `api/index.js` serverless function:
- Handles all SSR page rendering via TanStack Start
- Serves static assets (JS, CSS, images) from `dist/client`
- Uses Web Standard Request/Response API

---

## Deployment Workflow

### Automatic Deployments

Once connected to GitHub, Vercel will automatically:

- **Preview Deployments:** Every push to any branch
- **Production Deployments:** Every push to `main` branch (or your default branch)

### Manual Deployments

From the `web` directory:

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

---

## Post-Deployment Tasks

After first deployment:

1. **Update Slack OAuth URL**
   - Get your production URL from Vercel
   - Update Slack OAuth client ID in:
     - `src/components/landing/HeroModern.tsx`
     - `src/components/landing/Hero.tsx` (if still using)
     - `src/components/landing/CTASection.tsx`
     - `src/components/layout/Navbar.tsx`

2. **Add Custom Domain** (Optional)
   - Configure in Vercel dashboard
   - Update DNS records
   - SSL is automatic

3. **Update OG Images** (Optional)
   - Create 1200x630px images
   - Add to `public/assets/og-images/`
   - Redeploy

4. **Add Screenshots** (Optional)
   - Take screenshots of Askify bot
   - Add to `public/assets/screenshots/`
   - Update `Screenshots.tsx` component
   - Redeploy

---

## Vercel URL Structure

After deployment, your site will be available at:

- **Preview:** `https://askify-web-<hash>.vercel.app`
- **Production:** `https://askify-web.vercel.app`
- **Custom Domain:** `https://askify.jnahian.me` (if configured)

---

## Build Verification

Before deploying, test the build locally:

```bash
# From web directory
npm run build
npm run preview

# Visit http://localhost:4051 (or your WEB_PORT)
```

If the build works locally, it will work on Vercel!

---

## Troubleshooting

### Build fails on Vercel

- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally
- Verify all dependencies are in `package.json` (not devDependencies)

### Routes return 404

- Ensure the `api/index.js` serverless function exists
- Verify `vercel.json` has the rewrite rule routing to `/api`
- Check Vercel function logs for errors
- TanStack Start server handles all routing automatically
- Vercel should serve the app correctly

### Assets not loading

- Check public folder is included in build
- Verify asset paths are relative (starting with `/`)
- Clear Vercel cache and redeploy

---

## Updating the Website

### Via Git Push

1. Make changes in the `web` directory
2. Commit and push to `website` branch
3. Vercel deploys automatically (preview)
4. Merge to `main` for production deployment

### Via Vercel CLI

```bash
cd web
vercel --prod
```

Deploys immediately to production.

---

## Cost

Vercel Free Tier includes:
- ✅ Unlimited preview deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Custom domains
- ✅ Edge network (CDN)
- ✅ DDoS protection

Perfect for the Askify website! 🚀

---

## Alternative: Keep Bot + Website Together

If you prefer to keep everything on your VPS:

1. Don't deploy to Vercel
2. Use PM2 with `ecosystem.config.cjs`
3. Set up Nginx reverse proxy:
   - Bot: `https://api.askify.app` (port 4050)
   - Website: `https://askify.jnahian.me` (port 4051)

Both approaches work great!
