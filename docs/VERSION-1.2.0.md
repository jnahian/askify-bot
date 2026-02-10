# Askify v1.2.0 — Poll Management Features

> Derived from PRD v1.0 (February 9, 2026)
> Complexity: Medium

---

## Overview

This release adds poll lifecycle management — editing scheduled polls before they go live, reposting existing polls as fresh copies, and scheduling reposts for recurring use cases like weekly check-ins.

---

## 1. Poll Edit for Scheduled Polls

**Complexity:** Medium

- [x] **1.1** Add "Edit" button to scheduled poll creator DM confirmation message
- [x] **1.2** Action ID: `edit_scheduled_{pollId}` (regex matched)
- [x] **1.3** Register action handler in `src/actions/`
- [x] **1.4** Validate poll still has `status: 'scheduled'` before allowing edit
- [x] **1.5** Open poll creation modal pre-filled with existing poll data:
  - Reuse `buildPollCreationModal({ prefill })` with full poll config
  - Pre-fill: question, poll type, options, channel, all settings, close method, schedule time
- [x] **1.6** Use a distinct callback ID: `poll_edit_modal` to differentiate from creation
- [x] **1.7** Create `updatePoll()` service method in `pollService.ts`:
  - Update question, pollType, settings, channelId, scheduledAt, closesAt
  - Delete existing options and recreate (simpler than diffing)
- [x] **1.8** Handle submission: update poll record instead of creating new one
- [x] **1.9** Send updated DM confirmation to creator after edit
- [x] **1.10** Edge case: if poll was posted between edit button click and submission, reject with error

---

## 2. Poll Repost

**Complexity:** Medium

- [x] **2.1** Add "Repost" button to:
  - Creator DM results (after poll closes)
  - `/askify list` for closed polls
- [x] **2.2** Action ID: `repost_poll_{pollId}` (regex matched)
- [x] **2.3** Register action handler in `src/actions/`
- [x] **2.4** On click, create a fresh poll copy:
  - New poll record with new UUID
  - Copy: question, pollType, settings, channelId
  - Copy options (reset votes to zero)
  - Set `status: 'active'`, clear scheduledAt/closesAt
  - Reset all vote-related data
- [x] **2.5** Create `repostPoll()` service method in `pollService.ts`
- [x] **2.6** Post the new poll to the original channel
- [x] **2.7** Store new `message_ts`
- [x] **2.8** DM creator confirmation with new poll details
- [x] **2.9** Optionally allow channel override (open a small modal with channel select)

---

## 3. Schedule Repost

**Complexity:** Medium

- [x] **3.1** Add "Schedule Repost" button alongside "Repost" button
- [x] **3.2** Action ID: `schedule_repost_{pollId}` (regex matched)
- [x] **3.3** On click, open a modal with:
  - Datetimepicker for scheduled post time
  - Optional: channel override select
  - Optional: close method (manual/duration/datetime) — reuse existing modal components
- [x] **3.4** Callback ID: `schedule_repost_modal`
- [x] **3.5** On submission, create a fresh poll copy with `status: 'scheduled'`:
  - Copy question, pollType, settings, options from source poll
  - Set `scheduledAt` to selected datetime
  - Calculate `closesAt` if duration/datetime close method selected
- [x] **3.6** Create `scheduleRepost()` service method or extend `repostPoll()` with schedule option
- [x] **3.7** Existing `scheduledPollJob` handles posting at the scheduled time (no changes needed)
- [x] **3.8** DM creator confirmation with scheduled time
- [x] **3.9** Scheduled repost appears in `/askify list` with "Scheduled" status
