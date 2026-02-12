# Askify Website - Deployment Guide

> How to deploy the Askify website alongside the bot

---

## Deployment Strategy

The Askify website is served from the same Express server that runs the bot's health check endpoint. This means:

- ✅ Single deployment (bot + website together)
- ✅ Same port for both services
- ✅ No separate hosting needed
- ✅ Automatic deployment with bot updates

---

## How It Works

The `healthServer.ts` file serves:
1. Static files from `web/dist/client/` (built website)
2. `/health` endpoint for health checks
3. SPA fallback for all other routes (serves index.html)

**Routes:**
- `http://localhost:3000/` → Website landing page
- `http://localhost:3000/docs` → Documentation
- `http://localhost:3000/changelog` → Changelog
- `http://localhost:3000/health` → Health check endpoint

---

## Build Process

### Development

**Run bot only:**
```bash
npm run dev
```

**Run website only (for development):**
```bash
npm run dev:web
```

**Run both (in separate terminals):**
```bash
# Terminal 1: Bot
npm run dev

# Terminal 2: Website
npm run dev:web
```

### Production Build

Build both bot and website:
```bash
npm run build
```

This runs:
1. `npm run build:bot` - Compiles TypeScript for bot
2. `npm run build:web` - Builds website (runs `generate:sitemap` then `vite build`)

### Start Production

```bash
npm start
```

The bot starts and serves:
- Slack bot on Socket Mode
- Website at `http://localhost:3000`
- Health check at `http://localhost:3000/health`

---

## File Structure

```
askify-bot/
  src/
    lib/
      healthServer.ts       # Serves website + health endpoint

  web/
    dist/
      client/               # Built website (served by Express)
        index.html
        assets/
          *.js
          *.css
      server/               # SSR server files (not used in static mode)

    public/
      logo.PNG              # Copied to dist/client
      assets/
      manifest.json
      robots.txt
      sitemap.xml
```

---

## Environment Variables

No additional environment variables needed for the website. It uses the same Express server as the health check.

**Optional (for production):**
- `PORT` - Server port (default: 3000)

---

## Deployment Platforms

### Docker Deployment

Update your Dockerfile to include website build:

```dockerfile
# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/

# Install all dependencies
RUN npm ci
RUN cd web && npm ci

# Copy source
COPY . .

# Build bot + website
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

CMD ["npm", "start"]
```

### VPS Deployment

On your VPS (already set up with PM2):

```bash
# Pull latest code
git pull

# Install dependencies (both bot and web)
npm install
cd web && npm install && cd ..

# Build everything
npm run build

# Restart with PM2
pm2 restart askify-bot
```

The PM2 ecosystem config will automatically pick up the new build.

---

## Nginx Configuration (Optional)

If you want to serve the website through Nginx for better performance:

```nginx
server {
    listen 80;
    server_name askify.app;

    # Serve website
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Verification

After deployment, verify:

1. **Website loads:**
   ```bash
   curl http://localhost:3000/
   ```

2. **Health check works:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Static assets load:**
   ```bash
   curl http://localhost:3000/logo.PNG
   curl http://localhost:3000/sitemap.xml
   curl http://localhost:3000/robots.txt
   ```

4. **All routes work:**
   - `/` - Landing page
   - `/docs` - Documentation
   - `/changelog` - Changelog
   - `/terms` - Terms of Service
   - `/privacy` - Privacy Policy

---

## Build Output

After `npm run build`, you should see:

```
✓ Sitemap generated at /path/to/web/public/sitemap.xml
✓ 16 URLs included

vite v7.3.1 building client environment for production...
✓ 1832 modules transformed.
✓ built in 1.33s

dist/client/
  assets/
    globals-*.css
    index-*.js
    main-*.js
  index.html
  logo.PNG
  manifest.json
  robots.txt
  sitemap.xml
```

---

## Troubleshooting

### Website not loading

Check that:
- `web/dist/client/` directory exists
- Build completed successfully: `npm run build:web`
- Express server is serving static files (check healthServer.ts)

### 404 on routes

Ensure the SPA fallback is working:
- All routes except `/health` should serve `index.html`
- TanStack Router handles client-side routing

### Assets not loading

Check paths in `healthServer.ts`:
- Static path should point to `web/dist/client`
- Verify files exist in dist after build

---

## CI/CD Integration

Update your GitHub Actions workflow to build the website:

```yaml
- name: Build bot and website
  run: npm run build

- name: Deploy to VPS
  run: |
    rsync -avz --delete dist/ ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/app/dist/
    rsync -avz --delete web/dist/ ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }}:/app/web/dist/
    ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} "cd /app && pm2 restart askify-bot"
```

---

## Next Steps

1. Build the website: `npm run build:web`
2. Test locally: `npm start` then visit `http://localhost:3000`
3. Deploy to VPS with updated build process
4. Verify all routes work in production

---

## Benefits of This Approach

- ✅ Single deployment process
- ✅ Same Docker image for bot + website
- ✅ No additional hosting costs
- ✅ Unified logging and monitoring
- ✅ Same environment variables
- ✅ Simple PM2 process management

---

**Website is production-ready!** 🎉
