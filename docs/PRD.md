**PRODUCT REQUIREMENTS DOCUMENT**

**Askify**

An internal Slack poll bot for team decisions, engagement, and feedback

|        Version | 1.0                    |
| -------------: | :--------------------- |
|       **Date** | February 9, 2026       |
|     **Status** | Draft                  |
|   **Timeline** | MVP in 2–3 weeks       |
|       **Type** | Internal Tool          |
| **Tech Stack** | Bolt SDK \+ PostgreSQL |

# **1\. Overview**

Askify is an internal Slack bot that enables team members to create, manage, and participate in polls directly within Slack. It supports team decision-making, fun engagement polls, feedback collection, and meeting scheduling — all without leaving the Slack workspace.

| Target Users All internal team members who use Slack as their primary communication platform. |
| :-------------------------------------------------------------------------------------------- |

# **2\. Goals & Success Metrics**

## **2.1 Primary Goals**

- Streamline team decision-making with structured voting directly in Slack

- Boost team engagement through interactive and fun polls

- Replace external survey tools (Google Forms, etc.) for internal feedback collection

- Simplify meeting scheduling by gauging availability within Slack channels

## **2.2 Success Metrics**

| Metric                  | Target                           | How to Measure                |
| :---------------------- | :------------------------------- | :---------------------------- |
| Adoption rate           | 80% of team within 1 month       | Unique poll creators & voters |
| Vote participation      | \>70% of channel members         | Votes / channel member count  |
| Poll creation time      | \< 30 seconds                    | Time from /askify to submit   |
| External tool reduction | Eliminate Google Forms for polls | Tool usage audit              |

# **3\. Functional Requirements**

## **3.1 Poll Creation**

Users invoke the /askify slash command, which opens an interactive Slack modal with all configuration options. The modal adapts dynamically based on poll type selection (e.g., hiding the options field for Yes/No/Maybe polls).

**Modal Configuration Fields**

| Field                | Input Type       | Required    | Description                                             |
| :------------------- | :--------------- | :---------- | :------------------------------------------------------ |
| Poll Question        | Text input       | Yes         | The main question (max 300 chars)                       |
| Poll Type            | Select menu      | Yes         | Single choice, multi-select, yes/no/maybe, rating scale |
| Options              | Dynamic inputs   | Conditional | 2–10 options; hidden for yes/no & rating types          |
| Target Channel       | Channel select   | Yes         | Channel where the poll will be posted                   |
| Anonymous Voting     | Toggle           | No          | Default: off (public). Hides voter identity.            |
| Allow Vote Change    | Toggle           | No          | Default: on. Let voters update their selection.         |
| Show Live Results    | Toggle           | No          | Default: on. Hide results until poll closes.            |
| Allow Adding Options | Toggle           | No          | Default: off. Let voters suggest new options.           |
| Close Method         | Select menu      | No          | Manual, after duration, or at specific date/time        |
| Schedule Post        | Date/time picker | No          | Schedule poll for future posting                        |
| Send Reminders       | Toggle           | No          | Default: off. DM non-voters before close.               |
| Load Template        | Select menu      | No          | Pre-fill modal from a saved template                    |

## **3.2 Poll Types**

- **Single Choice:** Voters select exactly one option. Results displayed as a bar chart with counts and percentages.

- **Multi-Select:** Voters select one or more options. Each option shows its individual vote count and percentage of total voters.

- **Yes / No / Maybe:** Quick three-option poll. No custom options needed. Ideal for quick consensus checks.

- **Rating Scale:** Voters rate on a 1–5 or 1–10 scale. Results show average rating and distribution chart.

## **3.3 Voting Experience**

Polls are rendered as rich Slack Block Kit messages with interactive buttons or menus for voting.

1. Voters click buttons directly on the poll message to cast their vote

2. If vote change is enabled, clicking a different option updates the vote; clicking the same option retracts it

3. If anonymous mode is on, the poll shows aggregated counts only — no voter names are revealed

4. If live results are enabled, the bar chart updates in real-time after each vote via message update

5. If adding options is enabled, an “Add Option” button opens a small modal for voters to suggest new choices

## **3.4 Poll Lifecycle**

**Closing Mechanisms**

- **Manual Close:** Creator clicks a “Close Poll” button (visible only to the creator) on the poll message.

- **Auto-Close (Duration):** Poll closes automatically after a specified duration (e.g., 1 hour, 24 hours, 3 days).

- **Auto-Close (Date/Time):** Poll closes at a specific date and time chosen by the creator.

**Reminders**

When enabled, Askify sends a DM to channel members who have not yet voted. The reminder is sent at a sensible time before the poll closes (e.g., 1 hour before for short polls, 24 hours before for multi-day polls). Reminders include a deep link back to the poll message.

## **3.5 Scheduled Polls**

Creators can schedule polls for future posting. The modal includes a date/time picker that sets when the poll will be posted to the target channel. Scheduled polls are stored in the database and a background job posts them at the specified time. Creators can view, edit, or cancel scheduled polls via the /askify list command.

## **3.6 Results & Reporting**

**In-Channel Results**

When a poll closes (or live if enabled), results are displayed as a visual bar chart rendered using Slack Block Kit elements. The chart shows option labels, vote counts, percentages, and emoji-based colored progress bars.

**Result Distribution**

- DM to Creator: Askify sends a detailed results summary via DM when the poll closes, including voter breakdown (if not anonymous)

- Post to Channel: Creator can choose to post a formatted results summary to any channel after the poll closes

- Visual bar charts rendered inline using Block Kit mrkdwn and emoji-based progress bars

## **3.7 Poll Templates**

Users can save any poll configuration as a reusable template. Templates store the question format, poll type, options, and all settings. Creators can load a template when creating a new poll to pre-fill the modal. Templates are stored per-user and managed via /askify templates (list, delete).

# **4\. Technical Architecture**

## **4.1 Tech Stack**

| Component     | Technology                                |
| :------------ | :---------------------------------------- |
| Runtime       | Node.js (LTS)                             |
| Slack SDK     | Bolt for JavaScript (@slack/bolt)         |
| Database      | PostgreSQL (Supabase)                     |
| ORM           | Prisma                                    |
| Job Scheduler | node-cron for scheduled polls & reminders |
| Deployment    | Internal server (Docker recommended)      |

## **4.2 Database Schema**

The following core tables support the Askify data model:

**polls**

| Column       | Type        | Description                                           |
| :----------- | :---------- | :---------------------------------------------------- | ------------ | ------ | ------ |
| id           | UUID (PK)   | Unique poll identifier                                |
| creator_id   | VARCHAR     | Slack user ID of poll creator                         |
| channel_id   | VARCHAR     | Target Slack channel ID                               |
| message_ts   | VARCHAR     | Slack message timestamp (for updates)                 |
| question     | TEXT        | Poll question text                                    |
| poll_type    | ENUM        | single_choice                                         | multi_select | yes_no | rating |
| settings     | JSONB       | Anonymous, vote change, live results, reminders, etc. |
| status       | ENUM        | draft                                                 | scheduled    | active | closed |
| scheduled_at | TIMESTAMPTZ | When to post (null \= immediate)                      |
| closes_at    | TIMESTAMPTZ | Auto-close time (null \= manual)                      |
| created_at   | TIMESTAMPTZ | Record creation timestamp                             |

**poll_options**

| Column   | Type         | Description                    |
| :------- | :----------- | :----------------------------- |
| id       | UUID (PK)    | Unique option identifier       |
| poll_id  | UUID (FK)    | References polls.id            |
| label    | VARCHAR(200) | Option display text            |
| position | INTEGER      | Display order                  |
| added_by | VARCHAR      | Slack user ID (if voter-added) |

**votes**

| Column    | Type        | Description                |
| :-------- | :---------- | :------------------------- |
| id        | UUID (PK)   | Unique vote identifier     |
| poll_id   | UUID (FK)   | References polls.id        |
| option_id | UUID (FK)   | References poll_options.id |
| voter_id  | VARCHAR     | Slack user ID              |
| voted_at  | TIMESTAMPTZ | When the vote was cast     |

**poll_templates**

| Column     | Type         | Description                                                 |
| :--------- | :----------- | :---------------------------------------------------------- |
| id         | UUID (PK)    | Unique template identifier                                  |
| user_id    | VARCHAR      | Slack user ID of template owner                             |
| name       | VARCHAR(100) | Template display name                                       |
| config     | JSONB        | Full poll configuration (question, type, options, settings) |
| created_at | TIMESTAMPTZ  | Record creation timestamp                                   |

## **4.3 Slack App Configuration**

**Required Scopes (Bot Token)**

- chat:write — Post and update poll messages

- commands — Register /askify slash command

- channels:read — Read channel info for targeting

- users:read — Resolve user names for non-anonymous polls

- im:write — Send DM results and reminders

**Slack Features Used**

- Slash Commands: /askify (primary entry point)

- Modals (views.open / views.update): Poll creation form

- Block Kit: Poll rendering with buttons, sections, and context blocks

- Interactive Messages: Vote buttons, close poll button, add option button

- Message Updates (chat.update): Real-time result refresh

## **4.4 System Flow**

Askify follows an event-driven architecture:

1. User invokes /askify → Bolt receives slash command → Opens modal

2. User submits modal → Bolt handles view_submission → Validates & stores poll in PostgreSQL

3. If scheduled: Job scheduler picks it up at scheduled_at time and posts to channel

4. If immediate: Bot posts poll message to target channel via chat.postMessage

5. User clicks vote button → Bolt handles block_action → Records/updates vote in DB → Updates message

6. Auto-close job runs periodically, closes expired polls, posts results, sends DMs

7. Reminder job checks polls nearing close time and DMs non-voters

# **5\. Slash Commands & Interactions**

| Command           | Action                                             |
| :---------------- | :------------------------------------------------- |
| /askify           | Opens poll creation modal                          |
| /askify list      | Shows active & scheduled polls created by the user |
| /askify templates | Lists, creates, or deletes saved templates         |
| /askify help      | Shows usage guide and available commands           |

# **6\. MVP Scope & Phasing**

| Timeline MVP delivery target: 2–3 weeks from project kickoff. |
| :------------------------------------------------------------ |

## **6.1 Phase 1 — MVP (Weeks 1–3)**

Core polling functionality covering the most common use cases.

- Slash command /askify with modal-based poll creation

- All four poll types: single choice, multi-select, yes/no/maybe, rating scale

- Public and anonymous voting (creator configurable)

- Vote change toggle (creator configurable)

- Live results toggle with bar chart rendering

- Manual close and auto-close (duration & date/time)

- DM results to creator on poll close

- Core database schema and Prisma models

## **6.2 Phase 2 — Enhanced (Weeks 4–5)**

Scheduling, templates, and richer interactions.

- Scheduled polls (future posting with date/time picker)

- Poll templates (save, load, manage)

- Voter-added options

- Post results to a chosen channel

- /askify list and /askify templates commands

## **6.3 Phase 3 — Polish (Week 6+)**

Reminders, edge cases, and quality-of-life improvements.

- Reminder DMs to non-voters before poll close

- Improved bar chart visuals and result formatting

- /askify help command with interactive guide

- Error handling improvements and edge case coverage

- Performance optimization for high-vote polls

# **7\. Non-Functional Requirements**

## **7.1 Performance**

- Poll creation modal should open within 1 second of slash command

- Vote registration and message update should complete within 2 seconds

- Support up to 500 concurrent voters on a single poll without degradation

## **7.2 Reliability**

- Votes must be durable — no vote loss on server restart

- Scheduled polls and auto-close jobs must survive process restarts (persisted in DB)

- Graceful handling of Slack API rate limits with exponential backoff

## **7.3 Security**

- Bot token and signing secret stored as environment variables, never in code

- All incoming requests verified via Slack request signing

- Anonymous votes: voter_id stored in DB for deduplication but never exposed in any response or message

- No external network access required — internal deployment only

# **8\. Risks & Mitigations**

| Risk                      | Impact                                        | Mitigation                                                          |
| :------------------------ | :-------------------------------------------- | :------------------------------------------------------------------ |
| Slack API rate limits     | Delayed message updates on high-traffic polls | Queue vote updates and batch message refreshes; exponential backoff |
| Modal complexity          | Too many fields may overwhelm users           | Progressive disclosure; show advanced options only on toggle        |
| Scheduled job reliability | Missed scheduled polls                        | Persist schedules in DB; recovery job on startup                    |
| Block Kit limitations     | Limited visual options for charts             | Use emoji-based bar charts; explore image generation later          |
| Scope creep               | Missed MVP deadline                           | Strict phase boundaries; defer non-MVP features                     |

# **9\. Open Questions**

1. Should Askify support cross-channel polls (one poll posted to multiple channels simultaneously)?

2. Should workspace admins have elevated permissions (e.g., close any poll, view all poll analytics)?

3. Should there be a limit on concurrent active polls per user or per channel?

4. What is the data retention policy for closed polls? Archive after 90 days?

5. Should Askify support thread-based polls (posted as a thread reply instead of a channel message)?
