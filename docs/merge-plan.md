# np-commlink — Merge Plan (revised: independent features)

**Sources**
- APP A — `np-timetracker` v2.1.0 → `/Users/mpstaerk/Projects/xprivate/np-timetracker`
- APP B — `np-kitchen-bot` v0.4.3 → `/Users/mpstaerk/Projects/xprivate/np-kitchen-bot`

**Target** — `/Users/mpstaerk/Projects/xprivate/np-commlink`.

**Hard user constraint** — merged app MUST use timetracker's "shadowrun" visual style for EVERYTHING.

**Revision (2026-07-12)** — kitchen-bot is NOT grafted as a single bundled `kitchen/`
sub-module under a `/soykaf` tab shell. Instead each of its lists becomes an
**independent top-level DDD feature** (`shopping`, `storage`, `tasks`, `globals`),
mirroring how `tracking` / `office-time` / `notifications` already stand alone.
**`/soykaf` stays the SOYKAF standby stub** (timetracker's `kitchen/` domain is
untouched). This revision is possible cleanly because kitchen-bot's four lists are
**not coupled to each other** in code (verified — see §1.1); all cross-list logic
lives in a shared selector (reads root state by type) and in app-root effects.

---

## 1. Feasibility verdict

**Yes, feasible — and cleaner as independent features than as a bundled module.**

- timetracker already ships the DDD + Sheriff scaffold (`<domain>/{data,feature,smart-ui,ui,util}`) that new top-level domains slot into with zero structural change.
- Stacks are aligned: Angular 21.2.x, Ionic 8, Capacitor 8, NgRx 21.1.x, dayjs, ngx-translate, Vitest + Playwright, pnpm. Only trivial patch drift.
- Product-feature sets are DISJOINT — timetracker owns tracking / office-time / notifications / image-barcode; kitchen-bot owns shopping / storage / tasks / globals. No feature is discarded.
- The two "barcode" concepts do NOT overlap and both survive under distinct names (SIGIL image display vs a real mlkit scanner service — see §5.3).
- The store-key collisions (`settings`, `dialogs`) are real but resolved by moving kitchen-bot's shared slices into `@shared` under renamed keys (`listSettings`, `itemDialogs`).

### 1.1 Why independent features work (verified coupling analysis)

Grepped across `np-kitchen-bot/src/app`:

- **No grocery state slice imports another grocery slice.** `globals`, `shopping`, `storage`, `tasks` reducers/actions/effects/selectors are mutually independent.
- The only runtime cross-references are in **`state/application.effects.ts`** and **`state/message.effects.ts`** — both app-root orchestrators (init/save-on-change/toasts). They fold into timetracker's root `AppEffects` / `AppMessageEffects`, where depending on every domain is legal (composition root).
- The cross-list "show globals in storage" / "show shopping in globals" logic lives entirely in **`state/@shared/item-list.selector.ts`**, which reads the **root `IAppState` by property access** (`state.globals.items`, `state.settings.showGlobalsInStorage`, …) — a *type-level* dependency on `@shared/types`, NOT a runtime import of any feature domain.
- Every page imports only its OWN feature slice + the shared dialogs slice. Every edit-dialog imports only its own feature's selector.

⟹ Splitting into `domain:shopping` / `domain:storage` / `domain:tasks` / `domain:globals` needs **zero cross-domain Sheriff bridges**. Each depends only on `domain:shared`. The coupling stays where it belongs: in `@shared` (type-level) and the app root (effects).

---

## 2. Executive summary

**Strategy: adopt np-timetracker as the structural, visual, and shell base; graft each kitchen-bot list as its own independent top-level domain; hoist kitchen-bot's genuinely-shared machinery (generic item-list, categories, quick-add, edit-item modal, item factories, mlkit scanner, cross-list settings + dialog slices) into `@shared`.**

The base is np-timetracker because (a) the repo is named after its home deck (`commlink`), (b) it already contains the DDD + Sheriff structure, (c) the shadowrun constraint forces its theme system and shell. Kitchen-bot is treated as four product FEATURES plus a shared kit, plus a handful of genuinely-better bits already LIFTED in commits 1–16 (flat ESLint, project-service TS parser, mobile browserslist, `@ngrx/router-store`, `src/testing/` factories, effects-test discipline, `e2e/helpers.ts`, Android edge-to-edge `--ion-safe-area-*` mapping, `body.scanner-active` transparency).

The merged `src/app/` becomes: TT shell + `commlink/` (deck) + `tracking/` + `office-time/` + `notifications/` + `barcode/` (SIGIL) **unchanged**; `kitchen/feature/kitchen-page` **kept as the SOYKAF standby stub, unchanged**; four NEW independent domains `shopping/` `storage/` `tasks/` `globals/`, each `{data,ui,smart-ui,feature}`; one thin `list-settings/` domain (settings page only); and an enriched `@shared/` holding the cross-cutting slices, the categories/quick-add kit, the item factories, and the barcode scanner service.

`appId` is `np.afterwork.commlink`, `appName` `commlink` (landed in commit 12). Angular/ionic project keys are `np-commlink` (commits 12/15). Ionic Storage is unified onto DB `np-commlink` / prefix `npc-`. Both `android/` folders are discarded and regenerated (`cap add android` + `cap sync`) with the mlkit manifest edits re-applied.

**Progress:** commits **1–16 are complete** (init/tooling + verbatim TT domain copies + configs + deps + flat lint — all TT-side, all unaffected by this revision). Commit **17 (global.scss deltas) is applied and pending commit.** This document's §6 lists the remaining ordered commits.

---

## 3. Decision matrix (deltas from the original)

The build/tooling, lint/format, theming, testing, and native rows are unchanged
and already realized in commits 1–16. The two rows the revision changes:

| Dimension | Resolution (revised) |
|---|---|
| **Project structure & boundaries** | DDD `<domain>/{data,feature,smart-ui,ui,util}` enforced by Sheriff. Kitchen-bot's four lists become **four independent top-level domains** (NOT one `kitchen` domain, NOT a tab shell). Verified decoupled (§1.1) ⟹ no cross-domain bridges. Genuinely-shared kit → `@shared`. |
| **NgRx state** | TT structure + KB content. Adopt `@ngrx/router-store` (active list derived from `:listId`). PascalCase action consts, singular `.selector.ts`. Colliding KB root keys moved into `@shared` under renamed keys: `settings`→`listSettings`, `dialogs`→`itemDialogs`. Colliding action sources renamed: `[Settings]`→`[ListSettings]`, `[Dialogs]`→`[ItemDialogs]`; `[Application]` folded into TT's; `[ItemList]` reconciled into TT's single generic group; `[Categories]`, `[Globals]`, `[Shopping]`, `[Storage]`, `[Tasks]` kept (no TT collision). |

The feature-inventory row changes only in that the kitchen lists are top-level
routes (`/shopping`, `/storage`, `/tasks`, `/globals`, `/list-settings`) instead of
`/soykaf/*` children, and `/soykaf` remains the standby stub.

---

## 4. Target architecture

### 4.1 Folder layout (final)

```
src/app/
├── app.component.{ts,html,scss}      # TT ion-menu shell; menu gains grocery entries; SOYKAF entry unchanged (→ stub)
├── app.routes.ts                     # TT routes + /shopping /storage /tasks /globals /list-settings ; /soykaf STAYS → stub
├── app.effects.ts app.message.effects.ts   # TT + folded KB application/message orchestration (init, save fan-out, toasts)
├── app-title.strategy.ts
├── @shared/
│   ├── types.ts                      # union: TT + KB item/list/settings/dialogs/quick-add types + router: RouterReducerState
│   ├── data/
│   │   ├── application.actions.ts    # TT-owned [Application]; KB's [Application] actions fold in here
│   │   ├── router.selector.ts        # NEW: createFeatureSelector<RouterReducerState>('router') + getRouterSelectors()
│   │   ├── item-list/*               # reconciled generic machinery ([ItemList]); stateByListId registry maps :listId → slice
│   │   ├── item-dialogs/*            # KB 'dialogs' slice → key `itemDialogs`; [Dialogs]→[ItemDialogs], keep [Categories]; +openEditGlobalItem
│   │   ├── list-settings/*           # KB 'settings' slice → key `listSettings`; [Settings]→[ListSettings]; ISettings→IListSettings
│   │   └── quick-add/*               # KB 'quick-add' slice → key `quickAdd`; [Categories]
│   ├── smart-ui/
│   │   ├── list-page/                # generic list page (reconciled TT tracking ↔ KB)
│   │   ├── item-edit-modal/          # generic edit modal (reconciled)
│   │   ├── categories-dialog/        # shared category picker
│   │   └── edit-category-dialog/     # shared category editor
│   ├── ui/
│   │   ├── item-list/*  (+ item-list-quick-add)  forms/{date,item-name,number}-input  page-header/  text-item/  wordclock/
│   │   ├── category-item/            # shared category renderer
│   │   ├── forms/category-input/     # shared category form control
│   │   └── category-note.directive.ts
│   └── util/
│       ├── database.service.ts ui.service.ts        # unified (TT + KB folded)
│       ├── app.factory.ts app.utils.ts              # base item + uuid etc. (TT + KB merged)
│       ├── item.factory.ts                          # createGlobal/Shopping/Storage/Task item (from KB app.factory)
│       ├── barcode-scanner.service.ts               # NEW: mlkit service (from KB app.component lines 13–127)
│       ├── categories.pipe.ts
│       ├── migrations.ts  pipes/*
│       └── testing/{test-data.ts,test-providers.ts} # KB helpers, unified IAppState  [type:testing]
├── commlink/feature/commlink-page/   # TT — deck; gains tiles for the four grocery programs; SOYKAF tile STAYS standby
├── tracking/{data,feature,smart-ui,ui,util}/    # TT verbatim
├── office-time/{data,feature,smart-ui,ui,util}/ # TT verbatim (owns SIGIL data URL)
├── notifications/{data,feature,util}/           # TT verbatim
├── barcode/{feature,smart-ui}/                  # TT verbatim — SIGIL image display
├── kitchen/feature/kitchen-page/     # STUB — UNCHANGED (domain:kitchen). /soykaf = standby.
├── shopping/                         # NEW domain:shopping
│   ├── data/     (shopping.{actions,reducer,effects,selector}.ts + specs — [Shopping])
│   ├── ui/       (shopping-item/)
│   ├── smart-ui/ (edit-shopping-item-dialog/, shopping-action-sheet/)
│   └── feature/  (shopping-page/)
├── storage/                          # NEW domain:storage
│   ├── data/     (storage.* — [Storage])
│   ├── ui/       (storage-item/)
│   ├── smart-ui/ (edit-storage-item-dialog/)
│   └── feature/  (storage-page/)
├── tasks/                            # NEW domain:tasks
│   ├── data/     (tasks.* — [Tasks])
│   ├── ui/       (task-item/)
│   ├── smart-ui/ (edit-task-item-dialog/)
│   └── feature/  (tasks-page/)
├── globals/                          # NEW domain:globals (master-product catalog)
│   ├── data/     (globals.* — [Globals])
│   ├── ui/       (global-item/)
│   ├── smart-ui/ (edit-global-item-dialog/)
│   └── feature/  (globals-page/)      # KB selector app-page-database KEPT; class DatabasePage → GlobalsPage
└── list-settings/                    # NEW thin domain:list-settings (page only; slice lives in @shared)
    └── feature/list-settings-page/    # class SettingsPage → ListSettingsPage; dispatches ListSettingsActions
```

Root config files unchanged from commits 1–16 (`sheriff.config.ts`, `eslint.config.js`,
`angular.json`, `capacitor.config.ts`, `package.json`, tsconfigs, etc.).

### 4.2 Sheriff boundary model

Copied from timetracker verbatim (commit 12) — `enableBarrelLess: true`, no tsconfig
`paths`, two-axis `domain:*/type:*` auto-tagged from `src/app/<domain>/<type>`. The new
top-level folders (`shopping/`, `storage/`, `tasks/`, `globals/`, `list-settings/`) are
auto-tagged `domain:<name>`. Cross-domain edges:

- **Among grocery domains: NONE** (verified §1.1). Each depends only on `domain:shared`.
- Existing TT bridges (`notifications→tracking`, `barcode→office-time`, `commlink→notifications+office-time`) stay.
- Optional future bridge `commlink → shopping|storage` iff a deck tile surfaces live low-stock/unbought telemetry — deferred (§7).
- New `type:testing` tag (commit 26) may depend on any domain's `data`/`util`/types; restricted from import by non-spec files.

The verification promise stands: `pnpm lint` runs immediately after the first grocery
data slice lands so boundary violations surface early.

### 4.3 State organization (`src/main.ts`)

Single root `provideStore`:

```
router, settings, tracking, dialogs, officeTime, notifications,   // from TT (dialogs/settings = TT's own)
listSettings, itemDialogs, quickAdd, globals, shopping, storage, tasks   // grocery (shared + per-feature)
```

**Renamed KB keys** (avoid clobbering TT's `settings`/`dialogs`):
- KB `settings` → `listSettings` (reducer key + selectors; `ISettings` → `IListSettings`).
- KB `dialogs` → `itemDialogs`.
- KB `quick-add` → `quickAdd` (no collision; normalized casing).
- KB `globals`/`shopping`/`storage`/`tasks` → kept as-is (unique).

**Renamed action-group sources** (avoid identical `[Source] Name` type strings):
- KB `[Settings]` → `[ListSettings]`; `[Dialogs]` → `[ItemDialogs]`.
- KB `[Application]` → dropped; its actions fold onto TT's `[Application]` group.
- KB `[ItemList]` → reconciled into TT's single generic `[ItemList]` (one group).
- `[Categories]` (KB dialogs + quick-add), `[Globals]`, `[Shopping]`, `[Storage]`, `[Tasks]` → kept.
- TT consts simultaneously normalized to PascalCase (commit 20).

**Effects at root** (`AppEffects` + `AppMessageEffects`, TT location): init (`switchMap` + `catchError` toast fallback), `saveOnChange$` fan-out extended to grocery slices, `saveNotificationsOnChange$`, KB's `listIdByPrefix`/`actionsByListId` fan-out folded in (using renamed sources), `MessageEffects` toasts. **Feature effects registered independently:** `GlobalsEffects`, `ShoppingEffects`, `StorageEffects`, `TasksEffects`, `ListSettingsEffects`, `ItemDialogsEffects`. (KB `ApplicationEffects`/`MessageEffects` classes cease to exist — folded, never double-registered.)

**Router selector** — `@shared/data/router.selector.ts` (`createFeatureSelector<RouterReducerState>('router')` + `getRouterSelectors()`). The shared `item-list.selector` derives `stateByListId` from `:listId`.

**Router strategy** — keep TT's `withHashLocation()`. Unit-verified (commit 22) that `selectRouteParams` fires under hash URLs (`/#/storage/_storage`) before any list-page depends on it.

**Ionic Storage** — `provideIonicStorageAngular({ name: 'np-commlink', driverOrder: [IndexedDB, LocalStorage] })` in `main.ts`; single unified `DatabaseService`.

**ngx-translate** — TT's `provideTranslateService(...)` (loader `assets/i18n/`, `defaultLanguage: 'de'`, `fallbackLang: 'en'`).

**Unified `IAppState`** in `@shared/types.ts` — union of TT + KB slices + `router`.
**Unified `IDatastore`** in `database.service.ts` — one DB (`np-commlink`), one prefix (`npc-`), TT migrations extended additively with KB's version step.

### 4.4 Theming

- `src/theme/{variables,_shadowrun,_charts,_dashboard,_consts}.scss + _flex-utils.css` from TT verbatim (commit 3).
- `src/global.scss` = TT base + KB deltas (commit 17): `--ion-safe-area-*` map, `html,body` background (fallback retuned `#2b2b2b`→`#0f141b`), `[hidden]`, and `body.scanner-active ion-content { --background: transparent }` (targets `ion-content` to out-specify shadowrun's `ion-content` radial-gradient).
- Grocery ion-colors (`storage`, `shopping`, `task`, `global`, `category`) declared in `variables.scss` (commit 18) — RE-TUNED into the shadowrun slate family (one distinct tint each); `category` stays amber `#de8b27`. KB's purple/teal hexes dropped.
- Re-skin audit commits (50–51) walk every ported grocery page/dialog/renderer for contrast against amber `#de8b27`, monospace clipping on long German strings, and `color="primary"` audits.

### 4.5 Testing

- Runner: `@angular/build:unit-test` + Vitest, `globals:true`, coverage-v8 on demand; `tsConfig: tsconfig.spec.json`, `buildTarget: app:build:development`.
- Convention: rely on `globals:true` (no `import … from 'vitest'`). TT specs cleaned in commit 19.
- Shared infra at `src/app/@shared/testing/` (commit 25): deterministic factories (`mockGlobalItem/mockShoppingItem/mockStorageItem/mockTaskItem/mockTrackingItem/…`), `mockAppState()` → full unified `IAppState` incl. `router`; `BASE_TEST_PROVIDERS`, `provideTestingProviders(initialState)`, `provideMockActions` effects helper. `type:testing` Sheriff tag (commit 26).
- Backfill effects specs for TT's uncovered effects (commit 52). Port all KB specs to their new independent-domain locations (commit 53).
- e2e: KB `playwright.config.ts` (port 4321, 180s) + KB `e2e/helpers.ts` extended with TT flows (commit 54). KB e2e specs rewritten path→hash and re-pathed `/home/*`→`/#/<feature>/*` (commit 55). First-paint smoke over every `/#/<feature>/:listId` route (commit 56).

### 4.6 Native / Capacitor / PWA

Unchanged from the original plan (already partly realized in commit 12's
`capacitor.config.ts` with `appId: np.afterwork.commlink`). Plugin UNION (mlkit +
local-notifications) in `package.json` (commit 14, done). PWA manifest identity retune
(commit 57). Android regenerated + mlkit/camera/POST_NOTIFICATIONS manifest edits
re-applied (commits 58–59). The barcode scanner is now a `@shared/util` service wired to
`storage-page`/`shopping-page` behind an `isNativePlatform()` guard.

---

## 5. Feature consolidation

### 5.1 Final feature list (all survive)

| Route | Feature | Owner-source |
|---|---|---|
| `/commlink` | Commlink deck (HOME) — program tiles + live telemetry | TT |
| `/tracking` | Time tracking + timers + create-by-ticket | TT |
| `/data/:listId` | Saved-session stats + charts | TT |
| `/office-time` | MEATSPACE presence dashboard, wordclock | TT |
| `/settings` | Office-time dashboard-card toggles | TT |
| `/barcode` | SIGIL — badge image upload/rotate/delete | TT |
| `/notifications` | COMMS inbox + OS local notifications | TT |
| `/soykaf` | **SOYKAF standby stub (unchanged)** | TT |
| `/shopping/:listId` | Shopping list — add, ±, buyItem, share | KB → independent domain |
| `/storage/:listId` | Pantry — quantity, minAmount low-stock, bestBefore, categories, copy-to-shopping | KB → independent domain |
| `/tasks/:listId` | Task/todo list — dueAt, prio, categories | KB → independent domain |
| `/globals/:listId` | Globals — master products (unit, packaging, weight, bestBeforeTimespan) | KB → independent domain |
| `/list-settings` | Grocery feature flags (showQuickAdd, showGlobalsInStorage, …) | KB → `list-settings` domain |

Default route stays `/commlink`; `**` → `/commlink`.

### 5.2 Kitchen-bot → independent domains (restructuring map)

Each KB list becomes a self-contained domain. Refactor = file-moves + import fixups + the store-key/action-source renames above. Templates/logic preserved.

**Per-feature (shopping / storage / tasks / globals)** — for feature `F` with KB item type `X`:
- `state/F/F.{actions,reducer,effects,selector}.ts` (+ specs) → `F/data/`.
- `components/item-list-items/X-item/*` → `F/ui/X-item/`.
- `dialogs/edit-X-item-dialog/*` → `F/smart-ui/edit-X-item-dialog/` (injects Store ⟹ smart-ui). Class names `EditXItemDialogComponent` kept.
- `pages/F/*` → `F/feature/F-page/`.
- Shopping additionally: `dialogs/shopping-action-sheet/*` → `shopping/smart-ui/shopping-action-sheet/` (uses `@capacitor/share`).
- Globals: `pages/globals` selector `app-page-database` KEPT; class `DatabasePage` → `GlobalsPage`.

**Shared machinery → `@shared/`:**
- `state/@shared/item-list.{actions,selector,utils}.ts` → reconciled into `@shared/data/item-list/*` (KB is the superset — router-param `stateByListId`; `[ItemList]` stays TT-owned). `state/@shared/item-list.effects.ts` (generic, listId-driven — verified NOT importing feature slices) → `@shared/data/item-list/item-list.effects.ts`, class `ItemListEffects` reconciled with TT's `TrackingItemListEffects` (both survive).
- `state/dialogs/*` → `@shared/data/item-dialogs/*` (key `itemDialogs`; `[Dialogs]`→`[ItemDialogs]`; keep `[Categories]`; +NEW `openEditGlobalItem({scannedEan})` for the scanner). Holds the generic edit-item-dialog state AND the categories-picker state.
- `state/settings/*` → `@shared/data/list-settings/*` (key `listSettings`; `[Settings]`→`[ListSettings]`; `ISettings`→`IListSettings`).
- `state/quick-add/*` → `@shared/data/quick-add/*` (key `quickAdd`; `[Categories]`).
- `components/item-list/item-list-quick-add/*` → `@shared/ui/item-list/item-list-quick-add/*`.
- Umbrella `components/item-list/item-list.component.*` + sub-components (`item-list-empty`, `-search-result`, `-searchbar`, `-toolbar`) → reconciled into TT's `@shared/ui/item-list/*` (TT visuals win; KB quick-add slot + specs preserved).
- `components/item-list-items/category-item/*` → `@shared/ui/category-item/`; `components/item-list-items/text-item/*` → reconcile with TT's `@shared/ui/item-list-items/text-item`.
- `components/forms/category-input/*` → `@shared/ui/forms/category-input/`.
- `directives/category-note.directive.*` → `@shared/ui/category-note.directive.*`.
- `pipes/categories.pipe.*` → `@shared/util/categories.pipe.ts`.
- `dialogs/categories-dialog/*`, `dialogs/edit-category-dialog/*` → `@shared/smart-ui/` (generic category management).
- `components/pages/list-page/*`, `components/forms/item-edit-modal/*` → reconciled against TT's `tracking/smart-ui/{list-page,item-edit-modal}`; promote to `@shared/smart-ui/` if generic post-diff (documented in merge-notes).
- `app.factory.ts` split: `createBaseItem`/`uuidv4` → `@shared/util/{app.factory,app.utils}.ts` (merge with TT); `createGlobalItem/createShoppingItem/createStorageItem/createTaskItem` → `@shared/util/item.factory.ts` (kept in `@shared` because `@shared/data/item-dialogs` reducer uses `createStorageItem` for its initial placeholder — a per-domain factory would invert the dependency).
- `services/database.service.ts`, `services/ui.service.ts` → folded into TT's `@shared/util/{database,ui}.service.ts` (union `IDatastore`, unified DB name/prefix). KB copies dropped.
- `app.component.ts` mlkit scanner (lines 13–127) → `@shared/util/barcode-scanner.service.ts`.
- `src/assets/{avatar.svg,shapes.svg}` → merged `src/assets/` (already landed commit 11? verify — else add).

**`list-settings` domain** — `pages/settings/*` → `list-settings/feature/list-settings-page/` (class `SettingsPage`→`ListSettingsPage`). The slice itself lives in `@shared/data/list-settings` (shared, read by the item-list selector + quick-add). The page dispatches `ListSettingsActions` from `@shared`.

**DISCARDED from KB in full:** `app.component.{ts,html,scss,spec}` (TT shell owns the app), `pages/home/*` (the ion-tabs shell — NOT used; no tab shell in the independent model), `state/application.{actions,effects}` + `state/message.effects` classes (folded into TT root effects), `state/settings/settings.reducer.ts VERSION` reconciled into unified migrations.

### 5.3 Explicit conflicts / duplicates — resolutions

| Conflict | Resolution |
|---|---|
| **Two "barcode" concepts** | Both survive. TT's `barcode/` (SIGIL image display) untouched. KB's mlkit scanner (KB `app.component.ts` 13–127) → `@shared/util/barcode-scanner.service.ts` (real service; `isSupported=false` hardcode REMOVED). Scan button on storage/shopping behind `isNativePlatform()` guard, dispatching NEW `ItemDialogsActions.openEditGlobalItem({scannedEan})`. |
| **`/soykaf` stub vs KB home** | **Stub kept, unchanged.** KB's `pages/home` ion-tabs shell is DISCARDED (no tab shell). Grocery features mount at their own top-level routes. |
| **Existing `kitchen/` domain in TT** | Kept as-is (SOYKAF standby). Not deleted, not replaced. |
| **i18n key collisions** | Both `i18n/{de,en}.json` are FLAT dotted-key JSON. KB keys namespaced under a flat `grocery.` prefix (no nested object — flat/nested mixing breaks ngx-translate). Six known collisions (`edit-item.dialog.button.close`, `edit.item.dialog.button.{create,update}`, `edit.item.dialog.name`, `edit.item.dialog.title.{create,update}`) resolved by the prefix. Mechanical sed over templates (`\| translate`), TS (`translate.instant/get`), and `marker()` calls in ported files. Post-merge `ngx-translate-extract` diff proves no key dropped/double-prefixed. i18n merge runs BEFORE the first grocery port so no ported file ever renders a raw key. |
| **NgRx feature key collisions** | KB `settings`→`listSettings`, `dialogs`→`itemDialogs`; `quick-add`→`quickAdd`. `globals/shopping/storage/tasks/router` unique. |
| **NgRx action-source collisions** | `[Settings]`→`[ListSettings]`, `[Dialogs]`→`[ItemDialogs]`; `[Application]` dropped/folded; `[ItemList]` reconciled into TT's; `[Categories]/[Globals]/[Shopping]/[Storage]/[Tasks]` kept. |
| **`DatabaseService`/`UiService` class collision** | KB copies dropped; TT's `@shared/util/*` extended to cover all slices. Single DB `np-commlink`, prefix `npc-`. `IDatastore` union. |
| **`SettingsPage` class collision** | KB's `SettingsPage`→`ListSettingsPage` (`/list-settings`). TT's stays `SettingsPage` (`/settings`). |
| **`ItemListEffects` class collision** | KB generic orchestrator reconciled with TT's `TrackingItemListEffects`; the generic listId-driven effects live in `@shared/data/item-list/`. |
| **Item factories in `@shared`** | `createGlobal/Shopping/Storage/Task` live in `@shared/util/item.factory.ts` (not per-domain) because `@shared/data/item-dialogs` reducer references `createStorageItem` for initial state; a per-domain factory would invert `@shared → domain`. |
| **Dependency drift / android / DB name / router / translate / prettier / flex-utils / env / index.html** | As resolved in commits 1–16 and the original plan (unchanged by this revision). |

---

## 6. Migration steps — ordered commit list

Commits 1–16 are **complete** (init/tooling + verbatim TT copies + configs + deps +
flat lint). What follows is the remaining ordered list. Each = one commit, single-line
Conventional Commit. Buildable after every step. Commit 17 is already applied
(uncommitted working tree) and just needs committing.

### Phase C — theme deltas & shared/core plumbing

**17.** `style(global): merge kitchen-bot safe-area, scanner-active, and hidden helpers into global.scss` — **APPLIED** (safe-area map, `[hidden]`, `body.scanner-active ion-content` transparency, bg fallback `#0f141b`) + `docs/merge-notes.md` diff. Files: `src/global.scss`, `docs/merge-notes.md`.

**18.** `style(theme): register grocery ion-colors in slate palette` — add `--ion-color-{storage,shopping,task,global,category}` + `.ion-color-*` to `variables.scss`, re-tuned to shadowrun slate (distinct tint each; `category` amber). Verify `_consts.scss` identity note in merge-notes.

**19.** `refactor(tests): drop redundant vitest imports across specs` — mechanical sed over TT `*.spec.ts` (rely on `globals:true`); verify `tsconfig.spec.json types: ["vitest/globals"]`.

**20.** `refactor(state): normalize selector filenames and action-const casing` — `*.selectors.ts`→`*.selector.ts` (office-time); TT action consts → PascalCase (`TrackingActions`, `SettingsActions`, `OfficeTimeActions`, `NotificationsActions`, `DialogsActions`, `ApplicationActions`) + all import sites.

**21.** `feat(shared): add router feature selector and adopt @ngrx/router-store` — new `@shared/data/router.selector.ts`; in `main.ts` register `router: routerReducer`, add `provideRouterStore()`, `provideIonicStorageAngular({name:'np-commlink',…})`; keep `withHashLocation()`; verify translate config. Git-grep confirms TT had zero prior router-store imports.

**22.** `test(shared): verify router selector under hash routing` — `router.selector.spec.ts`: seed `RouterReducerState` for `/#/storage/_storage`, assert `selectRouteParams → {listId:'_storage'}` + `selectUrl`; cover `/tracking` and `/#/tasks/_tasks`.

**23.** `feat(shared): extend IAppState and IDatastore for grocery slices` — `@shared/types.ts`: add `router`, union item models (`IGlobalItem/IShoppingItem/IStorageItem/ITaskItem`, unit/packaging enums, `IListState<T>`, `IListSettings`, `TItemDialogsState`, `IQuickAddState`). Extend `IDatastore` (globals/shopping/storage/tasks/listSettings/itemDialogs/quickAdd). Extend `migrations.ts` with one additive step seeding the new slices.

**24.** `feat(shared): unify database service prefix and db name` — DB `np-commlink`, prefix `npc-`; loaders/persisters cover grocery slices (no-op until slices land).

**25.** `feat(shared): port kitchen-bot testing helpers under @shared/testing` — `test-data.ts` + `test-providers.ts`, unified `IAppState` incl. `router`.

**26.** `chore(sheriff): allow @shared/testing to depend on data and util layers` — `type:testing` rule + non-spec import restriction; `pnpm lint` green.

### Phase D — shared grocery kit + independent domains

**27.** `feat(i18n): merge grocery translations under grocery. flat namespace` — merge KB `i18n/{de,en}.json` with `grocery.` prefix on every KB key; enumerate the six collisions in merge-notes; `ngx-translate-extract` diff assertion. (Confirm `avatar.svg`/`shapes.svg` present from commit 11; add if missing.)

**28.** `feat(shared): port item-dialogs slice` — KB `state/dialogs/*` → `@shared/data/item-dialogs/*`; key `itemDialogs`; `DialogsActions`/`[Dialogs]`→`ItemDialogsActions`/`[ItemDialogs]`; keep `CategoriesActions`/`[Categories]`; add `openEditGlobalItem({scannedEan})` + reducer entry; register `itemDialogs` + `ItemDialogsEffects`. (Uses `createStorageItem` from `@shared/util/item.factory` — landed in 35; sequence 35 before 28 OR stub initial item, see note.)

**29.** `feat(shared): port list-settings slice` — KB `state/settings/*` → `@shared/data/list-settings/*`; `listSettings`/`[ListSettings]`/`IListSettings`/`ListSettingsEffects`; register.

**30.** `feat(shared): port quick-add slice` — KB `state/quick-add/*` → `@shared/data/quick-add/*`; `quickAdd`/`[Categories]`; register.

**31.** `refactor(shared): reconcile generic item-list machinery with router-store` — merge KB `state/@shared/item-list.{actions,selector,utils}.ts` into `@shared/data/item-list/*` (KB superset; `stateByListId` registry; `[ItemList]` kept); move generic `item-list.effects.ts` in; preserve tracking consumers; port `item-list.{selector,utils}.spec.ts`.

**32.** `feat(shared): promote item-list-quick-add into shared UI` — KB `components/item-list/item-list-quick-add/*` → `@shared/ui/item-list/item-list-quick-add/*` (+spec); verify it stays `type:ui` (no Store) or promote.

**33.** `refactor(shared): reconcile umbrella item-list component and sub-components` — diff KB `item-list.component.*` + sub-components + forms + text-item + page-header against TT's; TT visuals win, KB quick-add slot + specs preserved.

**34.** `feat(shared): port categories UI, dialogs, pipe, directive` — `category-item`→`@shared/ui/category-item/`; `category-input`→`@shared/ui/forms/category-input/`; `categories.pipe`→`@shared/util/`; `category-note.directive`→`@shared/ui/`; `categories-dialog` + `edit-category-dialog`→`@shared/smart-ui/`. Prefix `grocery.` i18n; prettier reindent; port specs.

**35.** `feat(shared): port item factories and merge app utils` — `createGlobal/Shopping/Storage/Task`→`@shared/util/item.factory.ts` (+spec); merge KB `app.utils` (uuid, matchers) into `@shared/util/app.utils.ts`. **Order before 28** (item-dialogs initial state needs `createStorageItem`).

**36.** `feat(shared): port mlkit barcode scanner service` — `@shared/util/barcode-scanner.service.ts` (isSupported/requestPermissions/scan/startScan + Google module install), spec mocking the plugin.

**37.** `refactor(shared): reconcile list-page and item-edit-modal against tracking` — diff KB `components/pages/list-page` + `components/forms/item-edit-modal` vs TT `tracking/smart-ui/*`; promote to `@shared/smart-ui/` if generic (decision in merge-notes); ports specs.

**38.** `feat(globals): port globals as an independent domain` — `globals/{data,ui/global-item,smart-ui/edit-global-item-dialog,feature/globals-page}`; register `globals`+`GlobalsEffects`; class `DatabasePage`→`GlobalsPage` (selector `app-page-database` kept); `grocery.` i18n; prettier; port specs. `pnpm lint` (first grocery domain — Sheriff cadence check).

**39.** `feat(shopping): port shopping as an independent domain` — `shopping/{data,ui/shopping-item,smart-ui/{edit-shopping-item-dialog,shopping-action-sheet},feature/shopping-page}`; register `shopping`+`ShoppingEffects`.

**40.** `feat(storage): port storage as an independent domain` — `storage/{data,ui/storage-item,smart-ui/edit-storage-item-dialog,feature/storage-page}`; register `storage`+`StorageEffects`.

**41.** `feat(tasks): port tasks as an independent domain` — `tasks/{data,ui/task-item,smart-ui/edit-task-item-dialog,feature/tasks-page}`; register `tasks`+`TasksEffects`.

**42.** `feat(list-settings): port grocery settings page` — `list-settings/feature/list-settings-page/*` (class `SettingsPage`→`ListSettingsPage`) dispatching `ListSettingsActions` from `@shared`; port page spec.

**43.** `feat(shared): wire scanner scan-buttons into storage and shopping pages` — add scan button (native-guard) to `storage-page`/`shopping-page` dispatching `ItemDialogsActions.openEditGlobalItem`.

### Phase E — wire routes, shell, effects, re-skin

**44.** `feat(routes): mount grocery feature routes` — `app.routes.ts`: add `/shopping/:listId`, `/storage/:listId`, `/tasks/:listId`, `/globals/:listId`, `/list-settings` with `marker()` titles. `/soykaf` UNCHANGED. `/commlink` default + `**` unchanged.

**45.** `feat(commlink): add grocery deck tiles and side-menu entries` — `commlink.page.ts` gains tiles (status `online`) for SHOPPING/STORAGE/TASKS/GLOBALS routing to `/…/_<default>`; `app.component.html` side-menu gains matching entries. **SOYKAF tile stays `standby`, links to `/soykaf` stub.**

**46.** `feat(effects): fold grocery init/save/message orchestration into root effects` — reconcile KB `state/application.effects` (init + saveOnChange fan-out + `listIdByPrefix`/`actionsByListId`) into `app.effects.ts`; extend `saveOnChange$` with grocery slices; fold KB `state/message.effects` into `app.message.effects.ts`; update fan-out maps to renamed sources. No double-registration.

**47.** `style(grocery): shadowrun re-skin audit — pages` — walk `{shopping,storage,tasks,globals,list-settings}/feature/**/*.scss`: `color="primary"` contrast vs amber, monospace/German clipping, slate ion-colors, drop hardcoded `#2b2b2b`/`#fff`.

**48.** `style(grocery): shadowrun re-skin audit — dialogs and renderers` — same for `@shared/smart-ui/{categories-dialog,edit-category-dialog}`, each domain's `smart-ui/edit-*-item-dialog`, `shopping-action-sheet`, and `*/ui/*-item` + `@shared/ui/{category-item,forms/category-input,category-note.directive}`.

### Phase F — tests

**49.** `test(effects): backfill effects specs for timetracker effects` — author `*.effects.spec.ts` for TT's uncovered effects (`app`, `app.message`, `tracking`, `notifications`, `notifications-from-tracking`, tracking `item-list`, `office-time`, tracking `dialogs`) using `provideMockActions` + `@shared/testing`.

**50.** `test(grocery): port kitchen-bot state, dialog, and page specs` — place every KB spec at its new independent-domain location: `state/*` specs → `<domain>/data/**` and `@shared/data/**`; dialog specs → `<domain>/smart-ui/**` and `@shared/smart-ui/**`; page specs → `<domain>/feature/**` and `list-settings/feature/**`; `application/message` specs folded into `app.effects.spec`/`app.message.effects.spec`. Update to `@shared/testing` + renamed refs.

**51.** `test(e2e): port kitchen-bot e2e helpers` — KB `e2e/helpers.ts` → `e2e/helpers.ts` extended with TT flows; confirm `playwright.config.ts` (port 4321, 180s).

**52.** `refactor(e2e): port grocery specs from path to hash routing` — KB `e2e/{shopping,storage,tasks,globals,settings,navigation}.e2e.ts` → `e2e/grocery/*`; rewrite `page.goto('/home/…')`→`/#/<feature>/…`, `page.goto('/settings')`→`/#/list-settings`. KB `settings.e2e.ts`→`e2e/grocery/settings.e2e.ts` (does NOT overwrite TT top-level `e2e/settings.e2e.ts`).

**53.** `test(e2e): first-paint smoke over every grocery list route` — `e2e/grocery/first-paint.e2e.ts` navigates `/#/shopping/_shopping`, `/#/storage/_storage`, `/#/tasks/_tasks`, `/#/globals/_globals`, `/#/list-settings` and asserts first item rendered (router-store × hash × zoneless CD).

### Phase G — native / PWA

**54.** `feat(pwa): retune manifest identity for commlink` — `public/manifest.webmanifest` name `CommLink`/`CL`, `theme_color`/`background_color` `#0f141b`, `start_url`/`display`; verify `<link rel="manifest">`.

**55.** `feat(android): regenerate android project via cap add` — `pnpm build` → `npx cap add android` → `npx cap sync android`; commit `android/**`; identity `np.afterwork.commlink`/`commlink`, versionName `1.0.0`/versionCode `1`.

**56.** `feat(android): re-apply mlkit, camera, and notification manifest edits` — mlkit `meta-data`, `CAMERA`, `FLASHLIGHT`, `POST_NOTIFICATIONS`; preserve TT activity `configChanges`+`label`; `validateDistributionUrl=true`.

### Phase H — docs & acceptance

**57.** `docs(merge): consolidate CLAUDE.md and record acceptance results` — author `CLAUDE.md` (DDD + Sheriff layout, the four independent grocery domains + `list-settings`, `@shared` grocery kit, store-key/action-source rename conventions, unified DB, two barcodes, theming/re-skin, i18n `grocery.` prefix, e2e hash routing, native re-edits, deferred CI). Record acceptance output (`pnpm install --frozen-lockfile`, `build`, `lint`, `test`, `e2e`, `cap sync`) in `docs/merge-notes.md`. Failures become NEW commits, not amendments.

---

## 7. Risks & open questions

### Structural / state
- **Store-key collisions on `settings`/`dialogs`** — moved to `@shared` under `listSettings`/`itemDialogs`; grep `select(...settings...)`/`select(...dialogs...)` after the ports to confirm each site is scoped correctly.
- **Action-source collisions** — handled by renames (commits 28/29/31) + fold (46); lingering old names surface as compile errors (renamed classes), not silent misfires.
- **Shared item-list selector reads root state by property access** — `@shared/data/item-list/item-list.selector.ts` reaches `state.globals/shopping/storage`; this is a *type* dependency on `@shared/types` (which must declare those slices), NOT a runtime import ⟹ Sheriff-clean, no bridge. If a grocery slice type is missing from `@shared/types`, the selector fails to compile — caught immediately.
- **`stateByListId` registry** — maps `:listId` → slice; grocery listIds (`_shopping/_storage/_tasks/_globals`) are known to `@shared`. Mild abstraction leak (shared knows grocery listIds) inherent to KB's design; acceptable, documented.
- **`@ngrx/router-store` under hash routing** — unit (22) + e2e first-paint (53).
- **Effect double-registration** — KB `Application/Message` effects folded into TT's, never registered alongside.

### Theming
- Scanner regression, primary-contrast flip, domain-color legibility, monospace/German clipping, component style budget — as original plan; audits in commits 47–48. Grocery ion-colors re-tuned to slate (commit 18).

### Native / Capacitor / Data
- mlkit manifest edits lost on `cap sync` (commit 56 re-applies; watch after Capacitor upgrades); `POST_NOTIFICATIONS` for Android 13+; Ionic DB `np-commlink`/`npc-` fresh (no migration bridge — brand-new repo); PWA icons still TT placeholders (redesign deferred).

### Testing
- e2e hash rewrite (52) + first-paint (53); `tsconfig.spec.json` includes `@shared/testing/**` (commit 13, done); effects backfill (49) is a firm gate; Sheriff cadence checked after the first grocery domain (commit 38).

### Deferred as follow-ups
- CI/pipeline; PWA shadowrun icon redesign; iOS folder; chart.js bundle size; beta channel.

### Open questions (unresolved)
1. **Deck-tile display names** — SHOPPING/STORAGE/TASKS/GLOBALS in plain shadowrun caps, or code-names (e.g. STASH/PROVISIONS)? Current plan uses plain caps. Product call.
2. **`list-settings` home** — currently a thin `list-settings` domain at `/list-settings`. Could instead become a section of a unified settings shell with office-time `/settings`. Kept separate = simpler.
3. **Commlink telemetry for grocery** — should tiles show live counts (low-stock, unbought)? If yes, add a `commlink → storage|shopping` Sheriff bridge + selectors. Default: static tiles.
4. **Scanned-EAN UX** — commit 36/43 assume "open edit-global-item dialog prefilled". Alternatives (match+add-to-shopping, settings-gated) deferred.
5. **`globals` route/label** — selector `app-page-database` kept; route `/globals`. Rename to `/database` if preferred.
