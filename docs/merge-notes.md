# np-commlink — merge notes

Running record of non-obvious merge decisions, diffs, and verification output.
Companion to `merge-plan.md` (the ordered commit list).

---

## Step 17 — `global.scss` diff (kitchen-bot ↔ timetracker)

Base = timetracker's `src/global.scss` (shadowrun). Below is the full diff of
kitchen-bot's `src/global.scss` against it, so nothing is dropped silently.

**timetracker-only (kept as base):**
- `@use 'theme/shadowrun';` (KB has no shadowrun layer)
- `--app-content-max-width` / `--app-content-bg` custom props + the
  `ion-content > *` and `app-item-list-toolbar` centering rules
- `.alert-button.alert-button-success` / `.alert-button-danger` colouring
- `@import 'theme/_flex-utils.css'` (KB used the `.scss` twin `theme/flex-utils`;
  TT's `.css` wins per plan §5.3)

**kitchen-bot-only (folded into base by this step):**
- `--ion-safe-area-*` ← `var(--safe-area-inset-*, env(safe-area-inset-*))` block
  (Android edge-to-edge; Capacitor SystemBars injects `--safe-area-inset-*`).
- `html, body { background-color: var(--ion-background-color, …) }` — KB fallback
  `#2b2b2b` **retuned to shadowrun `#0f141b`**.
- `[hidden] { display: none; }` — KB shipped `!important`; dropped the `!important`
  per plan (native `[hidden]` semantics, no specificity war needed here).
- `body.scanner-active { --background: transparent; --ion-background-color: transparent; }`
  — **rewritten to target `ion-content`**: shadowrun sets
  `ion-content { --background: radial-gradient(...) }` on the element, which
  out-specifies a body-level custom-prop, so the scanner transparency must be
  applied at `body.scanner-active ion-content`.

**common to both (unchanged):** the Ionic core/normalize/structure/typography/
display/padding/text-alignment imports and `.trigger { cursor: pointer; }`.

---

## Step 18 — grocery ion-colors + `_consts.scss`

Added `--ion-color-{shopping,storage,task,global,category}` to `theme/variables.scss`,
retuned from kitchen-bot's purple/teal set into the shadowrun **slate** family (one
distinct blue-grey per domain; `category` keeps amber `#de8b27`). KB's `.ion-color-local`
/ `.ion-color-low-stock(-warn)` classes are intentionally **not** carried over (dangling —
re-introduce during the re-skin audit only if a ported renderer actually uses them).

`theme/_consts.scss` — diffs against KB only by one trailing blank line; TT's copy kept
verbatim per the shadowrun constraint. No functional delta.

---

## Step 23 — merged `@shared/types.ts`

Merged kitchen-bot's `@types/types.d.ts` into TT's `types.ts`. Collision renames
(KB name → merged name), so TT's own types survive untouched:

| kitchen-bot | merged | why |
|---|---|---|
| `ISettings` (feature flags) | `IListSettings` | TT already has `ISettingsState` (office-time) |
| `IEditItemState<T>` | `IItemDialogState<T>` | TT keeps its own `IEditItemState<T>` (tracking) |
| `TDialogsState` | `TItemDialogsState` | TT keeps its own `TDialogsState` (tracking) |
| store key `settings` | `listSettings` | vs TT office-time `settings` |
| store key `dialogs` | `itemDialogs` | vs TT tracking `dialogs` |

Superset merges (both halves satisfy one type):
- `IBaseItem` — TT's `{id,name,createdAt}` + KB's optional `category?/price?/desc?/location?`.
- `IItemList<T>` — TT's minimal shape + KB's `id?/categories?/mode?/filterBy?` **optional** on
  the base (so tracking's list still fits); the concrete grocery lists (`TStorageList` …)
  re-require `categories`/`mode` via intersection so grocery selectors need no null guards.
- `ISearchResult<T>` — bound broadened `ITrackingItem`→`IBaseItem`; KB's cross-list buckets
  (`globalItems?/storageItems?/shoppingItems?`) added **optional** (tracking never sets them).
- Added `scannedEan?` to `IItemDialogState` for the barcode-scanner → openEditGlobalItem flow.
- `IAppState` gains `router` + the grocery slices; `IDatastore` gains the persisted grocery
  slices (`itemDialogs`/`quickadd` are ephemeral, not persisted — mirrors KB).

**Migrations:** `LoadedDatastore` is a mapped type over `IDatastore`, so it auto-extended to
the grocery keys — no new `migrations.ts` step. Grocery seeding is handled by each reducer's
`loadedSuccessfully` null-fallback (`datastore.globals ?? state`); KB's category-derivation
version step is folded into the unified `DatabaseService` when the grocery slices land.
`app.effects.ts` init error-fallback extended with the grocery `null` keys.

**Environments:** TT's `src/environments/*` win; grep confirms kitchen-bot defines no
environment keys absent from TT's (nothing to port).

---

## Step 27 — i18n merge under `grocery.` flat prefix

Every kitchen-bot key is prefixed with the flat string `grocery.` (no nested object —
mixing flat and nested keys breaks ngx-translate lookup). Result: `de.json` 130 → 186
keys (56 grocery), `en.json` 2 → 4. **Zero collisions** after prefixing — the six keys the
plan flagged (`edit-item.dialog.button.close`, `edit.item.dialog.button.{create,update}`,
`edit.item.dialog.name`, `edit.item.dialog.title.{create,update}`) now live as
`grocery.edit.item.dialog.*`, distinct from any TT key. Ported grocery templates/TS/`marker()`
calls get the same `grocery.` prefix in their respective port steps, so the tree never renders
a raw key. SVG assets (`avatar.svg`, `shapes.svg`) confirmed present from commit 11.

---

## Execution status & deviations (as built)

**DONE and green (builds + 156 tests pass at every commit):**
- Phase A/B (commits 1–16): tooling, TT domain copies, configs, deps, flat lint.
- Phase C (17–26): global.scss deltas, grocery ion-colors, vitest-import cleanup, PascalCase
  action consts + singular selector files, `@ngrx/router-store` + `router.selector`, hash-routing
  spec, `IAppState`/`IDatastore` type merge, DB name/prefix (`np-commlink`/`npc-`), `@shared/testing`
  helpers, Sheriff `type:testing` rule.
- Shared grocery kit: i18n `grocery.` merge; `item.factory` + `app.utils` merge; `grocery-list`
  (actions/utils/selector); `item-dialogs`, `list-settings`, `quick-add` slices; item-list
  reconciled to signals + categories (reorder dropped); `category-item` + `category-note` directive.
- All four grocery **domains' data layers** (globals/shopping/storage/tasks) + registration.
- Root **orchestrator effects**: `grocery-list.effects`, `item-dialogs.effects` (shell root).

**Key deviations from the original plan (decisions made during execution):**
1. **`item-list` machinery is NOT merged into one `[ItemList]`.** TT's `@shared/data/item-list/*`
   is tracking-flavored (`selectListState = state.tracking`); grocery got its own
   `@shared/data/grocery-list/*` (source `[ItemList]`→`[GroceryList]`, class `GroceryListEffects`).
2. **Orchestrator effects live at the shell root**, not `@shared` — they import the four feature
   domains, which would invert the `@shared → domain` dependency.
3. **One real cross-domain coupling remains:** `storage.effects ↔ shopping.effects` (copy-to-list).
   Declared an explicit Sheriff bridge `domain:shopping ↔ domain:storage`. globals/tasks are fully
   sealed. (So "zero bridges" from §1.1 became "one bridge pair".)
4. **`IItemList.categories`/`mode` are required** (grocery code reads them unguarded); the tracking
   list carries `categories: []`, `mode: 'alphabetical'`.
5. **`item-list` is one signal-style component, reorder dropped** (per user direction). The
   `<app-edit-category-dialog>` embed was removed (a `type:ui` component can't import `type:smart-ui`);
   pages will host that dialog instead.
6. Slice keys renamed to avoid TT collisions: `settings`→`listSettings`, `dialogs`→`itemDialogs`.
   `IEditItemState`→`IItemDialogState`, `TDialogsState`→`TItemDialogsState` (KB side).

**REMAINING (UI + wiring + tests + native + docs):**
- Shared UI: `item-list-quick-add`; grocery `list-page` + its 4 sub-components
  (`empty`/`searchbar`/`toolbar`/`search-result`) — **API fork to resolve** (KB `@Input` vs TT
  signals); `category-input` form; `categories-dialog` + `edit-category-dialog` (smart-ui);
  `categories.pipe`; `item-edit-modal`; mlkit `barcode-scanner.service` + scan buttons.
- Per domain: item renderer (`ui`), edit dialog (`smart-ui`), page (`feature`). Plus `list-settings`
  page. Pages must host `<app-edit-category-dialog>` (see deviation 5).
- Wiring: routes `/shopping /storage /tasks /globals /list-settings` (soykaf stays stub); commlink
  deck tiles + side-menu; extend `saveOnChange$` to grocery slices.
- Re-skin audits; port grocery specs + e2e (hash routing); regenerate `android/` + mlkit manifest
  edits; author `CLAUDE.md`.

**Sub-component fork resolution (verified against KB `list-page.component.html` bindings):**
- `item-list-empty` — TT signal API (`isEmptyList/isSearching/searchTerm/emptyList/emptySearch`)
  is an **exact match** → reuse `@shared/ui/item-list/item-list-empty` as-is.
- `item-list-searchbar` — TT API (`query/queryChange/hitEnter`) is an **exact match** → reuse.
- `item-list-toolbar` — grocery needs a `selectDisplayMode` output (alphabetical↔categories) TT
  lacks; TT already has `selectSortMode`. Extend TT's toolbar with `selectDisplayMode`, drop reorder.
- `item-list-search-result` — TT emits `selectTrackingItem`; grocery needs
  `selectGlobalItem/selectStorageItem/selectShoppingItem` over `ISearchResult`. Port a grocery
  variant (own selector, e.g. `app-grocery-search-result`).
- `item-list-quickadd` — KB-only (`quickAddItem/quickCreateGlobal/quickCreateCategory`) → port.
- The grocery `list-page` already uses `toSignal(store.select(...))` internally (`rxState()`,
  `rxItems()`, …); it binds the reconciled `<app-item-list>` with `[mode] [categories]
  (selectCategory) (deleteCategory)` — all present on the signal component. Give it its own
  selector (`app-grocery-list-page`) to avoid clashing with TT's tracking `app-list-page`.

---

## Acceptance (as of the view-layer completion)

The grocery view layer, wiring, and scanner are done. Verified green:
- `pnpm build` — succeeds (commlink.page.scss budget *warning* only, intentional).
- `npx sheriff verify src/main.ts` — **No issues found** (all domain bridges + the
  smart-ui relaxation are consistent).
- `pnpm exec eslint "src/**/*.ts"` — **0 problems**.
- `pnpm test` — **34 files / 156 tests pass**.
- Runtime smoke (served `www/browser`, screenshotted): the `/commlink` deck renders
  "8/9 PROGRAMS LOADED" with the 4 grocery tiles (SOYKAF standby), and `/#/storage/_storage`
  renders the full grocery list-page in shadowrun style — page-header, searchbar,
  LISTE/KATEGORIEN display-mode toggle, empty-state, German i18n all resolving.

**Feature-complete.** All four grocery features (shopping/storage/tasks/globals) + list-settings
are navigable from the deck tiles and side menu, persist via `saveGroceryOnChange$`, and the
mlkit scanner service is wired (native-guarded) on shopping/storage.

> **Correction (test/e2e follow-up).** The "feature-complete" acceptance above was verified only
> by a screenshot of the *empty* list page — it never exercised adding an item. The ported grocery
> e2e revealed that the merge had dropped kitchen-bot's `ApplicationEffects` **item-manipulation**
> effects when folding into the root (only init + save-on-change were carried over). The grocery
> domains dispatched `[X] Add Item From Search` / `Add Or Update Item` / `Add {Global,Storage,
> Shopping} Item` / `Update Mode|Search` with no consumer, so **grocery items could not be added at
> all** (searchbar or edit dialog) and the `addXItemFromSearch` helpers were dead code. Fixed by
> wiring those generic effects onto `GroceryListEffects` (`addItemFromSearch$`, `addOrUpdateItem$`,
> `addItemFrom{Global,Shopping,Storage}$`, `clearFilter$`, `clearSearch$`, `updateSearchOnItemChange$`,
> `updateQuickAdd$`). Now genuinely add-capable and covered by unit + e2e specs.

**Still outstanding (quality / completeness, not blocking a working app):**
- Port kitchen-bot's grocery specs (state/dialog/component) + backfill effects specs for the
  timetracker effects; port + hash-rewrite the grocery e2e specs.
- Shadowrun re-skin audit of the ported grocery pages/dialogs/renderers (contrast vs amber,
  monospace clipping on long German strings, hardcoded German labels "Mhd"/"Liste"/"Kategorien",
  the per-domain header `color` tint decision).
- Regenerate `android/` (`cap add android` + `cap sync`) and re-apply the mlkit/camera/
  POST_NOTIFICATIONS manifest edits; retune the PWA manifest identity.
- CI wire-up (deferred).
