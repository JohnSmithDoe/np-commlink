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
[decisions.md](./decisions.md) with the reason. What remains is one gate blind spot, four test gaps and
the doc drift._

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

## Tests — the risk-weighted holes

Coverage is not the metric and _lean tests_ is being honoured, not abused. These are the seams where a
wrong answer is silent.

- **T3 · `spec-resets-mock-selectors` has no RuleTester spec**, so a working rule and a dead one
  produce identical output — there are zero current violations. [footguns.md](./footguns.md) states the
  repo's own rule: _a lint rule with no spec fails open_. It is also blind to
  `provideMockStore({selectors})` and to an override moved into a `@shared/testing/` helper, a premise
  its header asserts and nothing enforces.

- **T4 · `@shared/util/forms/form-rules.ts` has no spec.** `requireUniqueName` encodes the
  edit-exemption (`twin.id !== editingId`) — drop that clause and every edit dialog refuses to save its
  own unmodified item, a total feature break no current test catches. `requireParseableDate` is the only
  defence against a persisted `'Invalid Date'`, which footguns records "sorts above every real date and
  can never be reconciled". Both take thunks; both are callable in a plain spec.

- **T5 · `board.page.ts` has no spec** — trackplay's largest feature file and the only page in the
  module without one, where three engines are wired to eight on-screen messages. The specific untested
  claim is the refusal→message mapping: `planMove` returns four refusals and `refuseNext` two, and a
  renamed union member renders nothing rather than failing — `no-figure` was exactly that hole.

- **T6 · Small, cheap pins:** `selectPlayerStats` with equal scores (see
  **B4**), `game-play.page.ts`'s `onValue` coercion (`"abc"→0`, `"3.7"→3`, `""→0`), and the
  `parseSetting → nextFigure` composition — both halves are well specced and **B3** lives only in their
  interaction.

## Docs — drift found

- **X1 · The board is absent from [domains.md](./domains.md).** The TRACKPLAY section is still
  headed "the dice pool" and every entry is about dice, while three commits of genuinely settled
  reasoning sit in two file banners _at the 13-line ceiling_ — a piece walks its own lap so
  `travelled + pips` decides everything and turning into home needs no separate rule; every rule the
  walk consults is data, so MÄDN, Pachisi and a house rule are one engine; the notation format; the
  `combineReducers`-identity trick that forces the cascade handlers into one file. That is content with
  no home. **Fix:** retitle the section and add the entries, then the banners shrink to a pointer.

- **X2 · [state.md](./state.md) says "both bundles" — French shipped.** `public/i18n/` holds three,
  [next-version.md](./next-version.md) already says the UI speaks three languages, and `fr.json` has
  never been proofread either. The entry understates its own debt by a third. Drop the ~76 figure while
  fixing it — it is a count the code owns and the entry already says to recount it.

- **X3 · The products-cascade defect is recorded in two files** — as a settled aside in
  `decisions.md` and as scheduled work in `next-version.md`. It is not settled, so `next-version.md` is
  its only correct home. Delete the sentence from `decisions.md`; the decision it trails ("a cascade
  must build its entry in the COMMAND") stands without the counter-example.

- **X4 · The undo opt-in rosters in `decisions.md` are an inventory mirroring the tree** — eight
  lists named, then six more. Both are accurate today, which is exactly what makes the drift silent
  tomorrow, and CLAUDE.md forbids the shape. Keep the two _rules_, drop the rosters: `grep
undoableDelete` and `grep UndoActions.pushed` is where the fact cannot drift from itself.

- **X5 · The tab-bar decision misses its most expensive case.** It prices `/soykaf`, `/data` and
  `/commlink/deck` as "a move plus a redirect", but `segmentBelow` returns `undefined` when
  `route === prefix` — so **a program mounted at its own module root can never be a tab in its own
  module's bar**, and two are: `/cash` and `/vitals`. Adopting the shell there means moving a published
  program URL down a segment, which for `vitals` touches a slice real users hold and therefore owes the
  usual ask. This constraint is what drove the trackplay restructure and is nowhere in the docs.

- **X6 · Two entries are written as the story, not the state.** The household-clipping entry in
  `state.md` narrates a cause "since found and fixed" (it is in the tree); the reducer-purity entry in
  `decisions.md` opens in the present tense about four handlers reading `crypto.randomUUID()` during
  reduce, and the code shows the fix landed. Both make a reader verify against the code to learn what is
  true. Keep the re-check instruction and the transferable lesson; drop the narrative and the count.

---

## What the next reviewer should look for

These are the shapes that produced the list above. Each one is invisible to every gate in the repo.

1. **A moved route leaves absolute string literals behind.** `games-page.facade.ts` was the signature failure: a program's
   URL moved, four literals were updated, the fifth was in a facade no compiler, lint rule or spec
   reads. After any `route:` change in `deck.catalog.ts` or a `path:` change in a routes file, grep the
   old literal across `src` **and** `e2e` — and check that the page still has an in-app entrance at all,
   not just a working URL.
2. **An extraction that leaves its own precedent standing.** `P2`: the shared tab shell was built to
   replace three improvised ones and replaced two. When a commit message says "every module invented its
   own answer", check that every instance actually converted.
3. **The newest domain re-answering a solved question.** `D1`, `D2`, `D5`, `P10` are all one shape: a
   new domain copied the block next door instead of the `@shared` factory. Ask of any new `data/`
   directory: which of these six lines does `@shared` already generate?
4. **A gate that is green for a structural reason.** `P8` (blind to `opacity`), `T3` (a rule with no
   RuleTester spec is indistinguishable from a dead one). When a rule reports zero violations, ask what
   would happen if it had stopped matching.
5. **A hand-maintained enumeration.** `P11` (`save.sources`), `X4` (the undo rosters). Forgetting an
   entry never fails — it reduces, renders, and is gone on next launch. Prefer a prefix rule to a list.
6. **Persisted hydration that does not spread initial state.** `D1`. `loaded ?? state` looks
   equivalent to `{...initial, ...loaded}` and is not: it is where an additive field stops being free.
7. **A live region created together with its message.** `P7`. `@if`-wrapped `role="status"` is the
   default mistake; the dice tray is the correct precedent in the same domain.
8. **An interactive surface that is not an Ionic element.** `P6`. The eight `a11y-*` rules only inspect
   `ion-*`, so an SVG, a canvas or a bare `<div (click)>` is unseen by all of them — and R5 can never be
   gated.
9. **Colour literals outside the theme layer.** `P5`. `grep --include='*.scss' '#[0-9a-fA-F]\{6\}'
src/app/` should return nothing.
10. **A refusal union whose template `@switch` is missing a `@case`.** An unmatched `@switch` is
    empty, not an error — every branch of a refusal type needs a visible answer or the feature is silent.
11. **Two writers of one artifact.** `P4` (tab bar vs route table), `D3` (the seed rule in both the
    effects config and the facade), and two action groups minting one `source`. Footguns says it: _one
    artifact, two writers is always a bug in the making._
12. **A tie, an empty set, a single member.** `B4`, `B8`, `P4`. Ranking code that never tests for equal
    scores, an `:id` catch-all with no unknown-id branch, a tab bar that renders with zero tabs.

### Verified clean — do not re-derive

Facade discipline is uniform and unchallenged: 44 action groups, zero hand-rolled `createAction`, zero
`@ngrx/*` outside `data/`, zero cross-domain imports outside the shell. No `I`/`T` type prefixes. No
`expect(component).toBeTruthy()` filler anywhere. `deck.catalog.ts` is a data table with no logic crept
in, and **no deck entry id has been renamed** by any recent commit. URL composition cannot break under
`--base-href` — the app is hash-routed, so base-href touches assets only. None of the three shell tokens
can throw `NullInjectorError`; all ship in the root injector with factory defaults. `board.factory.ts`'s
ring arithmetic, `planMove`'s lap walk and home-column blocking, the notation round-trip,
`trackplay.cascade.ts` and `trackplay.scoring.ts` were all hand-traced and are correct. Every one of the
13 edit dialogs uses `item-edit-modal`. `board.moves.ts` **is** covered (`board.moves.spec.ts`, 11
cases including a Pachisi ruleset) — a stale index claimed otherwise.

Route boilerplate across the 13 `*.routes.ts` was considered for extraction and **rejected**: the shape
is not uniform (providers, `data`, nested children, spread contexts), a helper would grow an options bag,
and these files are the one place a reader sees a module's whole URL surface — which `X5` makes
load-bearing. Also rejected: an `app-icon-button` for the 54 icon-only buttons (blocked — a third carry
`data-testid`s the e2e reads by literal, and `verify:testids` cannot see a pass-through input), cash's
four `confirmDelete` wrappers (already scheduled for deletion by undo), the three swipe-action constants
(the wording is domain-owned by design), and the per-domain `*.providers.ts` and feature-selector
projections (config and typing, not duplication).
