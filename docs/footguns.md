# Footguns

Empirical failures that do **not** reproduce from a read of the source. Each cost a red suite, a
data-loss bug, or an unbuildable artifact at least once. Nothing here is derivable — that is the entry
criterion.

## Lifecycle

- **Lazy ≠ unloaded.** `IonicRouteStrategy` has no `shouldDestroyInjector` and NgRx has no per-injector
  teardown: a lazy route's injector, effects and state register on first visit and persist for the
  session. Two lazy modules listening to the same action BOTH fire once both are visited (NgRx dedups
  same-class instances, never different-class). Hence the shared list/persistence flows are **builders,
  not a shared class** — one class in two injectors double-dispatches. "Lazy" is a boot-cost win, not
  memory reclaim.
- **Angular builds a route's `EnvironmentInjector` during recognition**, so reducers exist before the
  hydration resolver runs.
- **An effect reading router state must key on `routerNavigatedAction`, not on the state.**
  `provideRouterStore()` writes the slice at `ROUTER_NAVIGATION`, which fires **before** resolvers — and
  hydration IS a resolver. An effect keyed on the state dispatches, then watches `loaded` replace the
  slice underneath it. Survives every in-app path; fails only on a first-navigation deep link, i.e. a PWA
  bookmark or an APK cold start. `ROUTER_NAVIGATED` fires on `NavigationEnd`, ordered after hydration by
  construction (`category-filter.effects.ts`).

## Persistence — three ways to lose data

- **A save trigger must exclude `load`/`loaded`.** Hydration dispatches `[X] load` while the slice is
  still empty `initialState`; persisting on it clobbers the saved doc. Real data-loss bug, now guarded by
  a reload e2e.
- **A telemetry reporter must gate on its slice's `loaded` AND a resolved read**
  (`ReadBeforeWriteService`). `store.select` hands out `initialState` on subscription, so an ungated
  reporter announces a zero that the deck lights as live and the summary writer puts on disk over the
  previous session's real number — permanently, if that read then failed.
- **Every doc is a `{v,data}` envelope**, migrated on read by `runMigrations`; a context supplies a
  `ladder` only when it has a hop. The schema `version` lives in one place: the eager `settings` slice.
- Keys are `npc-<slice>`; summaries `npc-summary-<source>`. Each module reads only its own. The default
  storage bucket is **evictable** — `provideDurableStorage()` requests promotion fire-and-forget (Firefox
  prompts; awaiting it would hold the splash open).

## Six Ionic locator traps

Each passes alone and fails after an SPA navigation.

- **Scope to the page component** `app-page-<x>`, not `#main-content` — the outlet keeps visited routes
  mounted, so a sibling page's identical button is still there.
- **An overlay teleports to the app root**, outside that scope. Presenting **moves** the `ion-modal` to
  `ion-app` and leaves an `overlay-hidden` twin (so the wrapper matches *two*); a single list route mounts
  **five**; Ionic puts **no `role="dialog"`** on `ion-modal`. Key a presented dialog off its **title**,
  narrowed by `.show-modal`.
- **Click an `ion-select` host**, not its accessible button — the shadow `part="inner"` swallows it.
- **Re-entering a route mounts the page a second time**; `:visible` does not help (the stale instance is
  not `display:none` at assert time). Navigate with `goto` **+ `reload()`**.
- **`ion-back-button` is a `button`, not a `link`** — a native `<button>` in its shadow root, carrying a
  copy of the host `aria-label`.
- **A bare `ion-toast` is not unique** — the shell mounts its own update prompt, and an inline overlay
  sits in the DOM whether presented or not. Narrow with `:not(.overlay-hidden)`. General rule: **an
  always-mounted overlay makes every element-name locator for it ambiguous app-wide**, so adding one to
  the shell changes every spec's namespace.

## Specs

- **`detectChanges()` depends on what the template embeds.** jsdom never upgrades a Stencil element, so an
  `ion-*` host is inert while Angular renders the light DOM around it. A *dumb* component may call it and
  assert its own output; a page embedding Ionic-heavy children must not — what it asserts is a shell.
- **Rely on Vitest `globals: true`** — never `import` a *value* from `'vitest'`. `import type` is required
  for what `vitest/globals` does not declare (`MockInstance`).
- **A spec overriding selectors must `afterEach(() => store.resetSelectors())`** — spec files share a
  module registry and overrides leak into files that never set them. Facades are root singletons, so
  overriding between two `createComponent` calls needs `store.refreshState()`.
- **A fixture restates the defaults rather than importing `initialX`** — a fixture answers "a plausible
  state", a reducer's initial answers "what a fresh install boots into".
- **`vi.mock` cannot stub a relative import.** `@angular/build:unit-test` rejects it and the spec fails to
  *collect*, so it reads as a broken suite rather than an unsupported API. Drive the failure through a
  token the module already reads instead — the emoji catalog is failed via an `APP_LANGUAGE` with no entry
  in `DATA_BY_LANGUAGE`.
- **`vi.mock('<third-party-module>')` is unreliable here — inject instead.** The builder wraps each spec
  before Vitest hoists, so it always warns, and whether the double binds varies **between runs of the same
  suite**. A flaky green is worse than no test. Put a static vendor API behind an `InjectionToken` whose
  factory returns the real one (`LOCAL_NOTIFICATIONS` in
  `@shared/data/services/local-notifications.service.ts`) and override the token.
- Scope e2e content assertions with `#main-content`; hash-routing URLs (`/#/household/storage/_storage`).

## Gates that can go inert — and inert gates pass

- **A green suite does not verify a config change.** Check with `eslint --print-config <file>`. This
  repo's docs once called three unicorn rules disabled while all three sat at `error`.
- **Flat config *replaces* a rule's options, never merges them** — a selector added in one block is
  silently dropped wherever a later block sets the same rule id. Bit this repo twice; hence the i18n and
  NgRx checks are rule **ids**, not shared `no-restricted-syntax` option bags.
- **`extends` applies the enclosing block's `files` to everything it extends**, so a template-scoped set
  nested under a `**/*.ts` parent intersects to **nothing**. Measured: every template rule went inert and
  a planted nameless `<ion-icon>` linted green.
- **Editing a rule's source does not invalidate the ESLint cache** — it hashes the resolved config, not
  the plugin files. Develop with `--no-cache`; `rm -rf .eslintcache` (the builder makes that path a
  *directory*) before believing a full run. The cache is per-file while Sheriff is cross-file: if A breaks
  because B changed, A's cached result is reused.
- **`build` and `test` run on esbuild (transpile-only)**, so a broken *type-only* import passes both.
  Always run both `tsc --noEmit` passes.
- **Verify a new gate by breaking what it should catch.** `i18n-key-ownership` needed **two** node types —
  a quoted key is a `Literal` in TS but a `LiteralPrimitive` in a template, so a `Literal`-only selector
  silently passed every template, where most of the class lived.
- **A lint rule with no spec fails open** — it stops matching and reports nothing, indistinguishable from
  a clean tree. All eight `a11y-*` rules had 589 lines and zero tests; one was dead. `pnpm run test:plugin`
  is what makes a dead rule red, and it needs its own Vitest config because the builder's tsconfig reaches
  only under `src`.
- **A rule matching on a naming convention decays as the names drift, and reports nothing while it does.**
  `overlay-options.ts`'s receiver regex required a `Ctrl`/`Controller` suffix — true when written, later
  missing two of four overlay call sites. Match the part that cannot drift (the kind); treat an affix as
  decoration. A gate keyed on a convention needs the convention gated too, or it is keyed on nothing.
- **Verify a diagnostic query before scoping work off it.** A `grep -Lq` inversion faked a ~70-component
  backlog; counting colocated `*.spec.ts` files is not coverage; grepping templates for `aria-live` cannot
  see a shadow DOM. Shell idioms lie too — `tsc … | tail -2 && echo clean` prints "clean" whenever `tail`
  succeeds, which is always.
- **Coverage floors measure "of what is under test", not the app** — the builder instruments only what
  specs pull in. Templates are excluded from the denominator on purpose (with `.html` in: 39% statements,
  **1.4% functions**). `coverage.include` does not compose with `@angular/build:unit-test` — the report
  collapses to 0%.
- **`maximumWarning` cannot fail CI**, so a warning is not a gate; `verify-all.sh` surfaces the count.
- **`verify:testids` sees only `.html` declarations and *literal* references.** `DECLARE_TS` matches only
  the imperative `'data-testid': '…'` overlay form, so an id in an inline `template:` is declared nowhere;
  `USE_PLAYWRIGHT` matches `getByTestId('literal')`, so an id fed through a loop variable is referenced
  nowhere. Measured on the household list switcher: three ids invisible on **both** sides and a clean
  `0 dead · 0 undeclared`. An inline template and a `@for` each break the "static literal verbatim on both
  sides" requirement, and breaking both hides it.
- **One artifact, two writers** is always a bug in the making.

## Autofix and tooling hazards

- **stylelint `--fix` is not all safe here.** `property-no-vendor-prefix` turned `-webkit-mask` into a
  duplicate bare `mask`, dropping the clip on trackplay's victory beams (pre-15.4 Safari);
  `value-keyword-case` lowercased `Arial` inside `--sr-sans`. Read the `--fix` diff.
- **Markdown is outside every formatting gate.** `prettier --write` on a doc reflows the whole file into
  an unreviewable diff. Don't.
- **`i18n:extract` flags are load-bearing.** Both outputs must be named (no locale discovery);
  `'{de,en}.json'` stays **quoted** so the tool expands the braces, not the shell (macOS `sh` does, `dash`
  does not); use `--format-indentation '  '` and **never the `-fi` alias** — with two outputs yargs reads
  it as clustered `-f -i` and dies with `Unknown format: json,json`; `--trailing-newline` plus that
  indentation stop a 1164-line churn against prettier. **Acceptance:** `pnpm run i18n:extract` →
  `git diff --exit-code public/i18n/` is clean.
- **pnpm withholds releases hours old** (11.9 default `minimumReleaseAge`) and it looks exactly like a
  stuck resolver. The escape hatch is the trap: `pnpm add <pkg>@<version>` bypasses it by appending to
  `minimumReleaseAgeExclude` — a supply-chain control widened to win a patch bump. Prefer waiting.

## Never compose an identifier at the call site

Both halves must share one literal, or the tool that reads it goes blind.

- **i18n keys** — a key built from a template string is invisible to `--clean` and gets pruned; measured
  once at 120 keys across four families. Declare `Record<TUnion, Marker>` consts — the annotation is what
  enforces exhaustiveness. Never mirror the dotted path in nested objects.
- **`data-testid`** — `'row-' + item.id` and `getByTestId('row-milk')` share no literal, so a composed id
  drops out of the declared set and the dead-id check stops seeing it. A repeated row carries a static
  `list-row`; *which* row comes from user-visible content (`filter({ hasText })`). An `app-*` element name
  **is** already a contract.
- **Deck entry ids** — never renamed: absence means default, so a rename needs a migration hop.

## Ionic behaviour worth not re-deriving

R1–R9 are the a11y rule set; eight are gated by `commlink/a11y-*` and each rule's banner carries its
argument. Below are the ones whose *underlying fact* is invisible from the source. **R5 and R9 can never
be gated.**

`angular-eslint`'s `templateAccessibility` preset does not substitute: it keys off **native** elements
while every control here is a runtime-defined custom element, so it reported a clean pass over three
unlabelled icon-only toolbar buttons. **A gate green for a structural reason is worth less than no gate**
— it converts "nobody checked" into "something checked and approved".

- **(R1) `ion-icon` renders `role="img"` unconditionally and derives no name from `name`** — a bare icon
  is an image role with no accessible name. `aria-hidden="true"` is the default, not an optimisation.
- **(R3) A visible label is not a label the control has.** `ion-item` wires no `aria-labelledby`; a name
  comes from the control's own `label`, slotted text, or `aria-label`, and a host attribute reaches the
  shadow root only if the inherit list forwards it. `labelPlacement` positions a label and is not one;
  `placeholder` is an accname fallback. A self-closing `ion-checkbox`/`ion-toggle` without `aria-label`
  has **no name at all**.
- **(R4) `ion-modal` takes `aria-label`, not `aria-labelledby`** — it inherits only
  `['aria-label','role']` and puts `role="dialog"` on a wrapper inside a shadow root, so an IDREF cannot
  resolve across it. Keep it in sync with the visible `ion-title`: one key, both readers. For
  controller-presented overlays, `htmlAttributes` is the seam.
- **(R6) A toast's buttons are never announced** — `role="status"` + `aria-live="polite"` reads only the
  header and message. A toast whose button is the *only* path to an action loses it for screen-reader
  users: duplicate it somewhere persistent, or use an alert.
- **(R7) Ionic hardcodes English accessible names, only some overridable** — `ion-menu-button` ("menu")
  and `ion-back-button` ("back") inherit `aria-label`; `ion-searchbar`'s inner input ("search text"), its
  clear button ("reset"), `ion-datetime`'s nav and the modal drag handle do not.
- **(R8) `aria-label` on a roleless `<div>`/`<span>` is prohibited** — the implicit `generic` role does not
  support naming, so the label is never exposed. Add a role that permits one (`role="img"` for a glyph,
  `role="status"` for a live value) or use real text in a visually-hidden span. A themed HUD is exactly
  where labels get attached to `<span>`s.
- **(R5) Neither `ion-item-sliding` nor `ion-reorder-group` ships keyboard support** — an action reachable
  only by swipe or drag is unreachable without a pointer (WCAG 2.1.1). The pattern here is a kebab
  `ion-button` opening an `ion-popover` (`tracking-item`). **Never gateable** — it depends on whether a
  keyboard path to the *same* action exists elsewhere, which is not a property of the template. Also why
  `ion-item[button]` carries a row's primary action: a real `<button>`, at the cost of trailing controls
  having to stop propagation.
- **(R9) The viewport never clamps scale.** `maximum-scale`/`user-scalable=no` fail WCAG 1.4.4 and bought
  nothing — iOS Safari has ignored `user-scalable=no` since iOS 10, the exact platform it was written for.
  **Never gateable** — `index.html` is not an Angular template. Trade accepted: the Android WebView
  pinch-zooms the whole shell.
- **`ion-content` already sets `role="main"`** (unless inside a menu/popover/modal), so a hand-placed
  `<main>` produces two landmarks — this app once wrapped the **side menu** in `<main>`.
- **`ion-back-button` is `display:none` until `:host(.show-back-button)`**, set from
  `defaultHref !== undefined` — passing `backHref` is what makes it appear. Its click is
  `canGoBack() ? pop() : navigateBack(defaultHref)`, so a hand-rolled `router.navigate` is the fallback
  branch only, taken even when the user had somewhere to go back to.
- **Route-change focus is opt-in.** Without `focusManagerPriority`, a click-navigation leaves focus on the
  anchor, the outlet puts `aria-hidden` on the leaving page, and Chrome drops focus to `<body>`. `main.ts`
  boots `['heading','banner']`, dropping the usual `'content'` on purpose: it would match every page's own
  `ion-content` and skip the one thing worth announcing on arrival.

## Scheduled notifications

- **`schedule.at` and `schedule.every` are alternatives, not a value and its modifier.** Android's
  `triggerScheduledNotification` `return`s inside the `at` branch, so `every` is never read when `at` is
  set; the only repeat honoured is `repeats: true`, whose interval is `at - now` (an 18:00 reminder armed
  at 17:50 fires every ten minutes). `{ at, every: 'day' }` type-checks, schedules without warning, fires
  **once**, then is silent forever — and `isRemovable()` keeps it in `getPending()`, so it still reads as
  armed. A real daily is `schedule: { on: { hour, minute } }`, the one branch that re-arms itself.
- **A daily reminder does not exist off the native platform.** The web implementation understands `at` and
  nothing else: a schedule without it falls through to `buildNotification` and pops **immediately**, once.
  `scheduleDaily` refuses off-native and reports it rather than appearing to work.
- **`allowWhileIdle` buys only the first delivery of a cron** — the plugin's re-arm drops back to a plain
  non-wakeup alarm, so from the second occurrence a dozing device may hold the nudge.

## Money, dates, forms

- **Integer cents, never floats.** `< 0` outflow, `> 0` inflow; formatting only at the view edge.
- **Money parsing takes the language explicitly and cannot be centralized** — `12,34` read as English is a
  valid grouped amount (1234 €), so nothing can be rejected. Two call sites must **not** follow the UI: a
  German bank's CSV is German whatever the UI says, and a persisted rule threshold is normalized onto
  German on save so a language switch cannot re-interpret existing rules.
- **Import dedup keys on the `YYYY-MM-DD` prefix only** — `dateISO` carries a local offset, so keying the
  full string re-imports the whole batch after a DST change.
- **A parse returns `{ rows, rejected }`**, never a bare array: a partial import reporting success leaves
  the balance wrong with nothing to notice it by.
- **Reconciliation never auto-merges** — an equal-amount coincidence (two identical fares) would corrupt
  the ledger. Reconciled-away legs are excluded from balances or the spend double-counts.
- **`requireText`, not the built-in `required()`** — the latter counts `'   '` as present while every
  `persist()` trims. `requireUniqueName` takes `siblings`/`editing` as **thunks**, because `form()`
  evaluates its schema eagerly, before the fields they read exist.
- **A name rule's `siblings` must be the whole aggregate, never a page's view of it.** Feeding it the
  filtered view meant a search term left in the box shrank the sibling set and a duplicate saved. The
  aggregate read is spelled `allItems` so it cannot be confused with the engine's `items`.
- **A cleared date box persists the string `'Invalid Date'`** without `requireParseableDate` — it sorts
  above every real date and can never be reconciled.
- **`@angular/forms` writes every control binding onto a same-named directive input**, and
  `FieldState.pattern` defaults to a shared `computed(() => [])`, so a bound `ion-input` gets `pattern=""`
  — permanently `:invalid`. Harmless here; latent anywhere reading native validity.

## Layout units that lie

- **`vh` is not the height you can see, and it moves.** Mobile browsers resolve it against the *largest*
  viewport (URL bar retracted), so a `vh` offset is wrong on first paint and changes as the chrome
  collapses. It is also blind to content: `padding-top: 12vh` pushes a three-line empty state exactly as
  far as a one-line one. Both are why `cash.empty-state` uses `consts.vertical-cut`, whose `::before`
  takes a share of the **free** space.
- **A `flex-grow` below 1 distributes only that fraction of the free space** — Flexbox §9.7, the mechanism
  behind `vertical-cut`. Two non-obvious consequences: the container must have free space for it to do
  anything (it collapses to `0` when content fills the page — the desirable failure), and
  `justify-content` must be `flex-start`, since `center` splits the *remaining* fraction across both ends
  and halves the offset.
- **A measure must not be expressed in `ch`.** `1ch` is the advance width of `0` in the current font, and
  `--sr-deck-font` flips between a proportional sans and JetBrains Mono — so a `ch` width silently changes
  with the theme. `theme/_layout.scss` keeps `$content-measure` in `rem`.

## Build

- **`versionCode = major*10000 + minor*100 + patch`, so minor and patch must each stay below 100** —
  `0.1.100` and `0.2.0` both compute to `200`. Silent at build time; surfaces as an APK Android refuses
  with `INSTALL_FAILED_VERSION_DOWNGRADE`, whose only remedy is an uninstall that wipes every tracked
  session, the pantry and the ledger.
- **No absolute in-app URL may point at the server root** — Pages serves under `/np-commlink/`. The
  `TranslateHttpLoader` prefix is `'./i18n/'` (an absolute `/i18n/` 404s and every label degrades to its
  raw key) and the favicon `href` is relative.
- **A self-hosted font must live in `src/assets/`, not `public/`.** A stylesheet cannot express a
  base-href-relative `url()`: `url('/fonts/…')` 404s under the subpath, `url('fonts/…')` is a build error
  (a `public/` asset is copied, never bundled), and only `url('../assets/fonts/…')` is fingerprinted into
  `media/` as a CSS-relative URL surviving both bases. They also need their own **prefetch** group in
  `ngsw-config.json` — cached lazily, the first offline launch has no font.
- **The splash's colour literals in `index.html` are correct *because* they are not derived.** The builder
  inlines only the base `:root` as critical CSS, so at first paint the cyberpunk override has not arrived:
  `var(--sr-bg)` paints the *plain* backdrop and `Canvas` paints white — a light splash on the dark
  default, the exact flash the splash exists to prevent, inverted.
- **`reveal()` removes the splash on `transitionend`, not a timer** — the duration existed twice with
  nothing holding the copies equal. It also sets `pointer-events: none`: opacity does not affect
  hit-testing, and a full-bleed overlay at `z-index 99999` otherwise swallows the first press.
- **Postsync patch 5 (the `signingConfig`) is replaced, not skipped-if-present** — it is the script's own
  content, so an append-if-absent guard would reach only freshly generated `android/` folders and silently
  miss the machine it was written on.
- **The collected APK name follows the signature** (`np-commlink.apk` vs `-unsigned.apk`), and its source
  filename comes from AGP's `output-metadata.json`, never a glob — both outputs live in one directory and
  neither build deletes the other, so a glob hands over a stale APK from the other signing state.
