# Decisions

Settled questions, kept so they are not re-flagged as work. **Append; do not re-weave.** Each line is
a claim, a verdict, and what decided it. Live work is in [state.md](./state.md).

## Declined simplifications — all read as duplication and are not

- **The `deck.hud-label` mixin is not adopted at the nine sites that re-type its declarations.** It
  also emits `font-family`, which all nine inherit from their page root, so the substitution is
  behaviour-identical and costs **192 bytes**. Its two declarations are `var()` reads already.
- **The household `save`/`showEditDialog`/`remove` triples are not collapsed.** Each pairs an item type
  with the action for *that* list; deriving the list from the route softens it to a union, which is the
  one thing stopping a storage item being dispatched at the shopping list. Now structural: each method
  sits on the facade of the aggregate whose type it takes.
- **`CashCategoriesPageFacade` does not extend `BaseCategoryListPageFacade`** — its catalog carries its
  own cascades, so four of nine bodies would be overridden. A base with hooks for one caller.
- **`TrackingListPageFacade` and `TasksListPageFacade` share no base** — seven one-line dispatches in
  common, against different item types, create-seeds, and categories one has and the other lacks.
- **`@capacitor/app` stays** though nothing imports it. A *native* plugin: removing it changes
  Android's hardware back button, `android/` is regenerated and untested here, and no gate sees the
  difference. "No import" is not "unused" for a Capacitor plugin — same for `@capacitor/haptics`,
  `@capacitor/keyboard`.
- **Facades stay unspec'd** (2026-07-29). A facade method is one line, so a spec over it catches only
  mis-wiring, which splits into an *argument* mis-wire (typeable only by branding every id alias —
  rejected: branding needs an `as` at every mint point **including every read out of IndexedDB**,
  adding unchecked casts at the least trustworthy boundary in an app carrying zero `any`) and a
  *wrong-action* dispatch with an identical payload, which nothing types. It would not have caught the
  one time this bug shipped (`8eee87a`). Revisit only if a mis-wire actually ships.
  **`DeckFacade` is the exception** (0% functions): `configuredEntries` derives `hidden` and
  `moduleHidden` from two lists that are **both `string[]`**, so swapping them compiles and silently
  breaks the module cascade. If any facade ever earns a spec, it is this one.
- **Two off-contract facade methods** (`addCategory`/`showEditDialog`) stay on the concrete
  household/tasks facades, off `LIST_FACADE` — putting them on it forces `tracking` to implement
  operations it has no concept of.
- **A `field-note` READ idiom is not extracted.** Presentation is shared (`.sr-field-note`); what
  stays per-dialog is how each reads its errors. Two lines, five call sites. The asymmetry is
  deliberate: an empty money box leaves save disabled without a note (it is the initial state) while an
  empty **name** does say so — the box was seeded, so blank means the user cleared it.
- **The list dialogs' field tree spans the whole draft though only `name` is bound.** Raised as an
  interaction-path cost; read against `@angular/forms` 21.2.18 it is far cheaper than it sounds and the
  fix would be worse — `childrenMap` is a `linkedSignal` that **reuses** child nodes across recomputes,
  `valid()` is memoized, `reduceChildren` short-circuits, and scoping the form to the validated field
  would give back both things the conversion bought (the tree **is** the write-back channel, and
  `canSave` comes from the schema). Revisit only with a measurement on a 12-ingredient recipe.

## Latent capability is not dead code

**The wordclock's four `WordclockSettings` flags are intended variants — do not delete them on
reachability grounds** (settled 2026-07-31, after a `/simplify` sweep deleted them and was reverted).
They encode real German regional readings of one dial plus the corner-dot minute display. Every
argument for deleting them is true and insufficient: one writer, no settings surface, no i18n key,
exercised only by `wordclock.utils.spec.ts`. That is a *reachability* argument, and the spec cases are
the **specification** of those readings. "Only its own spec uses it" distinguishes unreachable from
unwritten, and only the owner can say which — ask before deleting a coherent feature axis.

## Findings that were wrong about their own evidence

- **"Exports whose only reference is their own spec" listed eleven; four were false.** The grep
  filtered out the lines containing `export`, which *were* the usages.
- **`tsconfig.json`'s `references` looked like dead weight** — no child sets `composite`, so
  `tsc -p tsconfig.json` answers TS6306. Removing it turned **178** spec files into "not found by the
  project service": the array is what typescript-eslint's `projectService` walks. Load-bearing for
  lint; a new tsconfig must be added to it.
- **Toasts already announce** (2026-07-29). `ion-toast` renders `role="status"` + `aria-atomic` +
  `aria-live="polite"` and flips `revealContentToScreenReader` on present. The audit missed it by
  grepping `src/**/*.html` for `aria-live` — a web component's shadow DOM is not in our templates.
  Raising errors to `assertive` would mean replacing `ion-toast` (Ionic hardcodes `polite`) — declined.
- **A spec may read an internal — its own file's.** `verify:exports` allows a sibling `*.spec.ts`
  reader; 37 exports are in that position, most a reducer's `initialState`. A spec in a **different**
  directory reaching for an internal is a finding: the remedy is to move the assertion beside its
  subject, never to widen the export.

## Identity

- **A category name is a label, never an identity — in all three owners.** household, tasks and cash
  hold `{id,name}` catalogs and reference by `CategoryId`; ids are `uuidv4()`, never derived from the
  name. What the name decides is *duplicate* handling, deliberately: adding an existing name is a
  no-op and renaming **onto** one merges — the loser's id is dropped and its rows remapped (cash
  remaps rules too). Since 2026-08-10 the row half of that remap is the shared `dropCategoryRef` /
  `remapCategoryRef` in all three owners, because a cash transaction carries `categoryIds` like every
  other `BaseItem`; a cash **rule** keeps a singular `categoryId`, because it ASSIGNS a category
  rather than being tagged with one, and its remap stays hand-written for that reason. That merge is
  why `CashCategoryPickerComponent.onRename` follows the survivor: the local draft would otherwise
  re-assert a retired id. **When a reducer rewrites rows a dialog is
  editing, the dialog is a row too** — the open dialog's draft put the retired id back on save.
- **A GUID per row, a natural key per singleton.** Anything existing as a row mints `uuidv4()`. The
  non-GUID identities are natural keys because there the key **is** the thing: the list ids (a route
  param, an effects guard and a persisted-doc discriminator at once), the deck catalog ids,
  `npc-summary-<source>`, and office-time's `officedays`/`freedays`/`holidays`, where minting a GUID
  per logged day would *admit* two rows for one date. ~~Only `holidays` holds that structurally (a
  `Record` keyed by date); the other two are `Array<Dayjs>`, so `hasDay` in `office-time.reducer.ts`
  is load-bearing.~~ **Superseded 2026-08-04 — and it was wrong twice over; see below.**
- **`officedays`/`freedays` are `Record<DayKey, true>` and `hasDay` is gone** (2026-08-04). The
  guard was a correctness rule held by memory, and it never covered `setOfficedays`/`setFreedays` —
  the two whole-array writes the `ion-datetime` picker actually uses — so the invariant was already
  broken on half the paths in. The shape carries it now. Two corrections to the entry above:
  **`holidays` is keyed by holiday NAME** (`Neujahr`, `Karfreitag` — `holidays.utils.ts`), not by
  date, so it never was the structural case it was cited as, and two holidays on one date would
  collide there too. And what keeps the day maps from colliding with it is the **value** type: `true`
  against `HolidayMap`'s `Dayjs`, so handing one where the other belongs is a type error. Had both
  been `Record<string, Dayjs>` it would have compiled — the `hiddenEntries`/`hiddenModules` footgun
  again.
- **The branding verdict above stands for ids and does not transfer to `DayKey`.** The objection was
  an `as` at every mint point *including every read out of IndexedDB*; here there is one mint
  (`dayjsToString`), one cast, and the disk read re-mints through it rather than casting at the
  boundary — so junk on disk is normalized instead of trusted. `DayKey` is a template-literal type,
  which is what makes a bare `string` unassignable and forces every write through that one function.
  The on-disk shape stayed `string[]`, so none of this needed a ladder or an `APP_VERSION` bump.
- **`groceries → household` abandoned two persisted identities knowingly** (2026-08-02), rather than
  laddering them: the doc key `npc-groceries → npc-household` and the persisted `AppModule` member in
  `hiddenModules`. By the rule above a persisted discriminator is never renamed, so this is the rule
  being broken rather than an oversight. What makes it free is that **nothing has ever shipped**. On a
  device that held either, the effect would be small and silent — an empty pantry, or a stale id that
  un-hides the module. The entry ids underneath and the four telemetry `source:`es were correctly left
  alone. **After the first release this stops being free.**
- **Comparing by name is legitimate in exactly one shape:** resolving input that never had an id to
  offer against — the recipe matcher's fallback for a storage row with no `productId`. Resolution of
  last resort, never identity. It stays a fallback because the field is legitimately absent two ways
  (a row typed straight into the pantry was never a product; rows persisted before it have none),
  which is what keeps the id-based fix migration-free.
- **A slice key is declared once.** It used to be written twice — `key:` in the descriptor and inside
  `createFeatureSelector` — across all eleven contexts, two strings that never had to agree to compile.
  Each slice now exports one `<SLICE>_STATE_KEY` and both sites read it. `router` is the exception: its
  key is an object property in `provideStore` and its selector lives in `household/data`.
- **`Category.id: string` vs a `CategoryId` alias** — cosmetic; the alias is a bare `string`.

## Architecture, reconsidered and rejected again

- **No root-state type.** `IAppState` was deleted and typing the *eager kernel* instead was rejected
  (2026-08-01): nothing that would benefit could import it — selectors and facades are `type:data`,
  which cannot reach the shell, and must not, the shell being the composition root — and nothing would
  keep it true, since `ContextBundle` erases both key and `TState` before `provideAppKernel()` sees it.
  Self-enforcement needs a phantom type threaded through three functions for a five-entry list.
- **"Every context lazy" did not survive contact with the notification inbox.** Routing it forced a
  durable-write port; that port is gone and the inbox is eager again, for the same reason the dashboard
  read-model always was. **Uniform lifecycle was the wrong goal** — the right one is a lifecycle
  matching where a slice is written and read. No *supplier* feature slice is eager.
- **A theme-composed i18n keyspace.** Composing keys from `theme + id` made all 60 invisible to
  `--clean`, and a missing theme could only surface at runtime as a raw key on screen. Declared
  `Record<Theme, …>` fields turn it into a compile error.
- **A CI i18n freshness gate** — the formatting flags removed the need. *One artifact, two writers.*
- **A checked-in release const plus a CI gate asserting it matches `package.json`** — injection through
  esbuild `define` needs no gate, there being nothing to drift.
- **The multi-column list on a wide screen, reverted** (2026-08-04). `item-list` flowed its `ion-list`
  into `repeat(auto-fit, minmax(380px, 1fr))` above a 1024px media query, on the reasoning that a
  desktop viewport should buy *more* rows rather than longer ones. Seen on the tracking list it reads
  as broken, and the cause is not tunable: **rows differ in height** — a running session is three lines
  (name, duration, range), a stopped one is a single line — so `align-items: start` leaves ragged gaps
  under the short rows, nothing lines up across columns, and the tall running row appears to escape the
  grid. Row heights are content, not layout, so no column count or `min` fixes it; a masonry or a
  fixed-height row would, and neither is worth what it costs a touch list. `$list-column-min`, `$wide`
  and the `wide` mixin went with it, `$content-wide` stayed, and `e2e/desktop/list-layout.e2e.ts` now
  asserts the inverse of what it asserted before — no two rows share a line.
- **The list's own header row is the filter caption, and nothing else** (2026-08-04). It carried the
  page's name too, two rows under the `app-page-header` showing the same string, so the label and the
  `listHeader` input are gone from all six call sites. The row still renders — but only when a category
  filter is armed, carrying the caption and the button that clears it. The `[listActions]` slot that
  lived in it is retired: its two users (tracking's day total, shopping's action sheet) moved to
  `[toolbarActionsEnd]`, which the sort row already had, so there is now **one** action slot per side
  rather than two that competed for the same buttons. `i18n:extract --clean` pruned `list-header.tasks`
  and `list-header.tracking`; the `household.list-header.*` family stayed, still naming lists through
  `LIST_NAME_MARKER` and the search-result group headers.
- **`office-time → tracking`** — an early design had office-time read a tracking read-model selector;
  the realized office-time is standalone and only reports telemetry.
- **`@ngrx/component-store` or a `signalStore` for dialog state** — `signal` + `computed` was the whole
  requirement, and no dialog state lives in NgRx.
- **Closing `metric?: string` into a union** — `metricKey` on the entry was preferred, at the cost of
  three repeated `marker(...)` literals.
- **`knip` / `import/no-unused-modules`** — a new dependency and a per-push cost for what WebStorm's
  *Unused global symbol* inspection reports live. `verify:exports` covers the rest.
- **`sonar-project.properties` and `qodana.yaml` are tracked and wired into nothing — do not delete
  them.** The first reviewer to grep for them proposed exactly that. Sonar runs on demand, natively
  rather than containerized (`sonarsource/sonar-scanner-cli` is amd64-only and a container mount breaks
  coverage import). Not to be added to CI without deciding gate semantics: the quality gate asserts
  only on *new* code, so a first analysis passes vacuously.

## Coverage gaps that are decisions

- **Two gestures are deliberately not e2e-covered** — no skipped spec exists to find. The
  `app-date-input` calendar (an `ion-datetime` grid inside a teleported modal) and the cash-rules
  reorder (a mouse-step drag over an `ion-reorder` sharing its row with a swipe handler): the
  Playwright drag would be more fragile than what it proves. Both have unit specs.
- **The remaining Ionic-element locators in `e2e/` are mechanism, not identity** (audited 2026-08-01).
  Correct as they stand: `getByTestId('x').locator('input')` (the inner native input is Ionic's and
  cannot carry an id), `alert(page).locator('button')` with `toHaveCount(1)` (the count **is** the
  assertion), `row.locator('ion-item-sliding')`, `page.locator('ion-popover')` as an overlay scope,
  `ion-menu` as a scope for `menu-row`, `ion-searchbar input`.
- **The update prompt has no e2e** — proving it needs two deployed builds. It ships in the first
  release regardless: a client can only be told about the next version by code already in the version
  it is running.
- **`geist` has no e2e** — the happy path is unreachable from headless Chromium, and the Prompt API is
  desktop-Chrome-only by design (so `unavailable` is a permanent, expected outcome on the APK).
- **The a11y rules carry no unit tests** — a rule set is config. What stands in for them is the finding
  count on the real corpus: turning the set on produced **74 findings in 28 files** where the previous
  gate reported 0. A rule that drops to zero on a corpus still holding violations has gone inert.

## The bank fixtures were real, and are gone from history

Settled 2026-07-30. `docs/cash/example.csv` and `example2.csv` were real giro exports — real IBANs,
real counterparties — purged from all 347 commits that carried them; `docs/cash/*.csv` is now
gitignored. **Timing was the point:** `git ls-remote` still returned zero refs, so the rewrite cost
nothing; one push would have made those blobs public irrevocably. Two things made it clean: no spec
ever read a `.csv` (parser specs carry inline rows), and each parser's header comment already spelled
out its column layout, which is now the cited format source. Two traps a naive purge springs — the
blobs had lived at **two** paths (`docs/example*.csv` before `1e63058`), and the commit that added
them *described* them as "the two real exports", which `filter-branch` leaves untouched without
`--msg-filter`. Verify with `git rev-list --objects --all`, not with a clean working tree.

## Two lessons from fixed defects

The defects are fixed and spec'd — the code is the record. The lessons are not derivable from it:

- **When a reducer rewrites rows a dialog is editing, the dialog is a row too** (see Identity above).
  The sibling *delete* path had it right, and so did the cash picker.
- **A written-down lesson does not apply itself to the code underneath it.** The four office-time stat
  cards froze at the last slice write because `calculateStats` read `dayjs()` inside projectors
  memoized on the slice — three lines below a facade comment documenting that exact trap, which had
  already been fixed for `todayIsOfficeDay`.

## The eight a11y rules stay, and now have a spec each

Settled 2026-08-04. The question put to them was whether ~4,000 lines of enforcement (a 21-rule
plugin plus 1,716 lines of scripts) is gold plating over 37k lines of app in a solo project. Answer:
the *inversion* is not the cost — `grep "new InjectionToken"` returns **four** files, and
`providePersistedContext` is one 90-line factory serving ten call sites, so it removes boilerplate
rather than adding it. The seals and facades stay for the reason they were built: this repo is the
merge of two apps.

What was actually wrong was measurement, not size. `a11y-no-actionable-toast-button` (R6) was **inert**
on the app's only actionable toast, and `a11y-overlay-options-have-name` (R4, controller half) was
blind to the global error handler's alert — both because the receiver regex demanded a suffix the code
had stopped writing. Two rules were considered for deletion and neither was deleted: R6's controller
sibling is the only check on the imperative overlay path, which axe-core structurally cannot see (a
transient overlay is gone before any scan, and axe has no concept of i18n). The fix was one character
class in `overlay-options.ts`, plus `rules/a11y.spec.ts` — 42 RuleTester cases, verified by reverting
the regex and watching exactly the `#toast` and `#alerts` cases go red.

**axe-core was evaluated and not adopted here.** It would cover R1/R2/R3 cleanly and add contrast and
ARIA-relationship classes no rule here touches, so it stays worth ~20 lines of Playwright fixture
someday — but it is a *sample* of what an e2e run happens to render, where ESLint reads every template.
Static and runtime a11y checking are different axes, not substitutes.

The suppression records a real gap rather than a false positive: the undo toast is the only path to
`restoreLastDeleted()`, so a screen-reader user cannot reach it. A persistent restore affordance is
unbuilt; the day it exists, the disable comment goes. It moved on 2026-08-09 out of
`trackplay.effects.ts` and into `notifications-toast.effects.ts`, where the toast is now built — so
it names the *mechanism* rather than one domain: any caller setting `ToastMessage.action` owes a
persistent path to the same action. On 2026-08-09 the household lists became a second such caller
and the count in the comment became "no caller has one" — the toolbar undo button that would clear
it for both at once is the affordance still unbuilt.

## The router is a write API; the store is the read API

Settled 2026-08-06. Four list pages injected `ActivatedRoute` and copied `?filter=<id>` into their
domain's state from `ionViewWillEnter`. The reads now come from `@ngrx/router-store` instead, and the
pages inject nothing about routing at all.

Three things this settled, in order of how easily they are re-litigated:

**`@ngrx/router-store` is read-only, and that is not an oversight.** It reports navigation
(`routerRequestAction` … `routerNavigatedAction`) and reduces it into a slice; dispatching those does
not navigate. NgRx shipped `go`/`back`/`forward` in v3 and **deleted them in v4**, and the migration
guide's answer is to define your own action and an effect that calls `Router`. So "read the router from
the store" and "navigate through the store" are different asks with different answers: the first is a
selector, the second is an effect. `stripCategoryFilterParam$` is that effect, and it is the only
place left that navigates on the filter's behalf.

**The router selector is kernel state, not `household`'s.** It lived in `household/data/` until `tasks`
needed the same query param, at which point Sheriff refused — correctly. It is now
`@shared/data/router/`. The param NAME stays in `@shared/util/` because both sides of the contract are
`data/` (a catalog facade writes it, a selector reads it) and `data → util` is the only edge between
them.

**The route sets the filter; it never clears it.** An absent `?filter=` is not an instruction. Household
persists `filterBy` (it matches the `[Storage]`/`[Shopping]`/`[Products]` save sources), so treating the
URL as the sole truth would wipe a restored filter every time a list was opened without the param.
Clearing is therefore its own action — one `clearCategoryFilter`, reacted to twice: each domain resets
its own `filterBy`, and one shared effect strips the query string. `ListPageComponent` used to do both
halves by hand and had to remember to; it now dispatches once.

The deleted `ionViewWillEnter` hooks were justified in a banner that argued `IonicRouteStrategy` caches
a routed component, so `ngOnInit` fires once while a drill repeats. True, and no longer load-bearing:
the store emits on every navigation regardless of what the component cache did. What replaced the hook
inherited its one real virtue by a different route — see the `routerNavigatedAction` ordering entry in
[footguns.md](footguns.md).

## Navigating: `Router` is the mechanism, and direction is all `NavController` adds

Settled 2026-08-08, when a segment switcher needed a sibling swap not to animate as a push. Four
questions were open at once; they have four different answers.

**`NavController` is not an alternative to `Router` — it is `Router` plus a direction.** Ionic says so
itself, three times, in the docblocks above `navigateForward`/`navigateBack`/`navigateRoot`
(`@ionic/angular/fesm2022/ionic-angular-common.mjs`): *"This method uses Angular's Router under the
hood, it's equivalent to calling `this.router.navigateByUrl()`, but it's explicit about the direction
of the transition."* All it does extra is `setDirection(...)`, which `IonRouterOutlet` consumes to pick
the transition. So injecting `Router` is correct everywhere, and the ~20 places that do are not a
migration backlog.

What makes the direction wrong is worth knowing, because it is a guess: `NavController` subscribes to
`NavigationStart` and infers `back` when `ev.id < lastNavId`, else `forward`. A **sibling** swap is
therefore always guessed `forward` and animates as a page push. That is the one case that needs the
wrapper, and `HouseholdListPageFacade.switchList` is the one place holding it —
`navigateRoot(url, { animated: false, replaceUrl: true })`, so three lists do not become three
back-stack entries. When such a navigation is a link rather than a handler, the declarative equivalent
Ionic names in the same docblocks is `routerLink` + `routerDirection`.

**Navigating is an effect when the *store* decided it, and not otherwise.** The distinction the entry
above already draws for reads applies to writes: `stripCategoryFilterParam$` is state → URL — the store
cleared a filter and the address bar must follow, possibly with no component alive to do it — so an
effect is the only correct home. A gesture that changes no state is not a store concern at all;
routing it through an action and an effect adds a type, an effect and a spec to end up calling the same
`Router` method. That ceremony is precisely what NgRx deleted `go`/`back`/`forward` to avoid.

**Which layer a gesture-navigation lives in is already decided by Sheriff, not by taste.** It looks
like drift — four navigations sit in `data/` facades, ten in `feature/` pages — but the split is exact:
the four are the four a **shared** component triggers. `ListPageComponent` calls
`facade.manageCategories()`, `CategoryListPage` calls `facade.drillTo()` and reads `facade.listHref()`.
`@shared` may not know a domain's routes, so the route has to live behind the facade. The ten are pages
that own their own route and call it from their own template. Nothing to reconcile.

**A controller never appears in a reducer, and none does.** A reducer is `(state, action) => state`,
called synchronously and possibly more than once per dispatch; a `ModalController` there would present
per call and fire again under any replay. Overlays belong in effects, and the shape already exists —
`notifications-toast.effects.ts` holds the only `ToastController` in the app behind `dispatch: false`,
and every other domain reaches it by dispatching `NotificationsActions.toast`.

**Purity is the wider claim, and it was false when first written here.** The sentence this replaces
said every reducer "imports only pure things", on the strength of a grep for `@ionic/angular` and
`@angular/router` imports. That is not what purity means, and the check could not have seen the actual
violation: impurity arrived through a **call into a util**, not an import of a framework. A transitive
audit on 2026-08-08 (reducer → local imports, three levels) found `trackplay` minting inside four
handlers — `createPlayer`, `createGameType`, and `enterGamePage` plus `setRoundValue`, the last two
through the shared `appendBlankRound` → `createRound`. Each read `crypto.randomUUID()` and `Date.now()`
during the reduce step, so the same action replayed produced different state and the persisted log
stopped describing the store it built.

The fix is the idiom `setRoundValue` already used: **a defaulted parameter on the action creator**, so
the clock and the id are read at *dispatch* time and travel in the payload. A default on the *factory*
would let the impurity back in silently, which is how all four sites arose.

**Two of the four then stopped being a question at all** (2026-08-09). Once every collection dispatched
`addItem` with a finished entity, `createPlayer` and `createGameType` moved into the facade beside
`createGame`, and their handlers stopped minting rather than minting from a payload. What is left is
one factory a reducer still reaches — `createRound`, from `appendBlankRound`, from `enterGamePage` and
`setRoundValue` — because *whether to append a round at all* depends on state and cannot be decided at
dispatch time. Only the minting moved: `createRound` takes its `id` as a **required** argument. The
durable lesson is not the defaulted parameter but where the call sits — a factory called from a facade
cannot be impure in a reducer, because it is not in one.

**Nothing gates any of this.** Two greps, kept honest, are the whole check: no `uuidv4(` / `Date.now(`
inside a `*.reducer.ts`, and nothing a handler calls reading either. A file-scoped import ban was
considered and rejected — it keys on a filename (a decaying gate, see
[footguns.md](footguns.md)) and would not have caught the one real violation.

## The migration ladder is live (2026-08-10)

`runMigrations` shipped unused: `APP_VERSION` sat at 1 and no domain passed a `ladder`, so nothing
had ever been migrated on disk. Cash's move onto the shared list stack was its first customer, and
took it to 3 in two rungs — the field renames, then the `ItemList` envelopes.

**One rung per stored-shape change, never one rung per release.** Both changes could have shared a
rung; keeping them apart is what makes each commit independently forward-migratable from whatever a
given install happens to hold. It is the same discipline as an expand/migrate/contract database
rollout: the ladder is only as trustworthy as its smallest step.

`APP_VERSION` is global, and that is not a mistake to fix. A slice with no entry for a hop is walked
past untouched and re-stamped, so the version number is a *floor* on the whole document set rather
than a per-slice counter — one number to reason about, and no way for two slices to disagree about
which hop they are on.

The rung is written against `unknown` and casts once, deliberately: the types it migrates FROM no
longer exist in the codebase, and a typed signature would keep a dead copy of them alive forever.
What holds it honest is `cash.migrations.spec.ts`, which pins each rung against a literal of the old
shape — the only place those shapes still need to be written down.

**A rung is a one-way door on someone's data.** There is no down-ladder and no automatic backup;
`runMigrations` throwing is the only safe failure, and it loads empty rather than half-migrated.

## The ladder was premature — back to v1 until the first release (2026-08-10)

Reverses the entry above, written the same day. `APP_VERSION` returns to 1 and `CASH_LADDER` is
deleted: the rungs migrated *from* shapes that no install has ever held. There are no tags, the
`pages` branch does not exist and the remote has never been pushed — the first push, CI run and tag
all still wait on the keystore ([state.md](./state.md)). A ladder step is only owed to data somebody
else is holding, and nobody is holding any.

The rule this restates, already recorded in [state.md](./state.md): **renaming a persisted key or a
stored shape is free until the first release.** That freedom is the whole reason to keep the pre-1.0
window open, and spending it on a migration nobody needs also spends the credibility of the version
number — a stamp of 3 claims two shape changes survived contact with real installs.

What that leaves is a `runMigrations` that is again shipped and unexercised, which is fine: it is
twenty lines with its own spec, and the first rung after the first tag will be written against a
shape that genuinely exists on somebody's disk. Everything the reverted entry says about *how* to
write one still holds — one rung per stored-shape change, `unknown` in, spec pinning the old literal,
no down-ladder. It was the timing that was wrong, not the design.

**Until the first tag, a stored-shape change means clearing local storage, not adding a rung.** The
dev browser is the only holder, and its contents are disposable by definition.

## Household is the first MVP feature, and what that excludes (2026-08-10)

The deck default now boots a cold install into Shopping, Storage, Products and Settings, which makes
household the release. Four candidates were considered against that scope and **declined**, so none of
them should be re-proposed as work before a tag exists:

- **SOYKAF / recipes are out.** The recipe book is v2 ([state.md](./state.md)) and its deck entry is
  hidden by default. This is what makes the next item decidable at all.
- **The bulk `storage → shopping` sweep stays out**, because the loop already closes by hand: a storage
  row's start-swipe copies it to the shopping list, and `moveToStorage` brings the bought ones back. What
  is missing is only the *automatic* "everything below its minimum", and `minAmount` has never been
  driven against a real pantry — automating a judgement nobody has exercised is how you get a shopping
  list you stop trusting.
- **`bestBefore` stays plain text.** Storage prints the date and can sort by it, but nothing colours or
  warns. The bet is explicit: a pantry you check by hand does not need the app to panic for you, and
  `storageStatusColor` keying on two axes at once would have to rank which one wins.
- **`packaging`, `packagingWeight` and `unit` stay as unread schema.** All three are SOYKAF v2 seed
  ([state.md](./state.md)); `packaging` is hardcoded `'loose'` and never editable, and `unit` is read
  only by the recipe-ingredient factory. Deleting them is free before the first tag and would have to be
  undone at v2, so they keep their place and their silence.

What was NOT declined is the pair of defects the same review found: a page with no entrance, and a
control with no effect. Both are fixed in the commits carrying this entry. The principle they share is
worth stating once, because it is cheaper than either fix: **a control the user can operate must change
something the user can observe, and a page the user can reach must be reachable without a URL bar.**

## A swipe deletes, and does not ask (2026-08-14)

**Row-level destructive actions stay unconfirmed, deliberately.** Every destructive `ion-item-option`
is `expandable`, so a full swipe fires it with no second tap, and that is the intended feel: a list
whose whole job is a pantry or a task pile has to be **as cheap to remove from as to add to**. A
confirm on every row would tax the common case to insure the rare one. This closes the row half of the
"one destructive-action policy" question that [state.md](./state.md) had been deferring on
classification — the classification is *row versus cascade*, and the row is now answered.

What this does **not** settle, because none of it is a swipe:

- **Cascades and bulk wipes.** Deleting a category strips it off every row in three reducers,
  tracking's *Reset all* discards every running timer, and geist's purge fires unannounced on a
  persona switch. A gesture that destroys what the user was not looking at is a different class from
  one aimed at the row under the thumb.
- **Cash still confirms.** Every cash delete routes through `deleteConfirmAlert`, raised from the
  shared `ListItemComponent`. It stays until it is decided on its own terms: the ledger is imported
  bank history, not a shopping list, and re-adding a row by hand is not the same cheap gesture this
  entry is buying elsewhere.

The undo half is unaffected and remains opt-in per list (`undoableDelete` on
`createItemListEffects`): shopping, storage and products offer it, the rest delete silently. Undo is
the recovery mechanism this entry leans on, not a promise every list makes — and **no list should grow
a confirm as a substitute for one.**

## The daily ritual counts up and never resets (2026-08-14)

**There is no streak, and that is the design.** The `ritual` module shows a lifetime completion total
and a seven-day dot row; it will not grow a "3 days in a row" counter that a gap sets back to zero. A
streak's motivational value is asymmetric — it protects an asset for someone already consistent, and
manufactures one to destroy for someone who is not — and the person this module exists for is the
second. The whole point is to rehearse *"I can finish a thing"*; a mechanic whose failure state is a
screen reporting that you didn't would ship the lesson and its rebuttal on the same page. The dot row
is the deliberate substitute: it shows rhythm honestly, a gap costs nothing that existed, and two good
days visibly repair it — recovery a streak counter can never display.

**The completions are an append-only log, never a stored count.** `RitualState.completions` holds
`{ promptId, completedAt }` rows; the total, "is today closed", the dot row and every date statistic
are selectors over them. This is the one-way door: a stored integer would have to be migrated the day
the module wants "how many in July", and a stored-shape change on a shipped build means clearing the
user's data. It is also why a bonus completion is simply another row — the *day* is closed by the
existence of any row dated today, which is a separate question from how many rows there are.

**The reminder is a cron the OS owns, and it will nudge on days already finished.** A daily reminder is
scheduled with `on: { hour, minute }`, never `at` + `every` — Android reads those as alternatives and a
notification scheduled with both fires exactly once and is then silent forever
([footguns.md](./footguns.md)). The cron branch re-arms itself after each delivery, which is the whole
point: the nudge survives an app that is never opened again. The price is that the app cannot suppress
today's occurrence after the user finishes, and **that is the right way to be wrong** — a redundant
nudge costs a glance, whereas a reminder that quietly stopped costs the habit. It is also why the
wording is deliberately neutral ("Wie war dein Tag?"): copy that assumes the task is still undone would
be wrong on exactly the days the user did best.

An earlier design re-armed the schedule forward on completion, using `at` plus a computed next
occurrence. It is recorded here only so it is not reinvented: it depended on `every` beside `at`, which
does not work, and its suppression logic bought a politeness nobody asked for at the cost of the one
property that matters.

**It is `ritual`, not a second page inside `tasks`.** `tasks` means `TaskItem` — a list with
categories, an edit dialog and a sort. A prompt catalog and a completion log share none of that state,
and one word. The rename was cheap before any i18n key shipped and would not be after.

**The prompt catalog lives in the translation bundle, and the draw excludes what was done recently.**
Roughly a hundred prompts cost ~7.5 KB on a 31 KB boot fetch — worth paying, because `i18n:extract`
keeps de/en in lockstep and renders an unfilled key as an empty string, and because a synchronous
catalog is what lets `RitualCatalog` stay a non-empty tuple and the drawn prompt stay non-optional. The
threshold at which that stops being true is around **250 entries**; past it, copy the emoji catalog's
per-language dynamic imports (`emoji.catalog.ts`) and resolve the module at the route so the prompt
does not go optional again.

Catalog *size* is not the answer to repetition — **adjacency is the complaint, not recurrence.** The
same small act returning three weeks later is the habit working; returning tomorrow reads as a broken
draw. So the draw excludes the last twenty distinct completed prompts, bounded by count rather than by
a day window: bonus completions can put five rows on one day, and a thirty-day window would then
exclude more than a hundred-entry catalog holds. The exclusion falls back to the whole catalog when it
would otherwise empty the pool, so a catalog smaller than the window still deals a card.

**A prompt can be dismissed for good, because "simple" is situational.** "Open a window" is trivial in
June and wrong in a January flat with a sleeping baby, and no catalog written by anyone else can know
which. So the modal offers *Not for me*, the id joins a persisted `dismissed` list, and the draw never
deals it again. It is deliberately not a rating, a snooze or a per-day skip: the user is curating a
catalog they did not write, and the only judgement they should have to make is "this one, never".

Dismissal is permanent, one tap from a mis-tap, and invisible afterwards — so it ships with **two** ways
back: an undo toast at the moment it happens, and a counted *Bring back* in ritual settings that
restores everything. The toast alone would not do. `ion-toast` is `role="status"`, so its button is
never announced, which is why `a11y-no-actionable-toast-button` is suppressed at the shared toast
effect with a note that every caller owes a persistent path to the same action. This is the first
caller that has one.

Dismissals join the same exclusion set as recency rather than getting a hard filter of their own. If
someone dismisses enough to empty the pool, the existing fallback deals from the whole catalog again —
quietly undoing dismissals in a state reachable only by dismissing ~98 prompts, which is a better
failure than a page with no card and a type that cannot express one.

Every prompt passes one test: **it cannot be half-done.** "Put one book back" has a moment it is
finished; "tidy the shelf" does not, and a prompt whose end is a judgement call cannot deliver the only
thing this module produces. Doable-in-the-flat and the three-minute ceiling are cheap proxies for that
one property, not independent rules.

## A cold install ships an empty deck (2026-08-14)

The factory default is now every catalog entry hidden — no tiles, no drawer rows, one `@empty` node
pointing at `/commlink/deck`. It replaces the curated four (Shopping, Storage, Products, Settings,
plus `list-settings` without a tile) that the household-MVP entry above describes; everything that
entry settles about **scope** still holds, only its statement of the deck default is superseded.

The curated list was not wrong, it was **unmaintainable in a specific way**: every feature that landed
re-opened the question "does this one belong in the default?" — the question that produced this entry,
asked about `ritual`. That question has no checkable answer, has to be re-argued per feature, and its
cost is paid by whoever adds the next module. Empty is a rule instead of a list. It cannot go stale
when the catalog grows, and it cannot be *wrong* for a given user, because the first thing the app
asks is which programs they want.

**It is legal only because nothing is stranded, and that is the precondition to re-check** before any
future entry claims to be reachable "from the deck". Two entrances are unconditional: the drawer's
`/settings` button is static, outside the `@for` over `menuEntries`, and the grid's `@empty` node
links to the deck config. `list-settings` is the entry that proves the point — it is `onDeck: false`,
so a grid could never have been its way in, and it now depends on the config page like everything
else.

`ritual` therefore ships switched off, like every other program, and needed no catalog change: it was
already `onDeck: true`. **No entry is ever to be added back to the default as a special case** — that
is the list this replaced.

The empty-state copy was rewritten in both themes and both bundles to drop the word "wieder" / "back
on": it now answers a deck that was never filled as well as one the user emptied, because it is the
same state and only one of the two is ever a mistake.

## Toasts get their own colour, and `success` keeps its meaning (2026-08-15)

Every toast defaulted to `success`, one green in both themes, which read as an eyesore against the
deck's amber. The fix is a **new `--ion-color-accent` family, not a recolouring of `success`** —
`success` is also read by `chart-colors.ts`, `_charts.scss`'s `$bar`, `tracking-item.component.scss`
and cash's positive amounts, where green against red **encodes a value's sign**. Repainting it would
flatten that distinction and falsify `variables.scss`'s own banner. Success is untouched; toasts simply
stopped asking for it.

`accent` aliases `success` on plain and `primary` under cyberpunk — the family `ThemeService` writes at
runtime from the user's accent swatch, contrast included — so a toast follows a swatch changed in
settings and no new hex entered the stylesheet. Explicit `color: 'danger'` callers are untouched: a
refusal should not look like the deck.

## The ritual card commits in place, and undo replaces the confirm (2026-08-15)

**The task modal is gone.** Tapping the card used to open a dialog offering *Hab ich gemacht* / *Neu
würfeln* / *Mag ich nicht* / *Später*, and that last button was the tell: a control whose only job was
to unwind the container it lived in. Nobody intends "later" — they mean "I didn't mean to tap that", a
need the modal itself created. It also duplicated its own opener (same eyebrow, same prompt text) and
forced `ritual.card.hint` — "Tippen zum Öffnen" — which explained the mechanism rather than the task. A
modal earns its place with a form, a choice, or a destructive confirm; this one was a copy.

The primary action now sits **inside** the card and the two quiet ones below it, in one wrapper that
carries the leave animation, so the group exits together instead of the card sliding out above two
stranded buttons.

**The modal was silently buying one thing: protection against a mis-tap on an irreversible act.** So
removing it required adding an undo, and `RitualActions.uncompleted` is that trade — the same one
[A swipe deletes, and does not ask](#a-swipe-deletes-and-does-not-ask-2026-08-14) already made, now
applied to the action this module exists to make cheap. **Undo over confirm**, and a confirm is not to
come back as a substitute for one.

The undo matches on the prompt id **and** the stamp, never "the last row": a bonus puts a second
completion on the same day, and the wrong toast must not take back the other one. That is also why
`ritual-dismiss.effects.ts` became `ritual-toast.effects.ts` — it now carries two undos, and a name
saying "dismiss" no longer covered it.

**The completion undo has no persistent path, and that is accepted rather than overlooked.** A
dismissal has two ways back (the toast, and *Zurückholen* in settings) because it is permanent and
invisible afterwards; a completion is visible on the page it happens on, and re-completing is one tap.
It is undoable while the toast is up and final after.

**The card itself must never become a button again.** Its accessible name would be the task text, so
it would announce *"Trink ein großes Glas Wasser, button"* and never say what pressing does — and the
largest target on screen would commit the day.

