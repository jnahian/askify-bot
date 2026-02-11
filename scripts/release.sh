#!/usr/bin/env bash
set -euo pipefail

# ── Read version from package.json ──────────────────────────────────
VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo "Version: ${VERSION}"
echo "Tag:     ${TAG}"

# ── Check gh CLI is available ───────────────────────────────────────
if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) is not installed." >&2
  exit 1
fi

# ── Check for uncommitted changes ──────────────────────────────────
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: You have uncommitted changes. Commit or stash them first." >&2
  exit 1
fi

# ── Check if release already exists ─────────────────────────────────
if gh release view "${TAG}" &>/dev/null; then
  echo "Error: Release ${TAG} already exists." >&2
  exit 1
fi

# ── Extract changelog for this version ──────────────────────────────
# Grabs everything between "## [VERSION]" and the next "## [" heading
NOTES=$(awk -v ver="${VERSION}" '
  /^## \[/ {
    if (found) exit
    if (index($0, "## [" ver "]")) { found=1; next }
  }
  found { print }
' CHANGELOG.md)

if [ -z "${NOTES}" ]; then
  echo "Error: No changelog entry found for version ${VERSION} in CHANGELOG.md." >&2
  exit 1
fi

echo ""
echo "── Release notes ──────────────────────────────────────────────"
echo "${NOTES}"
echo "───────────────────────────────────────────────────────────────"
echo ""

# ── Confirm ─────────────────────────────────────────────────────────
read -rp "Create GitHub release ${TAG}? [y/N] " confirm
if [[ "${confirm}" != [yY] ]]; then
  echo "Aborted."
  exit 0
fi

# ── Create release ──────────────────────────────────────────────────
gh release create "${TAG}" \
  --title "${TAG}" \
  --notes "${NOTES}" \
  --target main

echo ""
echo "Release ${TAG} created successfully!"
