# Recorded decisions

Settled questions, kept so they are not re-flagged as work. Each is a claim, a verdict, and the
measurement or argument that decided it. Live work is in [open-tasks.md](./open-tasks.md).

## Declined simplifications (2026-08-01 review)

All five read as duplication and are not.

- **The `deck.hud-label` mixin is not adopted at the nine sites that re-type its declarations.** It
  also emits `font-family`, which every one of those sites inherits from its page root — so the
  substitution is behaviour-identical and costs **192 bytes**. Its two declarations are `var()`
  reads, so the flip tokens are already the shared definition.
- **The household `save`/`showEditDialog`/`remove` triples are not collapsed into one route-derived
  method.** Each pairs an item type with the action for _that_ list; a `remove(item)` deriving the
  list from the route softens it to a union, which is the one thing stopping a storage item being
  dispatched at the shopping list. The decision now holds structurally rather than by count: since
  the split each method sits on the facade of the aggregate whose type it takes
  (`ShoppingFacade.removeItem(item: ShoppingItem)`), so the pairing is the file rather than the
  method name, and the eleven no longer sit together to invite the merge.
- **`CashCategoriesPageFacade` does not extend `BaseCategoryListPageFacade`.** Its catalog carries
  its own cascades, so four of nine bodies would be overridden — a base with hooks for one caller.
- **`TrackingListPageFacade` and `TasksListPageFacade` share no base.** Seven one-line dispatches in
  common, against different item types, create-seeds, and categories one has and the other lacks.
- **`@capacitor/app` stays**, though nothing imports it. It is a _native_ plugin: removing it changes
  Android's hardware back button, `android/` is regenerated and untested here, and no gate sees the
  difference. "No import" is not "unused" for a Capacitor plugin (same for `@capacitor/haptics`,
  `@capacitor/keyboard`).

## Findings that were wrong about their own evidence

Kept because the methods that produced them will be used again.

- **"Exports whose only reference is their own spec" listed eleven; four were false.** `ChartColors`
  is an exported function's return type; `MockKernelState` is used twice in its own file (the grep
  filtered out the lines containing `export`, which _were_ the usages); `UNPARSEABLE_DATE` is one of
  three sibling error kinds, two matched externally; `matchesNameExactly`/`matchesId` are spec'd
  directly, a use this project prefers.
- **`tsconfig.json`'s `references` looked like dead weight** — no child sets `composite`, so
  `tsc -p tsconfig.json` answers TS6306. Removing it turned **178** spec files into "not found by the
  project service": the array is what typescript-eslint's `projectService` walks to decide which
  project owns a file. Load-bearing for lint; a new tsconfig must be added to it.
- **Toasts already announce** (2026-07-29). `ion-toast` renders `role="status"` + `aria-atomic="true"`
  + `aria-live="polite"` and flips `revealContentToScreenReader` false→true on present — the trick
  that makes a live region fire. The audit missed it by grepping `src/**/*.html` for `aria-live`: a
  web component's shadow DOM is not in our templates. Raising errors to `assertive` would mean
  replacing `ion-toast` (Ionic hardcodes `polite` in shadow DOM) — declined.

**Pattern, from two of these:** the instrument could not see what it was looking for. Verify a
diagnostic query returns what you think before scoping work off it, and prefer the measurement the
toolchain already produces (a coverage report, `eslint --print-config`, the built component source)
over one improvised with grep.

## Latent capability is not dead code

**The wordclock's four `WordclockSettings` flags are intended variants — do not delete them on
reachability grounds** (settled 2026-07-31, after a `/simplify` sweep deleted them and was reverted).
`showCorners` · `deZwanzigNach` · `deZwanzigVor` · `deDreiviertel` encode real German regional
readings of one dial, plus the corner-dot minute display and the non-corner mode that rounds to the
nearest five-minute step instead of flooring. Every argument for deleting them is true and
insufficient: one writer (a hardcoded literal), no settings surface, no i18n key, the regional arms
exercised only by `wordclock.utils.spec.ts`. That is a _reachability_ argument, and the spec cases
are the **specification** of those readings, not coverage propping up dead code.

**Pattern:** "only its own spec uses it" distinguishes unreachable from unwritten, and only the owner
can say which. Ask before deleting a coherent feature axis; delete freely only where the capability
itself is gone (the empty effects shells, the speculative test-ids).

## The bank fixtures were real, and are gone from history

Settled 2026-07-30. `docs/cash/example.csv` and `example2.csv` were real giro exports — real IBANs,
real counterparties — purged from all 347 commits that carried them; `docs/cash/*.csv` is now
gitignored. **Timing was the point:** `git ls-remote` still returned zero refs, so the rewrite cost
nothing; one push would have made those blobs public irrevocably. Two things made it clean: no spec
ever read a `.csv` (parser specs carry inline rows), and each parser's header comment already spelled
out its column layout, which is now the cited format source. Two traps a naive purge springs — the
blobs had lived at **two** paths (`docs/example*.csv` before `1e63058`), and the commit that added
them _described_ them as "the two real exports", which `filter-branch` leaves untouched without
`--msg-filter`.

**Pattern:** purge the blob and the prose about the blob, and verify with
`git rev-list --objects --all`, not with a clean working tree.

## Facades stay unspec'd

Decided 2026-07-29. Most `<Domain>Facade`s have no spec, and the audit called that the app's untested
seam since NgRx is sealed behind it. A facade method is almost always one line, so a spec over it
catches exactly one class — **mis-wiring** — which splits into an _argument_ mis-wire
(`remove(item.name)` where the reducer wants an id) and a _wrong-action_ dispatch with an identical
payload. Only the first is typeable, and only by branding the id aliases; that was rejected because
branding needs an `as` at every mint point **including every read out of IndexedDB**, adding
unchecked casts at the least trustworthy boundary in an app carrying zero `any` and zero non-null
assertions — and it would not have caught the one time this bug shipped (`8eee87a`, a renamed product
un-cooking its recipes), which compared a real name to a real name by design. Nothing types the
second half at all. Revisit only if a mis-wire actually ships.

**`DeckFacade` is the exception** (20% statements, **0% functions**). Its reads are not delegation:
`configuredEntries` orders the catalog, applies theme labels, then derives `hidden` and
`moduleHidden` from two lists that are **both `string[]`**, so swapping them compiles and silently
breaks the module cascade. It stays unspec'd on the same cost argument, with the risk bounded — the
pure helpers (`commlink/util/deck.utils.ts`), `deck.reducer.ts` and the catalog's key completeness
are each spec'd, and `e2e/commlink/deck-config.e2e.ts` drives the flow. **If any facade ever earns a
spec, it is this one** — a pure `computed` over a mocked store, no component needed.

Note a colocated spec is not what coverage measures: both `@shared/data/persisted-states/*.factory.ts`
have no spec file and sit at 100% statements, exercised through the per-domain effects specs.

## Identity

- **A category name is a label, never an identity — in all three owners.** household, tasks and cash
  hold `{id,name}` catalogs and reference by `CategoryId`; ids are `uuidv4()`, never derived from the
  name. What the name decides is _duplicate_ handling, deliberately: adding an existing name is a
  no-op and renaming **onto** one merges — the loser's id is dropped and its rows remapped
  (`updateListCategory` in `@shared/util/item-lists/list.utils.ts`; `CashActions.updateCategory` in
  `cash.reducer.ts`, which remaps rules too). That merge is why `CashCategoryPickerComponent.onRename`
  follows the survivor: the local draft would otherwise re-assert a retired id.
- **A GUID per row, a natural key per singleton — neither is a gap in the other.** Anything existing
  as a row mints `uuidv4()`. The non-GUID identities are natural keys because there the key **is** the
  thing: the list ids (simultaneously a route param, an effects guard and a persisted-doc
  discriminator), the deck catalog ids (absence-means-default replaces a migration ladder, which is
  why they are never renamed), `npc-summary-<source>`, and office-time's
  `officedays`/`freedays`/`holidays`, where minting a GUID per logged day would _admit_ two rows for
  one date — the invariant those collections exist to hold. Only `holidays` holds it structurally
  (a `Record` keyed by date); `officedays`/`freedays` are `Array<Dayjs>`, so `hasDay` in
  `office-time.reducer.ts` is load-bearing — it is what makes `addOfficeTime`/`addFreeday` idempotent.
  Read it as belt-and-braces and drop it, and double-tapping "log today" silently doubles the count.
- **Comparing by name is legitimate in exactly one shape:** resolving input that never had an id to
  offer against — the recipe matcher's fallback for a storage row with no `productId`
  (`household/util/recipe-match.utils.ts`). Resolution of last resort, never identity.
- **`Category.id: string` vs a `CategoryId` alias** — cosmetic; the alias is a bare `string`.
- **`selectNotificationsUnread`** on the dashboard read-model is the sanctioned shell-badge read; the
  read-model catalogs each domain's source+metric by design.

## Contracts and coverage

- **Two off-contract facade methods** (`addCategory`/`showEditDialog`) stay on the concrete
  household/tasks facades, off the shared `LIST_FACADE` — putting them on it would force `tracking` to
  implement operations it has no concept of.
- **Two gestures are deliberately not e2e-covered** — no skipped spec exists to find. The
  `app-date-input` calendar (an `ion-datetime` grid inside a teleported modal) and the cash-rules
  reorder (a mouse-step drag over an `ion-reorder` sharing its row with a swipe handler): the
  Playwright drag would be more fragile than what it proves. Both are covered by unit specs.
- **The remaining Ionic-element locators in `e2e/` are mechanism, not identity** (audited 2026-08-01
  — the third `data-testid` direction no script can decide). Three were real and got ids; these are
  correct as they stand: `getByTestId('x').locator('input')` (six sites — the inner native `<input>`
  is Ionic's element and cannot carry an id); `alert(page).locator('button')` with `toHaveCount(1)`
  (the count **is** the assertion); `row.locator('ion-item-sliding')` (the swipe target, reached from
  a row already carrying `list-row`); `page.locator('ion-popover')` as an overlay scope (a presented
  popover teleports to the app root — what was wrong there was the translated text inside it, now
  `getByTestId('kebab-edit')`); `ion-menu` as a scope for `menu-row`; `ion-searchbar input`.

## Two patterns from fixed defects

The defects are fixed and spec'd — the code is the record. The lessons are not derivable from it:

- **When a reducer rewrites rows a dialog is editing, the dialog is a row too.** A merging category
  rename remapped stored rows; the open dialog's draft was never told and put the retired id back on
  save. The sibling _delete_ path had it right, and so did the cash picker.
- **A written-down lesson does not apply itself to the code underneath it.** The four office-time
  stat cards froze at the last slice write because `calculateStats` read `dayjs()` inside projectors
  memoized on the slice — three lines below a facade comment documenting that exact trap, which had
  already been fixed for `todayIsOfficeDay`.
