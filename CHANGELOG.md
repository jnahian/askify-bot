# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] - 2026-02-10

### Added

#### Poll Creation
- `/askify` slash command with modal-based poll creation
- Inline quick poll creation via `/askify poll "Q?" "Opt1" "Opt2" [--flags]`
  - Supports `--multi`, `--yesno`, `--rating [10]`, `--anon`, `--close <N>h|m`
  - Posts poll directly to the current channel with sensible defaults
  - Shows inline usage help when run without arguments
- Four poll types: single choice, multi-select, yes/no/maybe, rating scale
- Dynamic modal that adapts based on poll type, close method, and scheduling
- Dynamic add option fields (2-10) with per-option delete buttons
- Preserves typed question and option text across all modal rebuilds
- Emoji code support with hints in poll creation modal

#### Voting
- Vote buttons with single-vote and multi-vote logic
- Real-time bar chart rendering with `chat.update` on each vote
- Color-coded emoji bar charts (green, blue, purple, orange, yellow)
- Anonymous voting mode (counts only, no voter names)
- Vote change toggle (retract by clicking same option)
- Live results toggle (hidden until close when disabled)
- Voter-added options for single choice and multi-select polls
- Vote update debouncing (500ms) for high-traffic polls

#### Poll Management
- Manual close (creator-only) with confirmation dialog
- Auto-close via duration or specific date/time
- Scheduled polls with datetime picker and future posting
- `/askify list` — view active and scheduled polls with close/cancel actions
- DM results to creator on poll close
- Post results to any channel via "Share Results" button

#### Templates
- Poll templates — save, load, and delete reusable poll configs
- "Save as Template" prompt via DM after poll creation
- Template pre-fill in creation modal
- `/askify templates` — manage saved templates with use/delete actions

#### Notifications & Reminders
- Reminder DMs to non-voters with smart timing (1h or 24h before close)
- Reminder tracking via `reminder_sent_at` column to avoid duplicates
- Not-in-channel error handling with DM notification to invite the bot

#### Background Jobs
- Cron job for auto-closing expired polls every minute
- Cron job for posting scheduled polls every minute
- Reminder job every 15 minutes for non-voter DMs
- Startup recovery job for missed scheduled polls and auto-close events

#### Developer Experience
- Global request logging middleware with execution time for all commands, actions, and views
- Rich `/askify help` command with usage guide and tips
- Slack API retry with exponential backoff for rate limits
- Error handling for deleted messages, channel permission errors, and workspace changes
- Database indexes on polls and votes for query performance

#### Deployment
- Multi-stage Dockerfile with Node 22 Alpine
- Docker Compose with app + local Postgres for development
- Fly.io deployment guide (free tier)
- `.dockerignore` for optimized build context

#### Infrastructure
- TypeScript with @slack/bolt v4 (Socket Mode)
- Prisma v7 with `@prisma/adapter-pg` driver adapter (PostgreSQL via Supabase)
- Prisma schema with 4 models: Poll, PollOption, Vote, PollTemplate
- Slack app manifest
- node-cron for scheduled background jobs
