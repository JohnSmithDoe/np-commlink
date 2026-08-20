# Decisions

Settled — do not re-flag as work. **Append; never re-weave.** Live work is in [state.md](./state.md).
No entry cites a commit SHA: a history rewrite invalidates every one. A claim carries its own evidence.

## Declined extractions — read as duplication, are not

- **`deck.hud-label` at its 9 re-typing sites** — it also emits `font-family`, inherited at all nine.
  Behaviour-identical, 192 bytes.
- **household `save`/`showEditDialog`/`remove` triples** — deriving the list from the route softens the
  item type to a union, the one thing stopping a storage item dispatching at the shopping list.
- **`CashCategoriesPageFacade extends BaseCategoryListPageFacade`** — its catalog cascades; 4 of 9
  bodies would be overridden. A base with hooks for one caller.
- **A base for `TrackingListPageFacade` + `TasksListPageFacade`** — 7 one-line dispatches in common,
  against different item types, seeds and categories.
- **A `field-note` read idiom** — presentation is shared (`.sr-field-note`); the error read stays local.
  The asymmetry is deliberate: an empty money box disables save silently (initial state), an empty
  **name** says so (the box was seeded, so blank means cleared).
- **Scoping the list dialogs' field tree to the bound `name`** — `childrenMap` is a `linkedSignal`
  reusing child nodes, `valid()` is memoized, `reduceChildren` short-circuits. The tree **is** the
  write-back channel and `canSave` comes from the schema. Revisit only with a measurement.
- **Specs over facades** — a facade method is one line; a mis-wire is either an argument swap (needs
  branded ids — rejected: an `as` at every mint point *including every IndexedDB read*, in an app with
  zero `any`) or a same-payload wrong dispatch, which nothing types. The exception it was granted —
  `DeckFacade.configuredEntries`, deriving two booleans from two `string[]`, where a swap compiles — died
  with the module axis: one flag cannot be swapped with anything. **No facade currently earns a spec.**
- **`addCategory`/`showEditDialog` onto `LIST_FACADE`** — forces `tracking` to implement operations it
  has no concept of.

## Keep, despite looking unused

- **`@capacitor/app`, `haptics`, `keyboard`** — native plugins; removing `app` changes Android's back
  button, and no gate sees it. "No import" is not "unused" for a Capacitor plugin.
- **`sonar-project.properties`, `qodana.yaml`** — Sonar runs on demand, natively (the CLI image is
  amd64-only; a container mount breaks coverage import). Not for CI without deciding gate semantics: it
  asserts on *new* code only, so a first analysis passes vacuously.
- **The four `WordclockSettings` flags** — intended variants (German regional dial readings, corner-dot
  minutes), deleted once by a `/simplify` sweep and reverted. Spec-only usage is a *reachability*
  argument; the spec cases are the **specification**. Only the owner can tell unreachable from unwritten.
- **`packaging`, `packagingWeight`, `unit`** — unread SOYKAF v2 seed; deleting is free now and undone at v2.

## Identity and keys

- **A category name is a label, never an identity.** Three owners hold `{id,name}` and reference by
  `CategoryId`; ids are `uuidv4()`. The name decides *duplicates* only: adding an existing one is a
  no-op, renaming **onto** one merges.
- **Row remap is shared, rule remap is not.** `dropCategoryRef`/`remapCategoryRef` serve all three
  owners; a cash **rule** keeps a singular `categoryId` because it ASSIGNS a category rather than being
  tagged with one.
- **When a reducer rewrites rows a dialog is editing, the dialog is a row too** — the open draft put a
  retired id back on save. Hence `CashCategoryPickerComponent.onRename` follows the survivor.
- **A GUID per row, a natural key per singleton** — natural only where the key **is** the thing: list
  ids (route param, effects guard and persisted discriminator at once), deck ids,
  `npc-summary-<source>`, office-time's day maps.
- **`officedays`/`freedays` are `Record<DayKey, true>`; `holidays` is keyed by holiday NAME** with
  `Dayjs` values. What stops them being confused is the **value** type — two `Record<string, Dayjs>`
  would have compiled. The shape also carries the one-row-per-day invariant a hand-written guard used
  to, and never covered on the whole-array writes the picker actually uses.
- **`DayKey` is a template-literal type, and does not reopen branded ids** — one mint (`dayjsToString`),
  and the disk read re-mints rather than casting, so junk on disk is normalized instead of trusted.
- **Comparing by name is legitimate in exactly one shape** — the recipe matcher's fallback for a storage
  row with no `productId`. Resolution of last resort, never identity.
- **A slice key is declared once** — `<SLICE>_STATE_KEY`, read by both the descriptor and
  `createFeatureSelector`. `router` is the exception; its selector lives in `@shared/data/router/`.

## Architecture, rejected and re-rejected

- **No root-state type** — selectors and facades are `type:data` and cannot reach the shell, and
  `ContextBundle` erases key and `TState` before `provideAppKernel()` sees it. Self-enforcement needs a
  phantom type through three functions for a five-entry list.
- **"Every context lazy"** — routing the inbox forced a durable-write port. Uniform lifecycle was the
  wrong goal; the right one matches where a slice is written and read. No *supplier* slice is eager.
- **A theme-composed i18n keyspace** — made all 60 keys invisible to `--clean`, and a missing theme
  surfaced only at runtime. Declared `Record<Theme, …>` fields make it a compile error.
- **A CI i18n freshness gate** — the extract flags removed the need. *One artifact, two writers.*
- **A release const + a CI gate matching `package.json`** — esbuild `define` has nothing to drift.
- **`@ngrx/component-store` / `signalStore` for dialog state** — `signal` + `computed` was the whole
  requirement; no dialog state lives in NgRx.
- **Closing `metric?: string` into a union** — `metricKey` preferred, at three repeated `marker(...)`s.
- **`knip` / `import/no-unused-modules`** — a dependency and a per-push cost for what WebStorm reports
  live; `verify:exports` covers the rest.
- **`office-time → tracking`** — the realized office-time is standalone and only reports telemetry.

## Layout and theme

- **The multi-column list above 1024px, reverted.** **Rows differ in height** (a running session is
  three lines, a stopped one is one), so `align-items: start` left ragged gaps and the tall row appeared
  to escape the grid. Row heights are content, not layout: no column count fixes it, and masonry or
  fixed-height rows are not worth what they cost a touch list. `e2e/desktop/list-layout.e2e.ts` asserts
  no two rows share a line.
- **The list's own header row is the filter caption and nothing else** — it used to repeat the page name
  two rows under `app-page-header`, and renders now only when a filter is armed. `[listActions]` is
  retired into `[toolbarActionsEnd]`: one action slot per side, not two competing for the same buttons.
- **One ladder, three axes: φⁿ anchored at `1rem`.** Bare, the rungs are proportion (`$gc-*`); ×`1rem`
  the `--space-*` rhythm; ×`--fs-body` the display end of the type scale. The anchor is the argument —
  `1rem` is Ionic's `--ion-padding`, the one spacing number it ships. Ionic has no type or spacing
  scale, which is why `--fs-*` and `--space-*` exist at all.
- **A fully golden system was declined** — φ cannot tile, so it never divides a container into countable
  parts summing to a whole. Corollary: the ladder cannot hold both `0.5rem` and `1rem` (2 is not a power
  of φ). **The type scale is golden above body and hand-set below** — the small end answers legibility
  floors, AA contrast and 44px targets, and a ratio must yield to a hard minimum.
- **Van de Graaf declined as a literal canon** (a *spread* canon: needs a gutter, recto/verso and a known
  page height, and its margins are book-generous against Ionic's 16px). **Open Props declined** —
  Ionic-safe, measured, but a dependency for a seven-line ladder, and only 95 of 166 spacing literals
  have a rung in it. **The ladder is not defended on aesthetics research and must not be** — the
  golden-preference evidence is weak. Seven rungs beat twenty-one ad-hoc values whatever ratio makes them.
- **Toasts get `--ion-color-accent`, not a recoloured `success`.** `success` is also read by
  `chart-colors.ts`, `_charts.scss`, `tracking-item.component.scss` and cash's amounts, where
  green-against-red **encodes a value's sign**. `accent` aliases `success` on plain and `primary` under
  cyberpunk, so a toast follows the user's swatch and no new hex entered the stylesheet. Explicit
  `color: 'danger'` is untouched: a refusal should not look like the deck.

## Router and navigation

- **The router is a write API; the store is the read API.** List pages no longer copy `?filter=<id>` out
  of `ActivatedRoute` in `ionViewWillEnter`; reads come from `@ngrx/router-store`.
- **`@ngrx/router-store` is read-only by design** — dispatching its actions does not navigate. NgRx
  shipped `go`/`back`/`forward` in v3 and **deleted them in v4**. Reading the router is a selector;
  navigating is an effect.
- **The router selector is kernel state** — it lived in `household/data/` until `tasks` needed it and
  Sheriff refused, correctly. The param NAME stays in `@shared/util/`: both sides are `data/`, and
  `data → util` is the only edge between them.
- **The route sets the filter; it never clears it.** An absent `?filter=` is not an instruction, and
  household persists `filterBy`. Clearing is its own action, reacted to twice: each domain resets its
  own `filterBy`, one shared effect strips the query string.
- **`NavController` is `Router` plus a direction** — all it adds is `setDirection(...)`. Injecting
  `Router` is correct everywhere; the ~20 places that do are not a backlog.
- **Direction is a guess, and a sibling swap guesses wrong** (`back` inferred from `ev.id < lastNavId`),
  so it animates as a push. `HouseholdListPageFacade.switchList` is the one holder:
  `navigateRoot(url, { animated: false, replaceUrl: true })`, so three lists are not three back-stack
  entries. Declaratively: `routerLink` + `routerDirection`.
- **Navigating is an effect when the *store* decided it, and not otherwise.** State → URL needs one,
  possibly with no component alive. A gesture that changes no state is not a store concern; routing it
  through an action and an effect adds a type, an effect and a spec to call the same `Router` method.
- **Which layer a gesture-navigation lives in is decided by Sheriff, not taste** — the four in `data/`
  facades are the four a **shared** component triggers (`@shared` may not know a domain's routes); the
  ten in `feature/` pages own their own route.
- **A controller never appears in a reducer** — a reducer runs synchronously and possibly twice per
  dispatch, so a `ModalController` there presents per call and re-fires on replay.
  `notifications-toast.effects.ts` holds the only `ToastController`, behind `dispatch: false`.

## Reducer purity

- **Impurity arrives through a call into a util, not an import of a framework.** A grep for framework
  imports "proved" purity and could not see the real violation: four `trackplay` handlers read
  `crypto.randomUUID()` and `Date.now()` during the reduce step, so a replayed action produced different
  state and the persisted log stopped describing the store it built.
- **The fix is a defaulted parameter on the action *creator*** — clock and id read at dispatch time. A
  default on the *factory* lets the impurity back in silently, which is how all four sites arose.
- **Better: move the factory out of the reducer.** `createPlayer`/`createGameType` now sit in the facade.
  What remains is `createRound` via `appendBlankRound` — *whether* to append depends on state — and it
  takes its `id` as a **required** argument.
- **Nothing gates this.** Two greps: no `uuidv4(` / `Date.now(` in a `*.reducer.ts`, and nothing a
  handler calls reading either. A file-scoped import ban was rejected — it keys on a filename (a decaying
  gate, [footguns.md](./footguns.md)) and would not have caught the real violation.

## Persistence and the migration ladder

- **`APP_VERSION` is 1 and no domain passes a `ladder`.** A cash ladder was written and reverted the same
  day: its rungs migrated *from* shapes no install has ever held. A rung is owed only to data somebody
  else is holding.
- **Until the first tag, a stored-shape change means clearing local storage, not adding a rung** — the dev
  browser is the only holder. Renaming a persisted key is free in the same window; `groceries → household`
  knowingly abandoned `npc-groceries` and a persisted `AppModule` member on that basis. **After the first
  release this stops being free.**
- **When the first real rung is written:** one rung per stored-shape change, never one per release (the
  ladder is only as trustworthy as its smallest step); written against `unknown` and casting once,
  because the types it migrates FROM no longer exist and a typed signature keeps a dead copy alive
  forever; pinned by a spec against a literal of the old shape.
- **`APP_VERSION` is global on purpose** — a slice with no entry for a hop is walked past and re-stamped,
  so the number is a *floor* on the whole document set and two slices cannot disagree about which hop
  they are on.
- **A rung is a one-way door on someone's data** — no down-ladder, no backup. `runMigrations` throwing is
  the only safe failure: it loads empty rather than half-migrated.
- **The release did not freeze every slice — it froze the slices somebody is running.** "A rung is owed
  only to data somebody else is holding" outlived the tag: most of the app has no users, so most stored
  shapes still change for the price of a cleared browser. Which slices those are is a fact about people
  rather than about code, so it is **asked, never inferred**, and the roster lives in
  [CLAUDE.md](../CLAUDE.md) where a changing fact belongs — not restated here, where it would rot.

## Scope and defaults

- **A cold install ships an empty deck** — every catalog entry hidden, one `@empty` node pointing at
  `/commlink/deck`. The curated four it replaced were not wrong, they were unmaintainable in a specific
  way: every new feature re-opened "does this one belong in the default?", a question with no checkable
  answer, paid for by whoever adds the next module. Empty is a rule instead of a list. **No entry is ever
  added back as a special case.**
- **Legal only because nothing is stranded — re-check before any entry claims to be reachable "from the
  deck".** Two unconditional entrances: the drawer's static `/settings` button (outside the `@for`) and
  the grid's `@empty` link. An `onDeck: false` entry is why they are needed — a grid was never its way in.
- **One switch per program, and no module axis at all.** A module toggle gated the same visibility a
  program toggle already gated, so two controls answered one question and a hidden module had to disable
  its children's toggles to stay coherent. The module survives as a **label on the program row** — dim
  eyebrow under the page title — and only where it names a group: `groupingModules` gives it to the
  modules the catalog uses more than once, because on a module of one it repeats the row's own title.
  `hiddenModules` leaving `DeckState` is owed no rung, and `deck` **is** a slice real users hold: the
  leftover key is read by nothing, and the one behaviour it could still carry — a module switched off —
  resolves to those programs appearing again, which is the change asking for itself.
- **Household is the first MVP feature.** Declined against that scope, not to be re-proposed before a tag:
  - **SOYKAF / recipes are v2** ([state.md](./state.md)); the deck entry is hidden by default.
  - **The bulk `storage → shopping` sweep** — the loop closes by hand already (start-swipe copies a row to
    shopping, `moveToStorage` brings bought ones back). Missing is only the *automatic* "everything below
    its minimum", and `minAmount` has never been driven against a real pantry. Automating an unexercised
    judgement is how you get a list you stop trusting.
  - **`bestBefore` stays plain text** — printed and sortable, never coloured. `storageStatusColor` on two
    axes would have to rank which one wins.
- **A control the user can operate must change something the user can observe, and a page the user can
  reach must be reachable without a URL bar.**
- **The flags page is not a deck program.** `list-settings` left `DECK_CATALOG` entirely: it configures
  the three household lists and nothing else, so its entrance is their toolbar
  (`app-household-list-settings-button`, beside the categories button). A drawer row was a second,
  weaker answer to a question the toolbar answers better — and one a hidden program could switch off,
  leaving a page reachable only by URL. A stale id in a stored `hiddenEntries` is inert, since
  `visibleEntries` reads the catalog rather than the config, so no rung is owed; the one visible effect
  is that an untouched deck no longer compares equal to the factory one.

## Destructive actions

- **A swipe deletes and does not ask.** Every destructive `ion-item-option` is `expandable`. A list whose
  job is a pantry or a task pile must be as cheap to remove from as to add to; a confirm on every row
  taxes the common case to insure the rare one.
- **Undo over confirm, and a confirm is not to come back as a substitute for one.** Undo is opt-in per
  list (`undoableDelete` on `createItemListEffects`).
- **Not settled by the above** (none is a swipe): cascades and bulk wipes — a category delete strips three
  reducers, tracking's *Reset all* discards every running timer, geist's purge fires unannounced on a
  persona switch. Destroying what the user was not looking at is a different class.
- **Cash still confirms** via `deleteConfirmAlert` — the ledger is imported bank history, and re-adding a
  row by hand is not the cheap gesture this policy buys elsewhere.

## Ritual

- **There is no streak.** A lifetime total and a seven-day dot row; no counter a gap sets to zero. A
  streak protects an asset for someone already consistent and manufactures one to destroy for someone who
  is not — and the second is who this is for. The dot row shows rhythm honestly: a gap costs nothing that
  existed, and two good days visibly repair it.
- **Completions are an append-only log, never a stored count** — `{ promptId, completedAt }` rows; the
  total, "is today closed" and every date statistic are selectors. A bonus completion is just another row,
  and the *day* is closed by any row dated today.
- **The reminder is a cron the OS owns and will nudge on days already finished.** `on: { hour, minute }`,
  never `at` + `every` ([footguns.md](./footguns.md)); the cron branch re-arms itself, so the nudge
  survives an app never opened again. Today's occurrence therefore cannot be suppressed — the right way to
  be wrong, since a redundant nudge costs a glance and a reminder that quietly stopped costs the habit.
  Hence neutral wording: copy assuming the task is undone would be wrong on the days the user did best.
- **It is `ritual`, not a page inside `tasks`** — `tasks` means `TaskItem`, with categories, an edit
  dialog and a sort. A prompt catalog and a completion log share none of that state.
- **The catalog lives in the translation bundle** — ~100 prompts, ~7.5 KB on a 31 KB boot fetch, keeping
  de/en in lockstep and letting `RitualCatalog` stay a non-empty tuple. **Past ~250 entries**, copy the
  emoji catalog's per-language dynamic imports and resolve at the route.
- **Adjacency is the complaint, not recurrence** — the draw excludes the last twenty *distinct* completed
  prompts, bounded by count rather than a day window (bonus completions put five rows on one day). It
  falls back to the whole catalog when the pool would empty.
- **A prompt can be dismissed for good** — "open a window" is trivial in June and wrong in a January flat
  with a sleeping baby. *Not for me* is deliberately not a rating, a snooze or a per-day skip. It ships
  with two ways back (an undo toast, and a counted *Bring back* in settings) because `ion-toast` is
  `role="status"` and its button is never announced. Dismissals join the recency exclusion set rather than
  a hard filter, so emptying the pool falls back to the whole catalog.
- **Every prompt passes one test: it cannot be half-done.** "Put one book back" has a moment it is
  finished; "tidy the shelf" does not. The three-minute ceiling is a proxy for that property, not a rule.
- **The card commits in place; the task modal is gone.** Its *Später* button was the tell — a control
  whose only job was to unwind the container it lived in, answering a need the modal created. A modal
  earns its place with a form, a choice, or a destructive confirm.
- **Removing the modal required adding an undo** — it was silently buying protection against a mis-tap on
  an irreversible act. `RitualActions.uncompleted` matches prompt id **and** stamp, never "the last row":
  a bonus puts two completions on one day. It has no persistent path, and that is accepted — a completion
  is visible on the page it happens on and re-completing is one tap, unlike a dismissal.
- **The card must never become a button** — its accessible name would be the task text, so it would
  announce *"…, button"* without saying what pressing does, and the largest target on screen would commit
  the day.

## Accessibility

- **The eight `commlink/a11y-*` rules stay.** Put to the gold-plating test: `grep "new InjectionToken"`
  returns four files and `providePersistedContext` is one factory serving ten call sites, so the inversion
  removes boilerplate rather than adding it. The seals and facades stay for the reason they were built —
  this repo is the merge of two apps.
- **What was wrong was measurement, not size.** R6 was inert on the app's only actionable toast and R4's
  controller half was blind to the global error handler's alert, both because the receiver regex demanded
  a suffix the code had stopped writing. Fixed by one character class plus 42 RuleTester cases, verified
  by reverting the regex and watching exactly those cases go red.
- **axe-core evaluated, not adopted** — it would cover R1/R2/R3 and add contrast classes no rule here
  touches (worth ~20 lines of fixture someday), but it samples what a run happens to render where ESLint
  reads every template. Different axes, not substitutes — and it structurally cannot see the imperative
  overlay path, which is why neither rule considered for deletion was deleted.
- **The one suppression records a real gap.** `a11y-no-actionable-toast-button` is disabled at
  `notifications-toast.effects.ts`, naming the *mechanism*: any caller setting `ToastMessage.action` owes a
  persistent path to the same action. Two callers have none.
- **Toasts already announce** — `ion-toast` renders `role="status"` + `aria-live="polite"`. An audit missed
  it by grepping `src/**/*.html`; a web component's shadow DOM is not in our templates. Raising errors to
  `assertive` would mean replacing `ion-toast` — declined.

## Coverage gaps that are decisions

- **Two gestures are deliberately not e2e-covered** — the `app-date-input` calendar and the cash-rules
  reorder. The Playwright drag would be more fragile than what it proves; both have unit specs.
- **The remaining Ionic-element locators in `e2e/` are mechanism, not identity** —
  `getByTestId('x').locator('input')`, `alert(page).locator('button')` with `toHaveCount(1)` (the count
  **is** the assertion), `row.locator('ion-item-sliding')`, `ion-popover` and `ion-menu` as scopes,
  `ion-searchbar input`.
- **The update prompt has no e2e** — proving it needs two deployed builds, and it ships in the first
  release regardless: a client is only told about the next version by code already in the one it runs.
- **`geist` has no e2e** — the happy path is unreachable from headless Chromium, and the Prompt API is
  desktop-Chrome-only, so `unavailable` is permanent on the APK.
- **The a11y rules carry no tests beyond RuleTester** — a rule set is config. What stands in is the finding
  count on the real corpus: 74 findings in 28 files where the previous gate reported 0.

## Findings that were wrong about their own evidence

- **"Exports whose only reference is their own spec" listed eleven; four were false** — the grep filtered
  out the lines containing `export`, which *were* the usages.
- **`tsconfig.json`'s `references` is load-bearing for lint.** It looks like dead weight (no child sets
  `composite`, so `tsc -p tsconfig.json` answers TS6306), but removing it turned 178 spec files into "not
  found by the project service": the array is what typescript-eslint's `projectService` walks. **A new
  tsconfig must be added to it.**
- **A spec may read an internal — its own file's.** `verify:exports` allows a sibling `*.spec.ts` reader.
  A spec in a **different** directory reaching for an internal is a finding: move the assertion beside its
  subject, never widen the export.
- **A written-down lesson does not apply itself to the code underneath it.** The office-time stat cards
  froze because `calculateStats` read `dayjs()` inside projectors memoized on the slice — three lines
  below a facade comment documenting that exact trap.
- **The cash import CSVs were real giro exports and are gitignored.** Purged from history before the first
  push, which is what made it free. Two traps a naive purge springs: the blobs had lived at two paths, and
  the commit message *described* them (`filter-branch` leaves it without `--msg-filter`). Verify with
  `git rev-list --objects --all`, not a clean tree. No spec reads a `.csv` — each parser's header comment
  is the format source.

## The native project

- **`android/` is committed, and that reverses an earlier call.** It was git-ignored on the reasoning that
  `cap add android` regenerates it. It does not regenerate it *identically*: a newer `@capacitor/cli`
  scaffolds a different tree, and `android-postsync.sh` only pins the values it was told about — wrapper
  version, AGP, `variables.gradle` SDK levels and manifest defaults all drift silently between machines.
  Committing turns that into a reviewable diff. 53 files, 0.3 MB; the 240 MB is the apps build and `.gradle`,
  both excluded by the `android/.gitignore` Capacitor ships **because it expects the project to be
  versioned**.
- **`android-postsync.sh` stays, and its patches split in two.** 4 (versionName/versionCode from
  `package.json`) and 5 (the signing hook) are *derived per build* and must keep running; both are
  idempotent, so between version bumps they leave no diff. 1, 2, 3 and 6 are now also committed file
  state — kept because they cost nothing and keep a from-scratch `cap add` correct.
- **`.gitattributes` exists only for the Gradle wrapper.** `gradlew.bat` is parsed line by line by
  `cmd.exe` and needs CRLF; git normalises to LF on check-in, which would break the Windows half of a
  wrapper whose whole point is that it works everywhere.
- **The launcher label is `appName` in `capacitor.config.ts`, applied by postsync patch 6.** Capacitor
  writes it into `strings.xml` when it *scaffolds* and never again, so editing the config alone does not
  reach an existing `android/`. It is cosmetic — identity is `applicationId` + signature — so it is free
  to change across releases. `np-` is deliberate: it groups the author's apps in an app drawer.

## CI and deployment

- **No Codeberg fallback workflow is kept.** The Forgejo file was deleted rather than parked beside the
  GitHub one. It had never executed on any runner, so every constraint it encoded was reasoned rather than
  observed, and nothing in the repo can gate a workflow file — it would have rotted while reading as
  insurance. `git show` recovers it, and it would need testing at that point regardless.
- **CI is one serial job, and that is not a capacity concession.** `lefthook`'s pre-push runs the same
  suite, so nothing in CI is on anyone's critical path. Fanning out would buy wall-clock nobody waits on
  and cost a `pnpm install` per job plus an artifact hand-off at the deploy.
- **Pages deploys through the artifact API, not a `pages` branch.** `upload-pages-artifact` →
  `deploy-pages`, authenticated by a short-lived OIDC token, so no long-lived repo-write credential
  exists. `deploy` is a *separate* job only because `environment:` fails a job outright on a ref the
  environment does not permit, and a `pull_request` ref never is.
- **`actions/configure-pages` is deliberately absent.** It injects a base path, which this repo pins in
  `package.json`'s `build:pages` and asserts in `scripts/check-pages-build.mjs` — a third writer for a
  constant that is deliberately duplicated *and gated* would be the regression, not the duplication.
- **The release shape is asserted in shell, not in `on.push.tags`.** GitHub's glob dialect could express
  `v[0-9]+.[0-9]+.[0-9]+`, but putting it in the trigger would stop pre-release tags from being *verified*.
  The trigger is `v*` and the publish decision is a job output.
- **The signing key does not go into GitHub secrets, and CI builds no APK.** Weighed and declined: it
  would have saved three minutes a few times a year against a credential that *cannot be rotated* — a
  leak has no recovery story except abandoning the app identity and asking every user to uninstall,
  which takes their data. The exposure is also wider than "someone steals the repo": anyone with write
  access, any later workflow edit, and every third-party action sharing the job (`checkout`,
  `setup-node`, `cache`) would run beside it. The general shape is **automate up to the trust boundary
  and stop** — the same instinct that put Pages on a short-lived OIDC token instead of a PAT.
- **So the release is drafted by CI and published by hand.** The `release` job takes it as far as a
  runner can without the key — tag, title, install and verify notes — and the two assets are attached
  in the web UI. Draft rather than published is what makes a re-run harmless: the job re-asserts
  `--draft`, so a retry can never publish a release with no APK on it.
- **No script wraps that upload.** A `gh release upload` wrapper was written and deleted: `gh` is not
  installed here and is not wanted, so the script would have been a file that reads like the supported
  path while failing on its first line — the same reason no Codeberg fallback workflow is kept. Two
  files dragged into a draft, a few times a year, needs no abstraction.
- **`contents: write` lives only in that job.** Nothing else in the workflow can alter the repository,
  and it needs no checkout — `gh` addresses the repo through `GH_REPO`.
- **The tag must equal `package.json`'s version, and CI fails the run if it does not.** Nothing
  downstream reads the tag: `versionName`/`versionCode` come from `package.json` (postsync patch 4)
  and `NPC_RELEASE` from `$npm_package_version`. A tag running ahead would publish `v1.0.1` carrying
  `versionCode 10000`, which Android rejects as a downgrade — the only way in being an uninstall that
  takes every tracked session, the pantry and the ledger. Invisible at build time, so it is a gate.
- **The digest stays a printed line, not a second release asset.** A `.sha256` sidecar was written and
  reverted: it would be published by the same hand that published the APK, so it proves only "this is
  the file that was uploaded" — which the signature already proves, and proves better, against a
  fingerprint pinned once in the README rather than re-published each release. `collect-apk.sh` prints
  the digest, it is pasted into the notes, and the check that carries the weight is `apksigner`.

- **Bank statements are imported as camt, and only as camt.** The per-bank CSV parsers are gone —
  `volksbank.parser.ts`, `dkb.parser.ts`, the registry that chose between them, and the `Bank` field on
  the account that selected one. A CSV export is a positional format whose column order is the bank's
  private business: Volksbank's real download is 18 columns with `Buchungstag` at index 4, and the
  parser written against a 10-column sample found no header, returned zero rows and reported zero
  rejected — a silent empty import with nothing on screen to explain it. camt states what a CSV makes
  you guess. The namespace names the schema, `<Acct>` names the account, `CdtDbtInd` carries the sign,
  and amounts and dates are already machine-readable, so ONE parser serves every bank that emits one.
  The general shape is **prefer a self-describing payload over out-of-band configuration** — the same
  reason a `Content-Type` beats a client and server that merely agreed offline.
- **Every parsed row carries an `importKey`, so there is one key space and no branch.** `AcctSvcrRef`
  identifies a row exactly, but the schema permits a bank to omit it, and a key that is *sometimes*
  present forces every consumer to hold two notions of duplicate at once. `readStatement` therefore
  closes the gap before anything downstream sees a row: `camt|<ref>` where the statement carries one,
  `derived|<date>|<cents>|<text>|<n>` where it does not. The prefixes cannot collide, and `planImport`
  collapsed to a single `Set` as a result.
- **`AcctSvcrRef` is ASSUMED to be intrinsic to the entry, and that assumption is load-bearing.**
  Volksbank's looks like `2026043042104045000` — nineteen digits opening with the booking date. Two
  readings fit one sample: a booking timestamp plus a counter, which is stable across exports, or a
  sequence assigned when the *file* was generated, which is not. The second would make every re-import
  duplicate the whole statement, so the design rests on the first. **Falsifying it costs two minutes:**
  export one date range twice and diff the references. If they differ, the derived key has to become
  primary and the reference demoted to a tiebreaker.
- **Both kinds of key open with `YYYYMMDD`, and the resemblance stops there.** A reference is used
  verbatim, so it keeps the date the bank put at its front; a derived key is given the same compact date
  first, so a ledger's keys sort and read alike whichever kind a row got. Going further — matching the
  length and the all-digit charset too — would manufacture the one collision the two shapes exist to
  prevent. Instead a derived key carries four `|`-delimited segments, which no plausible reference has,
  and that holds without assuming anything about what charset or length a bank picks.
- **The derived key counts occurrences, and counts them after the pages are joined.** Two €4.20
  coffees on one Tuesday are `…|1` and `…|2`, not one coffee counted once — the collapse the old
  natural key caused. The numbering is stable across exports because both rows share a date, so no
  range can contain one without the other and both number the same way. Counting per document instead
  would restart at `1` wherever a pagination boundary happened to fall between them.
- **`importKey` stays optional on `CashTransaction` itself.** Every IMPORTED row has one; a manually
  typed row has no import identity to record. Expressing "required only when `source` is `imported`"
  needs a split union that eleven unrelated call sites would have to narrow, for a fact the import
  path already guarantees at the only place it matters.
- **The parser reads `<Ntry>`, never `<TxDtls>`.** A collective booking is one entry holding many
  details, and the balance moves once. Everything matches on `localName`: versions disagree on the
  namespace URI, on whether `<Sts>` holds a code or wraps one, and on whether a party sits under
  `<Pty>`, and pinning any of it rejects half the exports in the wild. camt.053 parses as a
  consequence, not as a feature — `BkToCstmrStmt` differs from `BkToCstmrAcctRpt` only above the part
  this reads.
- **The account carries an IBAN, and adopts it rather than demanding it.** It is what makes "you just
  imported the savings statement into the giro" answerable instead of merely regrettable. An empty
  field takes the IBAN of the first statement it accepts, and a filled one that disagrees refuses the
  import; asking someone to copy twenty digits correctly before their first import is a worse guard
  than no guard. A pick that mixes two accounts is refused on the same test, with nothing to compare to.
- **`fflate` is imported dynamically, inside the unzip branch.** A paginated export arrives as a zip;
  a single-page one does not, and the file picker takes several files, so the archive is a convenience
  and not the only path. It is the one import path that needs inflate, and the bundle should not carry
  it for the case that never happens. A zip is recognised by its magic bytes rather than its
  extension, so an archive a download manager renamed still opens.
- **The stored shape changed without a rung, and `APP_VERSION` stays 1.** Dropping `bank` and adding
  `iban` and `bankRef` is exactly what the ladder exists for, but the cash feature has no users yet:
  there is no v1 data anywhere that a step could migrate. A stale `bank` key left in a dev browser is
  read by nothing. The ladder therefore remains unexercised, and the next stored-shape change made
  after cash has real data still owes it a first real step.
