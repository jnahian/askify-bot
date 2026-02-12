# Askify

An internal Slack poll bot for team decisions, engagement, and feedback.

## Features

- **4 Poll Types** — Single choice, multi-select, yes/no/maybe, rating scale (1-5 or 1-10)
- **Rich Voting UX** — Interactive buttons, real-time bar charts with color-coded emoji, vote change/retraction
- **Emoji Support** — Use `:emoji_codes:` like `:fire:` `:rocket:` in questions and options
- **Anonymous Voting** — Voter identity hidden from messages; stored only for deduplication
- **Scheduled Polls** — Schedule polls for future posting with a datetime picker
- **Auto-Close** — Close after a duration or at a specific date/time
- **Reminder DMs** — Automatically DM non-voters before a poll closes
- **Templates** — Save and reuse poll configurations
- **Voter-Added Options** — Let voters suggest new choices on single/multi-select polls
- **Share Results** — Post formatted results to any channel after closing
- **Inline Quick Polls** — Create polls from the command line: `/askify poll "Q?" "A" "B" --flags`
- **Dynamic Modals** — Poll creation modal adapts based on poll type, close method, and scheduling
- **App Home Tab** — Usage guide and feature overview accessible from the bot's Home tab
- **DM Responses** — Bot responds helpfully when users message it directly

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL (via [Supabase](https://supabase.com) or local)
- A Slack workspace with admin access to create apps

### 1. Clone & Install

```bash
git clone git@github.com:jnahian/askify-bot.git
cd askify-bot
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `SLACK_BOT_TOKEN` | Bot OAuth token (`xoxb-...`) |
| `SLACK_SIGNING_SECRET` | Request signing secret |
| `SLACK_APP_TOKEN` | App-level token for Socket Mode (`xapp-...`) |
| `DATABASE_URL` | PostgreSQL connection string |

### 3. Set Up Database

```bash
npm run prisma:migrate   # Create tables
npm run prisma:generate  # Generate Prisma Client
```

### 4. Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app
2. Enable **Socket Mode** and generate an app-level token (`xapp-`)
3. Add the `/askify` slash command
4. Enable **Interactivity**
5. Add bot token scopes: `chat:write`, `commands`, `channels:read`, `users:read`, `im:write`
6. Subscribe to bot events: `app_home_opened`, `message.im`
7. Install to your workspace

### 5. Run

```bash
npm run dev    # Development (hot-reload)
npm run build  # Compile TypeScript
npm start      # Production
```

## Usage

| Command | Description |
|---|---|
| `/askify` | Open poll creation modal |
| `/askify poll "Q?" "A" "B"` | Quick inline poll in current channel |
| `/askify list` | View your active & scheduled polls |
| `/askify templates` | Manage saved poll templates |
| `/askify help` | Show usage guide |

### Inline Poll

Create polls directly from the command line without opening a modal:

```
/askify poll "What's for lunch?" "Pizza" "Sushi" "Tacos"
/askify poll "Best framework?" "React" "Vue" "Svelte" --multi --anon --close 4h
/askify poll "Move standup to 10am?" --yesno --close 30m
/askify poll "Rate the sprint" --rating
```

| Flag | Description |
|---|---|
| `--multi` | Multi-select poll |
| `--yesno` | Yes/No/Maybe (no options needed) |
| `--rating` | Rating scale 1-5 (use `--rating 10` for 1-10) |
| `--anon` | Anonymous voting |
| `--close <N>h\|m` | Auto-close after duration (e.g. `2h`, `30m`) |

## Architecture

```
src/
  app.ts              # Bolt app entry point
  lib/prisma.ts       # Prisma client singleton
  commands/           # Slash command handlers
  actions/            # Block action handlers (votes, buttons)
  views/              # Modal definitions & submission handlers
  events/             # Event handlers (DM messages, App Home tab)
  middleware/         # Global middleware (request logger)
  services/           # Business logic (poll, vote, template)
  blocks/             # Block Kit message builders
  jobs/               # Cron jobs (auto-close, reminders, scheduled posts)
  utils/              # Helpers (bar charts, debounce, retry)
prisma/
  schema.prisma       # Database schema (4 models)
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for Docker deployment instructions.

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 22 |
| Slack SDK | @slack/bolt v4 (Socket Mode) |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma v7 with `@prisma/adapter-pg` |
| Scheduler | node-cron |
| Deployment | Docker |

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Development TODO](docs/TODO.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Website

The Askify website is built with TanStack Start and served from the same Express server as the bot.

- **Source:** [`web/`](web/)
- **Live site:** Served at `http://localhost:3000` when running the bot
- **Build:** `npm run build:web`
- **Dev:** `npm run dev:web`

See [web/README.md](web/README.md) for website development details.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
