#!/usr/bin/env bash
# ─── why ─────────────────────────────────────────────────────────────────
# This repo is trunk-based and normally has uncommitted work sitting in the
# working copy — often somebody else's. Every pattern below acts on the WHOLE
# TREE instead of a pathspec, so each one either destroys that work or sweeps
# it into the wrong commit. `git clean -f` is the worst of them: untracked
# files are in no commit and no reflog, so there is nothing to recover from.
#
# A `permissions.deny` rule is not enough on its own, because git here is
# usually invoked as `cd <dir>; git …` and the rule matches the command's
# leading token. This hook reads the whole command string, so it sees the git
# call wherever it sits in a pipeline.
#
# The safe form is always a pathspec:
#   git add -- <paths>          (stages deletions too, since git 2.0)
#   git checkout -- <path>
#   git stash push -- <paths>   (recoverable, unlike reset/clean)
#
# `git push` is here for a different reason — see PUSH_REASON below. It is not
# about scope; it is the only git operation whose effect leaves this machine.
# ─────────────────────────────────────────────────────────────────────────
set -uo pipefail

# Heredoc BODIES are data, not commands — a commit message that quotes
# `git reset --hard` must not trip this. Drop each body while keeping the line
# that introduces it, since that line is a real command. (Found the honest way:
# this hook blocked its own commit.)
cmd=$(jq -r '.tool_input.command // ""' | awk '
  skip { if ($0 == term) skip = 0; next }
  {
    if (match($0, /<<-?[[:space:]]*'\''?"?[A-Za-z_][A-Za-z0-9_]*'\''?"?/)) {
      term = substr($0, RSTART, RLENGTH)
      sub(/^<<-?[[:space:]]*/, "", term)
      gsub(/['\''"]/, "", term)
      skip = 1
    }
    print
  }
')

SCOPE_REASON='This repo is trunk-based and usually holds uncommitted work that is not yours. Use a pathspec instead: `git add -- <paths>`, `git checkout -- <path>`, `git stash push -- <paths>`. Untracked files deleted by `git clean` are in no commit and no reflog.'

# Pushing is not a scope problem — it is the one git operation that leaves this
# machine. Once a commit is on the remote it is in everyone else's history, and
# on a trunk-based repo with no PR gate that is the deploy. The human decides
# when. Local commits are fine; publishing them is theirs.
PUSH_REASON='Publishing is the human decision here. This repo is trunk-based with no PR gate, so a push IS the release. Commit locally as much as you like and let Martin push.'

deny() {
  jq -n --arg pattern "$1" --arg why "${2:-$SCOPE_REASON}" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: (
        "Blocked (matched /" + $pattern + "/). " + $why
        + " Rationale: .claude/hooks/block-whole-tree-git.sh"
      )
    }
  }'
  exit 0
}

# reset --hard, anywhere in the argument list
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+reset[[:space:]]+[^|;&]*--hard' &&
  deny 'git reset --hard'

# clean with any flag cluster containing -f (-f, -fd, -xdf, …)
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+clean[[:space:]]+[^|;&]*-[A-Za-z]*f' &&
  deny 'git clean -f'

# whole-tree checkout: `git checkout .`, `git checkout -- .`, `git checkout -f`
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+checkout[[:space:]]+(--[[:space:]]+)?\.([[:space:]]|$)' &&
  deny 'git checkout -- .'
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+checkout[[:space:]]+-[A-Za-z]*f' &&
  deny 'git checkout -f'

# whole-tree restore — the same hazard under the newer spelling
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+restore[[:space:]]+[^|;&]*\.([[:space:]]|$)' &&
  deny 'git restore .'

# broad staging: -A, --all, -u, or a bare `.`
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+add[[:space:]]+(-A|--all|-u)([[:space:]]|$)' &&
  deny 'git add -A'
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+add[[:space:]]+\.([[:space:]]|$)' &&
  deny 'git add .'

# `git commit -a` / `-am` stages every tracked change — broad staging by another name
printf '%s' "$cmd" | grep -Eq -- 'git[[:space:]]+commit[[:space:]]+-[A-Za-z]*a[A-Za-z]*' &&
  deny 'git commit -a'

# Any push at all. `push` must follow `git` and its GLOBAL flags only, which is
# how `git stash push` (local, and the recommended escape hatch above) stays
# legal. The three alternatives are `-C <path>` / `-c <cfg>` with a detached
# value, any `--long` form, and short clusters — without the first of those,
# `git -C /somewhere push` slips through, which the test caught.
printf '%s' "$cmd" |
  grep -Eq -- 'git([[:space:]]+(-[Cc][[:space:]]+[^[:space:]]+|--[^[:space:]]+|-[A-Za-z]+))*[[:space:]]+push([[:space:]]|$)' &&
  deny 'git push' "$PUSH_REASON"

exit 0
