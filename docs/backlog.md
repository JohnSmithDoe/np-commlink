# Backlog — found, not yet fixed

Findings live here until the code answers them, then the entry is **deleted**. Nothing here is a
decision; if a finding turns out to be the right answer, it moves to [decisions.md](./decisions.md) and
leaves. A finding that needs a secret, a device or a human moves to [state.md](./state.md); one triaged
into the next major moves to [next-version.md](./next-version.md). No entry belongs in two files.

Line numbers were true when the finding was written and the tree moves — locate by symbol, not by line.

_Reviewed 2026-09-06 across five passes: pattern conformance, duplication, trackplay correctness, the
deck/nav shell, and state/tests/docs. Every gate was green at the time — everything found was invisible
to all of them, which is the point. The bug findings, the shell's shape and the whole duplication pass
have since been settled — four extractions done, five declined in
[decisions.md](./decisions.md) with the reason, the doc drift is closed and the four test gaps are
pinned. One entry is left, and it is a gate that cannot see what it was written to catch._

---

## Patterns — forked, or one too many

- **P8 · Dimming text with `opacity` walks past the muted-text gate.** The rule exists so muted text
  keeps a legible contrast ratio: it rejects the accent at an alpha and demands `--sr-text-dim`. But it
  only inspects `color:` declarations. `opacity: 0.5` on a row's `ion-label` — which is what
  `deck-config.page.scss` does for an off-deck tile — halves the ratio of everything inside it and the
  rule never looks. Same failure, different property, no report. It is not one site: geist, the deck
  config and notifications all dim this way, so the honest fix is a sweep plus a rule that also flags a
  low `opacity` on a block that paints text. Low urgency — nothing here is unreadable today; the point is
  that the gate would not tell us if it became so.

---

## SIN — the people module is a first cut

Landed working and gated, but Martin's verdict is that it needs work. Known rough edges:

- **No person page.** A tap opens the edit dialog; the row shows only the first address, and nothing
  links from a person to their BIOMON profile or TRACKPLAY record.
- **Sizes are one list for top and trousers** (letters, then children's heights) plus EU shoes — no
  jeans W/L, no per-garment notes. Untested against how sizes are actually bought.
- **The BIOMON astro dialog has no name field and a generic title** — it does not say whose signs it edits.
- **TRACKPLAY's `createdAt` sort now sorts by when the PERSON was created**, and "last played" counts
  a game nobody has scored yet — a new game starts with `updatedAt = createdAt`.

---

## Tests — what they assert, not whether they pass

_Audited 2026-10-17: every unit spec, the e2e suite minus handbook shots, and the RuleTester specs.
No test asserts behaviour the app lacks. The faults are tests that cannot fail, fixtures the real
pipeline never emits, and gaps exactly where the risk sits. Each suspected bug gets a red spec before its fix._

### Suspected bugs, found by reading

- **T4 · A never-seen schedule advances from its own due date, not the booking's.** `advanced` moves
  `nextDueISO` one period on from where it stands, so the first import of a year-long statement steps
  a schedule that has no `lastSeenISO` by one period, whatever month the newest payment fell in.

### Tests that cannot fail

- `tracking-notifications.effects` start/pause: the fixture state already equals the expected hint.
- `office-time.utils` `targetdays` copies the production formula into the expectation.
- `players.facade` last-played sort: that order is also the name order.
- `notifications.selector` "newest first": input already sorted.
- `pills.reducer` "keeps the slot across an edit" sends the same slot — and `updateListItem` would
  overwrite a different one, so the protection the name claims is absent.
- `list-page.component` reorder calls the fake facade directly; `commlink.page` `total` and `noise`
  echo the fake's own logic; `ritual-page.facade` reads one signal twice.
- `item-list-toolbar` emits its own `output()`; `today.service` "does not notify" tests signal
  equality; `jam.gateway` URL lines echo the fake client.
- `error-boundary.spec` tests local copies of the shells, not the real ones.

### Names that claim more than the body

- `dashboard.effects` "persists a report that arrives before this boot read" — no such gate exists;
  the body repeats the test above it.
- `edit-cash-rule-dialog` "refuses a blank name" contradicts the component's banner and the
  `rule.name || categoryName` fallback — one of them is wrong.
- `tasks.selector` sorts by `dueAt`; the app only offers `nextDueAt`.
- `office-time.reducer` tests `addFreeday`, which nothing dispatches — delete test and action.
  `office-time.effects` "has no failure path left" asserts an undefined key.
- "before" never checks order: `app-update.service`, `sources.facade`, `jam.gateway`,
  `database.service` ×3.
- `base-modal-dialog` "does not fall back to create mode" — it does. `edit-task-item-dialog` "drops the
  derived date" — it keeps it. `task-lead.utils` uses a different worst case than production.
  `board.page.spec`'s banner claims every refusal is asserted; three of six are —
  `overshoots-home`, `own-piece` and `blocked-in-home` are reachable and unasserted. `office-time.utils`
  "excludes free days" sets none.
- `geist.page` "sends the query" forces `jacked-in` with no session, so nothing streams.
- e2e: `e2e/office-time/first-paint.e2e.ts` banner says array, asserts a map (the legacy upgrade is untested);
  `e2e/household/manage-categories.e2e.ts` undo — no item ever carried the category; `e2e/vitals/pills.e2e.ts` "keeps the
  reminder switch on its own pill" seeds one pill, so the isolation is untested.

### Weak oracles

- **`e2e/tasks/recurring.e2e.ts` `inThreeMonths()` uses `setMonth(+3)`**, which overflows where the app
  clamps — red on Nov 29–30 and the like. `due-date.e2e` and `notes.e2e` compute dates in the runner
  and drift at midnight.
- Clock assertions that are always true: trackplay "reads the clock at dispatch time" (`isAfter(2024)`),
  `tracking.facade` truthy `now`, `household.factory` truthy `bestBefore`, `note-editor.facade`,
  `clock.spec`, `notifications.reducer` `not.toBe(...)`. Fake the clock, assert the value.
- `language-model.service` `toBeLessThanOrEqual(1)` passes on zero calls.
- `e2e/helpers.ts` `addViaSearch` sleeps `waitForTimeout(400)` twice, and every add-flow inherits it;
  six specs copy the sleep. Wait on the row or `waitForPersisted`.
- 18 "should create" `toBeTruthy` specs, each in a file with real tests — delete.

### Re-tested elsewhere — delete

- Generic list reducer/effects mechanics re-tested in ~8 domain specs; `item-list.effects.factory.spec`
  covers only undo. Move the generic cases there, keep per-module wiring.
- Feature-slice selectors and `state => state.x` projectors.
- `e2e/coprocessor/coprocessor.e2e.ts` and `e2e/vitals/astro.e2e.ts` re-check unit-tested arithmetic — one wiring value per page.
- `list-item.component` repeats `base-swipe-row.spec`; single `it.each` rows repeated in
  `golden.utils` and `ionic-color.utils`; `settings.effects` asserts a save no path makes.

### Gaps — risky code with no meaningful test

- **CREDSTICK:** `CashImportFacade.commit` (no spec); the reducer branch confirming pending rows; the
  balance check's PDNG skip; camt `ValDt` fallback, multi-statement documents, >2 decimals truncated;
  encoding — a declared ISO-8859-1 file end to end, bytes 0x80–0x9F, mixed files; burndown counting
  `excludedFromAllowance` accounts.
- **AGENDA:** `reopenDue`, `tasks-day-rollover.effects`, `reopen-due-tasks.resolver` and `toggleDone`
  have no spec; `advancePositioned` catch-up; due today paints 'danger' all day.
- **Time:** tracking pause → resume break accrual; `refreshOnYearRollover$`; `OfficeTimeFacade` (no
  spec); `TodayService` midnight timer; `calculateStats.remaining` and weekend holidays; wordclock
  23:58 / 12:58; no e2e runs a timer across a reload.
- **Lint plugin:** 11 of 20 rules have no RuleTester spec — `comments-header-only`,
  `ngrx-data-layer-only`, `marker-argument-is-literal`, `testid-is-static`, `no-barrel-outside-data`
  among them (shape 4). `a11y.spec` lacks `[attr.aria-label]`, `[label]` and `ion-select` /
  `-textarea` / `-range` / `-checkbox`; `spec-resets-mock-selectors` would misreport
  `afterEach(store.resetSelectors)`.
- Smaller: `ageOn` on 29 Feb; the vitals weight recompute on a date change and a negative result;
  board reducer success paths.

## What the next reviewer should look for

The shapes this review turned up, kept because they will recur. Each is invisible to every gate here.

1. **A moved route leaves absolute string literals behind.** The signature failure: a program's URL
   moved, four literals were updated, and the fifth sat in a facade no compiler, lint rule or spec
   reads — leaving a live button that ejected the user to the deck. After any `route:` change in `deck.catalog.ts` or a `path:` change in a routes file, grep the
   old literal across `src` **and** `e2e` — and check that the page still has an in-app entrance at all,
   not just a working URL.
2. **An extraction that leaves its own precedent standing.** The shared tab shell was built to
   replace three improvised ones and replaced two. When a commit message says "every module invented its
   own answer", check that every instance actually converted.
3. **The newest domain re-answering a solved question.** A new domain copies the block next door
   instead of the `@shared` factory. Ask of any new `data/` directory: which of these lines does
   `@shared` already generate? **But weigh before extracting** — a shape that repeats without drifting
   is not a finding, and this review produced four of those (see the declined extractions in
   [decisions.md](./decisions.md)). The question is never "how many copies", it is "would a bug be in
   all of them".
4. **A gate that is green for a structural reason.** The muted-text rule is blind to `opacity`; a rule
   with no RuleTester spec is indistinguishable from a dead one. When a rule reports zero violations,
   ask what would happen if it had stopped matching.
5. **A hand-maintained enumeration** — `save.sources`, an opt-in roster in a doc. Forgetting an
   entry never fails — it reduces, renders, and is gone on next launch. Prefer a prefix rule to a list.
6. **Persisted hydration that does not spread initial state.** `loaded ?? state` looks
   equivalent to `{...initial, ...loaded}` and is not: it is where an additive field stops being free.
7. **A live region created together with its message.** `@if`-wrapped `role="status"` is the
   default mistake; the dice tray is the correct precedent in the same domain.
8. **An interactive surface that is not an Ionic element.** The eight `a11y-*` rules only inspect
   `ion-*`, so an SVG, a canvas or a bare `<div (click)>` is unseen by all of them — and R5 can never be
   gated.
9. **Colour literals outside the theme layer.** `grep --include='*.scss' '#[0-9a-fA-F]\{6\}'
src/app/` should return nothing.
10. **A refusal union whose template `@switch` is missing a `@case`.** An unmatched `@switch` is
    empty, not an error — every branch of a refusal type needs a visible answer or the feature is silent.
11. **Two writers of one artifact** — a tab bar and a route table, two action groups minting one
    `source`, a rule stated in both a config and its caller. Footguns says it: _one artifact, two
    writers is always a bug in the making._
12. **A tie, an empty set, a single member.** Ranking code that never tests for equal scores, an `:id`
    catch-all with no unknown-id branch, a tab bar that renders with zero tabs. All three shipped.
13. **A test that cannot fail.** The fixture already holds the expected value, the input is already
    sorted, the expectation recomputes the production formula. Mutate the code under test in your
    head: if the spec stays green, it is decoration.

### Verified clean — do not re-derive

Facade discipline is uniform and unchallenged: 44 action groups, zero hand-rolled `createAction`, zero
`@ngrx/*` outside `data/`, zero cross-domain imports outside the shell. No `I`/`T` type prefixes.
`deck.catalog.ts` is a data table with no logic crept
in, and **no deck entry id has been renamed** by any recent commit. URL composition cannot break under
`--base-href` — the app is hash-routed, so base-href touches assets only. `PROGRAM_CONTEXT` cannot throw
`NullInjectorError`; it ships in the root injector with a factory default. `board.factory.ts`'s
ring arithmetic, `planMove`'s lap walk and home-column blocking, the notation round-trip,
`trackplay.cascade.ts` and `trackplay.scoring.ts` were all hand-traced and are correct. Every one of the
13 edit dialogs uses `item-edit-modal`. `board.moves.ts` **is** covered (`board.moves.spec.ts`, 11
cases including a Pachisi ruleset) — a stale index claimed otherwise. The board page's refusal `@switch`es
lack `bad-roll`, `unknown-field`, `too-many` and `no-room-at-home` on purpose: none is reachable from the
page — the pips are 1–6, every tap is a rendered field, placing stops once the set is complete, and a
thrown figure left the ring, so its own yard has a slot. `selectDashboardStatsYear` reading `dayjsToday()` inside a
memoized projector is not stale where it matters: its one consumer, telemetry, reads `officedays` and
`percentage`, which turn only with the year, and the year turning reloads the holidays and so the keys. Scoring an
ended game is unreachable: the grid is gone once it ends. The trackplay orphan sweep against an empty
roster deleting every game is the design — `PEOPLE` stays `undefined` until people is read, a failed
read included.

Tests that earn their keep and serve as the model: the camt parser variants and `read-statement`
occurrence keys, `money.parseMagnitude`, holidays checked against the published Berlin JSON, the
wordclock five-minute table, the board moves/setup/notation round-trips, task cadence clamping and
`tasks.migrations`, persisted-slice save gating and the `versioned` ladder, `trackTime$` under fake
timers, `cash-transactions.selector` against the real root state, the notifications reconcile, and the
e2e `game-play`, `cold-launch`, `deck-visibility`, `cash/rules` and storage-undo specs.

Route boilerplate across the 13 `*.routes.ts` was considered for extraction and **rejected**: the shape
is not uniform (providers, `data`, nested children, spread contexts), a helper would grow an options bag,
and these files are the one place a reader sees a module's whole URL surface — which the module-root
constraint in [decisions.md](./decisions.md) makes load-bearing. Also rejected: an `app-icon-button` for the 54 icon-only buttons (blocked — a third carry
`data-testid`s the e2e reads by literal, and `verify:testids` cannot see a pass-through input), cash's
four `confirmDelete` wrappers (already scheduled for deletion by undo), the three swipe-action constants
(the wording is domain-owned by design), and the per-domain `*.providers.ts` and feature-selector
projections (config and typing, not duplication).
