# Testing — lean, not exhaustive; and the gates around it

The a11y rules themselves → [ionic-a11y-practices.md](./ionic-a11y-practices.md) · the `data-testid`
locator contract and the gate list → [coding-conventions.md](./coding-conventions.md).

**Lean, not exhaustive** (inherited from timetracker). Three layers:

- **Vitest unit — pure logic** (`*.spec.ts`): utils, pipes, reducers, selectors (via `.projector(...)`).
  No `TestBed` where a plain call suffices.
- **Vitest unit — component class logic** (`*.component.spec.ts`):
  `TestBed.createComponent(...).componentInstance` + `provideMockStore()` +
  `provideZonelessChangeDetection()`. **`detectChanges()` depends on what the template embeds** —
  jsdom never upgrades a Stencil element, so an `ion-*` host is inert, but Angular renders the light
  DOM around it. A *dumb* component may call it and assert its own output (`page-header`, `list-item`,
  `text-item` all do); a page whose template embeds Ionic-heavy children must not, because what it
  would assert is a shell. `tasks.page.spec.ts` is the worked example. Anything needing a real
  rendered tree belongs in e2e.
- **Playwright e2e** (`e2e/`, port 4321): real-browser behaviour. Scope content assertions with
  `#main-content` and use **hash routing** URLs (`/#/household/storage/_storage`).

Shared test infra is `src/app/@shared/testing/` (`test-data.ts` deterministic factories,
`test-providers.ts`), reachable only from `*.spec.ts` (Sheriff `type:testing`). Effects stay RxJS.
Rely on Vitest `globals: true` — do **not** `import` a *value* from `'vitest'`; `import type` is fine
and necessary for the types `vitest/globals` does not declare (`MockInstance`). Spec files share a
module registry, so a spec overriding selectors must `afterEach(() => store.resetSelectors())` or the
overrides leak into files that never set them.

## A spec may read an internal — its own file's

A symbol whose only reader outside its file is that file's **sibling** `*.spec.ts` stays exported, and
`verify:exports` says so explicitly: a white-box unit test of what it sits next to is the seam
`type:testing` exists for. **37 exports** are in that position today, most a reducer's `initialState`.

A spec in a **different directory** reaching for an internal is a finding, because the export it needs
is usually evidence the assertion is in the wrong file. All four found were:
`household/data/list/household-list.selector.spec.ts` ran its own `describe` over `@shared/util`'s
`itemComparator` — a copy of coverage the shared sibling already had, and a cross-domain reach
besides; `commlink/util/deck.utils.spec.ts` tested two `commlink/model` constants; and the `settings`
/ `office-time` effects specs seeded the store from the reducer's `initialState`. The remedy each time
is to **move the assertion beside its subject** — never to widen the export.

For a state seed that means the domain's own `testing/` kit (`mockSettingsState`, `mockCashState`, …),
which every domain now has. A fixture **restates** the defaults rather than importing `initialX`: a
fixture answers "a plausible state", a reducer's initial answers "what a fresh install boots into",
and a spec conflating them asserts the second while claiming the first.

## Five Ionic locator traps

Each costs a red spec every time it is rediscovered — a spec that ignores them passes alone and fails
after an SPA navigation.

- **Scope controls to the page component**, `app-page-<x>`, not just `#main-content`: the router outlet
  keeps previously-visited routes mounted (the _lazy ≠ unloaded_ rule, seen from the DOM), so a sibling
  page's identical "Hinzufügen" button is still there.
- **An `<ion-modal>`/overlay teleports to the app root**, so it is _outside_ that page scope — key a
  presented dialog off its **title**, never off its wrapper. Three DOM facts make the tempting scopes
  wrong, all verified on `/household/storage/_storage`: presenting **moves** the `ion-modal` to
  `ion-app` and leaves an `overlay-hidden` twin behind inside the wrapper (so the wrapper matches
  _two_); a single list route mounts **five** `ion-modal`s; and Ionic puts **no `role="dialog"`** on
  `ion-modal`, so `getByRole('dialog')` matches nothing. `.show-modal` narrows to what is presented,
  the title to which one — `e2e/household/storage.e2e.ts` has the helper.
- **Click an `ion-select` host**, not its accessible button: the shadow `part="inner"` swallows the
  click.
- **Re-entering a route mounts the page a _second_ time** — the same `app-page-<x>` then matches twice
  and every row locator inside it is a strict-mode violation (`:visible` does _not_ help; the stale
  instance is not `display:none` at assert time). A spec bouncing between two routes should navigate
  with `goto` **+ `reload()`**, which collapses the outlet to one instance and makes every assertion a
  cold read of persisted state besides (`e2e/commlink/deck-config.e2e.ts`).
- **A bare `ion-toast` is not unique.** The shell mounts one of its own (the update prompt), and an
  inline overlay sits in the DOM whether presented or not — so `page.locator('ion-toast')` matches two
  and trips strict mode. Narrow with **`:not(.overlay-hidden)`**, the same class marking the
  `ion-modal` twin; `e2e/trackplay/players.e2e.ts` is the worked example. The general rule, and this is
  its second instance: **an always-mounted overlay makes every element-name locator for that overlay
  ambiguous app-wide** — so adding one to the shell is a change to every spec's namespace.

## A11y is gated, and the gate needed help (2026-07-29)

The template block extends **`angular.configs.templateAccessibility`** beside `templateRecommended` —
11 rules at `error`. The existing hand-maintained hygiene turned out to be complete for what those
rules check: the suite went green on the first run, with no template edits.

**Which is exactly why it is not the whole gate.** Those rules key off _native_ elements —
`elements-content` checks `<button>`/`<a>`/headings, `interactive-supports-focus` checks native
interactive roles — while every control here is an Ionic custom element. The set reported a clean pass
over **three genuinely unlabelled icon-only toolbar buttons**. **A gate that is green for a structural
reason is worth less than no gate**, because it converts "nobody checked" into "something checked and
approved."

So the class is covered by `commlink/a11y-*`, one rule per R-number. Three AST facts are load-bearing,
and each one, got wrong, yields a silently inert rule:

- **`[attr.aria-label]` parses to a `BoundAttribute` named plain `aria-label`** — the `attr.` prefix is
  already gone, so matching `attr.aria-label` matches nothing.
- **Text must be tested for a non-whitespace character.** An indented button has whitespace `Text`
  children, so a bare "has a text child" test exempts precisely the multi-line icon-only buttons this
  exists to catch.
- **The text test is a _descendant_ one, on purpose**, so text in a nested `ion-label` counts as a name
  while an `aria-label` on the inner `ion-icon` does not — that names the icon.

Two more facts made the set cheap: the parser services a template rule needs
(`convertElementSourceSpanToLoc`) hang off **`context.sourceCode.parserServices`**, so
`@angular-eslint/utils` is not required and the set has **no dependency at all**; and every parsed node
already carries an ESLint-shaped `loc`, so an attribute-level report is just `loc: attribute.loc`
(`convertNodeSourceSpanToLoc` takes the *span*, not a node — calling it like angular-eslint's element
helper throws). A block (`@if`, `@for`) holds its children one level deeper than an element, so a walk
that only follows `children` stops at the first `@if`.

**What the set does not gate, and why that is not a gap.** R5 (no action reachable only by swipe or
drag) is undecidable from a template: an `ion-item-sliding` is fine when a kebab popover elsewhere
dispatches what the swipe does, so a rule could only flag every swipe and be disabled everywhere. R9
(the viewport never locks zoom) is out for a duller reason — it lives in `src/index.html`, which is in
no template rule's file set. The same restraint runs through the rules that _do_ exist:
`overlay-options-have-name` passes over options built by a helper or carrying a spread rather than
guessing, **because a gate that reports what it cannot know teaches people to disable it.**

The rules carry no unit tests, for the same reason the unicorn set carries none: a rule set is config.
What stands in for them is the finding count on the real corpus — turning the set on produced **74
findings in 28 files** where the old gate reported 0, and a rule that drops to zero on a corpus still
holding violations has gone inert.

## Gate discipline

- **`build` / `test` run on esbuild (transpile-only)**, so a broken _type-only_ import passes them
  silently. Always run both `tsc --noEmit` passes, and usually `pnpm run e2e` — between them they have
  caught a type-only-import gap and a runtime co-hydration crash the other gates missed.
- **Verify a diagnostic query returns what you think before scoping work off it.** A `grep -Lq`
  inversion once faked a "~70-component OnPush backlog". Two more came out of the 2026-07-29 audit,
  both from grep standing in for a real measurement: counting colocated `*.spec.ts` files is not
  coverage, and grepping our templates for `aria-live` cannot see what a web component puts in its
  shadow DOM. **A shell idiom can lie about a gate too** — `tsc … | tail -2 && echo clean` prints
  "clean" whenever `tail` succeeds, which is always.
- **Verify a new gate by breaking what it should catch.** A green assertion proves nothing until it has
  been seen red for the right reason.
- **A config claim is only true if `eslint --print-config` says so.** A passing suite is not a check —
  this compendium described three unicorn rules as disabled while all three sat at `error`, and the
  suite was green throughout.
- **One artifact, two writers** is always a bug in the making: either one tool owns a file's bytes, or
  you force their outputs byte-identical.
