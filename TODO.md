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
- [ ] **0.8** Set up Supabase PostgreSQL project and obtain `DATABASE_URL` *(manual — user action)*
- [ ] **0.9** Create Slack App on api.slack.com *(manual — user action)*:
  - Enable slash command `/askify`
  - Enable interactivity & set request URL
  - Add bot token scopes: `chat:write`, `commands`, `channels:read`, `users:read`, `im:write`
  - Install to workspace and copy bot token + signing secret
- [x] **0.10** Git repo already initialized

---

## Phase 1 — MVP (Weeks 1–3)

### Step 1: Database Schema & Prisma Models

- [ ] **1.1** Define Prisma schema with all four tables:
  - `polls` — id (UUID), creator_id, channel_id, message_ts, question, poll_type (enum: `single_choice`, `multi_select`, `yes_no`, `rating`), settings (JSON), status (enum: `draft`, `scheduled`, `active`, `closed`), scheduled_at, closes_at, created_at
  - `poll_options` — id (UUID), poll_id (FK), label, position, added_by
  - `votes` — id (UUID), poll_id (FK), option_id (FK), voter_id, voted_at
  - `poll_templates` — id (UUID), user_id, name, config (JSON), created_at
- [ ] **1.2** Add unique constraint on votes: `(poll_id, voter_id, option_id)` for single-choice; `(poll_id, voter_id)` logic handled in service layer for multi-select
- [ ] **1.3** Run `npx prisma migrate dev` to generate and apply the initial migration
- [ ] **1.4** Generate Prisma Client (`npx prisma generate`)
- [ ] **1.5** Create a reusable `prisma.ts` client singleton in `src/`

### Step 2: Bolt App Bootstrap

- [ ] **2.1** Create `src/app.ts` — initialize Bolt app with bot token and signing secret from env
- [ ] **2.2** Register the `/askify` slash command listener
- [ ] **2.3** Verify the app starts and responds to `/askify` with a basic acknowledgment
- [ ] **2.4** Set up `nodemon` for dev hot-reload

### Step 3: Poll Creation Modal

- [ ] **3.1** Build the poll creation modal using Block Kit (`src/views/pollCreationModal.ts`):
  - Text input: Poll Question (max 300 chars)
  - Static select: Poll Type (single_choice, multi_select, yes_no, rating)
  - Dynamic text inputs: Options (2–10 fields, initially show 2 with an "Add Option" button)
  - Conversation select: Target Channel
  - Toggle/checkbox: Anonymous Voting (default off)
  - Toggle/checkbox: Allow Vote Change (default on)
  - Toggle/checkbox: Show Live Results (default on)
  - Static select: Close Method (manual, after duration, at date/time)
  - Conditional: Duration input or date/time picker based on close method
- [ ] **3.2** Handle modal dynamic updates — when poll type changes:
  - Hide options field for `yes_no` and `rating` types
  - Show options field for `single_choice` and `multi_select` types
- [ ] **3.3** Handle `view_submission` callback:
  - Validate inputs (question not empty, at least 2 options for applicable types, channel selected)
  - Return validation errors to the modal if invalid
- [ ] **3.4** Wire up: `/askify` → `views.open` with the modal

### Step 4: Poll Service & Storage

- [ ] **4.1** Create `src/services/pollService.ts`:
  - `createPoll(data)` — insert poll + options into DB, return poll record
  - `getPoll(pollId)` — fetch poll with options and vote counts
  - `closePoll(pollId)` — update status to `closed`
- [ ] **4.2** On `view_submission`, call `createPoll` to persist the poll
- [ ] **4.3** Set poll status to `active` for immediate polls, `scheduled` for future polls
- [ ] **4.4** Generate default options for special types:
  - `yes_no` → ["Yes", "No", "Maybe"]
  - `rating` → ["1", "2", "3", "4", "5"] (or 1–10 based on config)

### Step 5: Poll Message Rendering (Block Kit)

- [ ] **5.1** Create `src/blocks/pollMessage.ts` — build Block Kit message for a poll:
  - Header section with poll question
  - Context block with creator name, poll type, voter count
  - Action buttons for each option (one button per option)
  - Results section with emoji-based bar charts (if live results enabled)
  - "Close Poll" button (visible context: creator only via action handler logic)
- [ ] **5.2** Create `src/utils/barChart.ts` — render emoji progress bars:
  - Calculate percentage per option
  - Render filled/empty block emojis proportionally
  - Format: `Option Label  ████░░░░░░  45% (9 votes)`
- [ ] **5.3** Post the poll message to the target channel via `chat.postMessage`
- [ ] **5.4** Store the returned `message_ts` in the poll record (needed for `chat.update`)

### Step 6: Voting Mechanism

- [ ] **6.1** Create `src/services/voteService.ts`:
  - `castVote(pollId, optionId, voterId)` — handle vote logic
  - `retractVote(pollId, optionId, voterId)` — remove a vote
  - `getVotes(pollId)` — get all votes for a poll grouped by option
- [ ] **6.2** Register `block_actions` handler for vote buttons (`src/actions/voteAction.ts`):
  - Identify poll and selected option from action payload
  - Check poll status (reject if closed)
  - **Single choice:** If user already voted for this option → retract; if voted for another → switch; if no vote → cast
  - **Multi-select:** Toggle the selected option (add if not present, remove if present)
  - **Yes/No/Maybe:** Same as single choice
  - **Rating:** Same as single choice
  - Respect `allow_vote_change` setting — if off, reject changes after first vote
- [ ] **6.3** After each vote action, rebuild the poll message blocks with updated results
- [ ] **6.4** Call `chat.update` to refresh the poll message in-channel (if live results enabled)
- [ ] **6.5** If live results disabled, still update vote count internally but don't show bar charts until closed
- [ ] **6.6** Handle anonymous mode: show counts only, never include voter names in the message

### Step 7: Poll Closing

- [ ] **7.1** Register `block_actions` handler for "Close Poll" button (`src/actions/closePollAction.ts`):
  - Verify the user is the poll creator
  - Call `closePoll(pollId)`
  - Update the poll message to show final results and mark as closed
  - Disable all vote buttons
- [ ] **7.2** Create `src/jobs/autoCloseJob.ts`:
  - Run via `node-cron` every minute
  - Query polls where `status = 'active'` AND `closes_at <= NOW()`
  - For each expired poll: close it, update message, post final results
- [ ] **7.3** On poll close, send DM to creator with detailed results:
  - Question, total votes, per-option breakdown
  - Voter names per option (if not anonymous)
  - Formatted bar chart

### Step 8: Anonymous Voting

- [ ] **8.1** When `anonymous = true` in poll settings:
  - Store `voter_id` in DB (for deduplication/vote change)
  - Never include voter names in any message, DM, or API response
  - Poll message shows only aggregated counts
- [ ] **8.2** Creator DM results for anonymous polls show counts only, no voter names

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

- [ ] **10.1** Add date/time picker to the poll creation modal for scheduling
- [ ] **10.2** On submission with a future schedule time, save poll with `status = 'scheduled'`
- [ ] **10.3** Create `src/jobs/scheduledPollJob.ts`:
  - Run via `node-cron` every minute
  - Query polls where `status = 'scheduled'` AND `scheduled_at <= NOW()`
  - Post each poll to its target channel, update status to `active`
- [ ] **10.4** Store `message_ts` after posting

### Step 11: Poll Templates

- [ ] **11.1** Create `src/services/templateService.ts`:
  - `saveTemplate(userId, name, config)` — save poll config as template
  - `getTemplates(userId)` — list user's templates
  - `deleteTemplate(templateId, userId)` — delete a template
  - `loadTemplate(templateId)` — return config for pre-filling modal
- [ ] **11.2** Add "Save as Template" option in the poll creation modal or as a post-creation action
- [ ] **11.3** Add "Load Template" select menu at the top of the creation modal
- [ ] **11.4** On template load, pre-fill all modal fields with saved config

### Step 12: Voter-Added Options

- [ ] **12.1** Add "Add Option" button to poll messages (when `allow_adding_options` is enabled)
- [ ] **12.2** Register `block_actions` handler for "Add Option" button:
  - Open a small modal with a text input for the new option
- [ ] **12.3** Handle `view_submission` for the add-option modal:
  - Validate option text (not empty, not duplicate)
  - Insert new option into `poll_options` with `added_by` set to voter's ID
  - Rebuild and update the poll message with the new option

### Step 13: `/askify list` Command

- [ ] **13.1** Parse subcommand from `/askify` slash command text
- [ ] **13.2** Implement `list` handler — query user's polls with `status IN ('active', 'scheduled')`
- [ ] **13.3** Render results as an ephemeral message with poll details:
  - Question, status, channel, vote count, close time
  - Action buttons: "View", "Close", "Cancel" (for scheduled)

### Step 14: `/askify templates` Command

- [ ] **14.1** Implement `templates` handler — list user's saved templates
- [ ] **14.2** Render as ephemeral message with template names and action buttons:
  - "Use" (opens creation modal pre-filled), "Delete"
- [ ] **14.3** Handle delete confirmation and template removal

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
