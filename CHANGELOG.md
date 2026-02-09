# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Emoji code support with hints in poll creation modal (question and option fields)
- Emoji rendering in poll results DM headers
- Emoji usage tip in `/askify help` command

## [1.0.0] - 2026-02-09

### Added

#### Phase 1 — MVP
- `/askify` slash command with modal-based poll creation
- Four poll types: single choice, multi-select, yes/no/maybe, rating scale
- Dynamic modal that adapts based on poll type and close method
- Dynamic add/remove option fields (2-10) in creation modal
- Vote buttons with single-vote and multi-vote logic
- Real-time bar chart rendering with `chat.update` on each vote
- Anonymous voting mode (counts only, no voter names)
- Vote change toggle (retract by clicking same option)
- Live results toggle (hidden until close when disabled)
- Manual close (creator-only) with confirmation dialog
- Auto-close via duration or specific date/time
- DM results to creator on poll close
- Cron job for auto-closing expired polls every minute

#### Phase 2 — Enhanced
- Scheduled polls with datetime picker and future posting
- Cron job for posting scheduled polls every minute
- Poll templates — save, load, and delete reusable poll configs
- "Save as Template" prompt via DM after poll creation
- Template pre-fill in creation modal
- Voter-added options for single choice and multi-select polls
- `/askify list` — view active and scheduled polls with close/cancel actions
- `/askify templates` — manage saved templates with use/delete actions
- Post results to any channel via "Share Results" button

#### Phase 3 — Polish
- Reminder DMs to non-voters with smart timing (1h or 24h before close)
- Reminder tracking via `reminder_sent_at` column to avoid duplicates
- Rich `/askify help` command with usage guide and tips
- Color-coded emoji bar charts (green, blue, purple, orange, yellow)
- Improved results DM formatting with Block Kit sections and dividers
- Slack API retry with exponential backoff for rate limits
- Error handling for deleted messages, channel permission errors, and workspace changes
- Startup recovery job for missed scheduled polls and auto-close events
- Vote update debouncing (500ms) for high-traffic polls
- Database indexes on polls (status, creator_id, status+closes_at, status+scheduled_at) and votes (poll_id, voter_id)

#### Deployment
- Multi-stage Dockerfile with Node 22 Alpine
- Docker Compose with app + local Postgres for development
- `.dockerignore` for optimized build context

## [0.1.0] - 2026-02-09

### Added
- Initial project setup with TypeScript, Bolt for JavaScript, and Prisma v7
- Prisma schema with 4 models: Poll, PollOption, Vote, PollTemplate
- Slack app manifest
- Project folder structure and development tooling (nodemon, ts-node)
