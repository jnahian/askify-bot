# Deployment Guide

This guide covers deploying Askify to Fly.io (free tier) or any Docker host.

## Prerequisites

- A Supabase PostgreSQL database (or any PostgreSQL instance)
- A configured Slack app with Socket Mode enabled

---

## Deploy to Fly.io (Free Tier)

Fly.io's free tier includes 3 shared VMs with 256MB RAM — enough to run Askify. Since the bot uses Socket Mode (outbound WebSocket), no inbound ports or custom domains are needed.

### 1. Install the Fly CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Then sign up / log in
fly auth signup
# or
fly auth login
```

### 2. Launch the app

From the project root:

```bash
fly launch
```

When prompted:
- **App name**: `askify-bot` (or your choice)
- **Region**: Pick the closest to your team
- **Database**: Select **No** (you're using Supabase)
- **Deploy now**: Select **No** (we need to set secrets first)

This creates a `fly.toml` config file. Edit it to ensure the app runs as a long-lived process (not a web service):

```toml
app = 'askify-bot'
primary_region = 'sea'  # your chosen region

[build]

# No HTTP services needed — Socket Mode connects outbound
[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1
```

Remove any `[http_service]` or `[[services]]` sections if present — Askify doesn't serve HTTP traffic.

### 3. Set secrets

```bash
fly secrets set \
  SLACK_BOT_TOKEN=xoxb-your-bot-token \
  SLACK_SIGNING_SECRET=your-signing-secret \
  SLACK_APP_TOKEN=xapp-your-app-token \
  DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### 4. Run database migrations

```bash
# Run migrations via a one-off machine
fly machine run . --rm -e DATABASE_URL="postgresql://user:password@host:5432/dbname" -- npx prisma migrate deploy
```

Or run locally if you have Node.js installed:

```bash
npm install
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### 5. Deploy

```bash
fly deploy
```

### Monitoring

```bash
fly status            # Check app status
fly logs              # Stream live logs
fly ssh console       # SSH into the running machine
```

### Updating

```bash
git pull
fly deploy            # Rebuilds and deploys
```

If there are new database migrations:

```bash
fly machine run . --rm -e DATABASE_URL="..." -- npx prisma migrate deploy
fly deploy
```

### Cost

Fly.io free tier includes:
- 3 shared-cpu-1x VMs (256MB RAM each)
- 3GB persistent storage
- 160GB outbound bandwidth/month

Askify uses 1 VM and minimal bandwidth — well within free limits.

---

## Deploy to Docker Host (VPS)

For self-hosted deployments on any server running Docker.

### Prerequisites

- Docker and Docker Compose installed on your server

### Quick Deploy

### 1. Clone and configure

```bash
git clone git@github.com:jnahian/askify-bot.git
cd askify-bot
cp .env.example .env
```

Edit `.env` with your production credentials:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### 2. Run database migrations

```bash
# Using Docker (recommended)
docker build -t askify-bot .
docker run --rm --env-file .env askify-bot npx prisma migrate deploy

# Or locally if you have Node.js installed
npm install
npx prisma migrate deploy
```

### 3. Start the application

**Option A: App only (with external database like Supabase)**

```bash
docker build -t askify-bot .
docker run -d --restart unless-stopped --env-file .env --name askify askify-bot
```

**Option B: App + local Postgres (for development/testing)**

```bash
# Set DATABASE_URL in .env to:
# DATABASE_URL=postgresql://postgres:postgres@db:5432/askify

docker compose up -d
```

## Docker Configuration

### Dockerfile

The Dockerfile uses a multi-stage build:

1. **Build stage** — Installs all dependencies, generates Prisma client, compiles TypeScript
2. **Production stage** — Copies only compiled JS, production deps, and Prisma client

Final image is ~150MB based on `node:22-alpine`.

### docker-compose.yml

Two services:

| Service | Description |
|---|---|
| `app` | The Askify bot, built from Dockerfile |
| `db` | PostgreSQL 16 Alpine with persistent volume |

The `app` service waits for `db` to be healthy before starting.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | Yes | Bot OAuth token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Yes | Request signing secret from Slack app settings |
| `SLACK_APP_TOKEN` | Yes | App-level token for Socket Mode (`xapp-...`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | No | Set to `production` automatically in Docker |

## Networking

Askify uses **Socket Mode**, which means:

- No inbound HTTP ports need to be exposed
- The bot connects outbound to Slack via WebSocket
- No reverse proxy or SSL termination required
- Firewalls only need to allow outbound HTTPS (port 443)

## Health Monitoring

### Check if the container is running

```bash
docker ps | grep askify
```

### View logs

```bash
docker logs askify --tail 100 -f
```

### Restart the bot

```bash
docker restart askify
```

## Updating

```bash
git pull
docker build -t askify-bot .
docker run --rm --env-file .env askify-bot npx prisma migrate deploy
docker stop askify && docker rm askify
docker run -d --restart unless-stopped --env-file .env --name askify askify-bot
```

Or with Docker Compose:

```bash
git pull
docker compose build
docker compose run --rm app npx prisma migrate deploy
docker compose up -d
```

## Troubleshooting

### Bot not connecting

- Verify `SLACK_APP_TOKEN` starts with `xapp-`
- Ensure Socket Mode is enabled in your Slack app settings
- Check logs: `docker logs askify`

### Database connection errors

- Verify `DATABASE_URL` is correct and the database is accessible from the server
- For Supabase: ensure connection pooling settings are compatible (use port 5432, not 6543)
- Run a test connection: `docker run --rm --env-file .env askify-bot node -e "require('./dist/lib/prisma')"`

### Prisma client not found

- The Prisma client is generated during `docker build`. If you see import errors, rebuild:
  ```bash
  docker build --no-cache -t askify-bot .
  ```

### Missed scheduled polls after restart

- Askify runs a startup recovery job that catches up on any scheduled polls or auto-close events that were missed while the bot was down. No manual intervention needed.
