---
name: np-verify-all
description: >-
  Run every gate we have, against the working tree, and report a pass/fail table.
  Use when asked to "verify", "run the full stack", "check everything", "is this
  green", "can I commit/push this", or before a release tag. Reports and, on
  request, fixes the mechanically fixable — it does not change behaviour.
---

# np-verify-all

Enforces the hard-rules table in `CLAUDE.md`.
This skill runs the guards against the working tree — not against `HEAD`, because the
question is almost always "is what I have right now green".

**`GATES=(` in `scripts/verify-all.sh` owns the gate list** — this file drives the runner, and
each guard's own file banner argues why it is a script, a rule, or run twice.
Neither restates the list: it drifted twice while it was kept in prose as well.

**Not `ci.yml`.** CI runs `pnpm run lint`, which chains three separate tools — the plugin
type-check, eslint and **stylelint** — behind one exit code, so a runner that mirrors CI
step-for-step cannot tell you which of them failed, and stylelint is invisible in it
entirely. The runner splits them. It runs nothing CI does not; it is the same work,
reported at the resolution you debug at.

## Run it

**One command. Do not run the gates by hand** — watching a checklist tick over is the
point, and a dozen separate invocations bury it in tool noise:

```
./scripts/verify-all.sh
```

One card per gate: which gate and which **tool** in the header, the command in the body,
the verdict in the footer with its duration and one line of evidence. Exit 0 = all green.
Every gate's full log is written to `$TMPDIR/np-commlink-verify/<id>.log` whatever the
screen shows.

**The body is quiet unless the gate failed** — a red card replays its whole log, a green
one shows nothing. Fifteen green gates' output scrolls the one red card off the screen,
which is the opposite of what a checklist is for. This is not the old `--quiet`: that one
hid the output that explains a failure, and this shows only that output.

```
┌─ 14/17  unit tests ───────────────────────────────────────── vitest ─┐
│ $ pnpm run test:coverage                                             │
│                                                                      │
└─ 🦄 success · 13.7s · Tests 1240 passed (1240) ──────────────────────┘
```

**The footer colours its own verdict** — green `success`, red `failed`, yellow `skipped` —
and the summary counts the same three, dimming whichever are zero.

**One flag: `--stream`**, for watching a slow gate work. Same bytes, same order, printed
as they arrive rather than at the end. The other three are still gone, each having asked
for a less trustworthy answer: `--warm` kept a cache that hides cross-file violations,
`--quiet` hid the output that explains a failure, `--keep-going` undid a short-circuit.

**Only one gate can be skipped**, and only for one reason: `pages` serves what the
production build wrote, so a failed build leaves it reading the *last good* `www/`. Green
there would be an answer about a tree that no longer compiles, so it goes yellow and says
the question was not asked. Nothing else short-circuits — in particular **a red gate no
longer skips the expensive ones**, which costs ~40s on an already-broken tree and buys
knowing whether e2e broke too, otherwise a second run.

**Read its output; do not re-run gates it already ran.** The cards are the evidence —
quote them rather than re-deriving them.

## The gates, in the order the script runs them

That order is fail-fast (cheapest and likeliest to fail first), which is deliberately not
CI's — CI is one sequential job where the order is arbitrary, and here a typo should not
cost 20s of Playwright before it surfaces.

The **Tool** column is what each card's header names — the script names (`verify`,
`lint:styles`) say nothing about who is speaking in the body.

| #   | Gate              | Tool                  | Time       | Notes                                                                                             |
| --- | ----------------- | --------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| 1   | Module boundaries | sheriff               | 1s         | over the entry graph — cannot see specs, which is why eslint runs it too                          |
| 2   | Test-id contract  | check-testids.mjs     | 1s         | dead ids · locators that can never match                                                          |
| 3   | Icon registrations| check-icons.mjs       | 1s         | an `ion-icon` name nothing registered — an invisible control, never an error                      |
| 4   | Doc paths         | check-doc-paths.mjs   | 1s         | every path the compendium names exists — the only gate that reads markdown for meaning            |
| 5   | Plugin types      | tsc                   | 1s         | `-p eslint-plugin-commlink` — turns a rule load-crash into a compile error                        |
| 6   | Type-check (app)  | tsc                   | 1s         | what esbuild never checks                                                                         |
| 7   | Type-check (spec) | tsc                   | 2s         |                                                                                                   |
| 8   | Type-check (e2e)  | tsc                   | 1s         | Playwright transpiles with esbuild, so without this project nothing reads the specs' types        |
| 9   | Styles            | stylelint             | 1s         | the one layer eslint provably cannot read                                                         |
| 10  | Format            | prettier              | 3s         | markdown is deliberately outside it                                                               |
| 11  | Export surface    | check-exports.mjs     | 8s         | an `export` with no reader outside its file — what `noUnusedLocals` structurally cannot see       |
| 12  | ESLint            | eslint                | **30–85s** | the whole repo, not just `src/`; always cold                                                      |
| 13  | Lint rules        | vitest                | 1s         | RuleTester over the a11y rules — a rule with no spec fails open, reporting nothing                |
| 14  | Unit tests        | vitest                | 12–15s     | coverage, not a bare run: the thresholds only bind if something checks them                       |
| 15  | E2E               | playwright            | 25–55s     | 63 specs, Playwright starts its own `ng serve`                                                    |
| 16  | Production build  | esbuild               | 7s         | the **pages** base href, which is the one that can break on a subpath                             |
| 17  | Pages subpath     | check-pages-build.mjs | 1s         | serves 16's output at `/np-commlink/` and requests it — the only gate that reads another's output |

**~105–155s**, every time — there is no warm path any more, and gate 12 alone swings ~50s
with machine load. Cheap enough that "run the whole thing" is always the right answer; do
not offer a reduced subset unless asked, and if you do, say plainly which gates you
skipped.

A green e2e can still carry a **flaky** spec — one that failed and passed on its retry.
Playwright exits 0 and prints `1 flaky` above `62 passed`, and the footer reports both, so
`1 flaky · 62 passed` is a pass worth mentioning rather than a count that mysteriously
dropped by one.

Gates 1, 5, 9 and 12 are all "lint" in CI's telling: CI runs Sheriff's CLI, then
`pnpm run lint` = plugin `tsc` → eslint → stylelint. Splitting them is the whole point of
the runner — one exit code across three tools is what hid stylelint.

Gate 12 dominates and is 93.6% Sheriff's two eslint rules (every `commlink/*` rule
together is 22ms), so `TIMING=all` before optimising anything about lint. Its cost varies
a lot with machine load — 32s and 84s are both real measurements of the same command.

Gates 1–13 are read-only and independent, so they *could* run concurrently — the script
runs them sequentially anyway, because a few saved seconds is worth less than the
one-card-at-a-time readout. **14–17 must never overlap**: e2e binds port 4321 and the
build writes `www/`, and both saturate the CPU, which turns a slow spec into a flaky one.
17 is ordered rather than merely serialised — it serves what 16 wrote, which is why a
failed 16 skips it rather than letting it read whatever was left on disk.

## Traps that produce a wrong answer

The script encodes the first two; the rest still need judgment, which is why this is a
skill and not only a shell script.

- **A stale listener on :4321 makes e2e fail spuriously.** Playwright starts its own dev
  server; if something already holds the port the run burns ~180s and exits 1 with
  failures that have nothing to do with the code. The script clears the port before the
  e2e gate. If e2e still fails, re-run it once alone before reporting it red.
- **The eslint cache is per-file; Sheriff is cross-file.** A violation that file A gains
  because file B changed can survive a warm run. CI has no cache at all, so the script
  purges it every time — which is why there is no longer a flag to keep it. Note
  **`-rf`**: the cache is a *directory*, so `rm -f .eslintcache` fails with "is a
  directory", and if you are not reading stderr you will then time a warm run and report
  it as cold. That is exactly how the cold figure above was first mis-measured as 6s.
- **The working tree moves under you.** These gates take a minute, and someone editing in
  parallel makes the answer stale before it is printed — one dry run went red on
  `TS2304: Cannot find name 'marker'` in a file whose import landed thirty seconds later,
  and another gained two `unicorn/consistent-function-scoping` errors from spec files
  that appeared mid-run. Before reporting any failure, re-check that file:
  `git status --porcelain <path>` plus a re-run of the one gate. Report a stale failure
  as stale, not as red.
- **`--no-verify` skips the pre-commit hook**, so prettier is enforced by the format gate
  and nothing else. Never take "the hook passed" as evidence for it.
- **Invoke binaries as `./node_modules/.bin/<tool>`.** `pnpm exec` has half-deleted this
  install mid-session. The package scripts are fine; it is ad-hoc `pnpm exec` to avoid.
- **`git commit -F - <<EOF` deadlocks against lefthook.** Write the message to a file and
  pass the path, with `< /dev/null`.

## If something is red

Report it; do not reflexively fix it. When asked to fix:

- **Format** — `pnpm run format` is safe and total.
- **Styles** — stylelint's `--fix` is **not** all safe, and this is not hypothetical:
  `property-no-vendor-prefix` rewrote `-webkit-mask` into a duplicate bare `mask`,
  dropping the only thing that clips the trackplay victory beams on pre-15.4 Safari; and
  `value-keyword-case` lowercased `Arial` to `arial` inside the `--sr-sans` stack, where
  it cannot tell a keyword from a proper noun. Both rules are configured off or
  disable-commented now, but **read the `--fix` diff before staging it** regardless.
- **Never run prettier over `docs/`.** Markdown sits outside every formatting gate, so those files
  are not prettier-clean by design and a `--write` reflows whole files into unreviewable
  diffs.
- **A red unit-test or e2e gate is a real failure until proven otherwise.** The one benign
  cause is the port trap above.

## Report

The script already prints the table — relay it, do not rebuild it in prose. Add only what
it cannot know:

- **the verdict**, in one line ("green — committable", or what is broken);
- for a failure, the tool's own first error with its `file:line`, quoted rather than
  paraphrased, plus whether the tree moved under the run;
- **what is not covered.** A green table invites the wrong conclusion: nothing here
  renders the app, so visual regressions, the Android APK (`android/` is git-ignored and
  rebuilt on demand), the GEIST happy path (it needs a real on-device model that headless
  Chromium does not have) and the Pages deploy step are all outside it.
