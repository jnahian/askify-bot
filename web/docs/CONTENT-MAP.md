# Askify Website — Content Map

> Content extracted from README.md, PRD.md, CHANGELOG.md, and version docs
> Date: 2026-02-12

---

## 1. Landing Page Content

### Hero Section

**Headline:** "Powerful Slack Polls Made Simple"
**Subheadline:** "Team decisions, engagement, and feedback — all without leaving Slack"
**CTA:** "Add to Slack" (primary button)
**Secondary CTA:** "View Documentation"

---

### Features Grid (6 Features)

1. **4 Poll Types**
   - Single choice, multi-select, yes/no/maybe, rating scale (1-5 or 1-10)
   - Icon: 🗳️

2. **Rich Voting Experience**
   - Interactive buttons, real-time bar charts with color-coded emoji
   - Vote change/retraction support
   - Icon: 📊

3. **Anonymous Voting**
   - Voter identity hidden from messages
   - Stored only for deduplication
   - Icon: 🔒

4. **Smart Scheduling**
   - Schedule polls for future posting
   - Auto-close after duration or at specific time
   - Reminder DMs to non-voters
   - Icon: ⏰

5. **Templates & Reuse**
   - Save and reuse poll configurations
   - Voter-added options (let voters suggest choices)
   - Icon: 📋

6. **Share Results**
   - Post formatted results to any channel
   - DM results to creator
   - Visual bar charts
   - Icon: 📤

---

### How It Works (3 Steps)

1. **Create**
   - Use `/askify` to open the poll creation modal
   - Configure your poll with 4 types, custom settings, and scheduling

2. **Vote**
   - Team members vote with interactive buttons
   - Real-time results with color-coded emoji bar charts
   - Vote changes and retractions supported

3. **Share**
   - Polls auto-close or close manually
   - Results sent via DM to creator
   - Share formatted results to any channel

---

### Use Cases (4 Scenarios)

1. **Team Decisions**
   - "Where should we have the team offsite?"
   - Single choice polls with visual results

2. **Quick Consensus**
   - "Should we move standup to 10am?"
   - Yes/No/Maybe polls for fast feedback

3. **Feedback Collection**
   - "Rate this sprint (1-5)"
   - Rating scale polls with average calculation

4. **Engagement & Fun**
   - "What's for lunch?"
   - Multi-select polls with live results

---

### Screenshots Section

- Poll creation modal screenshot
- Active poll in channel screenshot
- Results DM screenshot
- Templates list screenshot

---

### Final CTA Section

**Headline:** "Ready to transform team decisions?"
**CTA:** "Add to Slack — Free to Use"
**Note:** "Works with Slack's free and paid plans"

---

## 2. Documentation Content Structure

### Category: Introduction

#### Doc: Getting Started (`getting-started`)

**Description:** Install and configure Askify in your Slack workspace

**Sections:**

1. **Installation**
   - Prerequisites: Slack workspace with admin access
   - Add to Slack button
   - Grant required permissions

2. **First Poll**
   - Use `/askify` command
   - Configure poll settings
   - Post to channel

3. **Next Steps**
   - Explore poll types
   - Try scheduled polls
   - Save templates

---

### Category: Core Features

#### Doc: Poll Types (`poll-types`)

**Description:** Understand the four poll types and when to use each

**Sections:**

1. **Single Choice**
   - One vote per voter
   - Best for: decisions, preferences
   - Example: "Which design do you prefer?"

2. **Multi-Select**
   - Multiple selections per voter
   - Best for: gathering multiple inputs
   - Example: "Which features should we prioritize? (select all)"

3. **Yes / No / Maybe**
   - Quick three-option consensus
   - Optional: hide "Maybe" option
   - Best for: quick approval checks
   - Example: "Should we deploy today?"

4. **Rating Scale**
   - 1-5 or 1-10 scale
   - Shows average rating
   - Best for: feedback, satisfaction surveys
   - Example: "Rate the new feature (1-5)"

---

#### Doc: Commands (`commands`)

**Description:** Master all Askify slash commands

**Sections:**

1. **Poll Creation**
   - `/askify` — Opens poll creation modal
   - `/askify poll "Question?" "Opt1" "Opt2"` — Quick inline poll

2. **Inline Poll Flags**
   - `--multi` — Multi-select poll
   - `--yesno` — Yes/No/Maybe poll (use `--no-maybe` for Yes/No only)
   - `--rating [10]` — Rating scale (default 5, optional 10)
   - `--anon` — Anonymous voting
   - `--close <N>h|m` — Auto-close after duration

3. **Poll Management**
   - `/askify list [filter]` — View your polls
     - No args: latest 10 polls
     - `7d`, `30d`: last N days
     - `YYYY-MM-DD YYYY-MM-DD`: date range
   - `/askify templates` — Manage saved templates
   - `/askify help` — Usage guide

---

#### Doc: Voting & Results (`voting-results`)

**Description:** How voting works and how to share results

**Sections:**

1. **Voting Behavior**
   - Click button to vote
   - Click again to retract (if allowed)
   - Multi-select: toggle on/off
   - Live results update in real-time

2. **Anonymous Mode**
   - Hides voter names from results
   - Only shows vote counts
   - Votes still tracked for deduplication

3. **Results Distribution**
   - DM to creator on close
   - "Share Results" button
   - Post to any channel
   - Visual bar charts with percentages

4. **Voter Names**
   - Shown in non-anonymous polls
   - Color-coded emoji bullets (🟢 🔵 🟣)

---

### Category: Advanced Features

#### Doc: Scheduling & Auto-Close (`scheduling`)

**Description:** Schedule polls for future posting and configure auto-close

**Sections:**

1. **Scheduled Polls**
   - Select "Schedule for later"
   - Choose date and time
   - Poll posted automatically
   - View scheduled polls in `/askify list`

2. **Auto-Close Methods**
   - **Manual:** Creator closes with button
   - **Duration:** Close after N hours/days
   - **Date/Time:** Close at specific moment

3. **Reminders**
   - Enable "Send Reminders"
   - Bot DMs non-voters before close
   - Smart timing: 1h or 24h before

---

#### Doc: Templates (`templates`)

**Description:** Save and reuse poll configurations

**Sections:**

1. **Saving Templates**
   - "Save as Template" button in creator DM
   - Name your template
   - Stored per-user

2. **Using Templates**
   - Load template in creation modal
   - Pre-fills: question, type, options, settings
   - Edit before posting

3. **Managing Templates**
   - `/askify templates` to list
   - "Use" button: open modal with pre-fill
   - "Delete" button: remove template

---

#### Doc: Advanced Settings (`advanced-settings`)

**Description:** Fine-tune poll behavior with advanced options

**Sections:**

1. **Voting Settings**
   - Allow Vote Change (default: on)
   - Show Live Results (default: on)
   - Anonymous Voting (default: off)

2. **Interaction Settings**
   - Allow Adding Options (single/multi only)
   - Voters suggest new choices
   - Approved by creator

3. **Poll Description**
   - Optional multiline description
   - Displays below question
   - Included in results

4. **Emoji Support**
   - Use `:emoji_codes:` in questions
   - Use in option labels
   - Auto-prefix: number emojis (1️⃣ 2️⃣) or star emojis (⭐)

---

### Category: Reference

#### Doc: Architecture & Tech Stack (`architecture`)

**Description:** Technical overview for developers

**Sections:**

1. **Tech Stack**
   - Node.js 22+
   - @slack/bolt v4 (Socket Mode)
   - PostgreSQL via Supabase
   - Prisma v7 ORM
   - node-cron scheduler

2. **Database Schema**
   - 4 models: Poll, PollOption, Vote, PollTemplate
   - UUID primary keys
   - JSONB settings column

3. **Architecture**
   - Event-driven Bolt handlers
   - Slash commands → Modals → Actions → Jobs
   - Real-time message updates
   - Background cron jobs

---

## 3. Changelog Content

### v1.1.0 (2026-02-12)

**Type:** Feature

**Title:** UI Improvements & List Enhancements

**Items:**

- type: feature
  text: "Poll Description Field — Optional multiline description in poll creation modal"
- type: feature
  text: "Number & Star Emojis — Auto-prefix options with 1️⃣ 2️⃣ 3️⃣ or ⭐⭐⭐ for visual clarity"
- type: feature
  text: "Maybe Toggle — Optional 'Include Maybe' checkbox for Yes/No polls"
- type: feature
  text: "Results Modal — 'Results' button in /askify list to view poll results in a modal"
- type: feature
  text: "Date Range Filtering — Filter polls by 7d, 30d, or YYYY-MM-DD YYYY-MM-DD"
- type: improvement
  text: "Poll Creation Modal UX — Radio buttons for Poll Type and Post Timing"
- type: improvement
  text: "Enhanced Poll List — Shows all statuses (active, scheduled, closed) with enriched poll cards"

---

### v1.0.1 (2026-02-11)

**Type:** Fix

**Title:** Scheduled Polls & Creator DM Improvements

**Items:**

- type: fix
  text: "Scheduled polls now include 'Close Poll' and 'Save as Template' buttons in creator DM"
- type: fix
  text: "Poll question max length reduced from 300 to 150 characters (Slack header block limit)"
- type: fix
  text: "Scheduled poll times display in user's local timezone"
- type: feature
  text: "GitHub Actions workflow for auto-deployment to VPS"
- type: improvement
  text: "App Home UI simplified for better readability"

---

### v1.0.0 (2026-02-10)

**Type:** Feature

**Title:** Initial Release

**Items:**

- type: feature
  text: "Four poll types: single choice, multi-select, yes/no/maybe, rating scale"
- type: feature
  text: "Inline quick poll creation with /askify poll command"
- type: feature
  text: "Real-time bar chart rendering with color-coded emoji"
- type: feature
  text: "Anonymous voting mode"
- type: feature
  text: "Scheduled polls with datetime picker"
- type: feature
  text: "Auto-close via duration or specific date/time"
- type: feature
  text: "Poll templates — save, load, and reuse"
- type: feature
  text: "Reminder DMs to non-voters with smart timing"
- type: feature
  text: "App Home tab with usage guide"
- type: feature
  text: "Docker deployment with multi-stage build"

---

## 4. Legal Pages Content (Placeholders)

### Terms of Service

**Last Updated:** 2026-02-12

**Sections:**

1. Acceptance of Terms
2. Use License
3. Service Description
4. User Responsibilities
5. Modifications to Service
6. Limitations of Liability
7. Termination
8. Governing Law

_(Full legal text to be provided by user or legal team)_

---

### Privacy Policy

**Last Updated:** 2026-02-12

**Sections:**

1. **Data Collection**
   - Workspace ID, channel IDs, user IDs
   - Poll questions, options, votes
   - Message timestamps
   - We do NOT store message content or personal data beyond Slack IDs

2. **Data Usage**
   - Enable poll creation and voting
   - Track votes for deduplication
   - Send reminders and results

3. **Data Storage**
   - PostgreSQL database (Supabase)
   - Stored securely with encryption
   - Retained for operational purposes

4. **Anonymous Voting**
   - Voter IDs stored for deduplication only
   - Never displayed in messages or results

5. **User Rights**
   - Access your data via /askify list
   - Delete polls (closes and archives)
   - Uninstall to remove all workspace data

6. **Contact**
   - Email: support@askify.app (placeholder)
   - GitHub: github.com/jnahian/askify-bot

_(Full legal text to be provided by user or legal team)_

---

## 5. SEO Metadata

### Landing Page

- **Title:** Askify — Powerful Slack Polls Made Simple
- **Description:** Create interactive polls in Slack with 4 poll types, anonymous voting, scheduled posting, auto-close, reminders, and visual results. Free internal tool.
- **Keywords:** Slack polls, Slack bot, team voting, Slack survey, poll bot, team decisions, Slack app

### Docs

- **Title Format:** {doc.title} — Askify Docs
- **Description:** {doc.description}
- **Canonical:** /docs/{id}

### Changelog

- **Title Format:** Askify v{version} — Changelog
- **Description:** {auto-generated from items}
- **Canonical:** /changelog/{version}

---

## 6. Navigation Structure

### Navbar

- Logo (Askify)
- Docs
- Changelog
- GitHub (external link)
- Add to Slack (CTA button)

### Footer

- **Product**
  - Features
  - Documentation
  - Changelog
  - GitHub
- **Legal**
  - Terms of Service
  - Privacy Policy
- **Social**
  - GitHub icon link
- **Copyright**
  - © 2026 Askify. MIT License.

---

## Next Steps

1. ✅ Content extraction complete
2. 🔲 Create JSON files for docs and changelog
3. 🔲 Write landing page components
4. 🔲 Implement content renderer
5. 🔲 Draft legal pages (with user input)
