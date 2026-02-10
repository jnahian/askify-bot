# Askify v1.1.0 — UI Improvements & List Enhancements

> Derived from PRD v1.0 (February 9, 2026)
> Complexity: Low to Low-Medium

---

## Overview

This release focuses on polishing the poll creation modal UX, enriching the `/askify list` command with filtering and result viewing, and improving poll message visuals.

---

## 1. Auto Number Emoji Prefix on Options & Buttons

**Complexity:** Low

- [ ] **1.1** Add number emoji mapping (1️⃣ 2️⃣ 3️⃣ ... 🔟) utility
- [ ] **1.2** Add star emoji mapping (⭐ for 1, ⭐⭐ for 2, etc.) for rating polls
- [ ] **1.3** Prefix option labels in poll messages with number emojis (e.g., `1️⃣ Pizza`)
- [ ] **1.4** For rating polls, use star emojis as labels and button text (e.g., `⭐⭐⭐` for rating 3)
- [ ] **1.5** Replace vote button text with number emoji only for non-rating polls (e.g., `1️⃣` instead of `Pizza`)
- [ ] **1.6** Apply to poll types: single choice, multi-select, yes/no/maybe (number emojis), rating (star emojis)

---

## 2. Optional Poll Description Field

**Complexity:** Low-Medium

- [ ] **2.1** Add `plain_text_input` field below question in poll creation modal (optional, multiline)
- [ ] **2.2** Store description in `Poll.settings` JSON (key: `description`)
- [ ] **2.3** Render description as a section block below the header in poll channel messages
- [ ] **2.4** Include description in results DM and shared results
- [ ] **2.5** Support description in poll templates (save & pre-fill)

---

## 3. Option to Hide "Maybe" from Yes/No/Maybe Polls

**Complexity:** Low-Medium

- [ ] **3.1** Add "Include Maybe option" checkbox in modal (visible only when poll type is `yes_no`)
- [ ] **3.2** Default: Maybe included (backward compatible)
- [ ] **3.3** When unchecked, generate only `['Yes', 'No']` options on submission
- [ ] **3.4** Add default emojis to yes/no/maybe options: ✅ Yes, ❌ No, 🤷 Maybe
- [ ] **3.5** Use emoji-only button labels for yes/no/maybe polls (✅, ❌, 🤷)
- [ ] **3.6** Store `includeMaybe` preference in settings JSON

---

## 4. Checkbox with Description for Settings

**Complexity:** Low

- [ ] **4.1** Consolidate individual setting checkboxes into a single `checkboxes` element
- [ ] **4.2** Add `description` field to each checkbox option:
  - Anonymous Voting — "Voter identities are hidden from results"
  - Allow Vote Change — "Voters can change or retract their vote"
  - Show Live Results — "Results are visible before the poll closes"
  - Send Reminders — "DM non-voters before the poll closes"
  - Allow Adding Options — "Voters can suggest new options"
- [ ] **4.3** Preserve existing default values (vote change: on, live results: on)
- [ ] **4.4** Update submission handler to parse consolidated checkbox values

---

## 5. Radio Buttons for Poll Type & Post Time

**Complexity:** Low

- [ ] **5.1** Replace Poll Type `static_select` with `radio_buttons` element
- [ ] **5.2** Replace Post Time `static_select` with `radio_buttons` element
- [ ] **5.3** Ensure `dispatch_action: true` works on radio buttons for dynamic modal rebuilds
- [ ] **5.4** Update `extractModalState()` to parse radio button values
- [ ] **5.5** Update template pre-fill logic to set `initial_option` on radio buttons

---

## 6. Enrich `/askify list` Command

**Complexity:** Low-Medium

- [ ] **6.1** Update `getUserPolls()` to include all statuses: active, scheduled, closed
- [ ] **6.2** Change default limit from 20 to 10
- [ ] **6.3** Add status emoji for closed polls (`:no_entry_sign:`)
- [ ] **6.4** Enrich poll card body:
  - Poll type label
  - Option count / option preview
  - Total vote count
  - Created date
  - Closed date (for closed polls)
- [ ] **6.5** Group or visually separate polls by status

---

## 7. Date Range Filter for `/askify list`

**Complexity:** Low-Medium

- [ ] **7.1** Parse text arguments from `/askify list` command:
  - No args → latest 10 polls (default)
  - `7d`, `30d`, etc. → relative date range (last N days)
  - `YYYY-MM-DD YYYY-MM-DD` → absolute date range
- [ ] **7.2** Add `from`/`to` date parameters to `getUserPolls()` service method
- [ ] **7.3** Filter on `createdAt` column with date range
- [ ] **7.4** Show filter info in the list header (e.g., "Your Polls — Last 7 days")
- [ ] **7.5** Show helpful error for invalid date format

---

## 8. Results Button on Poll List

**Complexity:** Low-Medium

- [ ] **8.1** Add "Results" button on each active/closed poll in the list
- [ ] **8.2** Action ID pattern: `list_results_{pollId}` (regex matched)
- [ ] **8.3** Register action handler in `src/actions/listActions.ts`
- [ ] **8.4** On click, open a modal with full results:
  - Bar charts with percentages
  - Voter names (if not anonymous)
  - Total vote count
  - Rating average (for rating polls)
- [ ] **8.5** Reuse `buildResultsDMBlocks()` logic adapted for modal view
- [ ] **8.6** No Results button for scheduled polls (no votes yet)
