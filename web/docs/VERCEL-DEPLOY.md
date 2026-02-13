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
   - **Output Directory:** Leave blank (Nitro auto-generates `.vercel/output/`)

4. Click **Deploy**

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

The `vercel.json` file is already configured:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

Nitro (configured in `vite.config.ts`) auto-detects the Vercel environment during build and generates the `.vercel/output/` directory in the correct format. No `framework` or `outputDirectory` overrides are needed.

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

- **Production (Custom Domain):** [askify.jnahian.me](https://askify.jnahian.me) ✅
- **Vercel URL:** `https://askify-web.vercel.app`
- **Preview:** `https://askify-web-<hash>.vercel.app` (per branch)

---

## Build Verification

Before deploying, test the build locally:

```bash
# From web directory
npm run build
npm run preview

# Visit http://localhost:3000 (or your WEB_PORT)
```

The build outputs to `.output/` locally (using `node-server` preset). On Vercel, Nitro switches to the `vercel` preset automatically.

---

## Troubleshooting

### Build fails on Vercel

- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally
- Verify all dependencies are in `package.json` (not devDependencies)

### Routes return 404

- Ensure `nitro` is installed and `nitro()` is in `vite.config.ts` plugins
- Do NOT set `framework` or `outputDirectory` in `vercel.json` — Nitro handles this
- Nitro auto-detects Vercel and outputs to `.vercel/output/` for proper SSR routing
- TanStack Start handles client-side routing automatically

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
