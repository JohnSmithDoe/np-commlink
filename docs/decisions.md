# Decisions

Settled — do not re-flag as work. Per-module decisions are in [domains.md](./domains.md), blocked work
and one-way doors in [state.md](./state.md), the next major's scope in [next-version.md](./next-version.md).

No entry cites a commit SHA. Nothing here restates what a `why` banner already says on the file itself,
or a count the code owns.

## Declined extractions

- **A single create-seed declaration.** The seed looked like two writers — `create:` config in the list
  effects and `createX(searchQuery, filterBy)` in the facade — but both call the same mint function, and
  every pair that exists passes the same arguments. What differs is only where the values come from: the
  effect reads the action, the facade reads its own state. Nothing to merge.
- **Renaming the eighteen page forwarders.** A bug in one is a bug in one, so the file wins. Worth
  knowing rather than doing: six names for one operation means a reader cannot tell from a page whether
  a delete is undoable or confirmed. The three that forwarded to a method the template already had are
  gone; the rest earn a rename only alongside work that is touching them anyway.
- **The five ItemList CRUD `on`s.** Seventeen reducers spell them out and none has ever diverged — all
  call the same `list.utils`. Every shape that returns them as shared `on()` entries pays five or six
  casts to NgRx's state variance, and `removeItem` cannot join at all: trackplay's aggregates omit it so
  `combineReducers` hands the cascade the pre-delete state. The line that DID drift was the hydration
  spread, and that is now one spelling.
- **A `removeWithUndo` helper.** Four collection facades push the undo entry and then dispatch the
  removal. The helper would take an already-built restore action, so it enforces nothing the copies get
  wrong — the rule that matters, _build the entry in the COMMAND_, is upheld by the caller either way.
  The `DEFAULT_GAME_TYPE_ID` check that looks written twice is two guards sharing one condition: the
  reducer's protects the state, the facade's stops an undo toast for a removal that never happened.
- **A shared modal chrome component.** The three cash modals are a pair and a variant, not a trio —
  reconcile has no confirm button. What is worth keeping in view is that all three lack an `ion-modal`
  host and depend on the caller passing `htmlAttributes`, so nothing links the visible title to the
  accessible name; that is an a11y question, not a duplication one.
- **A general route-scoped list chain.** `createRouteScopedListSelectors` fits a list scoped by `:id`
  with no projection. Cash's two views scope by `accountId`/`categoryId`, overwrite `sort` to pin the
  ledger, and post-map against the UNSCOPED items; absorbing that needs three options, which is a bag
  rather than a factory. The ordering rule — scope, then search, then sort — only bites where there is a
  scope step, so the unscoped trio has nothing to protect.
- **A `field-note` read idiom.** An empty money box disables save silently, an empty name box says so —
  the money box was never seeded, the name box was.
- **A 24-line banner ceiling.** 32 is the gate; 6–14 lines is the guideline for a new banner.

## Keep, despite looking unused

- **`@capacitor/app`, `keyboard`, `haptics`** — zero imports, all three on the native classpath. Removing
  `app` changes Android's back button and no gate sees it. "No import" ≠ "unused" for a Capacitor plugin.
- **`sonar-project.properties`** — Sonar runs on demand, natively (the CLI image is amd64-only; a
  container mount breaks coverage import). Not for CI: it asserts on _new_ code only, so a first
  analysis passes vacuously.
- **Intended variants outlive a `/simplify` sweep.** Spec-only usage is the specification, not dead code.

## Identity and keys

- **A category name is a label, never an identity.** Three owners hold `{id,name}` and reference by
  `CategoryId`. The name decides duplicates only: adding an existing one is a no-op, renaming onto one merges.
- **When a reducer rewrites rows a dialog is editing, the dialog is a row too** — the open draft follows
  the survivor rather than putting a retired id back on save.
- **A GUID per row, a natural key per singleton** — natural only where the key _is_ the thing: list ids,
  deck ids, office-time's day maps.
- **Branded ids rejected.** Cost is an `as` at every mint point including every IndexedDB read. One mint;
  the disk read re-mints rather than casting.
- **Comparing by name is legitimate in exactly one place** — the recipe matcher's fallback for a storage
  row with no `productId`.

## Architecture, rejected

- **A control the user can operate must change something observable; a page the user can reach must be
  reachable without a URL bar.** Why `list-settings` left `DECK_CATALOG`.
- **No root-state type** — selectors and facades are `type:data` and cannot reach the shell.
- **"Every context lazy"** — lifecycle matches where a slice is written and read. No _supplier_ slice is eager.
- **A skin-composed i18n keyspace** — made all 60 keys invisible to `--clean`. Declared `Record<Skin, …>`
  fields make a missing skin a compile error.
- **A CI i18n freshness gate** — the extract flags removed the need. _One artifact, two writers._
- **`@ngrx/component-store` / `signalStore` for dialog state** — `signal` + `computed` is the whole
  requirement. No dialog state lives in NgRx.
- **`office-time → tracking`** — office-time is standalone and only reports telemetry.
- **`geist`'s happy path is desktop-Chrome-only, permanently.** The Prompt API ships nowhere else, so
  `unavailable` is the APK's answer forever and the module treats it as a normal state.
- **A release const gated against `package.json`** (esbuild `define` has nothing to drift) and **closing
  `metric?: string` into a union** (`metricKey` preferred at three repeated markers).

## Layout and theme

- **The multi-column list above 1024px, reverted.** Row heights are content, not layout: a running session
  is three lines, a stopped one is one, so no column count fixes the ragged gaps.
- **One ladder, three axes: φⁿ anchored at `1rem`.** Bare = proportion, ×`1rem` = spacing, ×`--fs-body` =
  the display end of the type scale. `1rem` is Ionic's `--ion-padding`, the one spacing number it ships.
- **A fully golden system declined** — φ cannot tile, so the ladder cannot hold both `0.5rem` and `1rem`.
  The type scale is golden above body and hand-set below, where legibility floors, AA contrast and 44px
  targets bind. **Not defended on aesthetics research** — the golden-preference evidence is weak.
- **A desktop gap is never closed by shrinking a touch row.** The fix belongs to the measure.
- **Explicit `color: 'danger'` is untouched by the toast accent.**
- **Nesting the stored accent map by mode declined** — a shape change on a slice every install holds, to
  preserve a colour that is two taps to re-pick.
- **Two empty-state shapes.** Inside a list whose job is to be added to, the empty state is a ROW that
  creates on tap (`app-item-list-empty`). Everywhere else it is prose (`app-empty-state`), inert. Deck
  config has none and never can — its rows are a static catalog. The searchless lists (vitals' readings
  and pills, cash's rules) read their own note, the shared one naming a searchbar they do not render.
- **Green is a STATE a row is in; a chart series is not a state.** A missing due date returns `undefined`
  from `dueStatusColor` (no bar), and the categorical `series` palette carries no `success`/`danger`.
  Green means: money coming in, a healthy MHD, a deadline far off.
- **One screen, one duration format; on CHRONO that format is the clock.** `hh:mm:ss` — a stopwatch is
  what CHRONO is, prose needs i18n for a number nobody reads as prose, and variable-width text does not
  align right. `TimeWithUnitPipe` and the `time.unit.*` keys went with it.
- **Icon weight follows POSITION: a control is `-outline`, a `[leadingIcon]` subject is filled.** Both
  directions gated in `verify:icons`, which reads all five spellings a name reaches an icon through
  (`name`, `[name]`, an `icon` input, `[leadingIcon]`, `icon:` in a catalog or preset). "Outline
  everywhere" was tried and flattened two different things.
- **`FILLED_BY_DESIGN` is for a CONTROL that fills in to report its own state** — `isFavorite() ? 'star'
: 'star-outline'`, the note editor's pin. A filled/outline pair is a state machine, and a sweep reading
  only the variant suffix cannot see one.

## Router and navigation

- **The router is a write API; the store is the read API.** Reads come from `@ngrx/router-store`; NgRx
  deleted `go`/`back`/`forward` in v4. Reading the router is a selector; navigating is an effect.
- **The route sets the filter; it never clears it.** An absent `?filter=` is not an instruction. Clearing
  is its own action: each domain resets its own `filterBy`, one shared effect strips the query string.
- **`NavController` is `Router` plus a direction.** Injecting `Router` is correct everywhere.
- **Navigating is an effect only when the store decided it.** A gesture that changes no state is not a
  store concern.
- **A controller never appears in a reducer** — a reducer runs synchronously and possibly twice per dispatch.
- **No page carries a back button; the platform's back IS back.** `ion-back-button` renders on
  `defaultHref !== undefined` alone, so visibility is either always-on or computed from
  `IonRouterOutlet.canGoBack()` — a fact about how you arrived, not about the page.
- **Four directions, and a screen answers exactly one.** OUT is the menu and the deck, ACROSS is the
  module's tab bar, DOWN is a push that `app-page-return` reverses, IN is a list row opening its item —
  content, not chrome. A header icon standing in for ACROSS is what the tab bar replaced.
- **A module's tabs are its catalog entries exactly one segment below the shell.** `PROGRAM_CONTEXT` is
  asked with a URL PREFIX, not a module name, so the answer is a fact about the address bar: a program
  further down — `/vitals/iching/cast` under a `/vitals` shell — is a page inside a tab's stack, and the
  same lookup says so with no second rule. Sibling programs must therefore share their module's prefix;
  `/soykaf`, `/data` and `/commlink/deck` do not yet, and each costs a move plus a redirect. **A program
  sitting AT its module's prefix is the expensive case**: the lookup answers `undefined` for a route
  equal to the prefix, so such a program can never be a tab in its own module's bar. `/cash` and
  `/vitals` are both there, and adopting the shell for them means moving a published program URL down a
  segment — which for `vitals` touches a slice real users hold and owes the usual ask. It is what drove
  trackplay's restructure.
- **The shell is `@shared/feature/module-tabs-page`, mounted on the module's EMPTY-PATH route.** `IonTabs`
  navigates to `<its own URL>/<tab>`, so an empty path leaves the prefix at the module and every tab keeps
  the address the catalog publishes. A module root redirects to its first tab, because `ion-tab-button`
  addresses a named segment.
- **A detail lives INSIDE its tab**, so the bar stays up and back walks that tab's own stack — the reason
  to keep `ion-tabs` rather than a bare `ion-tab-bar`, which the docs permit but which owns no outlet.
- **A page belonging to the MODULE rather than to one tab stays beside the shell**, hides the bar, and
  names its own parent — `list-settings`, and cash's `rules`, `report`, `schedules`, `categories`. No
  catalog entry contains such a page, so `PROGRAM_CONTEXT` gives it none: `returnRoute`/`returnLabel` is
  the whole mechanism, and a page that names neither renders no return row at all.
- **A tab is labelled by the entry's `titleKey`.** The per-skin `nameKey` is the deck tile's wording and
  a shorter one, which the bar may want if a title ever truncates; it is not free, because resolving it
  makes the lookup skin-reactive.
- **Deck visibility does not trim the bar.** Hiding a tile means "not on my deck", not "not in this module".
- **A program's URL may move for one rung-free price: a redirect.** `DeckState` persists entry IDS
  (`order`, `visibleEntries`, `hiddenTiles`); the route lives in the catalog, which is code.
- **A child page names its parent in CONTENT, and the deck catalog decides whether it has one.**
  `app-page-return` is a row at the top of `ion-content`, one key with the parent's name as a parameter.
  `PROGRAM_CONTEXT` resolves the page's URL against `DECK_CATALOG`, so a page that IS an entry renders
  nothing; a page may name a narrower parent but `isProgram` outranks it. The lookup takes the page's own
  `ActivatedRoute`, never "where is the app now" — Ionic keeps the leaving page mounted through a transition.

## Reducer purity

- **Impurity arrives through a call into a util, not an import of a framework**, so a grep for framework
  imports cannot see it — a handler reading `crypto.randomUUID()` or `Date.now()` during reduce looks
  clean.
- **A clock or an id belongs on the action _creator_, as a defaulted parameter** — read at dispatch time.
  A default on the _factory_ lets the impurity back in silently.
- **Nothing gates this.** A file-scoped import ban keys on a filename (a decaying gate) and would not have
  caught the real violation.

## Persistence and the migration ladder

- **A rung is owed only to data somebody else is holding** — a fact about people, so it is asked, never
  inferred. Roster and standing instruction in [CLAUDE.md](../CLAUDE.md); exemptions in [state.md](./state.md).
- **`APP_VERSION` is global on purpose** — a slice with no entry for a hop is walked past and re-stamped,
  so the number is a floor on the whole document set.
- **When the first real rung is written:** one per stored-shape change, never one per release; written
  against `unknown` and casting once, because the types it migrates FROM no longer exist; pinned by a spec
  against a literal of the old shape. `runMigrations` throwing is the only safe failure — it loads empty,
  never half-migrated. No down-ladder, no backup.
- **A reset is a legitimate answer to a moved shape.** A rung is owed where the data's _meaning_ survives;
  the deck's pre-flip document named the ids to _hide_, so migrating it would have inverted every choice.

## Destructive actions

- **A swipe deletes and does not ask, where a row is cheap to re-add** (`expandable` `ion-item-option`).
  Cash is the only swipe deliberately not expandable.
- **Undo over confirm.** Cascades and bulk wipes are a different class, scheduled in [next-version.md](./next-version.md).
- **Who opts into undo is decided by the round trip.** `undoableDelete` pushes `addItem(item)`, so a list
  qualifies only where the delete took nothing but that item. **A cascade must build its entry in the
  COMMAND** — an effect runs after the reducer, which has already dropped what the entry needs. Cash
  confirms instead. Which lists sit on each side is `grep undoableDelete` and `grep UndoActions.pushed`,
  where the fact cannot drift from itself.
- **The stack's only path is `app-undo-button`**, in the header of every list that can raise an entry. A
  toast is `role="status"`, so a button inside it is never announced. Being the only control is what stops
  a five-second window and a persistent one from resolving the same entry twice.
- **An entry is offered only where undoing it is visible.** `UndoEntry.scope` is an `ItemListId`, DECLARED
  and never read from the router (`note-editor.facade.ts` deletes then navigates). Producer and page import
  the same constant, so a wrong scope cannot compile.
- **The cap of ten counts per scope**, or ten deletes in one list would evict another's entry.
- **A toast reports; it never offers.** `ToastMessage.action` is gone from the framework. Every offer has
  an on-page control. **Undo answers with a toast of its own** — without one a successful restore reads as
  the button vanishing.
- **A write confirms only where its result is off screen.** Creates and edits never toast;
  `saveAndResetTracking` does, its result being an archive entry on another page. Failures always toast.
- **Cash confirms at accounts, ledger, rules and schedules** (`deleteConfirmAlert`) — imported bank
  history is not cheap to re-add by hand, and the other three are the definitions its rows are read against.

## Accessibility

- **The eight `commlink/a11y-*` rules stay; what was wrong was measurement, not size.** R6 and R4's
  controller half were inert because the receiver regex demanded a suffix the code had stopped writing.
- **The touch floor is a token and one global rule, not a lint rule.** `--sr-touch` is 2.75rem (44px at
  the default root, WCAG 2.5.5 enhanced); `global.scss` floors every `ion-button[size='small']` at it, so
  `size="small"` means small TYPE. One opt-out: the chip's remove X, inside a 32px chip whose own row is
  the target.
- **axe-core evaluated, not adopted** — it samples what a run renders where ESLint reads every template,
  and structurally cannot see the imperative overlay path.
- **Raising error toasts to `assertive` declined** — it would mean replacing `ion-toast`. The reading that
  dates it is in `ionic-a11y-assumptions.spec.ts`.
- **A field's message waits for touched OR dirty; an empty name box takes focus on present.** Touched alone
  is not enough — one box on a phone, focused on present and saved from the toolbar, is never blurred. The
  state is per field node, so `close()` resets it. Enter confirms and marks touched in one breath;
  `confirm()`'s own `canSave()` guard is what makes emitting unconditionally safe. **The hand-rolled
  `sr-field-note`s in the vitals and cash dialogs still show on open** — each is its own fix.

## Findings that were wrong about their own evidence

- **A written-down lesson does not apply itself to the code underneath it.** `calculateStats` read
  `dayjs()` inside projectors memoized on the slice, three lines below a facade comment documenting that trap.
- **The cash import CSVs were real giro exports**, gitignored and purged from history before the first
  push. Two traps in a naive purge: the blobs had lived at two paths, and the commit message described
  them (`filter-branch` leaves it without `--msg-filter`). Verify with `git rev-list --objects --all`.

## The native project

- **`android-postsync.sh` stays.** The versionName/versionCode, signing and launcher-label patches are
  derived per build and must keep running; the rest is also committed file state, kept so a from-scratch
  `cap add` stays correct.
- **The launcher label is `appName` in `capacitor.config.ts`.** Capacitor writes it into `strings.xml` when
  it scaffolds and never again. Cosmetic — identity is `applicationId` + signature.

## CI and deployment

The workflow file documents what it does. Two decisions are not visible there:

- **The gates run once, on pre-push, and the workflow re-runs none of them.** A tag can only exist on a
  commit that already passed the suite, so a second run answers a question already answered — at the
  price of every push waiting on a runner. What this gives up is the backstop: `--no-verify` now reaches
  `main` unchecked, and a green tree on one machine is the only evidence there is. Accepted because the
  hook is installed by `prepare` and the repo has one pusher.
- **The signing key does not go into GitHub secrets, and no runner builds an APK.** It saves three minutes a few
  times a year against a credential that _cannot be rotated_ — a leak has no recovery except abandoning
  the app identity, which takes every user's data. Exposure is wider than the repo: anyone with write
  access, any later workflow edit, and every third-party action sharing the job. **Automate up to the
  trust boundary and stop** — the same instinct that put Pages on a short-lived OIDC token.

## The shared list page

Every `BaseItem` list renders `ListPageComponent`.

- **Absence is the declaration, for every axis.** No `catalog` → no chip bar, no `manageCategories` → no
  button, no `reorder` → no drag handle, no `sections` → one unnamed section, no `sortOptions` → a list
  that is ARRANGED.
- **`itemTemplate` never required `app-list-item`.** Tracking, schedules and the uncategorized view pass
  their own row. First thing to check when a page looks like it cannot join.
- **Whether an order is PINNED or a sort MODE turns on the toolbar.** Schedules and the ledger pin; the
  recipe book made its cookability ranking a sort option, or a first tap would have been a one-way door
  out of the page's whole point.
- **A sort fallback is not a pinned order.** `filterAndSortItemList` compares by NAME when `sort` is
  absent, which quietly alphabetised three lists whose order is semantic. **A list with a meaningful order
  needs its own selector.**
- **Structure over behaviour, where a private answer disagreed with the shared one.** Joining the shared
  effects changed what a duplicate name does: the hand-rolled save matched by `id` alone, the shared
  matcher matches id then exact name. Uniform beats the private answer unless the private answer is
  load-bearing.
- **The show-more tap is `ion-infinite-scroll` — LAZY LOADING, not virtualization.** It measures nothing
  and recycles nothing. Real windowing stays unbuilt: `ion-virtual-scroll` was removed in Ionic 7 and the
  CDK strategy wants a fixed `itemSize` that sliding two- and three-line rows do not offer.
- **The sort toolbar scrolls rather than degrades; the end slot is capped at half the row.** Ionic gives
  `.toolbar-container` `overflow: hidden` and `ion-button` `white-space: normal`, so an over-capacity row
  does not compress. The cap keeps a headline value and a run of actions from wanting opposite things.
- **Two lists are deliberately not candidates.** A `DeckEntry` has no `name` — its label is a per-skin
  marker. Cash's uncategorized view keeps the inert empty state, because there an empty list is a SUCCESS.

## Features and gates declined

- **Household is the first MVP feature.** Declined against that scope: the bulk `storage → shopping` sweep
  (`minAmount` has never been driven against a real pantry), and colouring `bestBefore` (`storageStatusColor`
  on two axes would have to rank which one wins).
- **Multi-list household is not what `:listId` offered.** Real multi-list means keying each named
  `HouseholdState` field, against a `ListSettings` whose six cross-list booleans name lists PAIRWISE. A
  shared catalog plus a route-state filter already gives the use case at no structural cost.
- **`emoji:build` stays out of CI.** The output is committed; a stale artifact can only miss emoji from a
  newer Unicode release.
- **No skin-tone choice in the picker.** CLDR nests tone variants per base emoji — several thousand entries
  for a picker that decorates an item name. A pasted tone modifier survives the round-trip anyway.
- **The PWA icons stay `"purpose": "maskable any"` at every size.** Splitting is worth it only if a real
  device's crop looks wrong. A trigger, not a task.
