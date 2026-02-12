# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Askify is an internal Slack poll bot built with Bolt for JavaScript (Socket Mode) and PostgreSQL via Supabase. It supports four poll types (single choice, multi-select, yes/no/maybe, rating scale) with configurable voting settings, scheduled polls, templates, reminder DMs, and shareable results.

## Commands

```bash
npm run dev              # Start with hot-reload (nodemon + ts-node)
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled app
npm run prisma:generate  # Regenerate Prisma Client after schema changes
npm run prisma:migrate   # Create and apply database migrations
npm run prisma:studio    # Open Prisma data browser
npx tsc --noEmit         # Type-check without emitting (use for validation)
```

## Architecture

**Entry point:** `src/app.ts` — creates the Bolt app, registers all handlers, runs startup recovery, then starts cron jobs.

**Startup order:** `registerRequestLogger` → `registerCommands` → `registerActions` → `registerViews` → `registerEvents` → `app.start()` → `runStartupRecovery()` → `startJobs()`

**Module registration pattern:** Each directory has an `index.ts` that exports a `register*(app)` or `start*(client)` function called from `app.ts`. To add a new handler, create the file and wire it through the directory's `index.ts`.

```
src/commands/    → app.command() handlers (/askify with subcommands: help, list, templates, poll)
src/actions/     → app.action() handlers (buttons, selects, regex-matched patterns)
src/views/       → app.view() handlers (modal submissions)
src/events/      → app.event() handlers (DM messages, App Home tab)
src/middleware/  → Global middleware (request logger, registered before handlers)
src/services/    → Business logic + Prisma DB operations (pollService, voteService, templateService)
src/blocks/      → Block Kit message builders (return { blocks, text })
src/jobs/        → node-cron background jobs + one-time startup recovery
src/utils/       → Pure utilities (barChart, debounce, slackRetry, channelError)
src/lib/         → Shared singletons (Prisma client)
```

**No test framework** is currently configured. Type-check with `npx tsc --noEmit`.

**Event flow:** `/askify` → opens modal → submission creates poll in DB → posts to channel (or schedules) → vote clicks update DB → debounced `chat.update` refreshes message → close (manual/auto-close cron) disables voting → DMs results with "Share Results" button → share posts to chosen channel.

## Prisma (v7)

- **Schema:** `prisma/schema.prisma`
- **Config:** `prisma.config.ts` (datasource URL from env)
- **Generated client:** `src/generated/prisma/` (gitignored) — import from `../generated/prisma/client`
- **Instantiation requires adapter:** `new PrismaClient({ adapter })` with `PrismaPg` from `@prisma/adapter-pg` (see `src/lib/prisma.ts`)
- **Models:** Poll, PollOption, Vote, PollTemplate — all use UUID primary keys
- After any schema change: run `npx prisma migrate dev` then `npx prisma generate`
- The generated client directory is gitignored — always run `prisma generate` after cloning

## Key Patterns

### Action ID Conventions
- **Vote buttons:** `vote_{optionId}` with value `{pollId}:{optionId}` — matched via `app.action(/^vote_.+$/)`
- **List actions:** `list_close_{pollId}`, `list_cancel_{pollId}` — matched via regex
- **Template actions:** `use_template_{id}`, `delete_template_{id}` — matched via regex
- **Static actions:** `close_poll`, `add_option`, `save_as_template`, `share_results`
- **Modal selects (dispatch_action):** `poll_type_select`, `close_method_select`, `schedule_method_select`, `add_modal_option`, `remove_modal_option`

### Modal Callback IDs
- `poll_creation_modal` — main creation modal
- `save_template_modal` — template name input
- `add_option_modal` — voter-added option input
- `share_results_modal` — channel select for sharing results

### Dynamic Modals
Select elements with `dispatch_action: true` trigger `app.action()` handlers that call `client.views.update()` with a rebuilt modal. The `buildPollCreationModal(opts: ModalOptions)` function accepts an options object with `pollType`, `closeMethod`, `scheduleMethod`, and `prefill` for template pre-filling. The `extractModalState()` helper in `modalActions.ts` reads current values from `body.view.state.values` before rebuilding.

### Poll Settings JSON
Stored in `Poll.settings` column: `{ anonymous, allowVoteChange, liveResults, ratingScale?, allowAddingOptions?, reminders? }`. Defaults: `allowVoteChange: true`, `liveResults: true`. The `allowAddingOptions` checkbox only appears for `single_choice`/`multi_select` poll types.

### Vote Semantics
- **Single choice / yes_no / rating:** Clicking the same option retracts the vote; clicking a different option switches (if vote change allowed). One vote per voter.
- **Multi-select:** Clicking an option toggles it on/off. Multiple selections per voter.
- `VoteResult.action` returns `'cast'`, `'retracted'`, `'switched'`, or `'rejected'`.

### Vote Update Debouncing
Rapid votes are debounced per poll ID (500ms) via `src/utils/debounce.ts`. The debounced callback re-fetches fresh poll data at execution time, so the final update always reflects the latest state.

### Slack API Retry
`src/utils/slackRetry.ts` provides `withRetry()` for exponential backoff on rate limit errors. Applied to `chat.update` in vote actions.

### Background Jobs
- **autoCloseJob** — every minute, closes expired polls (`status=active`, `closesAt <= now`)
- **scheduledPollJob** — every minute, posts due scheduled polls (`status=scheduled`, `scheduledAt <= now`)
- **reminderJob** — every 15 minutes, DMs non-voters with smart timing (1h or 24h before close)
- **startupRecovery** — runs once on startup, catches up on anything missed while bot was down

### Types from Slack
Import `KnownBlock`, `Button`, `View` from `@slack/types` (not `@slack/bolt`). The `@slack/bolt` package re-exports some but not all types.

### Key Types
`PollWithOptions` (in `pollService.ts`) is the primary interface used across blocks, actions, and jobs. It includes nested `options` with `_count.votes` and poll-level `_count.votes`. Cast from Prisma results via `as unknown as PollWithOptions`.

### Block Builders
- `blocks/pollMessage.ts` — `buildPollMessage()` for the channel message, `buildResultsDM()` for plain-text DM results
- `blocks/resultsDM.ts` — `buildResultsDMBlocks()` for rich Block Kit DM results with "Share Results" button

### Message Updates
Require storing `message_ts` from `chat.postMessage` response — saved via `updatePollMessageTs()`. The `PollWithOptions` interface includes `messageTs` for this purpose.

## Environment Variables

Required in `.env` (see `.env.example`):
- `SLACK_BOT_TOKEN` — Bot OAuth token (`xoxb-`)
- `SLACK_SIGNING_SECRET` — Request signing secret
- `SLACK_APP_TOKEN` — App-level token for Socket Mode (`xapp-`)
- `DATABASE_URL` — Supabase PostgreSQL connection string
