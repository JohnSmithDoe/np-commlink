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

### Verified clean — do not re-derive

Facade discipline is uniform and unchallenged: 44 action groups, zero hand-rolled `createAction`, zero
`@ngrx/*` outside `data/`, zero cross-domain imports outside the shell. No `I`/`T` type prefixes. No
`expect(component).toBeTruthy()` filler anywhere. `deck.catalog.ts` is a data table with no logic crept
in, and **no deck entry id has been renamed** by any recent commit. URL composition cannot break under
`--base-href` — the app is hash-routed, so base-href touches assets only. `PROGRAM_CONTEXT` cannot throw
`NullInjectorError`; it ships in the root injector with a factory default. `board.factory.ts`'s
ring arithmetic, `planMove`'s lap walk and home-column blocking, the notation round-trip,
`trackplay.cascade.ts` and `trackplay.scoring.ts` were all hand-traced and are correct. Every one of the
13 edit dialogs uses `item-edit-modal`. `board.moves.ts` **is** covered (`board.moves.spec.ts`, 11
cases including a Pachisi ruleset) — a stale index claimed otherwise.

Route boilerplate across the 13 `*.routes.ts` was considered for extraction and **rejected**: the shape
is not uniform (providers, `data`, nested children, spread contexts), a helper would grow an options bag,
and these files are the one place a reader sees a module's whole URL surface — which the module-root
constraint in [decisions.md](./decisions.md) makes load-bearing. Also rejected: an `app-icon-button` for the 54 icon-only buttons (blocked — a third carry
`data-testid`s the e2e reads by literal, and `verify:testids` cannot see a pass-through input), cash's
four `confirmDelete` wrappers (already scheduled for deletion by undo), the three swipe-action constants
(the wording is domain-owned by design), and the per-domain `*.providers.ts` and feature-selector
projections (config and typing, not duplication).
