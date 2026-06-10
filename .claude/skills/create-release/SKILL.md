---
name: create-release
description: >-
  Cut a new versioned release of askify-bot. Use this whenever the user wants to
  "create a release", "cut a release", "release a new version", "ship a version",
  "bump the version", "publish a release", "prepare release notes", or asks what
  the next version should be. Inspects package.json + the latest git tag, summarizes
  every change since the last tag, asks for the version bump strategy (major/minor/patch),
  writes matching CHANGELOG.md and web/content/changelog entries, bumps package.json,
  commits, and publishes the GitHub release (the tag is created automatically on publish,
  which triggers the deploy workflow). Trigger this even if the user only says "release
  it" or "let's tag a version" without naming a version number.
---

# Create Release

This skill drives the full release flow for **askify-bot**. The goal is a clean,
correctly-versioned GitHub release whose notes match what actually changed, with
both changelogs kept in sync. Publishing the release auto-creates the git tag,
which triggers `.github/workflows/deploy.yml` to deploy to the VPS — so accuracy
matters more than speed.

Work through the phases in order. Each phase ends in a `verify:` check — don't move
on until it holds. Stop and ask the user whenever something is ambiguous; a release
is hard to unwind once the tag is published and the deploy fires.

## Phase 1 — Establish the current state

Run these and read the results together:

```bash
node -p "require('./package.json').version"        # version on disk
git tag --sort=-v:refname | head -5                # latest tags (newest first)
git rev-parse --abbrev-ref HEAD                    # current branch
git status --porcelain                             # uncommitted changes?
gh auth status >/dev/null 2>&1 && echo "gh OK" || echo "gh NOT logged in"
```

Then reconcile what you find:

- **The true "last released version" is the latest git tag, not necessarily
  `package.json`.** These can drift (e.g. a tag was cut without bumping the file).
  If they disagree, surface it plainly to the user before continuing and let them
  decide the baseline — don't silently pick one.
- If the working tree is **not clean**, list the changes and ask the user to commit
  or stash first. The release flow creates its own commit and must start clean.
- If not on `main`, point it out. Releases target `main`; confirm before proceeding.
- If `gh` is not logged in, tell the user to run `gh auth login` (suggest they type
  `! gh auth login` so the output lands in the session).

verify: You can state the last released version, the current branch, that the tree
is clean, and that `gh` is authenticated.

## Phase 2 — Summarize changes since the last release

Diff the working state against the last released tag (use the tag from Phase 1):

```bash
LAST_TAG=$(git tag --sort=-v:refname | head -1)
git log "$LAST_TAG"..HEAD --no-merges --pretty='- %s'   # commits since last release
git diff "$LAST_TAG"..HEAD --stat | tail -30            # files touched, scope
```

Read the commit subjects and the changed files, then write a short human-readable
summary of what's new — grouped into **Added / Changed / Fixed** (and **Breaking**
if any). This summary is the raw material for both the version decision and the
changelog. Don't just paraphrase commit messages one-to-one; merge related commits
into user-facing bullet points the way the existing `CHANGELOG.md` entries read
(look at the top of that file for the house style).

verify: You have a categorized list of user-facing changes since `$LAST_TAG`.

## Phase 3 — Decide the new version

Recommend a bump using semver against the **last released tag**:

- **major** — breaking changes (incompatible API/behavior, dropped features)
- **minor** — new backward-compatible features (most feature releases here)
- **patch** — backward-compatible bug fixes / docs / internal-only changes

Use `AskUserQuestion` to confirm the strategy. Put your recommended option **first**
and label it "(Recommended)", and in each option's description show the **concrete
resulting version** so the choice is unambiguous — e.g. if the last tag is `v1.3.1`:

- `minor` → `1.4.0`
- `patch` → `1.3.2`
- `major` → `2.0.0`

Compute these yourself from the last released version; don't make the user do the math.

verify: The user has chosen a strategy and you know the exact new version `X.Y.Z`.

## Phase 4 — Draft the changelog entries

Get today's date for the entry: `date +%F` (e.g. `2026-06-11`).

Draft the entry from your Phase 2 summary and **show it to the user for approval
before writing any files.** Edit per their feedback. Only once they're happy do you
write to disk.

This repo keeps **two** changelogs that must stay in sync — update **both**:

### a) Root `CHANGELOG.md` (Keep a Changelog format)

Insert a new section directly **above the most recent version section** (entries are
newest-first). Match the existing structure exactly:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- **Feature Name**: One-line description of the user-facing change
  - Sub-detail if it helps
- ...

### Changed
- ...

### Fixed
- ...
```

Only include the `###` subsections that actually have entries. Use `### Breaking`
first if there are breaking changes. Keep the bold-lead-in + sub-bullet style used
by existing entries.

### b) `web/content/changelog/vX.Y.Z.json`

Create a new file named `vX.Y.Z.json` (e.g. `v1.4.0.json`). It must validate against
the Zod schema in `web/src/lib/content/schemas.ts`:

```json
{
  "version": "X.Y.Z",
  "date": "YYYY-MM-DD",
  "type": "feature",
  "title": "Short human title summarizing the release",
  "items": [
    { "type": "feature", "text": "User-facing description of a change" },
    { "type": "improvement", "text": "..." },
    { "type": "fix", "text": "..." }
  ]
}
```

Field rules:
- `type` (top-level) and each item `type` must be one of: `feature`, `improvement`,
  `fix`, `breaking`. Map CHANGELOG sections: Added→`feature`, Changed→`improvement`,
  Fixed→`fix`, Breaking→`breaking`.
- Top-level `type` = the dominant category of the release (usually `feature`).
- `text` entries should be self-contained and a bit more descriptive/marketing-toned
  than the terse CHANGELOG bullets — read an existing file like
  `web/content/changelog/v1.3.0.json` to match the voice. The web app auto-discovers
  this file via glob; no index needs updating.

verify: `CHANGELOG.md` has the new `## [X.Y.Z]` section and `web/content/changelog/vX.Y.Z.json`
exists and is valid JSON with the required fields.

## Phase 5 — Bump package.json

Set the version in `package.json` to the new `X.Y.Z`. Use npm so it's exact and
doesn't create a tag yet (we want the tag created by the GitHub release, not now):

```bash
npm version X.Y.Z --no-git-tag-version
```

(If you'd rather edit the `"version"` field directly, that's fine too — just make
sure it matches `X.Y.Z` exactly.)

verify: `node -p "require('./package.json').version"` prints `X.Y.Z`.

## Phase 6 — Commit and push

Commit the version bump + both changelog files together, then push to `main` so the
release tag will point at the pushed commit:

```bash
git add package.json CHANGELOG.md web/content/changelog/vX.Y.Z.json
git commit -m "chore(release): vX.Y.Z"
git push origin main
```

End the commit message with the standard co-author trailer used in this repo.

If pushing directly to `main` is rejected (branch protection), stop and tell the
user — they'll need to open a release PR and merge it first; the release must be
created from a commit that already exists on `main`.

verify: The release commit is on `origin/main` (`git status` shows clean & up to date).

## Phase 7 — Publish the GitHub release

Create the release with `gh`. **Publishing creates the tag `vX.Y.Z` automatically**
and triggers `deploy.yml` — there is no separate `git tag` step.

First guard against a duplicate, then use the `CHANGELOG.md` section you just wrote
as the release notes (extract it rather than retyping, so the release body and the
changelog never disagree):

```bash
# Abort if this release already exists
gh release view vX.Y.Z >/dev/null 2>&1 && { echo "Release vX.Y.Z already exists"; exit 1; }

# Pull the new section out of CHANGELOG.md into a notes file
awk -v ver="X.Y.Z" '
  /^## \[/ { if (found) exit; if (index($0, "## [" ver "]")) { found=1; next } }
  found { print }
' CHANGELOG.md > /tmp/release-notes-X.Y.Z.md

# Sanity-check the notes are non-empty before publishing
test -s /tmp/release-notes-X.Y.Z.md || { echo "No changelog notes found for X.Y.Z"; exit 1; }
```

Get the user's explicit go-ahead in the conversation first — this is the
irreversible, outward-facing step that fires the deploy. Then publish:

```bash
gh release create vX.Y.Z --target main --title "vX.Y.Z" --notes-file /tmp/release-notes-X.Y.Z.md
```

After it returns, confirm and report:

```bash
gh release view vX.Y.Z --web   # or without --web to print in terminal
```

verify: `gh release view vX.Y.Z` shows the published release with your notes, and the
tag `vX.Y.Z` now exists (`git tag | grep vX.Y.Z`). Tell the user the deploy workflow
has been triggered by the publish.

## Notes & gotchas

- **Tag is auto-created on publish** — never run `git tag vX.Y.Z` yourself; that
  would conflict with what `gh release create` does.
- **Don't run the eval/test harness against this skill** — every run would create
  real git commits and a real GitHub release. Verify changes by reading the produced
  files and the `gh release view` output instead.
- **Tag/package.json drift** is a known state in this repo. Always anchor "what's the
  next version" to the latest **git tag**, and treat a lagging `package.json` as a bug
  to fix in this release, not as the source of truth.
- **Both changelogs or neither** — a release that updates `CHANGELOG.md` but forgets
  `web/content/changelog/` (or vice-versa) is the most common mistake. They ship as a
  pair.
