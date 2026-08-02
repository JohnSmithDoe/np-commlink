#!/usr/bin/env bash
#
# verify-all.sh — run every guard this project has against the WORKING TREE and
# draw one card per gate: which gate and which tool in the header, the command
# in the body, the verdict in the footer.
#
#   ./scripts/verify-all.sh            one card per gate, output only where it failed
#   ./scripts/verify-all.sh --stream   every tool's output live, as it arrives
#
# A green gate's output is noise — fifteen of them scroll the one red card off the
# screen, which is the opposite of what a checklist is for. So the body is quiet
# by default and a FAILED gate replays its whole log into the card regardless.
# That is what separates this from the old --quiet flag: that one hid the output
# that explains a failure, and this one shows only that output.
#
# --stream is the third state: watching a slow gate work. It is the same bytes in
# the same order, printed as they arrive rather than at the end, and every gate's
# full log is written to $TMPDIR either way — so nothing is only ever visible
# live.
#
# The two other old flags are still gone, both having been ways to ask for a less
# trustworthy answer: --warm kept a cache that hides cross-file violations, and
# --keep-going undid a short-circuit.
#
# Dropping the short-circuit is the one real behaviour change: a red cheap gate
# no longer skips the expensive ones. That costs ~40s on an already-broken tree
# and buys knowing whether e2e broke too, which otherwise takes a second run.
#
# The gate list is owned by .claude/skills/np-verify-all/SKILL.md, with
# docs/coding-conventions.md Part 1 as its support. NOT by ci.yml: CI runs
# `pnpm run lint`, which chains three separate tools behind one exit code, so a
# runner that mirrors CI step-for-step cannot show you which of them failed.
#
# Hence the split below — eslint, stylelint and the plugin type-check are three
# gates here and one line in CI. Nothing runs that CI does not; it is the same
# work, reported at the resolution you actually debug at. Order is fail-fast
# (cheapest first), which is deliberately not CI's — CI is one sequential job
# where the order is arbitrary, and here a typo should surface before Playwright
# has had a chance to start.
#
# Three things this encodes so they cannot be forgotten:
#   1. The eslint cache is per-file while Sheriff is cross-file, so a violation
#      one file gains because another changed survives a warm run. It is purged
#      every time, which is what CI gets for free by having no cache at all.
#   2. A stale listener on :4321 makes Playwright fail with errors that have
#      nothing to do with the code, so the port is cleared before the e2e gate.
#   3. The expensive gates must not overlap: e2e binds :4321, the build writes
#      www/, and both saturate the CPU, which turns a slow spec flaky. `pages`
#      serves what the build wrote, so it can only run after it — and is SKIPPED
#      (yellow) when it failed, since www/ then holds the last good build and a
#      green there would be an answer about a tree that no longer compiles.
#      Everything else here is sequential, which satisfies the rest on its own.
#
# What it deliberately does NOT decide: whether a red gate is real. A tree that
# moves mid-run (an import landing thirty seconds after the file that needs it)
# reports as red and is not. Re-check the file and re-run the one gate.
#
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG_DIR="${TMPDIR:-/tmp}"
LOG_DIR="${LOG_DIR%/}/np-commlink-verify"

# Gate table — id|label|tool|command, in the order a card prints them. The ids
# name the log files and the pre-gate hooks below.
#
# The tool is the one fact neither other field carries: `pnpm run verify` does
# not say sheriff and `lint:styles` does not say stylelint — the script names are
# the most opaque part of the line. Knowing which tool is about to speak is what
# tells you how to read the body. What each gate is FOR is prose, and lives in
# SKILL.md's table.
#
# The command is the greedy remainder, so it is the only field that may contain
# a `|`.
GATES=(
  "sheriff|module boundaries|sheriff|pnpm run verify"
  "testids|test-id contract|check-testids.mjs|pnpm run verify:testids"
  "icons|icon registrations|check-icons.mjs|pnpm run verify:icons"
  "docpaths|doc paths|check-doc-paths.mjs|pnpm run verify:docs"
  "plugin|plugin types|tsc|pnpm run lint:plugin-types"
  "tsc-app|type-check (app)|tsc|./node_modules/.bin/tsc -p tsconfig.app.json --noEmit"
  "tsc-spec|type-check (spec)|tsc|./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit"
  "tsc-e2e|type-check (e2e)|tsc|./node_modules/.bin/tsc -p tsconfig.e2e.json --noEmit"
  "stylelint|styles|stylelint|pnpm run lint:styles"
  "format|format|prettier|pnpm run format:check"
  "exports|export surface|check-exports.mjs|pnpm run verify:exports"
  "eslint|eslint|eslint|pnpm run lint:eslint"
  "unit|unit tests|vitest|pnpm run test:coverage"
  "e2e|e2e|playwright|pnpm run e2e"
  "build|production build|esbuild|pnpm run build:pages"
  "pages|pages subpath|check-pages-build.mjs|pnpm run verify:pages"
)
TOTAL=${#GATES[@]}

STREAM=false
for arg in "$@"; do
  case "$arg" in
    --stream) STREAM=true ;;
    *)
      printf 'verify-all: unknown flag %s (only --stream)\n' "$arg" >&2
      exit 2
      ;;
  esac
done

if [ -t 1 ]; then
  DIM=$'\033[2m' GREEN=$'\033[32m' RED=$'\033[31m' YELLOW=$'\033[33m'
  BOLD=$'\033[1m' OFF=$'\033[0m'
else
  DIM='' GREEN='' RED='' YELLOW='' BOLD='' OFF=''
fi

# One character each, two COLUMNS each. All three are Emoji_Presentation by
# default, so no U+FE0F is needed to force it — which is the part terminals
# disagree about. `card_foot` subtracts for that second column; nothing else
# needs to.
SYM_OK='🦄' SYM_BAD='💥' SYM_SKIP='🚫'

# The header, the footer and the lines this script writes itself are ruled to a
# fixed width. A line of the TOOL's carries a `│` on the left and nothing on the
# right, which is what lets a 200-column vitest line through without either
# truncating it or wrecking the box — so the open right edge reads as "this came
# from the tool".
CARD_WIDTH=92

now() { perl -MTime::HiRes=time -e 'printf "%.3f\n", time'; }
# Time::HiRes must be imported HERE too — without it `time` is the integer
# builtin, and an integer now minus a fractional start prints a negative gate.
since() { perl -MTime::HiRes=time -e 'printf "%.1fs", time() - $ARGV[0]' "$1"; }
strip_ansi() { perl -pe 's/\e\[[0-9;]*m//g'; }
trim() { perl -pe 's/^\s+|\s+$//g'; }

# `${#s}` counts CHARACTERS in a UTF-8 locale, which is what the rule arithmetic
# assumes. Under LC_ALL=C it counts bytes and the borders come out ragged —
# cosmetic only, and no verdict depends on it.
hrule() { # count
  local pad
  printf -v pad '%*s' "$1" ''
  printf '%s' "${pad// /─}"
}

card_head() { # heading tool
  local left="┌─ $1 " right=" $2 ─┐" fill
  fill=$((CARD_WIDTH - ${#left} - ${#right}))
  [ "$fill" -lt 1 ] && fill=1
  printf '%s%s%s%s%s%s\n' \
    "$BOLD" "$left" "$OFF$DIM" "$(hrule "$fill")" "$right" "$OFF"
}

# A line of ours: undimmed text between two dimmed borders. The command is the
# only one with content — the others are the blank rows that keep the tool's
# output from touching the header and the footer.
card_own_line() { # text
  local fill
  fill=$((CARD_WIDTH - 4 - ${#1}))
  [ "$fill" -lt 1 ] && fill=1
  printf '%s│%s %s%*s%s │%s\n' "$DIM" "$OFF" "$1" "$fill" '' "$DIM" "$OFF"
}
card_line() { printf '%s│ %s%s\n' "$DIM" "$1" "$OFF"; }

# The footer is the verdict, so the verdict picks its own colour and symbol
# rather than the call site passing them in — three call sites choosing a colour
# each is three chances to paint a failure green.
card_foot() { # outcome timing [detail]
  local color symbol
  case "$1" in
    success) color=$GREEN symbol=$SYM_OK ;;
    failed) color=$RED symbol=$SYM_BAD ;;
    skipped) color=$YELLOW symbol=$SYM_SKIP ;;
  esac
  local text="$symbol $1 · $2"
  [ -n "${3:-}" ] && text="$text · $3"
  local left="└─ $text " fill
  # -1 for the symbol's second column, -2 for the closing `─┘`.
  fill=$((CARD_WIDTH - ${#left} - 1 - 2))
  [ "$fill" -lt 1 ] && fill=1
  printf '%s%s%s─┘%s\n' "$color" "$left" "$(hrule "$fill")" "$OFF"
}

# The curated evidence line. The body already showed it in full, but a footer
# that says only "success" makes you scroll to find out what succeeded.
detail_for() {
  local id="$1" log="$2"
  case "$id" in
    testids) grep -Eo '[0-9]+ declared.*' "$log" | tail -1 ;;
    icons) grep -Eo '[0-9]+ used.*' "$log" | tail -1 ;;
    exports) grep -Eo '[0-9]+ exports checked.*' "$log" | tail -1 ;;
    docpaths) grep -Eo '[0-9]+ paths checked.*' "$log" | tail -1 ;;
    unit) strip_ansi <"$log" | grep -E '^ *Tests +[0-9]' | tail -1 | tr -s ' ' | trim ;;
    # EVERY summary line, not the last one. Playwright prints "1 flaky" above
    # "62 passed" and exits 0, so `tail -1` reported a clean 62 and swallowed the
    # one fact worth carrying out of a green e2e run — that a spec only passed on
    # its retry. (It also quietly turned 63 specs into 62 with no explanation.)
    e2e)
      strip_ansi <"$log" | grep -E '^ *[0-9]+ (passed|failed|flaky|skipped)' |
        awk '{ gsub(/^ +| +$/, ""); out = out (out ? " · " : "") $0 } END { print out }'
      ;;
    build)
      local warnings
      warnings=$(grep -c 'WARNING' "$log")
      [ "$warnings" -gt 0 ] && echo "$warnings budget warning(s), non-fatal"
      ;;
    pages) grep -Eo 'serves correctly from .*' "$log" | tail -1 ;;
  esac
}

prepare_gate() {
  case "$1" in
    eslint) rm -rf .eslintcache ;;
    e2e) lsof -ti:4321 2>/dev/null | xargs kill -9 2>/dev/null ;;
  esac
  return 0
}

# ANSI is stripped from what is SHOWN and kept in what is SAVED: several tools
# colour even through a pipe, and their resets cancel the body's dim mid-line.
# `read -r` with an empty IFS keeps leading whitespace (vitest's summary, tsc's
# error context), and the trailing `[ -n "$line" ]` catches a last line with no
# newline, which `read` reports as failure even though it read it.
replay_log() { # log
  strip_ansi <"$1" | while IFS= read -r line || [ -n "$line" ]; do
    card_line "$line"
  done
}

# Run one gate, capturing the whole log either way.
#
# The streamed branch must answer with the COMMAND's status, never the
# pipeline's — `tee` and the reader both succeed while the thing under test
# fails, so `$?` after the pipe would report every gate green, which is a
# verifier that always passes. `PIPESTATUS[0]` is the only member that answers
# the question being asked.
#
# The quiet branch has no pipeline, and so needs the SUBSHELL instead: `eval`
# runs in the calling shell, where a command that ends in `exit` takes the runner
# with it and the remaining gates are never even attempted. The pipeline was
# hiding that by putting the command in a subshell for its own reasons.
run_gate() { # command log
  if [ "$STREAM" = true ]; then
    eval "$1" 2>&1 | tee "$2" | strip_ansi |
      while IFS= read -r line || [ -n "$line" ]; do
        card_line "$line"
      done
    return "${PIPESTATUS[0]}"
  fi
  (eval "$1") >"$2" 2>&1
}

# The one gate that reads another's output: `pages` serves what `build` wrote.
# With a failed build, www/ still holds whatever the last good one left there, so
# the gate would answer about a tree that cannot be built — a green that means
# nothing. Yellow says the question was not asked, which is the only true answer
# available.
skip_reason() { # id
  case "$1" in
    pages)
      case " $failed_ids " in
        *' build '*) echo 'production build failed — www/ is stale' ;;
      esac
      ;;
  esac
}

# A count reads as a verdict, so it is coloured like one — but only when it is
# not zero. A red `0 red` draws the eye to the one number that needs no reading.
count() { # n word color
  local color=$DIM
  [ "$1" -gt 0 ] && color=$3
  printf '%s%s %s%s' "$color" "$1" "$2" "$OFF"
}

rm -rf "$LOG_DIR" && mkdir -p "$LOG_DIR"
started=$(now)
passed=0
failed=0
skipped=0
failed_ids=""

printf '\n  %snp-commlink%s · verify-all · %s gates\n' "$BOLD" "$OFF" "$TOTAL"

# These gates read the working tree. Said out loud only when that differs from
# what is committed, because as a pre-push gate the two are assumed identical —
# and an assumption worth relying on is worth being told about when it breaks.
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  printf '  %sworking tree is dirty — verifying what is on disk, not what is committed%s\n' \
    "$DIM" "$OFF"
fi

index=0
for gate in "${GATES[@]}"; do
  index=$((index + 1))
  id="${gate%%|*}"
  rest="${gate#*|}"
  label="${rest%%|*}"
  rest="${rest#*|}"
  tool="${rest%%|*}"
  command="${rest#*|}"
  shown="${command#./node_modules/.bin/}"
  log="$LOG_DIR/$id.log"

  printf '\n'
  card_head "$index/$TOTAL  $label" "$tool"
  card_own_line "\$ $shown"

  skip=$(skip_reason "$id")
  if [ -n "$skip" ]; then
    card_own_line ''
    card_foot 'skipped' "$skip"
    skipped=$((skipped + 1))
    continue
  fi

  [ "$STREAM" = true ] && card_own_line ''
  prepare_gate "$id"

  gate_started=$(now)
  run_gate "$command" "$log"
  status=$?
  timing=$(since "$gate_started")

  # The captured log reaches the screen here or not at all — which is the whole
  # of the quiet default: a green gate's output is noise, a red one's is the
  # answer.
  if [ "$status" -ne 0 ] && [ "$STREAM" = false ]; then
    card_own_line ''
    replay_log "$log"
  fi
  card_own_line ''

  if [ "$status" -eq 0 ]; then
    card_foot 'success' "$timing" "$(detail_for "$id" "$log")"
    passed=$((passed + 1))
  else
    card_foot 'failed' "$timing" "exit $status"
    failed=$((failed + 1))
    failed_ids="$failed_ids $id"
  fi
done

printf '\n  %s · %s · %s%*s total %s\n' \
  "$(count "$passed" green "$GREEN")" \
  "$(count "$failed" red "$RED")" \
  "$(count "$skipped" yellow "$YELLOW")" \
  8 '' "$(since "$started")"
[ -n "$failed_ids" ] && printf '  %sred:%s%s\n' "$RED" "$failed_ids" "$OFF"
printf '  %slogs: %s%s\n\n' "$DIM" "$LOG_DIR" "$OFF"

[ "$failed" -eq 0 ] || exit 1
