# Footguns

Empirical failures that do **not** reproduce from a read of the source. Each cost a red suite, a
data-loss bug, or an unbuildable artifact at least once. Nothing here is derivable — that is the
entry criterion.

Fuller arguments for every line were deleted on 2026-08-04; recover with
`git show HEAD~1:docs/<file>.md` (`testing`, `lifecycle-and-persistence`, `coding-conventions`,
`i18n`, `build-and-deploy`, `theming`, `architecture`, `cross-feature-communication`,
`dialogs-and-forms`, `features`, `cash`, `deck-catalog`, `ionic-a11y-practices`).

## Lifecycle

- **Lazy ≠ unloaded.** `IonicRouteStrategy` has no `shouldDestroyInjector` and NgRx has no
  per-injector teardown, so a lazy route's injector, effects and state register on **first visit and
  persist for the session**. Modules are not mutually exclusive. Two lazy modules listening to the
  same action BOTH fire once both are visited — NgRx dedups same-class instances, never
  different-class ones. This is why the shared list/persistence flows are **builders, not a shared
  class**: one class in two injectors double-dispatches. "Lazy" is a boot-cost win, not memory reclaim.
- **Angular builds a route's `EnvironmentInjector` during recognition**, so reducers exist before the
  hydration resolver runs.
- **An effect that reads router state must key on `routerNavigatedAction`, not on the state itself.**
  `provideRouterStore()` writes the router slice at `ROUTER_NAVIGATION`, which by default fires
  **before** guards and resolvers — and hydration IS a resolver (`module-hydration.resolver.ts`). An
  effect keyed on the state therefore dispatches, then watches `loaded` replace the whole slice
  underneath it. It survives every in-app path, because the domain is already hydrated by the time you
  navigate within it, and fails only on a first-navigation deep link — which is exactly a PWA bookmark
  or an APK cold start. `ROUTER_NAVIGATED` fires on `NavigationEnd`, after resolvers, so it is ordered
  after hydration by construction: the same guarantee a lifecycle hook gets for free. This is why
  `category-filter.effects.ts` keys on the action.

## Persistence — three ways to lose data

- **A save trigger must exclude `load`/`loaded`.** Hydration dispatches `[X] load` while the slice is
  still at empty `initialState`; persisting on it clobbers the saved doc. Real data-loss bug, now
  guarded by a reload e2e.
- **A telemetry reporter must gate on its slice's `loaded` AND on a resolved read**
  (`ReadBeforeWriteService`). `store.select` hands out `initialState` on subscription, so an ungated
  reporter announces a zero that the deck lights as live and the summary writer puts on disk over the
  previous session's real number — permanently, if that read then failed.
- **Every doc is a `{v,data}` envelope**, migrated on read by `runMigrations`. A context supplies a
  `ladder` only when it has a hop. The schema `version` lives in exactly one place: the eager
  `settings` slice (`npc-settings`, owned by `commlink`).
- Keys are `npc-<slice>`; dashboard summaries `npc-summary-<source>`. Each module reads only its own
  keys. The default storage bucket is **evictable** — `provideDurableStorage()` requests promotion
  fire-and-forget (Firefox prompts; awaiting it would hold the splash open).

## Six Ionic locator traps

Each passes alone and fails after an SPA navigation.

- **Scope to the page component** `app-page-<x>`, not `#main-content` — the outlet keeps
  previously-visited routes mounted, so a sibling page's identical button is still there.
- **An overlay teleports to the app root**, outside that page scope. Presenting **moves** the
  `ion-modal` to `ion-app` and leaves an `overlay-hidden` twin in the wrapper (so the wrapper matches
  *two*); a single list route mounts **five**; Ionic puts **no `role="dialog"`** on `ion-modal`, so
  `getByRole('dialog')` matches nothing. Key a presented dialog off its **title**, narrowed by
  `.show-modal`.
- **Click an `ion-select` host**, not its accessible button — the shadow `part="inner"` swallows it.
- **Re-entering a route mounts the page a second time**; `:visible` does not help (the stale instance
  is not `display:none` at assert time). Navigate with `goto` **+ `reload()`**.
- **`ion-back-button` is a `button`, not a `link`** — Ionic renders a native `<button>` in its shadow
  root and copies the host `aria-label` onto it.
- **A bare `ion-toast` is not unique** — the shell mounts its own update prompt, and an inline overlay
  sits in the DOM whether presented or not. Narrow with `:not(.overlay-hidden)`. General rule: **an
  always-mounted overlay makes every element-name locator for that overlay ambiguous app-wide**, so
  adding one to the shell changes every spec's namespace.

## Specs

- **`detectChanges()` depends on what the template embeds.** jsdom never upgrades a Stencil element,
  so an `ion-*` host is inert while Angular still renders the light DOM around it. A *dumb* component
  may call it and assert its own output; a page embedding Ionic-heavy children must not — what it
  would assert is a shell. Rendered behaviour is e2e's.
- **Rely on Vitest `globals: true`** — never `import` a *value* from `'vitest'`. `import type` is
  required for what `vitest/globals` does not declare (`MockInstance`).
- **A spec overriding selectors must `afterEach(() => store.resetSelectors())`** — spec files share a
  module registry and overrides leak into files that never set them. Facades are root singletons, so
  overriding between two `createComponent` calls needs `store.refreshState()`.
- **A fixture restates the defaults rather than importing `initialX`** — a fixture answers "a
  plausible state", a reducer's initial answers "what a fresh install boots into".
- **`vi.mock` cannot stub a relative import.** `@angular/build:unit-test` rejects it outright — *"the
  `vi.mock` and related methods are not supported for relative imports with the Angular unit-test
  system"* — and the spec fails to collect, so it reads as a broken suite rather than an unsupported
  API. To force a module-level failure, drive it through a token the module already reads: the emoji
  picker's catalog is failed by providing an `APP_LANGUAGE` with no entry in `DATA_BY_LANGUAGE`
  (`emoji-picker.offline.spec.ts`).
- Scope e2e content assertions with `#main-content`; hash-routing URLs (`/#/household/storage/_storage`).

## Gates that can go inert — and inert gates pass

- **A green suite does not verify a config change.** Check with `eslint --print-config <file>`. This
  repo's docs described three unicorn rules as disabled while all three sat at `error`.
- **Flat config *replaces* a rule's options, never merges them** — a selector added in one block is
  silently dropped wherever a later block sets the same rule id. Bit this repo twice; it is why the
  i18n and NgRx checks are rule **ids** rather than shared `no-restricted-syntax` option bags.
- **`extends` applies the enclosing block's `files` to everything it extends**, so a template-scoped
  rule set nested under a `**/*.ts` parent intersects to **nothing**. Measured: every template rule
  went inert and a planted nameless `<ion-icon>` linted green.
- **Editing a rule's source does not invalidate the ESLint cache** — it hashes the resolved config
  object, not the plugin files. Develop with `--no-cache`; `rm -rf .eslintcache` (the builder makes
  that path a *directory*) before believing a full run. The cache is also per-file while Sheriff is
  cross-file: if A breaks because B changed, A's cached result is reused.
- **`build` and `test` run on esbuild (transpile-only)**, so a broken *type-only* import passes both
  silently. Always run both `tsc --noEmit` passes.
- **Verify a new gate by breaking what it should catch.** A green assertion proves nothing until seen
  red for the right reason. The `i18n-key-ownership` rule needed **two** node types — a quoted key is
  a `Literal` in TS but a `LiteralPrimitive` in an Angular template, so a `Literal`-only selector
  silently passed every template, where most of the class lived.
- **Verify a diagnostic query before scoping work off it.** A `grep -Lq` inversion faked a
  ~70-component backlog; counting colocated `*.spec.ts` files is not coverage; grepping templates for
  `aria-live` cannot see a web component's shadow DOM. A shell idiom lies too —
  `tsc … | tail -2 && echo clean` prints "clean" whenever `tail` succeeds, which is always.
- **Coverage floors measure "of what is under test", not the app** — the builder instruments only what
  specs pull in. Templates are excluded from the denominator on purpose (with `.html` counted in:
  39% statements, **1.4% functions**, leaving ~8 points of room for TS to regress into silently).
  `coverage.include` does not compose with `@angular/build:unit-test` — the report collapses to 0%.
- **`maximumWarning` cannot fail CI**, so a warning is not a gate; `verify-all.sh` surfaces the count.
- **A rule that matches on a naming convention decays as the names drift, and reports nothing while it
  does.** `overlay-options.ts`'s receiver regex required a `Ctrl`/`Controller` suffix and its banner
  asserted that was "already the app's convention" — true when written. It later missed `#toast`
  (`trackplay.effects.ts`) and `#alerts` (`global-error-handler.ts`): two of four overlay call sites,
  and the first is the app's **only** actionable toast, the exact shape R6 exists to report. `eslint`
  exited 0 on that file for as long as nobody asked. Prefer matching the part that cannot drift (the
  kind), and treat an affix as decoration. The general shape: a gate keyed on a convention needs the
  convention gated too, or it is keyed on nothing.
- **A lint rule with no spec fails open** — it stops matching and reports nothing, which is
  indistinguishable from a clean tree. All eight `a11y-*` rules had 589 lines and zero tests; one was
  dead. `pnpm run test:plugin` (gate 13) is the RuleTester pass that makes a dead rule red, and it
  needs its own Vitest config because `@angular/build:unit-test`'s tsconfig reaches only under `src`.
  Confirm a new rule spec by mutating the rule back and watching the intended cases fail.
- **`verify:testids` sees only `.html` declarations and *literal* references, and is silent about
  everything else.** `DECLARE_HTML` walks `.html` files; `DECLARE_TS` matches only the imperative
  `'data-testid': '…'` overlay form. So an id written in a component's inline `template:` is declared
  nowhere the script looks. `USE_PLAYWRIGHT` matches `getByTestId('literal')`, so an id fed through a
  loop variable is referenced nowhere either. Measured 2026-08-08 on the household list switcher:
  three ids invisible on **both** sides, and the run printed a clean `0 dead · 0 undeclared`. Moving
  the template into its own file made the declarations visible and the gate went red the same minute
  — on the composed reference, which had been unchecked the whole time. The script's banner already
  names the requirement ("a static literal appears verbatim on both sides"); an inline template and a
  `@for`/loop each break it, and breaking both hides the breakage.
- **One artifact, two writers** is always a bug in the making.

## Autofix and tooling hazards

- **stylelint `--fix` is not all safe here.** `property-no-vendor-prefix` turned `-webkit-mask` into a
  duplicate bare `mask`, dropping the clip on trackplay's victory beams (pre-15.4 Safari);
  `value-keyword-case` lowercased `Arial` to `arial` inside `--sr-sans`. Read the `--fix` diff.
- **Markdown is outside every formatting gate.** `prettier --write` on a doc reflows the whole file
  into an unreviewable diff. Don't.
- **`i18n:extract` flags are load-bearing.** Both outputs must be named (the tool has no locale
  discovery — `en.json` was hand-maintained for months); `'{de,en}.json'` stays **quoted** so the tool
  expands the braces, not the shell (macOS `sh` does, `dash` does not); use
  `--format-indentation '  '` and **never the `-fi` alias** — with two outputs yargs reads it as
  clustered `-f -i` and the run dies with `Unknown format: json,json`; `--trailing-newline` plus that
  indentation are what stop a 1164-line churn against prettier.
  **Acceptance test:** `pnpm run i18n:extract` → `git diff --exit-code public/i18n/` is clean.
- **pnpm withholds releases hours old** (11.9 default `minimumReleaseAge`) and it looks exactly like a
  stuck resolver. The escape hatch is the trap: `pnpm add <pkg>@<version>` bypasses it by appending to
  `minimumReleaseAgeExclude` — a supply-chain control widened to win a patch bump. Prefer waiting.

## Never compose an identifier at the call site

Both halves must share one literal, or the tool that reads it goes blind.

- **i18n keys** — a key built from a template string is invisible to `--clean` and gets pruned.
  Measured once at **120 keys across four families**. Declare `Record<TUnion, Marker>` consts; the
  annotation is what enforces exhaustiveness. Never mirror the dotted path in nested objects.
- **`data-testid`** — `'row-' + item.id` and `getByTestId('row-milk')` share no literal, so a composed
  id silently drops out of the declared set and the dead-id check stops seeing it. A repeated row
  carries a static `list-row`; *which* row comes from user-visible content (`filter({ hasText })`).
  An `app-*` element name **is** already a contract — don't add a second.
- **Deck entry ids** — never renamed: absence means default, so a rename would need a migration hop.

## Ionic behaviour worth not re-deriving

**R1–R9 are the a11y rule set**; eight of the nine are gated by `commlink/a11y-*` and each rule's own
banner carries its argument. The R-numbers below are the ones whose *underlying fact* is not visible
from the source. **R5 and R9 can never be gated** — see each.

`angular-eslint`'s `templateAccessibility` preset does not substitute for them: it keys off **native**
elements while every control here is a custom element Ionic defines at runtime, so enabling it alone
reported a clean pass over three genuinely unlabelled icon-only toolbar buttons. **A gate that is
green for a structural reason is worth less than no gate**, because it converts "nobody checked" into
"something checked and approved".

- **(R3) A visible label is not a label the control has.** `ion-item` wires no `aria-labelledby`; a
  name comes from the control's own `label`, slotted text, or `aria-label`. A host attribute reaches
  the shadow root only if the component's own inherit list forwards it. `labelPlacement` positions a
  visible label and is not itself one; `placeholder` is a last-resort accname fallback, not a label.
  A self-closing `ion-checkbox`/`ion-toggle` with no `aria-label` has **no name at all**.
- **(R4) `ion-modal` takes `aria-label`, not `aria-labelledby`** — it inherits only
  `['aria-label','role']` and puts `role="dialog"` on a wrapper inside a shadow root, so an IDREF
  cannot resolve across it. Keep it in sync with the visible `ion-title`: one translated key, both
  readers. For controller-presented overlays, `htmlAttributes` is the seam for any ARIA attribute.
- **(R1) `ion-icon` renders `role="img"` unconditionally and derives no name from `name`** — so a bare
  icon is an image role with no accessible name. `aria-hidden="true"` is the default, not an
  optimisation; there is no third state.
- **(R6) A toast's buttons are never announced** — `ion-toast` is `role="status"` + `aria-live="polite"`,
  which reads only the header and message. A toast whose button is the *only* path to an action loses
  that path for screen-reader users: duplicate it somewhere persistent, or use an alert.
- **`ion-content` already sets `role="main"`** (unless inside a menu/popover/modal), so a hand-placed
  `<main>` produces two landmarks — and this app once wrapped the **side menu** in `<main>`, pointing
  the one main landmark at the navigation drawer.
- **`ion-back-button` is `display:none` until `:host(.show-back-button)`**, set from
  `defaultHref !== undefined` — so passing `backHref` is what makes it appear at all. Its click is
  `canGoBack() ? pop() : navigateBack(defaultHref)`, so a hand-rolled `router.navigate` is the
  fallback branch only, taken even when the user had somewhere to go back to.
- **(R7) Ionic hardcodes English accessible names**, and only some are overridable: `ion-menu-button`
  ("menu") and `ion-back-button` ("back") inherit `aria-label`; `ion-searchbar`'s inner input
  ("search text"), the clear button ("reset"), `ion-datetime`'s nav and the modal drag handle do not.
  The un-overridable ones are upstream and belong in a recorded decision, not a workaround.
- **Route-change focus is opt-in.** Without `focusManagerPriority`, a click-navigation leaves focus on
  the anchor, the outlet then puts `aria-hidden` on the leaving page, and Chrome drops focus to
  `<body>` — a keyboard user lands at the top of the document with nothing announced. `main.ts` boots
  `['heading','banner']`, dropping the usual `'content'` on purpose: it would match every page's own
  `ion-content` and skip the one thing worth announcing on arrival.
- **(R8) `aria-label` on a roleless `<div>`/`<span>` is prohibited** by ARIA — the implicit `generic`
  role does not support naming, so the label is simply never exposed. Add a role that permits a name
  (`role="img"` for a glyph or count, `role="status"` for a live value), or use real text in a
  visually-hidden span. A themed HUD is exactly where labels get attached to `<span>`s.
- **(R5) Neither `ion-item-sliding` nor `ion-reorder-group` ships keyboard support.** An action
  reachable only by swipe or drag is unreachable without a pointer (WCAG 2.1.1). The pattern here is
  `tracking-item`: a kebab `ion-button` opening an `ion-popover`, which Ionic drives by keyboard fully.
  **Never gateable** — deciding it means knowing whether a keyboard path to the *same* action exists
  elsewhere in the app, which is not a property of the template being linted. Also why
  `ion-item[button]` is used for a row's primary action: it renders a real `<button>`, so Enter and
  Space reach it, at the cost of needing the trailing controls to stop propagation.
- **(R9) The viewport never clamps scale.** `maximum-scale`/`user-scalable=no` fail WCAG 1.4.4 and
  bought nothing: iOS Safari has ignored `user-scalable=no` since iOS 10, the exact platform the flag
  was written for. **Never gateable** — `index.html` is not an Angular template, so it is in no
  template rule's file set. The trade accepted: the Android WebView pinch-zooms the whole shell.

## Scheduled notifications

- **`schedule.at` and `schedule.every` are alternatives, not a value and its modifier.** Android's
  `triggerScheduledNotification` `return`s inside the `at` branch, so `every` is never read when `at`
  is set; the only repeat honoured there is `repeats: true`, whose interval is `at - now` (an 18:00
  reminder armed at 17:50 then fires every ten minutes). `{ at, every: 'day' }` type-checks, schedules
  without a warning, fires **once**, and is then silent forever — and `isRemovable()` keeps it listed
  in `getPending()`, so it still reads as armed. A real daily is `schedule: { on: { hour, minute } }`,
  the one branch that re-arms itself after each delivery.
- **A daily reminder does not exist off the native platform.** The web implementation understands `at`
  and nothing else: a schedule without it falls through to `buildNotification` and pops the
  notification **immediately**, once. So a browser toggle reads as armed while having fired its only
  nudge on the spot. `scheduleDaily` refuses off-native and reports it, rather than appearing to work.
- **`allowWhileIdle` buys only the first delivery of a cron.** The plugin's own re-arm drops back to a
  plain non-wakeup alarm, so from the second occurrence on a dozing device may hold the nudge until
  its next maintenance window.

## Money, dates, forms

- **Integer cents, never floats.** `< 0` outflow, `> 0` inflow; formatting only at the view edge.
- **Money parsing takes the language explicitly and cannot be centralized** — `12,34` read as English
  is a valid grouped amount (1234 €), so nothing can be rejected. Two call sites must **not** follow
  the UI: a German bank's CSV is German whatever the UI says, and a persisted rule threshold is
  normalized onto German on save so a language switch cannot re-interpret existing rules.
- **Import dedup keys on the `YYYY-MM-DD` prefix only** — `dateISO` carries a local offset that shifts
  with the device timezone, so keying the full string re-imports the whole batch after a DST change.
- **A parse returns `{ rows, rejected }`**, never a bare array: a partial import reporting success
  leaves the balance wrong with nothing to notice it by.
- **Reconciliation never auto-merges** — an equal-amount coincidence (two identical fares) would
  corrupt the ledger. Reconciled-away legs are excluded from balances or the spend double-counts.
- **`requireText`, not the built-in `required()`** — the latter counts `'   '` as present while every
  `persist()` trims. `requireUniqueName` takes `siblings`/`editing` as **thunks**, because `form()`
  evaluates its schema eagerly, before the fields they read exist.
- **A name rule's `siblings` must be the whole aggregate, never a page's view of it.** Feeding it the
  filtered page view meant a search term left in the box shrank the sibling set and a duplicate saved.
  The aggregate read is spelled `allItems` precisely so it cannot be confused with the engine's
  `items` in a file that injects both.
- **A cleared date box persists the string `'Invalid Date'`** without `requireParseableDate` — it
  sorts above every real date and can never be reconciled.
- **`@angular/forms` writes every control binding onto a same-named directive input**, and
  `FieldState.pattern` defaults to a shared `computed(() => [])`, so a bound `ion-input` gets
  `pattern=""` — permanently `:invalid`. Harmless here; latent anywhere reading native validity.

## Build

- **`versionCode = major*10000 + minor*100 + patch`, so minor and patch must each stay below 100** —
  `0.1.100` and `0.2.0` both compute to `200`. Silent at build time; surfaces as an APK Android
  refuses with `INSTALL_FAILED_VERSION_DOWNGRADE`, whose only remedy is an uninstall that wipes every
  tracked session, the pantry and the ledger.
- **No absolute in-app URL may point at the server root** — Pages serves under `/np-commlink/`. The
  `TranslateHttpLoader` prefix is `'./i18n/'` (an absolute `/i18n/` 404s and every label degrades to
  its raw key) and the favicon `href` is relative.
- **A self-hosted font must live in `src/assets/`, not `public/`.** A stylesheet cannot express a
  base-href-relative `url()`: `url('/fonts/…')` 404s under the subpath, `url('fonts/…')` is a build
  error (a `public/` asset is copied, never bundled), and only `url('../assets/fonts/…')` is
  fingerprinted into `media/` as a CSS-relative URL that survives both bases. They also need their own
  **prefetch** group in `ngsw-config.json` — cached lazily, the first offline launch has no font.
- **The splash's colour literals in `index.html` are correct *because* they are not derived.** The
  builder inlines only the base `:root` as critical CSS, so at first paint the cyberpunk override has
  not arrived: `var(--sr-bg)` paints the *plain* backdrop and `Canvas` paints white, both giving a
  light splash to the dark default — the exact flash the splash exists to prevent, inverted.
- **`reveal()` removes the splash on `transitionend`, not a timer** — the duration existed twice (a TS
  const and a stylesheet value) with nothing holding them equal. It also sets `pointer-events: none`,
  since opacity does not affect hit-testing and a full-bleed overlay at `z-index 99999` otherwise
  swallows the first press for the whole fade.
- **Postsync patch 5 (the `signingConfig`) is replaced, not skipped-if-present.** It is the script's
  own content, so an append-if-absent guard would make an edit reach only freshly generated `android/`
  folders and silently miss the machine it was written on.
- **The collected APK name follows the signature** (`np-commlink.apk` vs `-unsigned.apk`), and its
  source filename comes from AGP's `output-metadata.json`, never a glob — both outputs live in one
  directory and neither build deletes the other, so a glob hands over a stale APK from the other
  signing state.
- **`vi.mock('<third-party-module>')` is not reliable under `@angular/build:unit-test` — inject the
  dependency instead.** The builder wraps each spec before Vitest hoists the call, so it always warns
  ("not at the top level… will become an error in a future version") whatever the call's position, and
  whether the double actually binds varies **between runs of the same suite**: the mock applied on one
  `pnpm test` and not the next, with no code change. A flaky green is worse than no test. To fake a
  static Capacitor/vendor API, put it behind an `InjectionToken` whose factory returns the real one
  (`LOCAL_NOTIFICATIONS` in `@shared/data/services/local-notifications.service.ts`) and override the
  token in the spec — deterministic, and no module registry involved.
