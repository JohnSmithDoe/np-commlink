# Footguns

Empirical failures that do **not** reproduce from a read of the source. Nothing derivable belongs here.

## Lifecycle

- **Lazy ≠ unloaded.** `IonicRouteStrategy` has no `shouldDestroyInjector` and NgRx has no per-injector
  teardown: a lazy route's injector, effects and state persist for the session. Two lazy modules listening
  to the same action BOTH fire once both are visited (NgRx dedups same-class instances, never
  different-class) — hence the shared list/persistence flows are **builders, not a shared class**.
- **Angular builds a route's `EnvironmentInjector` during recognition**, so reducers exist before the
  hydration resolver runs.
- **An effect reading router state must key on `routerNavigatedAction`, not on the state.**
  `provideRouterStore()` writes the slice at `ROUTER_NAVIGATION`, which fires **before** resolvers — and
  hydration IS a resolver. Fails only on a first-navigation deep link (a PWA bookmark, an APK cold start).
  `ROUTER_NAVIGATED` fires on `NavigationEnd`, ordered after hydration (`category-filter.effects.ts`).

## Persistence

- **A save trigger must exclude `load`/`loaded`.** Hydration dispatches `[X] load` while the slice is still
  `initialState`; persisting on it clobbers the saved doc. A reload e2e guards it.
- **A telemetry reporter must gate on its slice's `loaded` AND a resolved read** (`ReadBeforeWriteService`).
  `store.select` hands out `initialState` on subscription, so an ungated reporter announces a zero the deck
  lights as live and the summary writer puts on disk over the real number — permanently, if that read failed.
- **Every doc is a `{v,data}` envelope**, migrated on read by `runMigrations`; a context supplies a `ladder`
  only when it has a hop. The schema `version` lives in one place: the eager `settings` slice.
- Keys are `npc-<slice>`; summaries `npc-summary-<source>`. Each module reads only its own. The default
  storage bucket is **evictable** — `provideDurableStorage()` requests promotion fire-and-forget.

## Ionic locator traps

- **Scope to the page component** `app-page-<x>`, not `#main-content` — the outlet keeps visited routes mounted.
- **An overlay teleports to the app root.** Presenting **moves** the `ion-modal` to `ion-app` and leaves an
  `overlay-hidden` twin; a single list route mounts **five**; Ionic puts **no `role="dialog"`** on
  `ion-modal`. Key a presented dialog off its **title**, narrowed by `.show-modal`.
- **Click an `ion-select` host**, not its accessible button — the shadow `part="inner"` swallows it.
- **Re-entering a route mounts the page a second time**; `:visible` does not help. Navigate with `goto` **+ `reload()`**.
- **`ion-back-button` is a `button`, not a `link`** — a native `<button>` in its shadow root carrying a copy
  of the host `aria-label`.
- **A bare `ion-toast` is not unique.** Narrow with `:not(.overlay-hidden)`. General rule: **an
  always-mounted overlay makes every element-name locator for it ambiguous app-wide.**
- **`[formField]` renders a second, hidden `input`** — `@angular/forms/signals` adds an
  `input.aux-input[type=hidden]`, so `getByTestId(…).locator('input')` on a bound `ion-toggle`/`ion-input`
  resolves to **two** elements. `getByRole('switch')` is not the way out either (the real control is in the
  shadow root). Narrow by type — `input[type="checkbox"]`.

## Specs

- **`detectChanges()` depends on what the template embeds.** jsdom never upgrades a Stencil element, so an
  `ion-*` host is inert. A dumb component may call it; a page embedding Ionic-heavy children must not.
- **Rely on Vitest `globals: true`** — never `import` a *value* from `'vitest'`. `import type` is required
  for what `vitest/globals` does not declare (`MockInstance`).
- **A spec overriding selectors must `afterEach(() => store.resetSelectors())`** — overrides leak across
  files. Facades are root singletons, so overriding between two `createComponent` calls needs `store.refreshState()`.
- **A fixture restates the defaults rather than importing `initialX`** — a fixture answers "a plausible
  state", a reducer's initial answers "what a fresh install boots into".
- **`vi.mock` cannot stub a relative import.** `@angular/build:unit-test` rejects it and the spec fails to
  *collect*, reading as a broken suite. Drive the failure through a token the module already reads.
- **`vi.mock('<third-party-module>')` is unreliable here — inject instead.** The builder wraps each spec
  before Vitest hoists, so whether the double binds varies **between runs of the same suite**. Put a static
  vendor API behind an `InjectionToken` (`LOCAL_NOTIFICATIONS`) and override the token.
- Scope e2e content assertions with `#main-content`; hash-routing URLs (`/#/household/storage/_storage`).

## Gates that can go inert — and inert gates pass

- **A green suite does not verify a config change.** Check with `eslint --print-config <file>`.
- **Flat config *replaces* a rule's options, never merges them** — a selector added in one block is silently
  dropped wherever a later block sets the same rule id. Hence the i18n and NgRx checks are rule **ids**.
- **`extends` applies the enclosing block's `files` to everything it extends**, so a template-scoped set
  nested under a `**/*.ts` parent intersects to **nothing**.
- **Editing a rule's source does not invalidate the ESLint cache** — it hashes the resolved config, not the
  plugin files. Develop with `--no-cache`; `rm -rf .eslintcache` (the builder makes that path a *directory*).
  The cache is per-file while Sheriff is cross-file.
- **`build` and `test` run on esbuild (transpile-only)**, so a broken *type-only* import passes both. Always
  run both `tsc --noEmit` passes.
- **Verify a new gate by breaking what it should catch.** `i18n-key-ownership` needs **two** node types — a
  quoted key is a `Literal` in TS but a `LiteralPrimitive` in a template.
- **A lint rule with no spec fails open** — it stops matching and reports nothing. `pnpm run test:plugin` is
  what makes a dead rule red, and it needs its own Vitest config because the builder's tsconfig reaches only
  under `src`.
- **A rule matching on a naming convention decays as names drift, and reports nothing while it does.** Match
  the kind, not the affix.
- **Verify a diagnostic query before scoping work off it.** `grep -Lq` inverts; counting colocated
  `*.spec.ts` files is not coverage; grepping templates for `aria-live` cannot see a shadow DOM.
  `tsc … | tail -2 && echo clean` prints "clean" whenever `tail` succeeds, which is always.
- **Coverage floors measure "of what is under test", not the app** — the builder instruments only what specs
  pull in. Templates are excluded from the denominator on purpose (with `.html` in: 39% statements, **1.4%
  functions**). `coverage.include` does not compose with `@angular/build:unit-test` — the report collapses to 0%.
- **`maximumWarning` cannot fail CI**, so a warning is not a gate; `verify-all.sh` surfaces the count.
- **`verify:testids` sees only `.html` declarations and *literal* references.** `DECLARE_TS` matches only the
  imperative `'data-testid': '…'` overlay form; `USE_PLAYWRIGHT` matches `getByTestId('literal')`. An inline
  template and a `@for` each break the "static literal verbatim on both sides" requirement, and breaking both
  hides it: three invisible ids still report `0 dead · 0 undeclared`.
- **One artifact, two writers** is always a bug in the making.

## Autofix and tooling hazards

- **stylelint `--fix` is not all safe here.** `property-no-vendor-prefix` turns `-webkit-mask` into a
  duplicate bare `mask`, dropping the clip on trackplay's victory beams; `value-keyword-case` lowercases
  `Arial` inside `--sr-sans`. Read the `--fix` diff.
- **Markdown is outside every formatting gate.** `prettier --write` on a doc reflows the whole file. Don't.
- **`i18n:extract` flags are load-bearing.** Both outputs must be named; `'{de,en}.json'` stays **quoted** so
  the tool expands the braces, not the shell; use `--format-indentation '  '` and **never the `-fi` alias**
  (with two outputs yargs reads it as clustered `-f -i`); `--trailing-newline` keeps a four-figure line churn
  out of the diff. **Acceptance:** `pnpm run i18n:extract` → `git diff --exit-code public/i18n/` is clean.
- **A key passed as a STATIC attribute is invisible to the extractor, and `--clean` deletes it.**
  `labelKey="settings.theme.title"` reads as a plain string to every scanner. It fails silently, one run
  later, as a deletion nobody made. Pass such a key through a `marker()` constant and bind it.
- **pnpm withholds releases hours old** (11.9 default `minimumReleaseAge`) and it looks like a stuck
  resolver. The escape hatch is the trap: `pnpm add <pkg>@<version>` appends to `minimumReleaseAgeExclude`,
  widening a supply-chain control to win a patch bump. Prefer waiting.

## Never compose an identifier at the call site

Gated (`marker-argument-is-literal`, `testid-is-static`, `verify:testids`); why each fails SILENTLY:

- **i18n keys** — a key built from a template string is invisible to `--clean` and gets pruned. Declare
  `Record<TUnion, Marker>` consts; the annotation enforces exhaustiveness.
- **`data-testid`** — `'row-' + item.id` and `getByTestId('row-milk')` share no literal, so the dead-id
  check stops seeing it and reports clean.
- **Deck entry ids** — never renamed. Absence means HIDDEN, so a renamed id drops out of every stored
  visible set and switches that program off for everyone holding one.

## Accessibility facts the source does not show

R1–R9 is the a11y rule set; each gated rule's banner carries its argument. **R5 and R9 can never be gated.**

- **`angular-eslint`'s `templateAccessibility` preset does not substitute** — it keys off **native** elements
  while every control here is a runtime-defined custom element, so it reports a clean pass over unlabelled
  icon-only toolbar buttons. **A gate green for a structural reason is worth less than no gate.**
- **(R1) `ion-icon` renders `role="img"` unconditionally and derives no name from `name`.**
  `aria-hidden="true"` is the default, not an optimisation.
- **(R3) A visible label is not a label the control has.** `ion-item` wires no `aria-labelledby`.
  `labelPlacement` positions a label and is not one; `placeholder` is an accname fallback. A self-closing
  `ion-checkbox`/`ion-toggle` without `aria-label` has **no name at all**.
- **(R4) `ion-modal` takes `aria-label`, not `aria-labelledby`** — it inherits only `['aria-label','role']`
  and puts `role="dialog"` on a wrapper inside a shadow root. Keep it in sync with the visible `ion-title`.
  For controller-presented overlays, `htmlAttributes` is the seam.
- **(R6) A toast's buttons are never announced** — `role="status"` + `aria-live="polite"` reads only header
  and message. Duplicate the action somewhere persistent, or use an alert.
- **(R7) Ionic hardcodes English accessible names, only some overridable** — `ion-menu-button` ("menu") and
  `ion-back-button` ("back") inherit `aria-label`; `ion-searchbar`'s inner input ("search text"), its clear
  button ("reset"), `ion-datetime`'s nav and the modal drag handle do not.
- **(R8) `aria-label` on a roleless `<div>`/`<span>` is prohibited** — the implicit `generic` role does not
  support naming. Add `role="img"` / `role="status"`, or use real text in a visually-hidden span.
- **(R5) Neither `ion-item-sliding` nor `ion-reorder-group` ships keyboard support** (WCAG 2.1.1). The
  pattern here is a kebab `ion-button` opening an `ion-popover` (`tracking-item`). **Never gateable** — it
  depends on whether a keyboard path to the same action exists elsewhere. Also why `ion-item[button]` carries
  a row's primary action, at the cost of trailing controls having to stop propagation.
- **(R9) The viewport never clamps scale.** `maximum-scale`/`user-scalable=no` fail WCAG 1.4.4 and buy
  nothing — iOS Safari has ignored `user-scalable=no` since iOS 10. **Never gateable** — `index.html` is not
  an Angular template. Trade accepted: the Android WebView pinch-zooms the whole shell.
- **A dismissing `ion-modal` fires `didDismiss`, and an unqualified handler closes the modal that replaced
  it.** `ItemDialogService` holds one request, so a dialog opening another makes the first one's `isOpen` go
  false; a handler calling `close()` there clears the request the second dialog is reading, with nothing
  logged. `close(listId)` ignores a caller that is not the open dialog.
- **`ion-content` already sets `role="main"`** (unless inside a menu/popover/modal), so a hand-placed
  `<main>` produces two landmarks.
- **`ion-back-button` is `display:none` until `:host(.show-back-button)`**, set from `defaultHref !== undefined`
  and nothing else. `@ionic/angular`'s directive overrides the CLICK — `canGoBack() ? pop() :
  navigateBack(defaultHref)` — and never the visibility. There is no such thing as an arrow that shows itself
  when back is possible.
- **Route-change focus is opt-in.** Without `focusManagerPriority`, a click-navigation leaves focus on the
  anchor and Chrome drops it to `<body>`. `main.ts` boots `['heading','banner']`, dropping `'content'` on
  purpose: it would match every page's own `ion-content`.

## `@for` with `@empty` inserts at the front once the empty branch has rendered

A `@for`/`@empty` pair that rendered its **empty** branch first inserts the first item view at the block's
*leading* anchor, not after the block's preceding siblings — so a chip lands above the text it belongs to.
It shows only on the second render of one instance (empty → one item), which is why it reads as "sometimes".

The fix is structural: **give a `@for` with an `@empty` its own container element.** Nothing gates it — the
smell is a `@for`/`@empty` sharing a parent with static content. `e2e/cash/derive.e2e.ts` asserts document
order on the fixed site. Same exposure, with element siblings: `edit-recipe-dialog` and `categories-dialog`,
both putting `ion-item`s straight into an `ion-list` where a wrapping `<div>` is not free.

## Scheduled notifications

- **`schedule.at` and `schedule.every` are alternatives, not a value and its modifier.** Android's
  `triggerScheduledNotification` `return`s inside the `at` branch. The only repeat honoured is
  `repeats: true`, whose interval is `at - now` (an 18:00 reminder armed at 17:50 fires every ten minutes).
  `{ at, every: 'day' }` type-checks, fires **once**, then is silent forever — and `isRemovable()` keeps it
  in `getPending()`, so it still reads as armed. A real daily is `schedule: { on: { hour, minute } }`.
- **A daily reminder does not exist off the native platform.** The web implementation understands `at` and
  nothing else; a schedule without it pops **immediately**, once. `scheduleDaily` refuses off-native.
- **`allowWhileIdle` buys only the first delivery of a cron** — the re-arm drops back to a plain non-wakeup alarm.
- **`schedule.on` takes its repeat interval from the FIRST field set, in the order year, month, day, weekday,
  hour, minute, second** (`DateMatch.java`). So `{ hour, minute }` re-arms daily and `{ weekday, hour, minute }`
  weekly — a weekday subset is one cron per day. Setting a `day` or `month` you did not mean silently demotes
  the repeat to monthly or yearly.

## Money, dates, forms

- **Money parsing takes the language explicitly and cannot be centralized** — `12,34` read as English is a
  valid grouped amount (1234 €). Two call sites must **not** follow the UI: a German bank's CSV is German
  whatever the UI says, and a persisted rule threshold is normalized onto German on save.
- **`requireText`, not the built-in `required()`** — the latter counts `'   '` as present while every
  `persist()` trims. `requireUniqueName` takes `siblings`/`editing` as **thunks**, because `form()` evaluates
  its schema eagerly.
- **A name rule's `siblings` must be the whole aggregate, never a page's view of it** — a search term left in
  the box would shrink the sibling set and a duplicate saves. The aggregate read is spelled `allItems`.
- **A cleared date box persists the string `'Invalid Date'`** without `requireParseableDate` — it sorts above
  every real date and can never be reconciled.
- **`@angular/forms` writes every control binding onto a same-named directive input**, and `FieldState.pattern`
  defaults to a shared `computed(() => [])`, so a bound `ion-input` gets `pattern=""` — permanently `:invalid`.
  Harmless here; latent anywhere reading native validity. Unfiled upstream, so treat it as current.

## Layout units that lie

- **`vh` is not the height you can see, and it moves.** Mobile browsers resolve it against the *largest*
  viewport, so a `vh` offset is wrong on first paint. It is also blind to content. Both are why
  `cash.empty-state` uses `consts.vertical-cut`, whose `::before` takes a share of the **free** space.
- **A `flex-grow` below 1 distributes only that fraction of the free space** (Flexbox §9.7). The container
  must have free space for it to do anything, and `justify-content` must be `flex-start` — `center` splits
  the remaining fraction across both ends and halves the offset.
- **A measure must not be expressed in `ch`.** `1ch` is the advance width of `0` in the current font, and
  `--sr-deck-font` flips between a proportional sans and JetBrains Mono. `theme/_layout.scss` keeps
  `$content-measure` in `rem`.
- **Ionic injects a component's CSS at RUNTIME, after `global.scss`, so at equal specificity Ionic wins and
  an app rule half-applies.** `ion-content > *` and `ion-list` are both `(0,0,1)`, and `list.md.css` zeroes
  its own host margins: the `max-width` applies, the `margin-inline: auto` does not, so a hand-rolled list
  page renders capped but flush LEFT. **Half a rule landing is the tell.** `global.scss` buys specificity
  with `:not(:root)` — matches every child, costs `(0,1,1)`.
- **A shadow Ionic element is reachable only through the custom properties it documents.** `ion-toolbar` is
  `encapsulation: "shadow"`; `--padding-start`/`--padding-end` are the only way in, and Ionic's default for
  both is `0`, which makes a `max(0px, …)` gutter free on every narrow viewport.

## Build

- **`versionCode = major*10000 + minor*100 + patch`, so minor and patch must each stay below 100** —
  `0.1.100` and `0.2.0` both compute to `200`. Silent at build time; surfaces as
  `INSTALL_FAILED_VERSION_DOWNGRADE`, whose only remedy is an uninstall that wipes every tracked session,
  the pantry and the ledger.
- **No absolute in-app URL may point at the server root** — Pages serves under `/np-commlink/`. The
  `TranslateHttpLoader` prefix is `'./i18n/'` and the favicon `href` is relative.
- **A self-hosted font must live in `src/assets/`, not `public/`.** `url('/fonts/…')` 404s under the subpath,
  `url('fonts/…')` is a build error, and only `url('../assets/fonts/…')` is fingerprinted into `media/` as a
  CSS-relative URL surviving both bases. They also need their own **prefetch** group in `ngsw-config.json`.
- **The splash's colour literals in `index.html` are correct *because* they are not derived.** The builder
  inlines only the base `:root` as critical CSS, so at first paint `var(--sr-bg)` paints the *plain* backdrop
  and `Canvas` paints white — the exact flash the splash exists to prevent, inverted.
- **`reveal()` removes the splash on `transitionend`, not a timer.** It also sets `pointer-events: none`:
  opacity does not affect hit-testing, and a full-bleed overlay at `z-index 99999` swallows the first press.
- **Postsync patch 5 (the `signingConfig`) is replaced, not skipped-if-present** — it is the script's own
  content, so an append-if-absent guard would reach only freshly generated `android/` folders.
- **The collected APK name follows the signature** (`np-commlink.apk` vs `-unsigned.apk`), and its source
  filename comes from AGP's `output-metadata.json`, never a glob — both outputs live in one directory and
  neither build deletes the other.
