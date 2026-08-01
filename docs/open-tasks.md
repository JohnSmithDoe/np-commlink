# Open, deferred, blocked — and what was decided not to build

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §12 the live backlog — blocked on a secret/artwork/upstream, deferred on a decision,
> SOYKAF v2, and the **recorded decisions kept here so they are not re-flagged as work** — plus
> §13 things considered and deliberately not built. **Check §12 before proposing work**; most of
> what looks undone is blocked or declined on purpose.

## 12. Open, deferred and blocked

**Almost nothing below is merely undone.** Every item in the first four groups needs something the
repository cannot supply on its own: a secret, artwork, an upstream release, a human reading the
result, or a product decision. The exception is the last group, _Measured gaps_ — three findings from
a whole-app audit (2026-07-29) that are plain work with nothing blocking them, recorded here so they
stop being rediscovered.

### Blocked — needs something only the owner can supply

- **Nothing has ever been published — and the first push waits on the keystore.** `git ls-remote
  origin` returns **zero refs** and there are no tags, so `.forgejo/workflows/ci.yml` has never
  executed and the Pages URL in the README serves nothing. Earlier text here read "the PWA half
  ships on a `vX.Y.Z` tag already"; that described the *capability*, never an event. The owner's
  decision (2026-07-29) is that **web and APK ship together**, so the first push, the first CI run
  and the first tag all wait on the keystore below rather than shipping the PWA alone. Everything
  the release needs is in place and verified locally; two prerequisites live in the repo settings
  (Actions under _Units_, the Forgejo `pages` webhook) and must be done before the first tag.
- **APK signing.** The debug APK builds (verified on SDK 36 / JDK 21); `apk:release` produces
  `app-release-unsigned.apk` because no `signingConfig` is wired. Wiring one needs a keystore + its
  passwords — secrets, so a decision rather than a default. It now gates **both** targets, since web
  and APK ship together. Note the signing key is a one-way door of its own: an APK signed with a
  different key can never upgrade one signed with the old key, at any version.
- ~~**Shadowrun PWA icons.**~~ **Not a task — the claim was wrong.** `public/icons/*` were never the
  timetracker placeholders: all 8 sizes carry the np mark (a circuit-tree `n` beside a solid `p`, blue
  on a dark rounded square), landed in `8601ac3`. `public/np-logo.svg` and the boot splash now render
  a monochrome vector reconstruction of it (§8, §11). What _is_ still open is smaller: the icons are
  declared `"purpose": "maskable any"` for every size, and one bitmap serving both purposes means the
  maskable safe-zone padding is wasted in the `any` context — worth splitting only if the home-screen
  crop ever looks wrong on a real device.
- **A DKB import driven live.** The DKB parser is unit-tested (`dkb.parser.spec.ts`, inline rows
  carrying the column layout its header comment at `dkb.parser.ts:13` documents), but only
  Volksbank has been driven end-to-end in-app. Needs a real DKB export on a device.
- **`en.json` read by a human.** Both bundles hold the same 592 keys and only 75 values are
  identical, so the great majority are real translations — but nothing could render them until the
  language switch shipped. The first English session is also the first proofread. (Recount before
  citing: this said 582/74 for a while after the bundles had grown.)

### Waiting on upstream

- **Angular 22 — gated on NgRx.** Angular `22.0.8` is `latest` (2026-07-22); we are on `21.2.18`,
  the `v21-lts` line, so this is _not_ an unsupported version and there is no urgency. **The gate is
  `@ngrx/*`:** `latest` is still `21.1.1` with peer `@angular/core: ^21.0.0`, and `next` is only
  `22.0.0-beta.0`. NgRx is the spine here — a `data/` layer in every domain plus
  `@shared`, and the persistence and list-flow effects are _builders_ every context instantiates — so
  forcing it would mean pnpm overrides on an untested combination. **Bump when `@ngrx/*@22` is stable.**
  - **Lockstep set — one atomic commit or none:** `@angular/*` + `@angular/cli` + `@angular/build` +
    `angular-eslint` (22.1.0 peers `@angular/cli >=22 <23`, so it cannot move early) + `@ngrx/*`.
    Their peer ranges are mutually exclusive across the v21/v22 boundary.
  - **Already compatible, no action:** `@ionic/angular` 8.8.x, `@ionic/storage-angular`, `ng2-charts`
    9, `@ngx-translate/*` 18, Sheriff.
  - Run it as `ng update @angular/core@22 @angular/cli@22` (tested schematics) against
    `angular.dev/update-guide` 21→22; do not hand-edit `package.json`. Bump alone, as its own commit
    — a framework major on top of other changes makes a red gate unattributable.
  - **pnpm holds back releases that are hours old, and it looks exactly like a stuck resolver.**
    pnpm 11.9 applies a default `minimumReleaseAge` cooling-off (nothing sets it in
    `pnpm-workspace.yaml`, so this is the built-in), and a `pnpm update` will silently decline a
    version its range permits because it is too new — measured 2026-07-30: `@angular/core@21.2.19`,
    published 17.4 h earlier, was withheld while `@angular/cli@21.2.19` (published three weeks
    earlier, same version number) installed fine. **That asymmetry is not a skew to fix** — the family
    members carry the same patch number on different publish dates, so `core` and `cli` disagreeing by
    a patch is normal and self-corrects. The trap is the escape hatch: `pnpm add <pkg>@<version>`
    bypasses the gate by appending to a **`minimumReleaseAgeExclude`** list in `pnpm-workspace.yaml`,
    which is a supply-chain control being quietly widened to win a patch bump. **Prefer waiting** —
    a plain `pnpm update` picks it up once it ages out. The Angular family is additionally
    all-or-nothing because its intra-family peers are **exact** (`@angular/common@21.2.19` peers
    `@angular/core: '21.2.19'`, not a range), so one held-back member pins the whole set.
- **An Angular bug worth filing.** Angular pushes every control binding onto a same-named directive
  input, and `FieldState.pattern` defaults to a shared `computed(() => [])` rather than `undefined`,
  so a bound `ion-input` gets `pattern=""` — a pattern matching only the empty string, leaving the
  native input permanently `:invalid`. Harmless here (no `<form>`, no submit, no `:invalid` styling),
  latent anywhere that reads native validity. **Custom controls dodge it**: the binding is only
  written onto the host when the host accepts the native property, which `app-money-input` does not.

### Deferred on a decision, not on effort

- **Reordering the deck from the grid itself.** The model has always supported it
  (`DeckFacade.reorder(ids)` takes the complete resolved order, which is what an `ionReorderEnd`
  produces). What stops it is that a tile **is** a navigation link: a drag competes with the tap that
  opens the program, so it needs a long-press-to-arm mode or an explicit "arrange" toggle — a UX
  choice. The capability already has a home on `/commlink/deck`.
- **A `field-note` READ idiom, if a sixth dialog wants one.** The _presentation_ is shared (the global
  `.sr-field-note`). What is still per-dialog is how each **reads** its errors: `invalid()`,
  `some(kind === X)`, `some(kind !== X)`. A shared `hasErrorOtherThan(field, kind)` is two lines and
  still not worth extracting for five call sites, but it is the obvious place to look if this grows.
  Note the asymmetry those reads encode deliberately: an _empty_ money box leaves save disabled
  without a note (it is the initial state), while an empty **name** does say so — the box was seeded
  from an item or the search term, so blank means the user cleared it.
- **The emoji picker's `ion-input` `end` slot is experimental.** Ionic 8 documents `start`/`end`
  slots on `ion-input`, but implements them with *simulated* rather than native Web Component slots,
  so behaviour "may not exactly match". It renders and clicks correctly in the e2e run and on the web
  build; the Android WebView the APK ships into is the one target not covered by a gate. The fallback
  needs no redesign — the identical `ion-button` moves to the wrapping `ion-item`, one level out.
- **`emoji:build` is run by hand, not by CI.** The output is committed, so the build never needs the
  network and a stale artifact cannot break a release — it can only miss emoji added by a newer
  Unicode release. A gate that re-ran the generator and diffed would need `emojibase-data` installed
  in CI for a check that fires once a year; regenerating on a dependency bump is the cheaper habit.
- **The picker offers no skin-tone choice.** CLDR ships tone variants nested under each base emoji
  (`skins`), and the generator drops them — 1644 entries become several thousand, for a picker whose
  job is decorating a grocery name. `extractEmoji` already keeps a tone modifier attached to its
  glyph, so a name pasted with one survives the round-trip and the recents row shows it correctly.

### SOYKAF recipe book — v2

The constraint that shapes all of it: the check is **presence-only** ("in storage" / "missing"),
never "you are 200 ml short" — storage counts packages while a recipe asks for a measure, and nothing
converts a bottle into ml.

- **Cook → subtract** ingredients from storage; missing ingredients → push into `_shopping`. (v1's
  missing list is deliberately read-only, with no one-tap push.) A product decision: it makes cooking
  mutate stock.
- **Base unit on `IProduct` + pack sizes** (milk → `ml`; 0.5 l / 1 l bottles) — the _purchase-unit vs
  consumption-unit_ bridge a quantitative "200 ml short" requires. **Open only if presence-only proves
  too weak**, because the cost is real: `IStorageItem.quantity` becomes a base-unit amount, which
  pools distinct packs into one number and so **destroys per-pack `bestBefore`** (two bottles with
  different dates become "1000 ml" with one date). Half the schema already exists — `IProduct` has
  carried `unit`, `packaging` and `packagingWeight?` since kitchen-bot, unread by the matcher.
- **Recipe photos.** A slice persists as one key/value doc (recipes ride inside `npc-groceries`) that
  the generic save effect rewrites wholesale on every mutation, so base64 images would ride inside
  the text document. Needs a place for binaries first.

### Looked at, deliberately not changed

- **The list dialogs' field tree spans the whole draft, though only `name` is bound.** Raised as a
  cost on the interaction path: `patch()` replaces the draft object, so every unrelated edit (a
  servings tick, a quantity stepper) recomputes the root `childrenMap` and `canSave` re-aggregates
  through it. Read against `@angular/forms` 21.2.18 it is far cheaper than it sounds, and the fix
  would be worse than the cost:
  - `childrenMap` is a `linkedSignal` that **reuses** child nodes across recomputes
    (`prevData.byPropertyKey.get(key)`), so a patch is an `Object.keys` walk plus Map lookups, not a
    tree rebuild. Only a key written as `undefined` is deleted and recreated.
  - `valid()` is a memoized `computed` and `reduceChildren` passes `shortCircuitFalse`, so validity
    stops at the first invalid child.
  - Scoping the form to the validated field would give back the two things the conversion bought: the
    tree **is** the write-back channel for `[formField]="form.name"`, and `canSave` comes from the
    schema instead of a hand-written conjunction. A subset form needs manual sync — the coupling the
    conversion removed.

  Revisit only with a measurement, and on a real draft (a 12-ingredient recipe is the worst case).

### Recorded decisions (here so they are not re-flagged as work)

- **Five simplifications from the 2026-08-01 review, declined with the measurement that killed
  each.** All five read as duplication and are not.
  - **The `deck.hud-label` mixin is not adopted at the nine sites that re-type its declarations.**
    The mixin also emits `font-family`, which every one of those sites already inherits from its
    page root — so the substitution is behaviour-identical and adds **192 bytes** for nothing. There
    is little to single-source anyway: the two declarations are `var()` reads, so the flip tokens are
    the shared definition and the mixin would only be sharing the habit of using them. (This
    originally also argued "a stylesheet already over its 6 kB budget"; that leg is gone — the
    component-style budget was the Angular scaffold default and is 7 kb / 8 kb deliberately since
    2026-08-01, with `commlink.page.scss` at 6.47 kB. The decision stands on the first reason alone.)
  - **`GroceryListPageFacade`'s `save*` / `showEdit*` / `remove*` triples stay eleven methods.**
    Each pairs an item type with the action for *that* list; a route-derived `remove(item)` softens
    that to a union, which is the one thing stopping a storage item being dispatched at the shopping
    list. The templates would all change too.
  - **`CashCategoriesPageFacade` does not extend `BaseCategoryListPageFacade`**, though it
    implements the same contract and reads as the same shape. Its catalog carries its own cascades,
    so four of the nine bodies would be overridden — a base with hooks for one caller.
  - **`TrackingListPageFacade` and `TasksListPageFacade` share no base either.** Seven one-line
    dispatches in common, against different item types, different create-seeds, and categories that
    one has and the other does not.
  - **`@capacitor/app` stays**, though nothing imports it and nothing declares it as a peer. It is a
    *native* plugin: removing it changes what Android's hardware back button does, `android/` is
    regenerated and untested here, and no gate can see the difference. "No import" is not "unused"
    for a Capacitor plugin — `@capacitor/haptics` and `@capacitor/keyboard` are the same case.
- **Two review findings that were wrong about their own evidence** (2026-08-01), kept because the
  method that produced them will be used again.
  - A grep for "exports whose only other reference is their own spec" listed eleven. Four were
    false: `ChartColors` is the return type of an exported function, `TMockKernelState` is used twice
    in its own file (the grep filtered the lines containing `export`, which were the usages),
    `UNPARSEABLE_DATE` is one of three sibling error kinds two of which are matched on externally,
    and `matchesNameExactly`/`matchesId` are spec'd directly, which is a use this project prefers.
  - `tsconfig.json`'s `references` looked like dead weight — no child sets `composite`, so
    `tsc -p tsconfig.json` answers TS6306 rather than type-checking. Removing it turned **178** spec
    files into "not found by the project service": the array is what typescript-eslint's
    `projectService` walks to decide which project owns a file. It is load-bearing for lint, and a
    new tsconfig has to be added to it.


- **The wordclock's four `TSettings` flags are intended variants — do not delete them on reachability
  grounds** (settled 2026-07-31, after a `/simplify` sweep deleted them and the deletion was reverted).
  `showCorners` · `deZwanzigNach` · `deZwanzigVor` · `deDreiviertel` encode real German regional
  readings of the same dial (ZWANZIG NACH … ZEHN VOR HALB · ZWANZIG VOR … ZEHN NACH HALB ·
  DREIVIERTEL … VIERTEL VOR), plus the corner-dot minute display and, with it, the *non*-corner dial
  mode that rounds to the nearest five-minute step instead of flooring — which is why `:58` tips into
  the next hour there and stays inside it under corners. A wordclock that renders one of them is a
  smaller product.
  **Every argument for deleting them is true and still not sufficient**, so a later pass will
  reconstruct it: the type has exactly one writer (`DashWordclockComponent`'s hardcoded literal), no
  settings page or slice field feeds it, no i18n key names a variant, and the three regional arms are
  exercised only by `wordclock.utils.spec.ts`. That is a *reachability* argument; the flags are latent
  capability with a future settings surface as the intended writer. The spec's variant and
  corners-disabled cases are the **specification** of those readings, not coverage propping up dead
  code — so their existence is not evidence the code is dead.
  **Pattern:** "only its own spec uses it" distinguishes unreachable from unwritten, and only the owner
  can say which. Ask before deleting a coherent feature axis; delete freely only where the capability
  itself is gone (the empty effects shells, the speculative test-ids).
- **The bank fixtures were real, and are gone from history** (settled 2026-07-30, closing what this
  section listed as a pre-push blocker). `docs/cash/example.csv` and `example2.csv` were Martin's own
  giro exports — real IBANs, real counterparties — so they were purged from all 347 commits that
  carried them and `docs/cash/*.csv` is now gitignored. **Timing was the whole point:** `git ls-remote`
  still returned zero refs, so the rewrite cost nothing; one push would have made those blobs public
  irrevocably. Two things made it clean rather than a trade: **no spec ever read a `.csv`** (every
  parser spec carries inline rows, so the purge could not redden the suite), and each parser's header
  comment already spelled out its column layout — which is why *that* is now the cited format source in
  §7 and above. Two traps worth remembering, both of which a naive purge would have sprung: the blobs
  had lived at **two** paths (`docs/example*.csv` before `1e63058` moved them under `docs/cash/`), so
  filtering the current path alone would have left the originals; and the commit that added them
  *described* them in its message as "the two real exports", which `filter-branch` leaves untouched
  without a `--msg-filter` — a rewrite that purges the data but keeps the sentence pointing at it has
  re-raised the very question it was run to close. **Pattern:** purge the blob and the prose about the
  blob, and verify with `git rev-list --objects --all`, not with a clean working tree.
- **Toasts already announce — the audit finding was wrong** (checked 2026-07-29). §12 briefly claimed
  toast output had no live region and that "Ionic's own toast does not announce either". It does:
  `ion-toast` renders its content div with **`role="status"` + `aria-atomic="true"` +
  `aria-live="polite"`** and flips an internal `revealContentToScreenReader` false→true on present,
  which is the standard trick that makes a live region actually fire (the content has to change
  _after_ the region exists). So every toast in the app is announced, politely, with nothing to
  build. **Why the audit missed it: it grepped `src/**/*.html` for `aria-live`, and a web component's
  shadow DOM is not in our templates** — only GEIST's own `aria-live` showed up. Raising errors to
  `assertive` would be the only refinement left, and it is not cheap: Ionic hardcodes `polite` inside
  shadow DOM, so it would take custom markup replacing `ion-toast`. Not worth it — declined.
- **Two off-contract facade methods** (`addCategory`/`showEditDialog`) stay on the concrete
  grocery/tasks facades, deliberately off the shared `LIST_FACADE` contract: putting them on it would
  force `tracking` to implement operations it has no concept of.
- **Two e2e gestures are deliberately not covered by e2e** — no skipped spec exists to find, the tests
  were never written — both because the Playwright drag would be more fragile than what
  it proves: the `app-date-input` calendar (an `ion-datetime` day grid inside a teleported modal) and
  the cash-rules reorder (a mouse-step drag over an `ion-reorder` sharing its row with a swipe
  handler). Both behaviours are covered by unit specs.
- **The remaining Ionic-element locators in `e2e/` are mechanism, not identity** (audited 2026-08-01,
  the third `data-testid` direction no script can decide — §Part 2 2.4). Three were real and were
  given ids; these were checked one by one and are correct as they stand:
  - **`getByTestId('x').locator('input')`** — six sites. The identity is the testid on the custom
    element; the inner native `<input>` is how you type into an `ion-input`, and it is Ionic's element,
    not ours, so it *cannot* carry an id.
  - **`alert(page).locator('button')`** with `toHaveCount(1)` — the count of buttons **is** the
    assertion (the global error alert's only button reloads), and Ionic generates those buttons from
    an options array.
  - **`row.locator('ion-item-sliding')`** — the swipe target, reached from a row that already carries
    `list-row`; `openRowSwipe` needs the sliding element itself, and adding a second name for it is one
    more thing to keep in sync.
  - **`page.locator('ion-popover')` as an overlay scope** — a presented popover teleports to the app
    root, so the row cannot scope it; what was wrong there was the *translated text* inside it, which
    is now `getByTestId('kebab-edit')`.
  - **`ion-menu` as a scope** for `menu-row`, and **`ion-searchbar input`** — the same mechanism case,
    both one level from a component-element contract.
- **The unspec'd facades stay unspec'd** (decided 2026-07-29, after the audit that raised it). Most
  `<Domain>Facade`s have no spec — `DashboardFacade`, `DeckFacade`, `NotificationsFacade`,
  `SettingsFacade`, `TrackplayFacade`, `OfficeTimeFacade`, both grocery page facades, both shared page
  facades — and the audit called that the app's untested seam, since NgRx is sealed behind it. Worked
  through, the finding does not survive its own argument. A facade method is **almost always** one line
  (`dispatch(Actions.x(arg))` / `selectSignal(sel)`) — for the one exception see the note below — so a
  spec over it catches exactly one class,
  **mis-wiring**, which splits in two: an _argument_ mis-wire (`remove(item.name)` where the reducer
  wants an id) and a _wrong-action_ dispatch carrying an identical payload. Only the first is typeable,
  and only by branding the id aliases (`type TCategoryId = string & { readonly __brand: unique symbol }`
  — an intersection, so branded→`string` still assigns while `string`→branded does not, and the field
  is a phantom that does not exist at runtime). That was rejected on cost: branding needs an `as` at
  every mint point **including every read out of IndexedDB**, which would add unchecked casts at the
  least trustworthy boundary in an app that currently carries zero `any` and zero non-null assertions —
  and it would not have caught the one time this bug actually shipped (`8eee87a`, a renamed product
  un-cooking its recipes), because that code compared a real name to a real name by design. Nothing
  types the second half at all. What remains is not worth eleven mirror specs asserting that `dispatch`
  was called, and raising the coverage thresholds to force them into existence would game a metric
  rather than buy safety — against this repo's stated **"lean, not exhaustive"** philosophy (§10).
  Revisit only if a mis-wire actually ships. Note the numbers here are a floor over _imported_ files,
  not the app (`vitest.config.ts` documents why), and `routes/`/`model/` are not gaps either: a route
  manifest is config and the model layer is types. **A colocated spec is also not what coverage
  measures** — both `@shared/data/persisted-states/*.factory.ts` have no spec file of their own and sit at 100%
  statements, exercised through the per-domain effects specs, so "no `*.spec.ts` beside it" overstates
  a gap on its own.

  **`DeckFacade` is the one facade the paragraph above does not describe** (20% statements, **0%
  functions**, `deck.facade.ts:31-100`). Its reads are not delegation: `configuredEntries` orders the
  catalog, applies theme labels and then derives `hidden` from `hiddenEntries` and `moduleHidden` from
  `hiddenModules`; `configuredModules` dedupes and marks; `hasCustomConfig` checks three lists. Those
  two config lists are both arrays of strings, so swapping them compiles and silently breaks the module
  cascade — the mis-wire class with something real behind it. It stays unspec'd on the same
  cost argument, and the risk is bounded rather than absent: the pure helpers it composes
  (`commlink/util/deck.utils.ts` — `orderEntries`/`visibleEntries`/`resolveLabels`), `deck.reducer.ts`
  and the catalog's key completeness are each spec'd, and `e2e/commlink/deck-config.e2e.ts` drives the
  flow. What is unproven is the wiring on paths that e2e does not walk. **If any facade ever earns a
  spec, it is this one** — a pure `computed` over a mocked store, no component needed.
- **`selectNotificationsUnread`** on the dashboard read-model is the **sanctioned** shell-badge read
  (§6) — the read-model catalogs each domain's source+metric by design.
- **`ICategory.id: string` vs a `TCategoryId` alias** — cosmetic; the alias is a bare `string`, no
  divergence.
- **A category name is a label, never an identity — in all three owners.** grocery, tasks and cash
  hold `{id,name}` catalogs and reference entries by `TCategoryId`; ids are minted `uuidv4()` and
  never derived from the name. What the name still decides is *duplicate* handling, deliberately:
  adding an existing name is a no-op and renaming **onto** one merges — the loser's id is dropped and
  its referencing rows remapped to the survivor (`updateListCategory` in `@shared/util/item-lists/list.utils.ts`
  for grocery/tasks, `CashActions.updateCategory` in `cash.reducer.ts`, which remaps rules too). That
  merge is why `CashCategoryPickerComponent.onRename` follows the survivor: the local draft would
  otherwise re-assert an id the reducer just retired.
- **A GUID per row, a natural key per singleton — and neither is a gap in the other.** Everything that
  exists as a row of its own mints `uuidv4()` (`IBaseItem`, `ICategory`, `IRecipeIngredient`, cash's
  account/transaction/rule, trackplay's `IBase` + `IGameType`). The identities that are _not_ GUIDs
  are natural keys, deliberately, because there the key **is** the thing: the list ids
  (`_storage`/`_products`/`_shopping`/`_tasks`/`_tracking` — simultaneously a route param, an effects
  guard and a persisted-doc discriminator), the deck catalog ids (§7.1 — absence-means-default
  replaces a migration ladder, which is why they are never renamed), `npc-summary-<source>`, and
  office-time's `officedays`/`freedays`/`holidays`, where a day is identified by its date — minting a
  GUID per logged day would _admit_ two rows for one date, which is precisely the invariant those
  collections exist to hold. Only `holidays` holds it structurally, being a `Record` keyed by date;
  `officedays`/`freedays` are `Array<Dayjs>`, which admits duplicates freely, so there the guard is
  explicit and load-bearing — `hasDay` in `office-time.reducer.ts` is what makes
  `addOfficeTime`/`addFreeday` idempotent (`setOfficedays` replaces wholesale and dedups nothing, so
  its callers must pass a set). Reading that guard as belt-and-braces and dropping it is how
  double-tapping "log today" would silently double the office-day count.
  **Comparing by name is legitimate in exactly one shape:** resolving
  input that never had an id to offer against, i.e. the recipe matcher's fallback for a storage row
  with no `productId` (`groceries/util/recipe-match.utils.ts`). Resolution of last resort, never
  identity.

### Fixed by the 2026-08-01 review

Four correctness defects and one gate hole, all with specs that fail without the fix. Recorded
because each was a *class* of mistake worth recognising, not because the code needs re-checking.

1. **A merging category rename destroyed the item's category.** The catalog merge remapped stored
   rows; the open edit dialog's draft was never told and put the retired id back on save. The
   sibling *delete* path had it right, and so did the cash picker — only merge-rename was missed.
   **Pattern:** when a reducer rewrites rows a dialog is editing, the dialog is a row too.
2. **The four office-time stat cards froze at the last slice write.** `calculateStats` read
   `dayjs()` inside projectors memoized on the slice. The facade documented this exact trap three
   lines above the affected fields, having already fixed it for `todayIsOfficeDay`. **Pattern:** a
   written-down lesson does not apply itself to the code underneath it.
3. **A category op inside an open cash modal reverted every unsaved field.** `BaseModalDialog`
   reseeded its draft off `existing`, a live computed, so any reducer write touching the edited row
   discarded the user's typing. It now keys on `editId` — identity, not reference.
4. **The recipe matcher counted a `quantity: 0` pantry row as stock**, so `/soykaf` called a recipe
   cookable while the low-stock tile flagged the same item as out.
5. **`e2e/` was type-checked by nothing** — no tsconfig project reached it, and Playwright
   transpiles with esbuild. `tsconfig.e2e.json` plus a gate of its own closed it.

### Measured gaps — all three closed

A whole-app audit on **2026-07-29** raised three, deliberately recorded as missing _mechanisms_ rather
than percentages (a count is what rotted in the NgRx-spine claim above). None is outstanding:

1. **Accessibility was ungated — fixed.** §10, _A11y is gated, and the gate needed help_.
2. **No global `ErrorHandler` — fixed.** §4, _The last-resort error boundary_.
3. **Toasts had no live region — the finding was false.** Ionic already announces every toast; see
   _Recorded decisions_ above.

**Two of the three were mis-measured, and in the same way both times: the instrument could not see
what it was looking for.** The facade "untested seam" counted colocated `*.spec.ts` files rather than
coverage (both `@shared/data/persisted-states/*.factory.ts` have no spec and sit at 100%), and the missing live
region came from grepping `src/**/*.html` for `aria-live`, which cannot see a web component's shadow
DOM. The pattern is already in §10's gate discipline — _verify a diagnostic query returns what you
think before scoping work off it_ — and an audit is exactly a pile of diagnostic queries. Prefer the
measurement the toolchain already produces (a coverage report, `eslint --print-config`, the built
component source) over one improvised with grep.

---

## 13. Considered and not built

Kept so their absence doesn't read as an oversight.

- **`office-time → tracking` was never built.** An early design had office-time read a tracking
  read-model selector; the realized office-time is standalone and only reports telemetry.
- **`notify({ level })` as a generic action was not built.** The realized contract is
  `NotificationsActions` (§3.2).
- **"Every context lazy" did not survive contact with the notification inbox.**
  `feature/fully-lazy` routed both remaining eager sinks: `tracking` (a background timer bridged it
  to notifications — the timer was deleted, correctly) and `notifications`. Routing the inbox forced
  the durable-write port described in §3.5; that port is gone and the inbox is eager again, for the
  same reason the dashboard read-model always was. **Uniform lifecycle was the wrong goal** — the
  right one is a lifecycle that matches where a slice is written and read. No _supplier_ feature slice
  is eager.
- **A theme-composed i18n keyspace.** The original deck-label plan claimed "a third theme is a new
  JSON block, not a code change". That was the wrong trade — composing keys from `theme + id` made all
  60 invisible to `--clean`, and a missing theme could only be discovered at runtime as a raw key on
  screen. Declared `Record<TTheme, …>` fields turn it into a compile error (§7.1, §9).
- **A CI i18n freshness gate** — see §9; the formatting flags removed the need.
- **Closing `metric?: string` into a union** — keeping `metricKey` on the entry was preferred for
  consistency, at the cost of repeating three `marker('deck.metric.count')` literals.
- **`@ngrx/component-store` or a `signalStore` for dialog state** — `signal` + `computed` was the
  whole requirement (§2.6).

