# np-commlink merge — HANDOVER (for a fresh session)

**Status:** the timetracker × kitchen-bot merge is functionally complete and all three quality follow-ups are done — **A (tests, §3), B (re-skin, §4), C (native/PWA, §5)**. Only genuinely-deferred items remain: the APK build (needs the Android SDK), a shadowrun PWA-icon redesign, and CI. All four grocery features (shopping / storage / tasks / globals — routed at `/database` for globals) + list-settings are navigable, persist, add/edit/copy items, render in uniform amber shadowrun chrome, and the mlkit scanner is wired.

**Gate (all green):** `pnpm run build` (clean-cache; only the expected commlink.page.scss budget warning) · `npx sheriff verify src/main.ts` (No issues) · `eslint "src/**/*.ts"` (0 problems) · `pnpm test` (**94 files / 554 tests**) · `pnpm e2e` (**14/14**) · 0 NG8107.

> **⚠️ Bug found + fixed during the test port (commit `9e0803b`).** The merge had folded kitchen-bot's `ApplicationEffects` **init + save** into the root effects but **dropped its item-manipulation half** — so the four grocery domains dispatched `[X] Add Item From Search` / `Add Or Update Item` / `Add {Global,Storage,Shopping} Item` / `Update Mode|Search` etc. with **nothing consuming them**. Grocery items could not be added at all (searchbar *or* edit dialog); the `addXItemFromSearch` helpers sat unused. The prior "feature-complete and verified" claim was based on a screenshot of an *empty* list page and never exercised an add. Fixed by wiring those effects onto `GroceryListEffects`; the ported grocery e2e now exercises the add flows end-to-end.

**What's left = quality/completeness only** (B + C below). None block a working app.

---

## 0. Read these first (in order)

1. `docs/merge-notes.md` — the full decision log + **"Execution status & deviations"** + acceptance record. Authoritative.
2. `CLAUDE.md` — the merged repo's architecture guide (layout, Sheriff, state, theming, two barcodes).
3. This file — the follow-up work + gotchas.

Source apps (read-only references for porting): `../np-timetracker` (TT, the base) and `../np-kitchen-bot` (KB, grocery source).

---

## 1. Critical gotchas — DO NOT relearn these the hard way

- **Perl `@shared` interpolation bug.** In `perl -pi -e "…s{x}{../../@shared/y}…"`, Perl interpolates `@shared` as an (empty) array → you get `../..//y`. **Always escape it: `\@shared`** in the replacement, or use `while IFS= read -r f` loops (zsh does NOT word-split a stored `$FILES` var — use `grep -rl … | while read f`, not `for f in $FILES`).
- **The `.angular/cache` masks config errors.** A green `pnpm build` can hide a broken `.browserslistrc`/tsconfig. Before trusting green after config changes: `rm -rf .angular/cache && pnpm build`.
- **`tsconfig.app.json` `TS6307` diagnostics are cosmetic.** Raw `tsc -p tsconfig.app.json` reports ~142 `TS6307` ("not listed in file list") — that's inherent to Angular's esbuild tsconfig (`files` + `*.d.ts` include); the builder supplies the graph. **Do NOT "fix" by broadening `include` to `src/**/*.ts`** — it breaks the composite-project disjoint-files invariant (introduces 50 spec errors). Leave it at the Angular default. Real gates are build/lint/test.
- **NG8107 (`optionalChainNotNullable`) is active** — don't add redundant `?.` on non-nullable feature-selector signals. Genuinely-nullable ones (`selectListState`, `selectListSearchResult`, `selectListItems` → `undefined`) keep `?.`.
- **Two item-list engines, on purpose.** `@shared/data/item-list/*` = TT tracking-flavoured (`selectListState = state.tracking`, source `[ItemList]`). `@shared/data/grocery-list/*` = KB multi-list engine (source `[GroceryList]`, route-param driven). Don't merge them.
- **Rely on Vitest `globals:true`** — never `import … from 'vitest'` in specs.

---

## 2. KB → merged rename & path map (use when porting remaining KB files)

**Store keys / action sources / types** (KB → merged):
| KB | merged |
|---|---|
| store key `settings` | `listSettings` |
| store key `dialogs` | `itemDialogs` |
| `SettingsActions` / `[Settings]` | `ListSettingsActions` / `[ListSettings]` |
| `DialogsActions` / `[Dialogs]` | `ItemDialogsActions` / `[ItemDialogs]` (keep `CategoriesActions`/`[Categories]`) |
| `ItemListActions` / `[ItemList]` | `GroceryListActions` / `[GroceryList]` |
| `ItemListEffects` | `GroceryListEffects` (at shell root `src/app/grocery-list.effects.ts`) |
| `ISettings` | `IListSettings` |
| `IEditItemState<T>` | `IItemDialogState<T>` |
| `TDialogsState` | `TItemDialogsState` |
| `ListPageComponent` / `app-list-page` | `GroceryListPageComponent` / `app-grocery-list-page` |
| `ItemListSearchResultComponent` / `app-item-list-search-result` | `GrocerySearchResultComponent` / `app-grocery-search-result` |
| `SettingsPage` (kitchen) | `ListSettingsPage` |

**Import path moves** (KB → merged; escape `\@shared` in perl!):
- `../../@types/types` → `@shared/types` (relative, depth-dependent)
- `state/@shared/item-list.{actions,selector,utils}` → `@shared/data/grocery-list/grocery-list.*`
- `state/dialogs/dialogs.*` → `@shared/data/item-dialogs/item-dialogs.*`
- `state/settings/settings.*` → `@shared/data/list-settings/list-settings.*`
- `state/quick-add/*` → `@shared/data/quick-add/*`
- `state/<domain>/<domain>.*` → `src/app/<domain>/data/<domain>.*` (globals/shopping/storage/tasks)
- `app.factory` (createX item creators) → `@shared/util/item.factory`; base/uuid → `@shared/util/{app.factory,app.utils}`
- `app.utils` → `@shared/util/app.utils`
- `pipes/categories.pipe` → `@shared/util/categories.pipe`
- `directives/category-note.directive` → `@shared/ui/category-note.directive`
- `components/forms/{date,item-name,number}-input` → `@shared/ui/forms/*` (TT's — reuse)
- `components/forms/{category-input,item-edit-modal}` → `@shared/smart-ui/*`
- `components/item-list/item-list-quick-add` → `@shared/smart-ui/item-list-quick-add`
- `components/item-list/{empty,searchbar,toolbar}` → `@shared/ui/item-list/*` (TT's — reuse)
- `components/pages/list-page` → `@shared/feature/grocery-list-page`
- `dialogs/edit-<X>-item-dialog` → `src/app/<domain>/smart-ui/edit-<X>-item-dialog`
- `dialogs/{categories,edit-category}-dialog` → `@shared/smart-ui/*`
- `components/item-list-items/<X>-item` → `src/app/<domain>/ui/<X>-item`

**i18n:** every KB translation key is namespaced `grocery.<key>` in `src/assets/i18n/{de,en}.json`. Any KB template `'x.y' | translate` and any `marker('x.y')` in ported TS must become `grocery.x.y`.

**Sheriff bridges (already in `sheriff.config.ts`):** `shopping↔storage` (copy-to-list) and `shopping/storage→globals` (create-global dialog). `tasks` + `globals` sealed. `smart-ui→smart-ui` is relaxed (KB dialogs compose store-connected sub-components). `type:testing` reachable only from `*.spec.ts`.

---

## 3. Follow-up A — tests — ✅ DONE

Delivered (Vitest **34 → 94 files / 156 → 554 tests**, plus **14 e2e**):
- **A1 — grocery specs ported** to their merged homes with the §2 renames: all four domains' data specs (reducer/selector/effects), the shared `quick-add`/`list-settings`/`item-dialogs`/`grocery-list` slices, every item renderer + dialog + page, the shared item-list sub-components (empty/toolbar/quickadd/search-result→grocery-search-result/list-page→grocery-list-page), `category-input`/`item-edit-modal`, `categories.pipe`, `category-note.directive`, `item.factory`, and the `app.utils` superset. `home.page` skipped (tab shell discarded).
- **A2 — effects specs**: `grocery-list.effects` + `item-dialogs.effects` orchestrators ported to the shell root; fresh `app.effects` + `app.message.effects` specs authored for the merged (TT-flavoured) root effects; instantiation smoke specs backfilled for the six untested TT effects.
- **A3 — e2e** ported onto hash routing (see §3-notes below) — helpers rewritten off the discarded ion-tabs shell to hash-URL nav; `e2e/grocery/{shopping,storage,tasks,settings,navigation,first-paint}.e2e.ts`; `playwright.config.ts` webServer command fixed.

**Reconciliation gotchas encountered (for future ports):**
- KB `detectChanges()` + DOM-query specs **pass in the merged jsdom** — they assert Angular light-DOM + directives, not Stencil shadow DOM (the "no detectChanges" rule is about Stencil internals).
- Components reconciled to **signal inputs** (`text-item`, `item-list-empty`, `item-list-toolbar`, `page-header`): assign via `fixture.componentRef.setInput(...)` and read via call syntax (`component.showReorder()`).
- `ISearchResult.globalItems/storageItems/shoppingItems` are **optional** in the merge (tracking never sets them) → `?.` before `.map`.
- State-key renames also apply **inside `mockAppState(...)` overrides**: `settings:`→`listSettings:`, `dialogs:`→`itemDialogs:`; and `mockSettings`→`mockListSettings`, `mockDialogsState`→`mockItemDialogsState`.
- `page-header` renders its label in `.app-brand__name` (shadowrun brand), not `ion-title`.
- **e2e:** merged app has **no bottom tabs** — navigate via `page.goto('/#/<feature>/:listId')`; root `/` redirects to `/#/commlink` (deck = `app-page-commlink`), settings = `/#/list-settings`.

Shared test infra: `src/app/@shared/testing/{test-data.ts,test-providers.ts}` (deterministic factories `mockStorageItem/mockShoppingItem/mockTaskItem/mockGlobalItem/mockTrackingItem/…`, `mockAppState()` = full unified `IAppState`, `provideTestingProviders(initialState)`, `provideEffectsTestingProviders(actions$, initialState)`, `COMMON_TEST_PROVIDERS`, `BASE_TEST_PROVIDERS`).

<details><summary>Original A1/A2/A3 plan (for reference)</summary>

### A1. Port KB grocery specs → new locations
KB spec files (all under `../np-kitchen-bot/src/app/`), with target locations:

- **State → `<domain>/data/**` and `@shared/data/**`:**
  `state/globals/{reducer,selector,effects}.spec` → `globals/data/`; same for `shopping`/`storage`/`tasks`.
  `state/quick-add/{reducer,selector}.spec` → `@shared/data/quick-add/`.
  `state/settings/{reducer,effects}.spec` → `@shared/data/list-settings/` (rename to `list-settings.*`).
  `state/dialogs/{reducer,selector,effects}.spec` → `@shared/data/item-dialogs/` (rename `item-dialogs.*`).
  `state/@shared/item-list.{selector,utils,effects}.spec` → `@shared/data/grocery-list/grocery-list.*`.
- **Dialogs → `<domain>/smart-ui/**` and `@shared/smart-ui/**`:**
  `dialogs/edit-<X>-item-dialog.spec` → `<domain>/smart-ui/`; `dialogs/{categories,edit-category}-dialog.spec` + `category-input`/`item-edit-modal` → `@shared/smart-ui/`; `shopping-action-sheet.spec` → `shopping/smart-ui/`.
- **Renderers/forms → `<domain>/ui/**` and `@shared/ui/**`:**
  `item-list-items/{global,shopping,storage,task}-item.spec` → `<domain>/ui/`; `category-item`/`text-item`/`item-list*`/`forms/*`/`page-header`/`list-page` → their `@shared` homes.
- **Pages → `<domain>/feature/**`:** `pages/{globals,shopping,storage,tasks,settings}.page.spec`. **Skip `pages/home/home.page.spec`** — the ion-tabs home shell was discarded (no tab shell in the independent model).
- **App-level:** `state/application.effects.spec` + `state/message.effects.spec` → fold assertions into new `src/app/{app.effects,app.message.effects}.spec.ts` (see A2).

Each ported spec needs: renamed imports/actions/selectors/types (§2), `grocery.` i18n where asserted, and `@shared/testing` helpers. Then `pnpm test` should climb well past 156.

### A2. Backfill effects specs for TT effects (no specs today)
`app.effects.ts`, `app.message.effects.ts`, `grocery-list.effects.ts`, `item-dialogs.effects.ts`, `tracking/data/{tracking,item-list}.effects.ts`, `office-time/data/office-time/office-time.effects.ts`, `notifications/data/{notifications,notifications-from-tracking}.effects.ts`, `tracking/data/dialogs/dialogs.effects.ts`. Template: KB's `storage.effects.spec` — `provideMockActions(() => actions$)` + `firstValueFrom`.

### A3. e2e (Playwright, `playwright.config.ts` port 4321)
Port KB `e2e/{helpers.ts, shopping, storage, tasks, settings, navigation}.e2e.ts` → `e2e/helpers.ts` (extend with TT flows) + `e2e/grocery/*`. **Rewrite path→hash routing:** `page.goto('/home/…')` → `/#/<feature>/…`, `/settings` → `/#/list-settings`. KB `settings.e2e.ts` → `e2e/grocery/settings.e2e.ts` (do NOT overwrite TT's top-level `e2e/settings.e2e.ts`). Add `e2e/grocery/first-paint.e2e.ts` asserting each `/#/<feature>/:listId` renders its first item.

---

</details>

## 4. Follow-up B — shadowrun re-skin audit — ✅ DONE

Product decisions taken (2026-07-12): **header tint → dropped** for uniform amber chrome; **deck-tile codenames → kept** (MARKET/STASH/AGENDA/CATALOG); **globals route → renamed `/globals` → `/database`** (listId stays `_globals`).

Delivered:
- **Uniform amber chrome** — `grocery-list-page`'s `color` is now optional; the grocery pages omit it, so `page-header` + `item-list` fall back to the default shadowrun amber (matching timetracker). Per-domain identity lives on the deck tiles only. Category-mode still shifts the accent (`headerColor` → `'category'`).
- **i18n** — every remaining hardcoded string moved to `grocery.*` (~28 new keys in `de.json`/`en.json`): the 5 `Delete` buttons, item notes (`min-amount`/`best-before`/`prio`/`due`), edit-dialog labels, the globals best-before timespan options, the `Mhd`/`Prio`/`Termin` sort buttons, and the whole `list-settings` page. Also fixed a raw-key render (`edit.item.dialog.dueAt` was missing the `grocery.` prefix in the task edit dialog).
- **Route rename** — `/database/:listId` (route/tile/menu/e2e/CLAUDE.md).
- **Screenshot-verified** across storage / tasks / list-settings / database — uniform amber, AA-legible amber-on-near-black, all labels resolving.

**Minor cosmetic left:** the longest list-settings toggle label ("Kategorie-Schnellhinzufügen anzeigen") truncates with a graceful ellipsis at 430px — shorten the German if the ellipsis bothers you. Empty component `.scss` files verified inert (nothing relied on KB's brown/grey).

---

## 5. Follow-up C — native / PWA — ✅ DONE (except deferred CI)

Decision (2026-07-12): **`android/` stays git-ignored** (regenerated on demand), rather than committed — the manifest edits are re-applied by a committed idempotent script instead of baking a large generated tree into `main`.

Delivered:
- **`scripts/android-postsync.sh`** — idempotent; run after `pnpm run build && npx cap add android && npx cap sync android`. Re-applies the `CAMERA`/`FLASHLIGHT`/`POST_NOTIFICATIONS` permissions, the mlkit `barcode_ui` `meta-data` (inside `<application>`), and `versionName 1.0.0`/`versionCode 1`. Verified against a freshly-generated `android/` and re-run for idempotency. (The generated activity `configChanges` is already the rich Capacitor-8 set — no augmentation needed.)
- **PWA manifest** (`public/manifest.webmanifest`) retuned: `name` `CommLink`, `short_name` `CL`, `theme_color`/`background_color` `#0f141b`. Added a matching `<meta name="theme-color">` + `<title>CommLink</title>` to `src/index.html`. Icons stay the timetracker placeholders (shadowrun icon redesign deferred).
- Identity confirmed `np.afterwork.commlink` / `commlink` in `capacitor.config.ts` + `ionic.config.json` (unchanged).

**Still deferred:** the actual APK build (Android Studio, needs the Android SDK — out of this environment), a shadowrun PWA icon redesign, and **CI** (`.github/workflows/*` — a product decision re secrets/targets; neither source repo's CI was ported).

---

## 6. Commands & verification protocol

```bash
cd ~/Projects/xprivate/np-commlink
pnpm build                              # esbuild; watch for the commlink.page.scss budget WARNING (expected)
rm -rf .angular/cache && pnpm build     # do this after any config change (cache masks errors)
npx sheriff verify src/main.ts          # boundary check — must say "No issues found"
npx eslint "src/**/*.ts"                # 0 problems
pnpm test                               # Vitest (currently 156)
pnpm e2e                                # Playwright (after A3)
# Runtime smoke (screenshot):
npx http-server www/browser -p 8783 -s & 
node ~/.claude/skills/screenshot/screenshot.mjs "http://localhost:8783/#/storage/_storage" --out=/tmp/s.png --width=430 --wait=1200
```

**Definition of done for each follow-up:** build clean-cache + sheriff + lint + test all green, and (for UI/re-skin) a screenshot confirming the page renders in shadowrun style. Commit per logical step (Conventional Commits), tree buildable after each.

## 7. Open product questions (from merge-plan.md §7)
1. Deck-tile codenames (MARKET/STASH/AGENDA/CATALOG) — keep or rename to plain SHOPPING/STORAGE/TASKS/GLOBALS?
2. Scanned-EAN UX — currently opens the global-item edit dialog prefilled (`ItemDialogsActions.openEditGlobalItem`). Alternative: match existing globals + add-to-shopping.
3. `globals` route/label — selector `app-page-database` kept; route `/globals`. Rename to `/database`?
4. Per-domain header `color` tint (see §4) — keep or drop.
