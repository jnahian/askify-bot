# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Askify is an internal Slack poll bot built with Bolt for JavaScript (Socket Mode) and PostgreSQL via Supabase. It supports four poll types (single choice, multi-select, yes/no/maybe, rating scale) with configurable voting settings.

## Commands

```bash
npm run dev              # Start with hot-reload (nodemon + ts-node)
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled app
npm run prisma:generate  # Regenerate Prisma Client after schema changes
npm run prisma:migrate   # Create and apply database migrations
npm run prisma:studio    # Open Prisma data browser
```

## Architecture

**Entry point:** `src/app.ts` — creates the Bolt app, registers all handlers, starts background jobs.

**Module registration pattern:** Each module directory has an `index.ts` that exports a `register*(app: App)` function called from `app.ts`. To add a new command/action/view, create the handler file and wire it through the directory's `index.ts`.

```
src/commands/   → app.command() handlers (slash commands)
src/actions/    → app.action() handlers (buttons, select menus)
src/views/      → app.view() handlers (modal submissions)
src/services/   → Business logic and database operations
src/blocks/     → Block Kit message builders (returns { blocks, text })
src/jobs/       → node-cron background jobs (receive WebClient from app.ts)
src/utils/      → Pure utility functions
src/lib/        → Shared singletons (Prisma client)
```

**Event flow:** `/askify` command → opens modal → modal submission creates poll in DB and posts to channel → vote button clicks update DB and refresh message via `chat.update` → close (manual or auto-close cron) disables voting and DMs results to creator.

## Prisma (v7)

- **Schema:** `prisma/schema.prisma`
- **Config:** `prisma.config.ts` (datasource URL from env)
- **Generated client:** `src/generated/prisma/` — import from `../generated/prisma/client`
- **Instantiation requires adapter:** `new PrismaClient({ adapter })` with `PrismaPg` from `@prisma/adapter-pg` (see `src/lib/prisma.ts`)
- **Models:** Poll, PollOption, Vote, PollTemplate — all use UUID primary keys
- After any schema change: run `npx prisma migrate dev` then `npx prisma generate`

## Key Patterns

- **Vote action IDs** use the format `vote_{optionId}` with value `{pollId}:{optionId}`. The handler matches via regex: `app.action(/^vote_.+$/)`
- **Dynamic modals** use `dispatch_action: true` on select elements to trigger `app.action()` handlers that call `client.views.update()` with rebuilt modal
- **Poll settings** are stored as JSON in the `settings` column: `{ anonymous, allowVoteChange, liveResults, ratingScale }`
- **Message updates** require storing `message_ts` from `chat.postMessage` response — this is saved via `updatePollMessageTs()`
- **Types from Slack:** Import `KnownBlock`, `Button`, `View` etc. from `@slack/types` (not `@slack/bolt`)

## Environment Variables

Required in `.env` (see `.env.example`):
- `SLACK_BOT_TOKEN` — Bot OAuth token (`xoxb-`)
- `SLACK_SIGNING_SECRET` — Request signing secret
- `SLACK_APP_TOKEN` — App-level token for Socket Mode (`xapp-`)
- `DATABASE_URL` — Supabase PostgreSQL connection string
