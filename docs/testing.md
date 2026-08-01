# Testing — lean, not exhaustive; and the gates around it

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §10 — the three test layers and their rules, **the five Ionic locator traps** (each
> costs a red spec when rediscovered), how a11y ended up gated by this repo's own
> `eslint-plugin-commlink/`, and gate discipline. **See also:** the a11y rules themselves →
> [ionic-a11y-practices.md](./ionic-a11y-practices.md) · the `data-testid` locator contract →
> `CLAUDE.md`.

## 10. Testing

**Lean, not exhaustive** (inherited from timetracker). Three layers:

- **Vitest unit — pure logic** (`*.spec.ts`): utils, pipes, reducers, selectors (via
  `.projector(...)`). No `TestBed` where a plain call suffices.
- **Vitest unit — component class logic** (`*.component.spec.ts`):
  `TestBed.createComponent(...).componentInstance` + `provideMockStore()` +
  `provideZonelessChangeDetection()`. **`detectChanges()` depends on what the template embeds** —
  jsdom never upgrades a Stencil element, so an `ion-*` host is inert. A *dumb* component may call
  it and assert its own light DOM (`page-header`, `list-item`, `text-item` all do, through
  `getByTestId(fixture, …)`) — Angular renders that whether or not Stencil ever runs. A page or
  smart component whose template embeds Ionic-heavy children must not: what you would be asserting
  is a shell. `tasks.page.spec.ts` carries the worked example in a comment. Anything that needs a
  real rendered tree belongs in e2e.
- **Playwright e2e** (`e2e/`, port 4321): real-browser behavior. Scope content assertions with
  `#main-content` and use **hash routing** URLs (`/#/groceries/storage/_storage`).

Shared test infra lives at `src/app/@shared/testing/` (`test-data.ts` deterministic factories,
`test-providers.ts`), reachable only from `*.spec.ts` (Sheriff `type:testing`). NgRx **effects stay
RxJS**. Rely on Vitest `globals: true` — do **not** `import` a *value* from `'vitest'`; a bare
`import type` is fine, and necessary for the handful of types `vitest/globals` does not declare
(`MockInstance`). Spec files share a module registry, so a spec overriding selectors must
`afterEach(() => store.resetSelectors())` or the overrides leak into files that never set them.

### A spec may read an internal — its own file's

A symbol whose only reader outside its file is that file's **sibling** `*.spec.ts` stays exported, and
`verify:exports` (CI gate 6) says so explicitly: a white-box unit test of what it sits next to is the
seam `type:testing` exists for, and Sheriff already lets any `*.spec.ts` reach any tag. 37 exports are
in that position today, most of them a reducer's `initialState`.

A spec in a **different directory** reaching for an internal is a finding, because the export it needs
is usually evidence that the assertion is in the wrong file. All four found were:
`groceries/data/grocery-list.selector.spec.ts` ran its own `describe` over `@shared/util`'s
`itemComparator` — a copy of coverage the shared sibling already had, and a cross-domain reach besides;
`commlink/util/deck.utils.spec.ts` tested two `commlink/model` constants; and the `settings` /
`office-time` effects specs seeded the store from the reducer's `initialState`. The remedy each time is
to **move the assertion beside its subject** — never to widen the export.

For a state seed that means the domain's own `testing/` kit (`mockSettingsState`, `mockOfficeTimeState`,
`mockCashState`, …), which every domain now has. A fixture **restates** the defaults rather than
importing `initialX`: a fixture answers "a plausible state", a reducer's initial answers "what a fresh
install boots into", and a spec that conflates them asserts the second while claiming the first.

### Five Ionic locator traps

Each costs a red spec every time it is rediscovered — a spec that ignores them passes alone and fails
after an SPA navigation.

- **Scope controls to the page component**, `app-page-<x>` (`app-page-recipes`, `app-page-storage`),
  not just `#main-content`: the router outlet keeps previously-visited routes mounted (the
  _lazy ≠ unloaded_ rule, seen from the DOM), so a sibling page's identical "Hinzufügen" button is
  still there.
- **An `<ion-modal>`/overlay teleports to the app root**, so it is _outside_ that page scope — key a
  presented dialog off its **title**, never off its wrapper. Three DOM facts make the tempting scopes
  wrong, all verified on `/groceries/storage/_storage`: presenting **moves** the `ion-modal` to
  `ion-app` and leaves an `overlay-hidden` twin behind inside the wrapper (so the wrapper matches
  _two_); a single list route mounts **five** `ion-modal`s; and Ionic puts **no `role="dialog"`** on
  `ion-modal`, so `getByRole('dialog')` matches nothing. `.show-modal` narrows to what is presented,
  the title to which one — `e2e/groceries/storage.e2e.ts` has the helper.
- **Click an `ion-select` host**, not its accessible button: the shadow `part="inner"` swallows the
  click.
- **Re-entering a route mounts the page a _second_ time** — the same `app-page-<x>` then matches twice
  and every row locator inside it is a strict-mode violation (`:visible` does _not_ help; the stale
  instance is not `display:none` at assert time). A spec bouncing between two routes should navigate
  with `goto` **+ `reload()`**, which collapses the outlet to one instance and makes every assertion a
  cold read of persisted state besides (`e2e/commlink/deck-config.e2e.ts`).
- **A bare `ion-toast` is no longer unique.** The shell mounts one of its own (the update prompt), and
  an inline overlay sits in the DOM whether presented or not — so `page.locator('ion-toast')` matches
  two and trips strict mode. Narrow with **`:not(.overlay-hidden)`**, the same class that marks the
  `ion-modal` twin above; `e2e/trackplay/players.e2e.ts` is the worked example. The general rule this
  is the second instance of: **an always-mounted overlay makes every element-name locator for that
  overlay ambiguous, app-wide** — so adding one to the shell is a change to every spec's namespace.

### A11y is gated, and the gate needed help (2026-07-29)

> The rules themselves — what Ionic's docs require of us, what Ionic already does for us, and which
> of its built-in accessible names are hardcoded English — are in **`docs/ionic-a11y-practices.md`**
> (R1–R9, each verified against the installed `@ionic/core`). **Seven of the nine are now gated**, by
> this project's own plugin, `eslint-plugin-commlink/`; R5 and R9 are review matters, permanently.

The template block in `eslint.config.js` now extends **`angular.configs.templateAccessibility`**
beside `templateRecommended` — 11 rules at `error` (`alt-text`, `label-has-associated-control`,
`click-events-have-key-events`, `valid-aria`, `interactive-supports-focus`, …). The existing
hand-maintained hygiene turned out to be complete for what those rules check: the suite went green on
the first run, with no template edits.

**Which is exactly why it is not the whole gate.** Those rules key off _native_ elements —
`elements-content` checks `<button>`/`<a>`/headings, `interactive-supports-focus` checks native
interactive roles — while every control here is an Ionic custom element. The set reported a clean pass
over **three genuinely unlabelled icon-only toolbar buttons** (two on the shopping page, one on
storage: the action-sheet trigger and the two barcode-scan buttons, now carrying
`grocery.a11y.actions` / `grocery.a11y.scan`). A gate that is green for a structural reason is worth
less than no gate, because it converts "nobody checked" into "something checked and approved".

So the class is covered by **`eslint-plugin-commlink/`, this project's own plugin** —
`commlink/a11y-*`, one rule per R-number, enabled through the plugin's own self-scoping `configs.all`. It began as a single
`no-restricted-syntax` selector for R2 (the same technique the i18n vocabulary gates use) and became a
rule set for two reasons, one of which is the flat-config trap below.

Three AST facts are load-bearing, and each one, got wrong, yields a silently inert rule:
**`[attr.aria-label]` parses to a `BoundAttribute` named plain `aria-label`** (the `attr.` prefix is
already gone, so matching `attr.aria-label` matches nothing); text must be tested for a
**non-whitespace** character, since an indented button has whitespace `Text` children — a bare "has a
text child" test exempts precisely the multi-line icon-only buttons this exists to catch; and the text
test is a **descendant** one on purpose, so text in a nested `ion-label` counts as a name while an
`aria-label` on the inner `ion-icon` does not (it names the icon).

Three more facts made the set cheap, and are worth knowing before reaching for a dependency: the
parser services a template rule needs (`convertElementSourceSpanToLoc`) hang off
**`context.sourceCode.parserServices`**, so `@angular-eslint/utils` is not required and the set has
**no dependency at all**; every parsed node already carries an ESLint-shaped `loc`, so an
attribute-level report is just `loc: attribute.loc` (`convertNodeSourceSpanToLoc` takes the *span*, not
a node — calling it like angular-eslint's element helper throws); and a block (`@if`, `@for`) holds its
children one level deeper than an element, so a walk that only follows `children` stops at the first
`@if`.

It is **TypeScript with no build step**. The builder constraint that once argued for CommonJS is
real but narrower than it looked: `@angular-eslint/builder` resolves only
`eslint.config.{js,mjs,cjs}`, so a TypeScript *config* would need `jiti` — a TypeScript *plugin*
`require`d from a `.js` config needs nothing, because Node ≥ 22.18 strips types on `require()`.
Verified end to end against this toolchain before adopting it, including that the builder spawns no
worker or child process and so inherits default-on stripping. The costs are three: relative imports
must carry an explicit `.ts`, only erasable syntax is allowed, and stripping never type-checks —
which is why `pnpm run lint` runs `tsc -p eslint-plugin-commlink` first, with `erasableSyntaxOnly`
turning a load crash into a compile error.

**The trap worth remembering is flat-config, not a11y: ESLint _replaces_ a rule's options, it does not
merge them.** Declared once on the `**/*.html` block, the R2 selector was silently dropped for every
domain folder and for `@shared`, because the i18n vocabulary gates set `no-restricted-syntax` again
for those same files and the last matching block wins whole. The workaround was to spread it into all
three blocks; the fix was to stop sharing a rule name at all, since **a rule _id_ cannot be shadowed
the way a rule's options can** — which is the second reason this is a rule set. No
`no-restricted-syntax` or `no-restricted-imports` is left in the config today (`--print-config`
reports both `undefined`), so the shadowing above is history rather than a live hazard. The habit it
taught is not: **when two concerns share one rule name, adding the second silently disables the
first** — and more generally, a config claim is only true if `eslint --print-config` says so. A
passing suite is not a check. That is not hypothetical either: this compendium described three
unicorn rules as disabled while all three sat at `error` (§1.2), and the suite was green throughout.

**What the set does not gate, and why that is not a gap to close.** R5 (no action reachable only by
swipe or drag) is undecidable from a template: an `ion-item-sliding` is fine when a kebab popover
elsewhere dispatches what the swipe does, so a rule could only flag every swipe and be disabled
everywhere. R9 (the viewport never locks zoom) is out for a duller reason — it lives in
`src/index.html`, which is not an Angular template and so is in no template rule's file set. The same restraint runs through the rules that _do_ exist — `overlay-options-have-name`
passes over options built by a helper or carrying a spread rather than guessing at them, because a gate
that reports what it cannot know teaches people to disable it. The rules carry no unit tests, for the
same reason the unicorn set carries none here: a rule set is config. What stands in for them is the
finding count on the real corpus — turning the set on produced **74 findings in 28 files** where the
old gate reported 0, and a rule that drops to zero on a corpus still holding violations has gone inert.

### Gate discipline (learned — keep applying)

Gates: `tsc -p tsconfig.app.json --noEmit` + `-p tsconfig.spec.json --noEmit` ·
`pnpm exec sheriff verify src/main.ts` · `pnpm run lint` · `pnpm test` · `pnpm run build` ·
`pnpm run e2e`.

- **`build` / `test` run on esbuild (transpile-only, no type-check)**, so a broken _type-only_ import
  passes them silently. Always run both `tsc --noEmit` passes, and usually `pnpm run e2e` — between
  them they've caught a type-only-import gap and a runtime co-hydration crash the other gates missed.
- **Verify a diagnostic query returns what you think before scoping work off it** (a `grep -Lq`
  inversion once faked a "~70-component OnPush backlog"). Two more instances came out of the
  2026-07-29 audit, both from grep standing in for a real measurement: counting colocated `*.spec.ts`
  files is not coverage, and grepping our templates for `aria-live` cannot see what a web component
  puts in its shadow DOM (§12). **A shell idiom can lie about a gate too** — `tsc … | tail -2 && echo
  clean` prints "clean" whenever `tail` succeeds, which is always. Check `$?`, or run the command bare
  so its own output is the answer.
- **Verify a new gate by breaking what it should catch.** A green assertion proves nothing until it
  has been seen red for the right reason.
- **One artifact, two writers** is always a bug in the making: either one tool owns a file's bytes, or
  you force their outputs byte-identical (§9).

