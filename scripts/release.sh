#!/usr/bin/env bash
set -euo pipefail

# ── helpers ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}▶${RESET} $*"; }
success() { echo -e "${GREEN}✔${RESET} $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET} $*"; }
die()     { echo -e "${RED}✖ $*${RESET}" >&2; exit 1; }

# ── args ─────────────────────────────────────────────────────────────────────

BUMP="${1:-patch}"   # patch | minor | major

[[ "$BUMP" =~ ^(patch|minor|major)$ ]] \
  || die "Invalid bump type '$BUMP'. Use: patch (default), minor, or major."

# ── pre-flight checks ─────────────────────────────────────────────────────────

command -v node >/dev/null 2>&1 || die "node is not installed."
command -v npm  >/dev/null 2>&1 || die "npm is not installed."

cd "$(dirname "$0")/.."

[[ -f package.json ]] || die "package.json not found. Run this script from the repo root."

if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  warn "You have uncommitted changes. The release will proceed, but consider committing first."
  echo ""
fi

# ── current version ───────────────────────────────────────────────────────────

CURRENT=$(node -p "require('./package.json').version")
info "Current version: ${BOLD}${CURRENT}${RESET}"

# ── bump version in package.json ─────────────────────────────────────────────

info "Bumping ${BUMP} version…"
NEW=$(npm version "$BUMP" --no-git-tag-version | tr -d 'v')
success "New version: ${BOLD}${NEW}${RESET}"

# ── package (vsce runs vscode:prepublish → build internally) ─────────────────

VSIX="ai-commit-pr-generator-${NEW}.vsix"

info "Packaging ${VSIX}…"
./node_modules/.bin/vsce package --no-git-tag-version --no-update-package-json -o "$VSIX"
success "Package ready: ${BOLD}${VSIX}${RESET}"

# ── git commit + tag ──────────────────────────────────────────────────────────

if git rev-parse --git-dir >/dev/null 2>&1; then
  info "Creating git commit and tag v${NEW}…"
  git add package.json package-lock.json
  git commit -m "chore: release v${NEW}"
  git tag "v${NEW}"
  success "Tagged v${NEW}."
fi

# ── push ─────────────────────────────────────────────────────────────────────

if git remote get-url origin >/dev/null 2>&1; then
  info "Pushing to remote…"
  git push
  git push --tags
  success "Pushed."
else
  warn "No remote configured — skipping push."
fi

# ── GitHub Release ────────────────────────────────────────────────────────────

RELEASE_URL=""
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  info "Creating GitHub Release v${NEW}…"
  gh release create "v${NEW}" "$VSIX" \
    --title "v${NEW}" \
    --notes "$(cat <<EOF
## Install

Download \`${VSIX}\` and install in VS Code:

\`\`\`
code --install-extension ${VSIX}
\`\`\`

Or via the VS Code UI: **Extensions → ··· → Install from VSIX…**
EOF
)"
  success "GitHub Release created."
  RELEASE_URL=$(gh release view "v${NEW}" --json url -q .url 2>/dev/null || echo "")
else
  warn "gh CLI not found or not authenticated — skipping GitHub Release."
  echo -e "  Create manually: ${CYAN}gh release create v${NEW} ${VSIX} --title \"v${NEW}\"${RESET}"
fi

# ── summary ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Done.${RESET}"
echo -e "  Version : ${GREEN}${NEW}${RESET}"
echo -e "  File    : ${GREEN}${VSIX}${RESET}"
[[ -n "$RELEASE_URL" ]] && echo -e "  Release : ${GREEN}${RELEASE_URL}${RESET}"
echo ""
echo -e "Upload ${BOLD}${VSIX}${RESET} to the Marketplace:"
echo -e "  ${CYAN}https://marketplace.visualstudio.com/manage/publishers/wsilva${RESET}"
