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
  remaps rules too). That merge is why `CashCategoryPickerComponent.onRename` follows the survivor: the
  local draft would otherwise re-assert a retired id. **When a reducer rewrites rows a dialog is
  editing, the dialog is a row too** — the open dialog's draft put the retired id back on save.
- **A GUID per row, a natural key per singleton.** Anything existing as a row mints `uuidv4()`. The
  non-GUID identities are natural keys because there the key **is** the thing: the list ids (a route
  param, an effects guard and a persisted-doc discriminator at once), the deck catalog ids,
  `npc-summary-<source>`, and office-time's `officedays`/`freedays`/`holidays`, where minting a GUID
  per logged day would *admit* two rows for one date. Only `holidays` holds that structurally (a
  `Record` keyed by date); the other two are `Array<Dayjs>`, so **`hasDay` in `office-time.reducer.ts`
  is load-bearing** — it is what makes the add actions idempotent. Read it as belt-and-braces and drop
  it, and double-tapping "log today" silently doubles the count.
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
