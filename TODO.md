# Askify — Step-by-Step TODO

> Derived from PRD v1.0 (February 9, 2026)

---

## Phase 0 — Project Setup

- [x] **0.1** Initialize Node.js project (`npm init`) with TypeScript
- [x] **0.2** Install core dependencies: `@slack/bolt`, `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `node-cron`, `dotenv`
- [x] **0.3** Install dev dependencies: `typescript`, `ts-node`, `nodemon`, `@types/node`
- [x] **0.4** Configure `tsconfig.json`
- [x] **0.5** Create project folder structure:
  ```
  src/
    app.ts              # Bolt app entry point
    lib/prisma.ts       # Prisma client singleton
    commands/           # Slash command handlers
    actions/            # Block action handlers (votes, buttons)
    views/              # Modal definitions & submission handlers
    services/           # Business logic (poll, vote, template, results)
    blocks/             # Block Kit message builders
    jobs/               # Cron jobs (auto-close, reminders, scheduled posts)
    utils/              # Helpers (bar chart renderer, formatters)
  prisma/
    schema.prisma       # Database schema
  ```
- [x] **0.6** Create `.env` file with placeholders: `SLACK_BOT_TOKEN`, `SLACK_SIGNING_SECRET`, `SLACK_APP_TOKEN`, `DATABASE_URL`
- [x] **0.7** Add `.env` to `.gitignore`
- [x] **0.8** Set up Supabase PostgreSQL project and obtain `DATABASE_URL`
- [x] **0.9** Create Slack App on api.slack.com:
  - Enable slash command `/askify`
  - Enable interactivity & set request URL
  - Add bot token scopes: `chat:write`, `commands`, `channels:read`, `users:read`, `im:write`
  - Install to workspace and copy bot token + signing secret
- [x] **0.10** Git repo already initialized

---

## Phase 1 — MVP (Weeks 1–3)

### Step 1: Database Schema & Prisma Models

- [x] **1.1** Define Prisma schema with all four tables (done in Phase 0)
- [x] **1.2** Add unique constraint on votes: `(poll_id, voter_id, option_id)`
- [x] **1.3** Run `npx prisma migrate dev` to apply migration
- [x] **1.4** Generate Prisma Client (`npx prisma generate`)
- [x] **1.5** Create a reusable `prisma.ts` client singleton in `src/lib/`

### Step 2: Bolt App Bootstrap

- [x] **2.1** Create `src/app.ts` — initialize Bolt app with socket mode
- [x] **2.2** Register `/askify` slash command with subcommand parsing (help, list, templates)
- [x] **2.3** `/askify` opens poll creation modal
- [x] **2.4** Set up `nodemon` for dev hot-reload (`npm run dev`)

### Step 3: Poll Creation Modal

- [x] **3.1** Build poll creation modal (`src/views/pollCreationModal.ts`):
  - Question, Poll Type, Dynamic Options (2–10), Channel Select
  - Anonymous, Vote Change, Live Results toggles
  - Close Method (manual/duration/datetime) with conditional inputs
  - Rating Scale selector (1–5 or 1–10) for rating type
- [x] **3.2** Dynamic modal updates on poll type and close method change (`src/actions/modalActions.ts`)
- [x] **3.3** `view_submission` handler with validation (`src/views/pollCreationSubmission.ts`)
- [x] **3.4** Wired: `/askify` → `views.open` → modal

### Step 4: Poll Service & Storage

- [x] **4.1** `src/services/pollService.ts`: createPoll, getPoll, closePoll, updatePollMessageTs, getExpiredPolls
- [x] **4.2** `view_submission` calls `createPoll` and posts to channel
- [x] **4.3** Poll status set to `active` on creation
- [x] **4.4** Default options: yes_no → [Yes, No, Maybe], rating → [1..N] based on scale

### Step 5: Poll Message Rendering (Block Kit)

- [x] **5.1** `src/blocks/pollMessage.ts`: header, context, vote buttons, bar charts, close button
- [x] **5.2** `src/utils/barChart.ts`: emoji progress bars with percentages
- [x] **5.3** Post poll to channel via `chat.postMessage`
- [x] **5.4** Store `message_ts` for future `chat.update`

### Step 6: Voting Mechanism

- [x] **6.1** `src/services/voteService.ts`: handleSingleVote, handleMultiVote, getVotersByOption, countUniqueVoters
- [x] **6.2** `src/actions/voteAction.ts`: vote button handler with single/multi/toggle logic
- [x] **6.3** Rebuild poll message after each vote
- [x] **6.4** `chat.update` for live results
- [x] **6.5** Hidden results when live results disabled
- [x] **6.6** Anonymous mode: counts only, no voter names

### Step 7: Poll Closing

- [x] **7.1** `src/actions/closePollAction.ts`: creator-only close with confirmation dialog
- [x] **7.2** `src/jobs/autoCloseJob.ts`: cron every minute, closes expired polls
- [x] **7.3** DM results to creator on close (with `buildResultsDM`)

### Step 8: Anonymous Voting

- [x] **8.1** voter_id stored for dedup, never exposed in messages
- [x] **8.2** Creator DM shows counts only for anonymous polls

### Step 9: Integration Testing & Polish

- [ ] **9.1** Test end-to-end: `/askify` → modal → create poll → vote → close → DM results
- [ ] **9.2** Test all four poll types individually
- [ ] **9.3** Test anonymous vs public voting
- [ ] **9.4** Test vote change enabled vs disabled
- [ ] **9.5** Test live results enabled vs disabled
- [ ] **9.6** Test auto-close (duration and date/time)
- [ ] **9.7** Test manual close (creator only)
- [ ] **9.8** Handle edge cases: double-click on vote, voting on closed poll, invalid channel
- [ ] **9.9** Add error handling for Slack API failures (rate limits, network errors)

---

## Phase 2 — Enhanced (Weeks 4–5)

### Step 10: Scheduled Polls

- [x] **10.1** Add date/time picker to the poll creation modal for scheduling
- [x] **10.2** On submission with a future schedule time, save poll with `status = 'scheduled'`
- [x] **10.3** Create `src/jobs/scheduledPollJob.ts`:
  - Run via `node-cron` every minute
  - Query polls where `status = 'scheduled'` AND `scheduled_at <= NOW()`
  - Post each poll to its target channel, update status to `active`
- [x] **10.4** Store `message_ts` after posting

### Step 11: Poll Templates

- [x] **11.1** Create `src/services/templateService.ts`:
  - `saveTemplate(userId, name, config)` — save poll config as template
  - `getTemplates(userId)` — list user's templates
  - `deleteTemplate(templateId, userId)` — delete a template
  - `loadTemplate(templateId)` — return config for pre-filling modal
- [x] **11.2** Add "Save as Template" option in the poll creation modal or as a post-creation action
- [x] **11.3** Add "Load Template" select menu at the top of the creation modal
- [x] **11.4** On template load, pre-fill all modal fields with saved config

### Step 12: Voter-Added Options

- [x] **12.1** Add "Add Option" button to poll messages (when `allow_adding_options` is enabled)
- [x] **12.2** Register `block_actions` handler for "Add Option" button:
  - Open a small modal with a text input for the new option
- [x] **12.3** Handle `view_submission` for the add-option modal:
  - Validate option text (not empty, not duplicate)
  - Insert new option into `poll_options` with `added_by` set to voter's ID
  - Rebuild and update the poll message with the new option

### Step 13: `/askify list` Command

- [x] **13.1** Parse subcommand from `/askify` slash command text
- [x] **13.2** Implement `list` handler — query user's polls with `status IN ('active', 'scheduled')`
- [x] **13.3** Render results as an ephemeral message with poll details:
  - Question, status, channel, vote count, close time
  - Action buttons: "View", "Close", "Cancel" (for scheduled)

### Step 14: `/askify templates` Command

- [x] **14.1** Implement `templates` handler — list user's saved templates
- [x] **14.2** Render as ephemeral message with template names and action buttons:
  - "Use" (opens creation modal pre-filled), "Delete"
- [x] **14.3** Handle delete confirmation and template removal

### Step 15: Post Results to Channel

- [ ] **15.1** After a poll closes, show a "Share Results" button to the creator (via DM or on the poll message)
- [ ] **15.2** On click, open a modal with a channel select for where to post results
- [ ] **15.3** Post formatted results summary to the selected channel

---

## Phase 3 — Polish (Week 6+)

### Step 16: Reminder DMs

- [ ] **16.1** Create `src/jobs/reminderJob.ts`:
  - Run via `node-cron` periodically (e.g., every 15 minutes)
  - Find polls with `reminders = true` nearing their close time
  - Determine non-voters by comparing channel members vs voters
  - Send DM to each non-voter with poll question and a deep link to the message
- [ ] **16.2** Calculate smart reminder timing:
  - Polls closing within 2 hours → remind 1 hour before
  - Polls closing within 1–3 days → remind 24 hours before
- [ ] **16.3** Track reminder sent status to avoid duplicate DMs

### Step 17: `/askify help` Command

- [ ] **17.1** Implement `help` handler — return ephemeral message with:
  - Available commands and descriptions
  - Quick-start guide for creating a poll
  - Links or tips for poll types and settings

### Step 18: Improved Visuals & Formatting

- [ ] **18.1** Refine emoji-based bar charts with better proportional rendering
- [ ] **18.2** Add color-coded emojis for different options or ranking tiers
- [ ] **18.3** Improve results DM formatting with sections and dividers

### Step 19: Error Handling & Edge Cases

- [ ] **19.1** Add Slack API rate limit handling with exponential backoff
- [ ] **19.2** Handle channel permission errors (bot not in channel)
- [ ] **19.3** Handle deleted messages (poll message removed by someone)
- [ ] **19.4** Handle user who left the workspace voting/creating polls
- [ ] **19.5** Add input sanitization for all user-provided text
- [ ] **19.6** Add startup recovery job: check for missed scheduled polls or auto-closes on app restart

### Step 20: Performance Optimization

- [ ] **20.1** Batch `chat.update` calls for high-traffic polls (debounce rapid vote updates)
- [ ] **20.2** Add database indexes for frequent queries (poll_id on votes, status on polls)
- [ ] **20.3** Optimize vote counting queries (use DB aggregation instead of fetching all rows)

---

## Deployment

- [ ] **D.1** Create `Dockerfile` for containerized deployment
- [ ] **D.2** Create `docker-compose.yml` (app + optional local Postgres for dev)
- [ ] **D.3** Set up environment variables in deployment environment
- [ ] **D.4** Configure Slack app request URL to point to deployed server
- [ ] **D.5** Run initial database migration on production Supabase instance
- [ ] **D.6** Smoke test all features in production workspace
