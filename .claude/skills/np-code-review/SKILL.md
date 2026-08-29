---
name: np-code-review
description: >-
  Review a working diff (or a commit range) with several independent reviewers,
  then score every finding for confidence and drop the ones that don't survive.
  Use when asked to code review changes, "review my diff", "check this before I
  commit", or to review a commit / range on main. Trunk-based and local: no PR,
  no `gh`. Reports findings only — it does not apply fixes unless asked.
---

# np-code-review

Adapted from the official `code-review` plugin, which reviews a **GitHub PR** and
comments via `gh`. The repo is on GitHub, but the work is trunk-based — changes land
on `main`, so there is no PR to review. The target is a **diff** and the output is
`ReportFindings`, rendered in the terminal.

Two properties of the original are the point of it and are preserved:

1. **Several reviewers with non-overlapping lenses.** Five general reviewers converge
   on the same shallow findings; five *framings* do not.
2. **Most of this file suppresses findings rather than generating them.** A review is a
   generative search over an unbounded space, so it will always produce output — the
   scoring pass and the false-positive list below are what make "found nothing" a
   reachable result. Do not soften them to have something to report.

## Step 1 — Resolve the scope

`$ARGUMENTS`, when given, is a git revision range (`HEAD~3..HEAD`, a sha, a tag).
Otherwise: the working tree if it is dirty (`git diff HEAD`, which covers staged and
unstaged), else the last commit (`git show HEAD`).

State the resolved scope in one line before proceeding. **If the diff is empty, stop
and say so** — do not fall back to reviewing the codebase at large.

Everything downstream is scoped to **lines this diff touched**. A real problem on a line
the diff did not touch is out of scope (see false positives).

## Step 2 — Gather the guidance, as paths

A Haiku agent returns the **paths** of the guidance that applies — not the contents:
the four `CLAUDE.md` layers that are already in context (`~/.claude/CLAUDE.md`,
`~/Projects/CLAUDE.md`, this repo's `CLAUDE.md`, `.claude/CLAUDE.md`), plus
`docs/decisions.md` and `docs/footguns.md` (pull whichever bears on the touched
area) and any `CLAUDE.md` under a touched directory.

## Step 3 — Summarize

A Haiku agent reads the diff and returns what the change is trying to do. Every lens
gets this summary, so a reviewer can tell an intentional behavior change from a slip.

## Step 4 — Six parallel reviewers

Launch six Sonnet agents concurrently. Each returns findings plus, per finding, the
reason it was flagged. Give each one the diff, the Step 3 summary, and the Step 2 paths.

Reviewers reach for **`codegraph_explore`** before grep or Read (`.codegraph/` exists):
one call returns the verbatim source of the touched symbols plus their callers, which is
the blast radius a diff-only reading cannot see.

- **#1 — CLAUDE.md compliance.** Audit against the four layers. `CLAUDE.md` is guidance
  for *authoring*, so not all of it is review-applicable; flag only what the file
  actually says, and quote the sentence.
- **#2 — Shallow bug scan.** Read the diff and little else. Large bugs only. Skip
  nitpicks. Skip anything you cannot state as input → wrong output.
- **#3 — Git history of the touched lines.** `git log -L`, `git blame`, and the commit
  *bodies*. Recent subjects read as claims ("a renamed product no longer un-cooks the
  recipes that use it"), so a diff that quietly undoes a deliberate earlier fix can be
  visible here. **The history is squashed into chapters periodically**, so this source
  is strong for the current chapter and goes coarse behind it — blame on an older line
  reaches a chapter commit that answers *when*, not *why*. Treat a miss here as no
  evidence rather than as evidence of nothing, and fall back on #4.
- **#4 — Documented decisions.** `docs/decisions.md` (settled questions) and `docs/state.md` (open, deferred, declined
  work). **These are the record, not the log** — anything meant to outlive its commit is
  here. Does the change contradict a recorded decision, or re-introduce something the doc
  says was removed on purpose? If it supersedes a decision deliberately, that is not a
  finding — but the doc is now stale, which is.
- **#5 — Comments.** Two directions, because this repo bans comments except
  non-derivable *why*: does the change still honor the rationale of a comment that
  survives near it, **and** did the change add a comment that restates the code (or a
  name that lies about what the code now does)?
- **#6 — Unenforced invariants.** The rules no gate checks — the highest-yield lens
  here, and the one a generic reviewer misses entirely:
  - **`listId` guards.** A lazy route's injector, effects and state persist for the
    session, so two lazy effects on the same action both fire. Any effect reacting to a
    shared action must guard on its list (household ∈ `{_storage,_products,_shopping}`,
    tasks `=== '_tasks'`, tracking `=== '_tracking'`).
  - **No composed i18n keys.** A key built from a template string is invisible to
    `i18n:extract --clean` and gets pruned. Every key is a `marker(...)` literal.
  - **`siblings` is the aggregate, never a page view.** A uniqueness rule fed
    `select*ListItems` shrinks with the search box, and a duplicate saves.
  - **Nothing matches on an action `type` string.** Use the creator
    (`ofType(X.y)`, `case X.y.type:`). Parsing the source prefix is fine.
  - **`Record<Theme, …>` completeness** — a catalog `labels` entry and a
    `DECK_CHROME_LABELS` block per theme, in code *and* in both message bundles.
  - **Layering by hand:** no `@ngrx` outside `data/` (+ the eslint allowlist); no pure
    logic in `data/` (it is `util/`); `smart-ui` is a strict leaf; a `<domain>/data`
    barrel is imported as the folder, never deep.
  - **Facade naming:** `-page` suffix means it binds a shared page token
    (`LIST_FACADE`/`CATEGORIES_FACADE`) and nothing else.
  - **Subpath deploy:** no absolute in-app URL may point at the server root.
  - **Speaking code:** a block that would need a comment to explain *what* it does
    should be an extracted, well-named function.

## Step 5 — Score each finding

One Haiku agent **per finding**, given the finding, the diff, and the Step 2 paths.
Hand it this rubric verbatim:

- **0** — Not confident at all. A false positive that does not survive light scrutiny,
  or a pre-existing issue.
- **25** — Somewhat confident. Might be real, could be a false positive; you could not
  verify it. If stylistic, it is not explicitly called out in the relevant CLAUDE.md.
- **50** — Moderately confident. Verified real, but a nitpick or rare in practice, and
  unimportant relative to the rest of the change.
- **80** — Highly confident. You double-checked it and verified it is very likely real
  and will be hit in practice; the approach in the diff is insufficient. It directly
  affects functionality, or it is named explicitly in the relevant CLAUDE.md.
- **100** — Certain. Double-checked and confirmed: definitely real, will happen
  frequently, and the evidence directly confirms it.

For a finding flagged on CLAUDE.md grounds, the scorer must **open the file and confirm
the sentence exists** and says that specifically. A paraphrase that isn't there is a 0.

> The rubric rungs are `0/25/50/80/100`, not the plugin's `0/25/50/75/100`. With a
> `< 80` filter, a scorer snapping to the rubric it was handed could only ever pass a
> 100 — so the intended "highly confident" band was being discarded silently. The rung
> and the threshold have to be the same number.

## Step 6 — Filter

Drop everything below **80**. If nothing survives, say so plainly and stop — that is a
successful review, not a failed one. Do not re-run the lenses to find something.

## Step 7 — Report

Call `ReportFindings` once, most severe first: `100` → `verdict: CONFIRMED`, `80` →
`PLAUSIBLE`. Every finding needs a `failure_scenario` stated as concrete input → wrong
output, a `file`/`line`, and a kebab-case `category`. Cite the CLAUDE.md sentence or the
commit sha a finding rests on. Do not also print the findings as prose.

Fix nothing unless asked. If asked, re-run the gates the change can break —
`./node_modules/.bin/eslint`, `./node_modules/.bin/sheriff verify src/main.ts`,
`pnpm test` (call the local binaries directly; `pnpm exec` has purged `node_modules`
mid-session here).

## False positives — do not report these

From the original, all of it still applies:

- Pre-existing issues the diff did not introduce.
- Something that looks like a bug and is not.
- Pedantic nitpicks a senior engineer would not raise.
- **Anything a linter, typechecker, compiler or test would catch.** `verify-all.sh` runs
  seventeen gates on every push — eslint, stylelint, prettier, sheriff, `tsc` ×4, vitest
  (with coverage floors), Playwright, prod build and the whole-repo scripts — so that band
  is noise by construction. Do not run them yourself either; they are not this review's
  signal.
- General quality complaints (missing coverage, vague security, thin docs) unless a
  CLAUDE.md explicitly requires it.
- Something a CLAUDE.md forbids but the code deliberately silences (a lint-ignore).
- Behavior changes that are plainly intentional or part of the stated goal.
- Real problems on lines the diff did not touch.

Repo-specific additions, each of which has been flagged wrongly before:

- **No `detectChanges()` in a component spec.** jsdom does not run Stencil, so `ion-*`
  are inert; rendered-DOM assertions belong in e2e. Its absence is the convention.
- **`docs/*.md` is not prettier-clean** — markdown is outside every gate. Formatting
  there is not a finding, and a `--write` would reflow the whole file.
- **`android/` is git-ignored and regenerated**; the postsync script re-applies what
  `cap sync` strips. Its absence from the diff is correct.
- **GEIST reporting `unavailable`** is the expected, permanent outcome on Android and in
  headless Chromium — not an error path to harden.
- **No `import … from 'vitest'`** — `globals: true`. The missing import is the rule.
