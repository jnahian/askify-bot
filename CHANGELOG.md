# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.3.0] - 2026-02-13

### Added
- **Poll Edit for Scheduled Polls**: Edit scheduled polls before they go live
  - "Edit" button in scheduled poll creator DM confirmation
  - Pre-filled modal with existing poll configuration
  - Update question, poll type, options, channel, settings, and schedule time
  - Validation to ensure poll is still scheduled before allowing edit
- **Poll Repost**: Repost closed polls as fresh copies
  - "Repost" button in creator DM results and `/askify list` for closed polls
  - Creates new poll with fresh vote counts
  - Optional channel override via modal
  - Posts to original or selected channel with new poll ID
- **Schedule Repost**: Schedule reposts for recurring polls
  - "Schedule Repost" button alongside repost option
  - Datetime picker for scheduled post time
  - Optional channel override and close method configuration
  - Scheduled reposts appear in `/askify list` with "Scheduled" status

### Improved
- **Interactive Landing Page Demos**: Replaced static screenshots with fully interactive components
  - Clickable poll creation form with live editing
  - Live voting demo with real-time percentage updates
  - Animated results sharing with channel selector
- **Consistent Container Widths**: Unified all pages to 1400px max-width
  - Landing page sections, docs, changelog, header, and footer all aligned
  - Professional, cohesive layout across entire site
- **Real Askify Branding**: All interactive demos feature the actual Askify logo
- **Uniform Component Sizing**: All three interactive demos have identical dimensions (380px × 600px) for perfect grid alignment

## [1.2.0] - 2026-02-12

### Added
- **Website & Landing Page**: Complete TanStack Start-based website with modern two-column hero, features grid, screenshots showcase, use cases, and call-to-action sections
  - Responsive design with dark mode as default
  - Modern UI with Lucide icons and Tailwind CSS
  - PWA-ready with web app manifest and app icons
- **Documentation System**: Interactive documentation with sidebar navigation and code highlighting
  - Getting Started guide
  - Poll Types reference
  - Commands overview
  - Scheduling & Templates
  - Voting & Results
  - Advanced Settings
  - Architecture deep-dive
- **Changelog Page**: Version history viewer with table of contents sidebar
  - Filterable by version
  - Semantic changelog with feature/improvement/fix badges
  - Direct linking to specific versions
- **Legal Pages**: Privacy Policy and Terms of Service pages
  - GDPR and data protection compliance
  - Comprehensive service terms
- **PWA Support**: Installable web app experience
  - Web app manifest with app icons (192x192, 512x512)
  - Apple touch icon
  - Favicon set (16x16, 32x32, ICO)
- **SEO Optimization**: Enhanced discoverability
  - Auto-generated sitemap.xml
  - robots.txt configuration
  - Meta tags and Open Graph support
- **Vercel Deployment**: Configuration and deployment guide for Vercel platform
  - Environment variable setup
  - Build configuration
  - Static export support

### Changed
- **Deployment**: Integrated website into PM2 ecosystem config
  - Separate process for web server
  - Shared environment variables via parent .env
  - Health check endpoint remains in bot process
- **Build Scripts**: Standardized web-related scripts to `web:*` naming convention
  - `web:dev` — Development server with hot reload
  - `web:build` — Production build
  - `web:preview` — Preview production build
- **Dependencies**: Separated frontend dependencies into `web/package.json`
  - Cleaner root package.json for bot-only dependencies
  - Independent versioning for web dependencies

### Fixed
- Handle missing website build gracefully in development mode
- Import order and deprecated icon warnings in web components
- CodeRabbit review feedback across web application

## [1.1.0] - 2026-02-12

### Added
- **Poll Description Field**: Optional multiline description field in poll creation modal
  - Displays below poll question in channel messages
  - Included in results DM and shared results
  - Saved in templates for reuse
- **Number & Star Emojis**: Auto-prefix poll options with visual indicators
  - Number emojis (1️⃣ 2️⃣ 3️⃣) for single choice, multi-select polls
  - Emoji-only vote buttons for cleaner UI
  - Star emojis (⭐⭐⭐) for rating scale polls
  - Yes/No/Maybe polls use ✅ ❌ 🤷 emoji buttons
- **Maybe Toggle**: Optional "Include Maybe" checkbox for Yes/No polls
  - Default: Maybe included (backward compatible)
  - When unchecked, creates Yes/No poll only
- **Results Modal**: "Results" button on each poll in `/askify list`
  - Opens modal with bar charts, percentages, and voter names
  - Includes rating average for rating polls
  - Available for active and closed polls
- **Date Range Filtering**: Filter polls in `/askify list` by date
  - Relative ranges: `7d`, `30d` (last N days)
  - Absolute ranges: `YYYY-MM-DD YYYY-MM-DD`
  - Display filter info in list header

### Changed
- **Poll Creation Modal UX**:
  - Poll Type and Post Timing now use radio buttons (clearer selection)
  - Settings checkboxes include helpful descriptions
  - "Single Choice" pre-selected as default poll type
- **Enhanced Poll List**:
  - Default limit reduced from 20 to 10 polls
  - Shows all poll statuses: active, scheduled, closed
  - Enriched poll cards with type, option count, vote count, dates
  - Visual separation by poll status
  - Status emoji for closed polls (🚫)

## [1.0.1] - 2026-02-11

### Fixed
- Scheduled polls now include "Close Poll" and "Save as Template" buttons in the creator DM when they go live (previously plain text only)
- Startup recovery polls now include the same action buttons in the creator DM
- Remove "Close Poll" button from channel message — only the creator can close via DM
- Poll question max length reduced from 300 to 150 characters to match Slack header block limit
- Scheduled poll times now display in each user's local timezone using Slack date formatting
- Fix extra trailing divider appearing in polls without action buttons

### Added
- GitHub Actions workflow for auto-deploying to VPS via SSH on release publish
- Release script (`npm run release`) that reads version from `package.json`, extracts changelog notes, and creates a GitHub release
- PM2 ecosystem config (`ecosystem.config.cjs`) with log formatting and restart backoff

### Changed
- Extract shared `buildCreatorNotifyDM()` block builder used by all creator notification paths
- Simplify App Home UI for better readability — consolidated sections and condensed command references

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

#### App Experience
- App Home tab with usage guide, commands reference, and feature overview
- DM response handler — bot replies helpfully when users message it directly

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
