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

# Warn (but don't abort) if there are uncommitted changes
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
  warn "You have uncommitted changes. The release will proceed, but consider committing first."
  echo ""
fi

# ── current version ───────────────────────────────────────────────────────────

CURRENT=$(node -p "require('./package.json').version")
info "Current version: ${BOLD}${CURRENT}${RESET}"

# ── bump version in package.json ─────────────────────────────────────────────

info "Bumping ${BUMP} version…"
# npm version writes the new version and creates a git tag; --no-git-tag-version
# skips the tag so we can create it ourselves after the build succeeds
NEW=$(npm version "$BUMP" --no-git-tag-version | tr -d 'v')
success "New version: ${BOLD}${NEW}${RESET}"

# ── build ─────────────────────────────────────────────────────────────────────

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
  echo ""
  echo -e "  Push with: ${CYAN}git push && git push --tags${RESET}"
fi

# ── summary ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}Done.${RESET}"
echo -e "  Version : ${GREEN}${NEW}${RESET}"
echo -e "  File    : ${GREEN}${VSIX}${RESET}"
echo ""
echo -e "Install locally:"
echo -e "  ${CYAN}code --install-extension ${VSIX}${RESET}"
