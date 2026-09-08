#!/usr/bin/env bash
#
# publish-template.sh — first-time publication of bulletproof-ai-project-template.
#
# Scope: INITIAL publication only. If the GitHub repository already exists this
# script stops. Later template versions use ordinary git add / commit / push.
#
# Before the YES prompt: local verification and local git preparation only
# (init, .gitignore, branch, staging). No commit, no repo creation, no push.
#
# Run it from inside the template directory (it reads TEMPLATE_VERSION,
# AGENTS.md, etc. relative to the current directory, not relative to this
# script's own location):
#   cd /path/to/bulletproof-ai-project-template
#   bash scripts/publish-template.sh
# (a copy outside the repo, e.g. ~/publish-template.sh, also works — the
# script only cares about the working directory it's run from)

set -Eeuo pipefail

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  C_G="$(printf '\033[32m')"; C_R="$(printf '\033[31m')"
  C_Y="$(printf '\033[33m')"; C_B="$(printf '\033[1m')"; C_0="$(printf '\033[0m')"
else
  C_G=""; C_R=""; C_Y=""; C_B=""; C_0=""
fi

WARN_COUNT=0

pass() { printf '%s[PASS]%s %s\n' "$C_G" "$C_0" "$*"; }
warn() { printf '%s[WARN]%s %s\n' "$C_Y" "$C_0" "$*"; WARN_COUNT=$((WARN_COUNT + 1)); }
info() { printf '       %s\n' "$*"; }
head1() { printf '\n%s== %s ==%s\n' "$C_B" "$*" "$C_0"; }

fail() {
  printf '%s[FAIL]%s %s\n' "$C_R" "$C_0" "$*" >&2
  exit 1
}

on_error() {
  printf '\n%s[FAIL]%s Aborted at line %s. Nothing further was attempted.\n' \
    "$C_R" "$C_0" "${1:-?}" >&2
}
trap 'on_error "$LINENO"' ERR

ask_tty() {
  # Read from the terminal, not stdin, so pasted text cannot answer this prompt.
  local _prompt="$1" _var
  if [ -r /dev/tty ]; then
    printf '%s' "$_prompt" > /dev/tty
    IFS= read -r _var < /dev/tty
  else
    printf '%s' "$_prompt"
    IFS= read -r _var
  fi
  printf '%s' "$_var"
}

REPO_NAME="bulletproof-ai-project-template"
VISIBILITY="private"
BRANCH="main"

# ---------------------------------------------------------------------------
# 1. Locate the template directory
# ---------------------------------------------------------------------------
head1 "1. Locating template"

MARKERS="AGENTS.md CLAUDE.md PLAN.md README.md TEMPLATE_VERSION"

looks_like_template() {
  local d="$1" m
  for m in $MARKERS; do
    [ -f "$d/$m" ] || return 1
  done
  [ -d "$d/docs" ] && [ -d "$d/prompts" ] && [ -f "$d/scripts/validate.sh" ]
}

TEMPLATE_DIR=""
if looks_like_template "$PWD"; then
  TEMPLATE_DIR="$PWD"
elif looks_like_template "$PWD/$REPO_NAME"; then
  TEMPLATE_DIR="$PWD/$REPO_NAME"
fi

if [ -z "$TEMPLATE_DIR" ]; then
  fail "No template found here.
       Looked in: $PWD
              and: $PWD/$REPO_NAME
       cd into the extracted template directory and re-run."
fi

cd "$TEMPLATE_DIR"
TEMPLATE_DIR="$PWD"
pass "Template directory: $TEMPLATE_DIR"

# ---------------------------------------------------------------------------
# 2. Verify required files
# ---------------------------------------------------------------------------
head1 "2. Verifying required files"

REQUIRED_FILES="
AGENTS.md
CLAUDE.md
PLAN.md
README.md
CHANGELOG.md
TEMPLATE_VERSION
docs/ARCHITECTURE.md
docs/DESIGN.md
docs/DECISIONS.md
docs/PALETTES.md
prompts/01-project-intake.md
prompts/02-execute-phase.md
prompts/03-review.md
prompts/04-final-verification.md
prompts/05-autonomous-phase.md
scripts/validate.sh
"

MISSING=""
for f in $REQUIRED_FILES; do
  [ -f "$f" ] || MISSING="$MISSING $f"
done
[ -n "$MISSING" ] && fail "Missing required file(s):$MISSING"
pass "All required files present"

if [ -f ".claude/settings.json" ]; then
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import json,sys; json.load(open(".claude/settings.json"))' 2>/dev/null \
      && pass ".claude/settings.json is valid JSON" \
      || fail ".claude/settings.json is not valid JSON"
  else
    warn ".claude/settings.json present but python3 unavailable to validate it"
  fi
else
  warn ".claude/settings.json not found (permission deny-list absent)"
fi

# ---------------------------------------------------------------------------
# 3. Verify TEMPLATE_VERSION
# ---------------------------------------------------------------------------
head1 "3. Verifying TEMPLATE_VERSION"

TEMPLATE_VERSION="$(tr -d ' \t\r\n' < TEMPLATE_VERSION)"
[ -n "$TEMPLATE_VERSION" ] || fail "TEMPLATE_VERSION is empty"

printf '%s' "$TEMPLATE_VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$' \
  || fail "TEMPLATE_VERSION is not semver: '$TEMPLATE_VERSION'"
pass "TEMPLATE_VERSION = $TEMPLATE_VERSION"

if grep -q "## $TEMPLATE_VERSION" CHANGELOG.md 2>/dev/null; then
  pass "CHANGELOG.md documents $TEMPLATE_VERSION"
else
  warn "CHANGELOG.md has no '## $TEMPLATE_VERSION' entry"
fi

# ---------------------------------------------------------------------------
# 4. Secret / sensitive-file scan
# ---------------------------------------------------------------------------
head1 "4. Scanning for secrets"

FOUND_FILES="$(
  find . -path ./.git -prune -o -type f \( \
       -name '.env' -o -name '.env.*' ! -name '.env.example' \
    -o -name '*.pem' -o -name '*.key' -o -name '*.p12' -o -name '*.pfx' \
    -o -name 'id_rsa*' -o -name 'id_ed25519*' -o -name '.npmrc' \
    -o -name '*.keystore' -o -name 'credentials' -o -name 'credentials.json' \
    -o -name '.netrc' -o -name 'terraform.tfvars' \
  \) -print 2>/dev/null || true
)"

if [ -n "$FOUND_FILES" ]; then
  printf '%s\n' "$FOUND_FILES" >&2
  fail "Sensitive file(s) found above. Remove them before publishing."
fi
pass "No sensitive filenames"

SECRET_RE='BEGIN (RSA|DSA|EC|OPENSSH|PGP)? ?PRIVATE KEY|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9]{24,}|AIza[0-9A-Za-z_-]{30,}'

HITS="$(grep -REIl --exclude-dir=.git "$SECRET_RE" . 2>/dev/null || true)"
if [ -n "$HITS" ]; then
  printf '%s\n' "$HITS" >&2
  fail "Possible credential material in the file(s) above. Review before publishing."
fi
pass "No credential patterns in file contents"

# ---------------------------------------------------------------------------
# 5. Verify scripts/validate.sh
# ---------------------------------------------------------------------------
head1 "5. Verifying scripts/validate.sh"

bash -n scripts/validate.sh || fail "scripts/validate.sh has a syntax error"
pass "scripts/validate.sh parses cleanly"

if [ -x scripts/validate.sh ]; then
  pass "scripts/validate.sh is executable"
else
  chmod +x scripts/validate.sh
  warn "scripts/validate.sh was not executable — executable bit set (local change)"
fi

# ---------------------------------------------------------------------------
# 6. Show the tree
# ---------------------------------------------------------------------------
head1 "6. Files to be published"

find . -path ./.git -prune -o -type f -print | sed 's|^\./||' | sort

FILE_COUNT="$(find . -path ./.git -prune -o -type f -print | wc -l | tr -d ' ')"
info ""
info "$FILE_COUNT file(s)"

# ---------------------------------------------------------------------------
# 7. Initialize git if needed  (local preparation)
# ---------------------------------------------------------------------------
head1 "7. Local git repository"

command -v git >/dev/null 2>&1 || fail "git is not installed"

GIT_WAS_PRESENT="no"
if [ -d .git ]; then
  GIT_WAS_PRESENT="yes"
  pass "Existing .git found — inspecting rather than replacing"
  info "Branch:  $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '(no commits yet)')"
  info "Commits: $(git rev-list --count HEAD 2>/dev/null || echo 0)"
  EXISTING_REMOTES="$(git remote -v 2>/dev/null || true)"
  if [ -n "$EXISTING_REMOTES" ]; then
    printf '%s\n' "$EXISTING_REMOTES" | sed 's/^/       /'
  else
    info "Remotes: none"
  fi
else
  if git init -b "$BRANCH" >/dev/null 2>&1; then
    :
  else
    git init >/dev/null
    git symbolic-ref HEAD "refs/heads/$BRANCH"
  fi
  pass "Initialized empty repository on '$BRANCH'"
fi

# ---------------------------------------------------------------------------
# 8. .gitignore only if needed
# ---------------------------------------------------------------------------
head1 "8. .gitignore"

if [ -f .gitignore ]; then
  pass ".gitignore already present — left untouched"
else
  cat > .gitignore <<'GITIGNORE'
# Local environment — never commit real values
.env
.env.*
!.env.example

# Credentials
*.pem
*.key
*.p12
.netrc

# OS noise
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Dependencies / build output (present once a project is generated from this template)
node_modules/
dist/
build/
.venv/
__pycache__/
GITIGNORE
  pass ".gitignore created"
fi

# ---------------------------------------------------------------------------
# 9. Ensure branch main
# ---------------------------------------------------------------------------
head1 "9. Branch"

HAS_COMMITS="no"
git rev-parse --verify HEAD >/dev/null 2>&1 && HAS_COMMITS="yes"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "$BRANCH")"
if [ "$CURRENT_BRANCH" = "$BRANCH" ]; then
  pass "On '$BRANCH'"
elif [ "$HAS_COMMITS" = "no" ]; then
  git symbolic-ref HEAD "refs/heads/$BRANCH"
  pass "Default branch set to '$BRANCH'"
else
  git branch -M "$BRANCH"
  warn "Renamed local branch '$CURRENT_BRANCH' to '$BRANCH' (local only)"
fi

# ---------------------------------------------------------------------------
# 10 & 11. Stage and show status  (still no commit)
# ---------------------------------------------------------------------------
head1 "10. Staging"
git add -A
pass "Staged (not committed)"

head1 "11. git status"
git status --short --branch

STAGED_COUNT="$(git diff --cached --name-only | wc -l | tr -d ' ')"

WILL_COMMIT="yes"
if git diff --cached --quiet 2>/dev/null; then
  if [ "$HAS_COMMITS" = "yes" ]; then
    WILL_COMMIT="no"
    warn "Nothing staged — working tree already matches HEAD; no new commit will be made"
  else
    fail "Nothing staged and no commits exist. Refusing to create an empty commit."
  fi
fi

if [ "$HAS_COMMITS" = "yes" ]; then
  COMMIT_MSG="chore: sync bulletproof AI project template v${TEMPLATE_VERSION}"
else
  COMMIT_MSG="feat: initialize bulletproof AI project template v${TEMPLATE_VERSION}"
fi

# ---------------------------------------------------------------------------
# 12. GitHub prerequisites  (checked before the commit)
# ---------------------------------------------------------------------------
head1 "12. GitHub prerequisites"

if ! command -v gh >/dev/null 2>&1; then
  printf '%s[FAIL]%s GitHub CLI (gh) is not installed. Nothing was committed or pushed.\n\n' "$C_R" "$C_0" >&2
  cat >&2 <<EOF
Your files are staged at:
  $TEMPLATE_DIR
No commit was created.

To finish, install and authenticate gh, then re-run this script:

  brew install gh          # macOS
  gh auth login

Or publish manually — create a PRIVATE repo named '$REPO_NAME' on GitHub, then:

  git commit -m "$COMMIT_MSG"
  git remote add origin git@github.com:<your-user>/$REPO_NAME.git
  git push -u origin $BRANCH
EOF
  exit 1
fi
pass "gh is installed"

if ! gh auth status >/dev/null 2>&1; then
  printf '%s[FAIL]%s gh is installed but not authenticated. Nothing was committed or pushed.\n\n' "$C_R" "$C_0" >&2
  cat >&2 <<EOF
Run:

  gh auth login

then re-run this script. Your files remain staged and uncommitted at:
  $TEMPLATE_DIR
EOF
  exit 1
fi
pass "gh is authenticated"

GH_USER="$(gh api user --jq .login 2>/dev/null || true)"
[ -n "$GH_USER" ] || fail "Could not determine GitHub user from gh"
pass "GitHub user: $GH_USER"

FULL_REPO="$GH_USER/$REPO_NAME"

# --- origin must not already point somewhere ------------------------------
if git remote get-url origin >/dev/null 2>&1; then
  EXISTING_ORIGIN="$(git remote get-url origin)"
  printf '%s[FAIL]%s A remote named origin already exists:\n       %s\n\n' \
    "$C_R" "$C_0" "$EXISTING_ORIGIN" >&2
  cat >&2 <<EOF
This script performs INITIAL publication only and will not modify an existing
remote. Nothing was committed or pushed.

If this repository is already published, use ordinary git instead:

  git commit -m "$COMMIT_MSG"
  git push origin $BRANCH
EOF
  exit 1
fi
pass "No origin remote configured"

# --- repo must not already exist on GitHub --------------------------------
if gh repo view "$FULL_REPO" >/dev/null 2>&1; then
  EXISTING_VIS="$(gh repo view "$FULL_REPO" --json visibility --jq .visibility 2>/dev/null || echo unknown)"
  printf '%s[FAIL]%s GitHub repository already exists: %s (visibility: %s)\n\n' \
    "$C_R" "$C_0" "$FULL_REPO" "$EXISTING_VIS" >&2
  cat >&2 <<EOF
This script publishes the canonical template for the FIRST time only. It will not
push into an existing repository, and it has not deleted, modified, or overwritten
anything. Nothing was committed or pushed.

If that repository is your template, publish updates with ordinary git:

  git remote add origin git@github.com:$FULL_REPO.git
  git commit -m "$COMMIT_MSG"
  git push -u origin $BRANCH

If it is something else, rename it on GitHub or choose a different name, then
re-run this script.
EOF
  exit 1
fi
pass "No existing GitHub repo named $FULL_REPO"

# ---------------------------------------------------------------------------
# Summary and the single confirmation
# ---------------------------------------------------------------------------
head1 "About to commit and publish"

cat <<EOF
  Local path      : $TEMPLATE_DIR
  Template version: $TEMPLATE_VERSION
  Branch          : $BRANCH
  Staged files    : $STAGED_COUNT
  Commit          : $( [ "$WILL_COMMIT" = "yes" ] && printf '%s' "$COMMIT_MSG" || printf 'none — HEAD already current' )
  Repository      : $FULL_REPO  (new)
  Visibility      : private
  Remote origin   : will be added
  Force push      : never

  On YES, in this order:
    1. create the commit from the staged snapshot shown above
    2. create the private GitHub repository
    3. add origin
    4. push $BRANCH

  On anything else: no commit, no repository, no push. Files stay staged.

EOF

if [ "$WARN_COUNT" -gt 0 ]; then
  printf '%s%s warning(s) above.%s\n\n' "$C_Y" "$WARN_COUNT" "$C_0"
fi

CONFIRM="$(ask_tty 'Type YES to proceed (anything else aborts): ')"
if [ "$CONFIRM" != "YES" ]; then
  printf '\nAborted. No commit was created, no GitHub repository exists, nothing was pushed.\n'
  printf 'Your files remain staged at %s\n' "$TEMPLATE_DIR"
  exit 1
fi

# ---------------------------------------------------------------------------
# 13. Commit
# ---------------------------------------------------------------------------
head1 "13. Commit"

if [ "$WILL_COMMIT" = "yes" ]; then
  git commit -q -m "$COMMIT_MSG"
  pass "Committed: $COMMIT_MSG"
else
  pass "No new commit needed"
fi

COMMIT_HASH="$(git rev-parse --short HEAD)"
COMMIT_SUBJECT="$(git log -1 --pretty=%s)"

# ---------------------------------------------------------------------------
# 14. Create repository and connect
# ---------------------------------------------------------------------------
head1 "14. Creating repository"

gh repo create "$FULL_REPO" --"$VISIBILITY" --disable-wiki >/dev/null
pass "Created $VISIBILITY repository $FULL_REPO"

ORIGIN_URL="$(gh repo view "$FULL_REPO" --json sshUrl --jq .sshUrl 2>/dev/null || true)"
[ -n "$ORIGIN_URL" ] || ORIGIN_URL="https://github.com/$FULL_REPO.git"
git remote add origin "$ORIGIN_URL"
REMOTE_URL="$ORIGIN_URL"
pass "Added origin: $REMOTE_URL"

# ---------------------------------------------------------------------------
# 15. Push
# ---------------------------------------------------------------------------
head1 "15. Pushing $BRANCH"

PUSH_STATUS="failed"
if git push -u origin "$BRANCH"; then
  PUSH_STATUS="success"
  pass "Pushed $BRANCH to origin"
else
  printf '%s[FAIL]%s Push failed. Not retrying, and NOT force-pushing.\n\n' "$C_R" "$C_0" >&2
  cat >&2 <<EOF
The repository $FULL_REPO was created and origin is set, but the push did not
complete. Your commit ($COMMIT_HASH) is safe locally.

Inspect before doing anything else:

  git fetch origin
  git log --oneline origin/$BRANCH
  git status

Then retry:

  git push -u origin $BRANCH

If SSH authentication is the problem, check: ssh -T git@github.com
Do not use --force.
EOF
  exit 1
fi

# ---------------------------------------------------------------------------
# 16. Verification
# ---------------------------------------------------------------------------
head1 "16. Verification"

git fetch origin "$BRANCH" >/dev/null 2>&1 || true

LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo 'unknown')"

[ "$(git rev-parse --abbrev-ref HEAD)" = "$BRANCH" ] \
  && pass "On branch $BRANCH" || warn "Not on $BRANCH"

if [ -z "$(git status --porcelain)" ]; then
  TREE_STATUS="clean"
  pass "Working tree clean"
else
  TREE_STATUS="dirty"
  warn "Working tree has uncommitted changes"
fi

if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  pass "origin/$BRANCH matches local HEAD"
else
  PUSH_STATUS="unverified"
  warn "origin/$BRANCH ($REMOTE_SHA) differs from local HEAD ($LOCAL_SHA)"
fi

FINAL_VISIBILITY="$(gh repo view "$FULL_REPO" --json visibility --jq .visibility 2>/dev/null || echo unknown)"
case "$FINAL_VISIBILITY" in
  PRIVATE|private) pass "Repository visibility: $FINAL_VISIBILITY" ;;
  *) warn "Repository visibility is $FINAL_VISIBILITY — expected private" ;;
esac

# ---------------------------------------------------------------------------
# Final report
# ---------------------------------------------------------------------------
head1 "Report"

cat <<EOF
  Template version : $TEMPLATE_VERSION
  Local repo path  : $TEMPLATE_DIR
  Git branch       : $BRANCH
  Commit           : $COMMIT_HASH  $COMMIT_SUBJECT
  GitHub repo      : $FULL_REPO
  Visibility       : $FINAL_VISIBILITY
  Remote           : $REMOTE_URL
  Push status      : $PUSH_STATUS
  Working tree     : $TREE_STATUS
  Warnings         : $WARN_COUNT
  Pre-existing git : $GIT_WAS_PRESENT

  View: gh repo view $FULL_REPO --web

  Future template versions: ordinary git add / commit / push.
  This script is for initial publication only.
EOF

exit 0
