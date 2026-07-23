#!/bin/bash
# Stop hook: detects new features and updates CLAUDE.md automatically.
#
# Strategy:
# 1. Read the Stop hook payload (session info) from stdin
# 2. Check git for new component/route files added since last run
# 3. If new features detected, invoke Claude in headless mode to update CLAUDE.md
# 4. Uses a marker file to prevent recursive loops

set -e

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

MARKER_FILE=".claude/.last-update-commit"
CURRENT_HEAD=$(git rev-parse HEAD 2>/dev/null || echo "no-git")

# Read Stop hook payload (we don't use it but must consume stdin)
cat > /dev/null

# Avoid loops: skip if we're being triggered by the CLAUDE.md update itself
if [ -f "$MARKER_FILE" ] && [ "$(cat "$MARKER_FILE")" = "$CURRENT_HEAD" ]; then
  exit 0
fi

# Detect new feature files (untracked or newly added) since last check
NEW_FILES=$(git status --porcelain 2>/dev/null | grep -E '^\?\?|^A ' | awk '{print $2}' | grep -E '\.(tsx|ts|py)$' | grep -vE '(test_|\.test\.|CLAUDE\.md|scratchpad)' || true)

# Also check files added in the last commit
if [ "$CURRENT_HEAD" != "no-git" ]; then
  LAST_COMMIT_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD 2>/dev/null | grep -E '\.(tsx|ts|py)$' | grep -vE '(test_|\.test\.|CLAUDE\.md|scratchpad)' || true)
else
  LAST_COMMIT_FILES=""
fi

ALL_NEW="$NEW_FILES"$'\n'"$LAST_COMMIT_FILES"
ALL_NEW=$(echo "$ALL_NEW" | sort -u | grep -v '^$' || true)

# Threshold: only trigger if 2+ new feature files (avoid tiny edits)
FILE_COUNT=$(echo "$ALL_NEW" | grep -c . || echo 0)
if [ "$FILE_COUNT" -lt 2 ]; then
  exit 0
fi

# Check if CLAUDE.md exists
if [ ! -f "CLAUDE.md" ]; then
  exit 0
fi

echo "[CLAUDE.md hook] Detected $FILE_COUNT new/changed feature files. Updating CLAUDE.md..." >&2

# Build a concise prompt for headless Claude
PROMPT="A new feature or set of files was just added to this project. Review the current git status and recent changes, then update CLAUDE.md to reflect any new architecture, endpoints, components, or workflows. Keep the update surgical — only add/modify sections that describe genuinely new capabilities. Do not restructure existing content. Files changed:
$ALL_NEW

If nothing meaningful needs updating in CLAUDE.md, respond with 'no update needed' and do not modify the file."

# Invoke Claude in headless mode to update CLAUDE.md (non-blocking, best-effort)
# Uses --dangerously-skip-permissions so it can write without prompts
(
  claude -p "$PROMPT" --dangerously-skip-permissions >/dev/null 2>&1 &
) &

# Save marker to prevent immediate re-run
echo "$CURRENT_HEAD" > "$MARKER_FILE"

exit 0
