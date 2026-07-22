# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`np-commlink` — Ionic 8 + Angular 21 (standalone, zoneless) + Capacitor 8 app. It is the **merge of two apps**: `np-timetracker` (time/office tracking, the structural + visual base) and `np-kitchen-bot` (shopping / storage / tasks / globals grocery lists, grafted in as independent features). One Shadowrun/cyberdeck look throughout. Ships as a web app (PWA) and an Android APK.

The current architecture (who talks to whom, and why) lives in **`docs/architecture.md`** — read it before touching the grocery subsystem. The merge decision log and refactor history are in the git commit log; open/deferred work is in `docs/open-tasks.md`.

> We work trunk based. so only on the main branch. if you must use a worktree instead of a branch but try to just keep up with other changes and work on the main.


## Commands

- `pnpm start` — dev server (`ng serve`). `pnpm run build` — prod web build (`www/browser`).
- `pnpm test` — Vitest via `@angular/build:unit-test` (one-shot). `pnpm run e2e` — Playwright (`e2e/`, port 4321).
- `pnpm exec eslint "src/**/*.ts"` — lint (flat `eslint.config.js`: angular-eslint + @ngrx + Sheriff + prettier).
- `pnpm run i18n:extract` — extract `marker(...)` keys into `src/assets/i18n/de.json`.
- `pnpm run build:android` — `ionic capacitor build android`.

> **Testing philosophy** (inherited from timetracker). Lean, not exhaustive. Two layers:
> - **Vitest unit — pure logic** (`*.spec.ts`): utils, pipes, reducers, selectors (via `.projector(...)`). No `TestBed` where a plain call suffices.
> - **Vitest unit — component class logic** (`*.component.spec.ts`): `TestBed.createComponent(...).componentInstance` + `provideMockStore()` + `provideZonelessChangeDetection()`. **Do not `detectChanges()`** — jsdom doesn't run Stencil, so `ion-*` are inert; rendered-DOM assertions belong in e2e.
> - **Playwright e2e**: real-browser behavior. Scope content assertions with `#main-content` (the side menu duplicates page titles) and use **hash routing** URLs (`/#/storage/_storage`).
>
> Shared test infra is at `src/app/@shared/testing/` (`test-data.ts` deterministic factories, `test-providers.ts`), reachable only from `*.spec.ts` (Sheriff `type:testing`). NgRx **effects stay RxJS**. Rely on Vitest `globals:true` — do **not** `import … from 'vitest'`.

## Architecture

> **⚠️ Re-domained (2026-07, branch `feature/ddd-refactor`).** The grocery subsystem was
> restructured by a DDD refactor: `shopping`/`storage`/`products` (was `globals`) are now
> features of a **single `groceries` domain** (`src/app/groceries/`); `tasks` is its own domain,
> sealed off the grocery engine via a `ListPageFacade` (`@shared/data/list/`); the shared page
> is the domain-blind `list-page` (was `grocery-list-page`); `notifications` and `commlink` no
> longer import any domain (inverted behind `@shared` `notify`/`dashboardTelemetry` contracts);
> and the grocery cluster + `tasks` are **lazy** (co-hydrated via a route resolver). Some
> descriptions below predate this — **`docs/architecture.md` is the current, authoritative
> structure.**

Standalone app bootstrapped from `src/main.ts` (no `AppModule`). All providers (router, store, effects, Ionic, translate, storage) are wired in `bootstrapApplication(...)`.

### Folder layout (Hahnekamp-style, Sheriff-enforced)

Domain-first, sliced by type; every dir carries a `domain:*` + `type:*` tag (`sheriff.config.ts`).

```text
src/app/
  app.component.* / app.routes.ts / app.effects.ts / app.message.effects.ts   ← type:shell
  grocery-list.effects.ts / item-dialogs.effects.ts                            ← type:shell (grocery orchestrators)

  @shared/                                          ← domain:shared
    types.ts (type:model)  testing/ (type:testing)
    data/   ( item-list/ [tracking-flavoured] · grocery-list/ [multi-list engine]
              item-dialogs/ · list-settings/ · quick-add/ · application.actions · router.selector )
    util/   ( database.service · migrations · app.factory · item.factory · app.utils ·
              categories.pipe · barcode-scanner.service · pipes/ )
    ui/     ( item-list/ + subcomponents · category-item/ · category-note.directive ·
              grocery-search-result/ · page-header/ · forms/ · text-item/ · wordclock/ )
    smart-ui/ ( item-edit-modal · category-input · categories-dialog · edit-category-dialog ·
                item-list-quick-add )
    feature/  ( grocery-list-page — the shared grocery page shell )

  commlink/ tracking/ office-time/ notifications/ barcode/       ← timetracker domains (unchanged)
  kitchen/feature/kitchen-page/                                   ← SOYKAF standby stub (unchanged)
  shopping/ storage/ tasks/ globals/                              ← grocery feature domains
    data/ ui/ smart-ui/ feature/
  list-settings/feature/list-settings-page/                      ← grocery feature-flags page
```

**Sheriff dep rules** (`pnpm exec sheriff verify`): domains sealed (`domain:* → sameTag, domain:shared`). After **sheriff-tighten** there are **no** explicit cross-domain bridges left — every domain is sealed to the default. `barcode` now owns its own `barcode` slice (the SIGIL badge), so the last bridge `barcode→office-time` is gone (§1); the old grocery bridges (`shopping↔storage`, `shopping/storage→globals`) are intra-`groceries` (`sameTag`); `notifications→tracking` and `commlink→…` are inverted behind `@shared` contracts. Type axis: `feature → smart-ui/ui/data/util/model`, `smart-ui → ui/data/util/model` (**strict leaf — no `sameTag`**; a smart component composes dumb UI, never another smart component. The edit-dialog wrappers that compose store-connected sub-components therefore live in `<domain>/feature/`, and `categories-dialog` is rendered by those wrappers instead of nested inside `category-input` — §2), `ui → util/model`, `data → util/model`, `util → model`. `type:testing` may reach any layer but only `*.spec.ts` may depend on it. Each **`<domain>/data/` is a facade barrel** (`index.ts`): outside code imports the folder (`…/data`) and sees only the public facade (action group · published selectors · `*LazyProviders` · any `ListPageFacade`); reducer/effects/internal selectors are encapsulated (deep import = violation). Other layers stay barrel-less (`enableBarrelLess: true` — per-folder, not global). **`@shared` is layered downward:** `@shared/data` holds only genuine NgRx state (the eager `dashboard` + kernel slices, `item-list`/`router` selectors); the list engine's pure logic + contracts + the `NotificationsStore` port live in `@shared/util` (`list.utils`/`list.selector`/`item-list.utils`/`notifications.transforms`, `DashboardActions`/`NotificationsActions`/`item-list` actions, `LIST_FACADE`+`IListPageFacade`). So a domain's `data → @shared` is a downward `data → util`/`model` edge; `sameTag` on `type:data` remains only for intra-slice wiring.

### Routing (`src/app/app.routes.ts`)

Hash routing (`withHashLocation()`). Lazy pages: `commlink` (home/deck), `tracking`, `data/:listId`, `office-time`, `settings`, `barcode`, `notifications`, `soykaf` (**standby stub**), and the grocery routes `shopping/:listId`, `storage/:listId`, `tasks/:listId`, `products/:listId` (was `/database`; listId is `_products`), `list-settings`, plus `cash` and `trackplay/*`. Routes for the **lazy** contexts carry **`providers` (state + effects) + a `moduleHydrationResolver(load, loaded)`** that blocks activation until the scoped `loaded` fires: `tracking` + `data/:listId` (the tracking context — the single `tracking` slice; its edit dialog rides the eager shared `itemDialogs`); `notifications`; the grocery routes (co-register all three slices so cross-list reads never hit an unregistered sibling) + `tasks/:listId`; `cash`; the five `trackplay/*`; `settings` + `office-time` (the office-time context — two slices `officeTimeSettings`+`officeTime` co-registered); and `barcode` (its own single-slice context since sheriff-tighten §1 — was folded into the office-time context while the SIGIL badge lived in `officeTime`). `**` → `commlink`. Titles via `data.title` + `AppTitleStrategy`.

### State (NgRx)

Root (eager) `provideStore` slices are the **kernel only**: `router`, `dashboard` (commlink read-model), the app-global `settings` slice (the persisted schema `version` anchor **plus the selected UI `theme`** — `TTheme`; `SettingsEffects` mirrors it onto `<html data-theme>` via `theme.service` and lifts the boot splash), and `itemDialogs`. (`listSettings`/`quickadd` are **no longer** eager — they were grocery-specific all along and moved into the lazy `groceries` domain in the settings re-scope; the one app-wide thing they carried, the `version`, became the global `settings` slice.) **Every bounded context is now lazy** (`feature/fully-lazy`, completing the deferred §7): `tracking`, `notifications`, `products`/`shopping`/`storage`/`tasks`, `cash`, `trackplay`, `barcode`, and `officeTimeSettings`/`officeTime` register per-route via `provideState` (`<domain>/data/provide-<m>-lazy.ts`) and hydrate in their route's `moduleHydrationResolver`, not eager. The grocery `listSettings` slice is co-registered on the grocery routes (own `[ListSettings] load/loaded` resolver key) and, alone, on `/list-settings` (via `listSettingsLazyProviders` — deliberately not the full grocery context, else its telemetry reporters would `report` zero counts on subscribe). No global load action — each context owns a scoped `[X] load/loaded` lifecycle and its reducer hydrates on its own `loaded`; `main.ts`'s `provideAppInitializer` dispatches only the kernel loads (`settings` + `dashboard`; the theme rides in `settings`).

**§7 (tracking + notifications lazy) — how the cross-cutting couplings were resolved:** the background `runningUpdates$` timer was **deleted** (a notification is a point-in-time event, not a live dashboard); the notification CTA **deep-links** (`/notifications` → `/tracking?cmd=<id>`, a string route — notifications imports no domain); tracking's off-route writes into notifications go through the **durable `NotificationsStore`** (see Persistence), not the reducer; the always-on notification **badge** reads the eager `dashboard` read-model (`selectNotificationsUnread`), never the lazy notifications slice.

> **⚠️ lazy ≠ unloaded on exit.** `IonicRouteStrategy` has no `shouldDestroyInjector` and NgRx `provideEffects`/`provideState` have no per-injector teardown, so a lazy route's injector + effects + state register on **first visit and persist for the session** — modules are **not** mutually exclusive. Two lazy modules that subscribe to the **same** action (e.g. the grocery + tasks dialog orchestrators both listen to the generic `ItemDialogsActions`/`CategoriesActions`) BOTH fire once both are visited (NgRx dedups same-class instances, never different classes) — so each such effect must **guard on the target `listId`** (grocery ∈ `{_storage,_products,_shopping}`, tasks `=== '_tasks'`), reading the same field it routes on. "Lazy" here is a boot-cost win, not memory reclaim.

- **One multi-list engine + shared single-list helpers.** `groceries/data/grocery-list/*` is the multi-list engine (source `[GroceryList]`) — `selectListState` derives the active list from the `:listId` route param via `router.selector` + `stateByListId`. The single-list domains (`tracking`, `tasks`) have **no** separate engine: each owns its slice (`state.tracking`/`state.tasks`) and builds its list flow (add-from-search, sort, search-sync) on the domain-blind `@shared/util/list` helpers (`list.utils`/`list.selector`), driving the shared `ListPageComponent` via its own `*ListPageFacade`. Tracking's former standalone item-list engine (`[ItemList]` shim) + `dialogs` slice were retired onto these shared mechanics + the shared `itemDialogs` open-command (the last timetracker×kitchen-bot merge-duplicate).
- **Grocery slice renames vs kitchen-bot** (to avoid timetracker collisions): store keys `settings→listSettings`, `dialogs→itemDialogs`; action sources `[Settings]→[ListSettings]`, `[Dialogs]→[ItemDialogs]`, `[ItemList]→[GroceryList]`; types `ISettings→IListSettings`, `IEditItemState→IItemDialogState`, `TDialogsState→TItemDialogsState`. **Settings re-scope:** `listSettings`, `quickadd`, and the quick-add row (`ItemListQuickaddComponent`) now live in the `groceries` domain (they were grocery-specific, not shared); the freed bare `ISettings`/`settings`/`[Settings]` names are now the **app-global** version slice (`@shared/data/settings`), and timetracker's own settings type/slice/source were renamed `IOfficeTimeSettingsState`/`officeTimeSettings`/`[OfficeTimeSettings]`. `tasks` dropped its vestigial quick-add entirely.
- **List/dialog orchestrators are per-domain + lazy** (§2b). The old eager shell `grocery-list.effects.ts`/`item-dialogs.effects.ts`/`app.effects.ts` are **deleted**. The grocery multi-list engine + dialog orchestration live in `groceries/data/grocery-list/{grocery-list,grocery-item-dialogs}.effects.ts` (in `groceriesLazyProviders`, scoped to the three grocery lists); `tasks` **and `tracking`** each have their **own switch-free copies** (`tasks/data/{tasks-list,tasks-item-dialogs}.effects.ts`; `tracking/data/{tracking-list,tracking-item-dialogs}.effects.ts` — both `@shared`-only → sealed; tracking's guard on `listId === '_tracking'`, tasks' on `=== '_tasks'`). Each context's save + list-flow + dialog + telemetry effects ride in its own `provide-<m>-lazy.ts` (`tracking/data/{tracking-list,tracking-item-dialogs,tracking-save}.effects.ts`, `notifications/data/notifications-save.effects.ts`, etc.).

### Persistence (`src/app/@shared/util/database.service.ts`)

`@ionic/storage-angular`, DB name `np-commlink`, keys namespaced `npc-<slice>` (+ `npc-summary-<source>` for the persisted dashboard read-model). It is a **dumb per-key port**: `bootstrap()` runs the one eager boot read (the `npc-summary-*` docs, behind an init-once guard); each lazy context reads/writes only its own key via `load<T>(key)` / `save<K>(key, value)` in its own lazy load/save effect. `migrate()` (`migrations.ts`) is kept as a framework but is **empty** (VERSION `'1'`) — migrations no longer run at boot (§6). The schema `version` now lives in exactly one place: the eager app-global `settings` slice (`npc-settings`), seeded on first boot by `SettingsEffects` (the per-slice `version`s on `listSettings` + office-time were dropped in the settings re-scope). `itemDialogs`/`quickadd` are ephemeral and **not** persisted (`quickadd` is grocery-owned now). Fresh-install only — no migration from the old `np-time-tracker` / kitchen-bot databases.

**Durable cross-module write port (§7):** `@shared/data/notifications/notifications.store.ts` (`NotificationsStore`) does a read-modify-write on `npc-notifications` (reusing the pure `notifications.transforms`) + reports the new `unread` to the dashboard read-model. It's how an **off-route** writer (tracking's reconcile/CTA, on `/tracking`) mutates notifications now that its reducer may be unregistered — the reducer path (on `/notifications`) and this durable path share the same pure transforms so they can't drift; the module resolver re-hydrates the slice from this doc on each `/notifications` entry, correcting any staleness. This is the general pattern for lazy-module cross-boundary writes: **share only the durable store + pure transforms, never a live slice.**

### i18n

`@ngx-translate/core`, German default. Flat dotted keys. **All kitchen-bot keys are namespaced under `grocery.`** (`src/assets/i18n/{de,en}.json`) to avoid collisions with timetracker keys. TS keys not used via the `translate` pipe must be `marker('grocery.…')`.

### Types

Centralized in `src/app/@shared/types.ts`. `IItemList<T>` requires `categories`/`mode` (grocery reads them unguarded; the tracking list carries empty defaults). `IDatastore` is the `DatabaseService` ↔ persisted-slice contract.

### Capacitor / Android / two barcodes

`appId np.afterwork.commlink`, `webDir www/browser`. Plugins: the timetracker set + `@capacitor-mlkit/barcode-scanning`. **Two unrelated "barcode" features:** `barcode/` (SIGIL — displays an uploaded badge image, no camera) and `@shared/util/barcode-scanner.service.ts` (mlkit EAN-13 camera scanner, wired to a native-guarded scan button on the shopping/storage pages → opens the global-item dialog). The `android/` folder is **git-ignored and regenerated on demand** (not committed): `pnpm run build && npx cap add android && npx cap sync android`, then `./scripts/android-postsync.sh` re-applies the edits Capacitor strips on every sync — the mlkit `barcode_ui` `meta-data` + `CAMERA`/`FLASHLIGHT`/`POST_NOTIFICATIONS` permissions, and `versionName 1.0.0`/`versionCode 1`. The script is idempotent. The generated activity `configChanges` is already the rich Capacitor-8 set, so it needs no augmentation.

## Theming — two themes (Cyberpunk deck + OK Boomer)

**Two** themes off one token group: **cyberpunk** — the Shadowrun deck (near-black slate, amber + teal neon, monospace, glow, HUD frame; the **default**) — and **OK Boomer** — a plain, light, serious office look (sans-serif, flat surfaces, sentence case, no neon). **Do not restyle components one by one** — retheme the CSS custom properties. The active theme is the **`<html data-theme>`** attribute (default `cyberpunk`), driven by the eager `settings` slice (`selectTheme` · `SettingsActions.setTheme` · picker on `/settings`) and applied by `SettingsEffects.applyTheme$` via `@shared/util/theme.service` (also sets `<meta theme-color>` + native status-bar style). The async boot read is covered by a boot **splash** (`@shared/util/splash.service` + `index.html #app-splash` on web / `@capacitor/splash-screen` `launchAutoHide:false` on native) revealed once the theme is applied — so the theme resolves before first paint, no flash. Plan/rationale: `docs/theming-two-themes-plan.md`.

- **Plain = base, cyberpunk = opt-in.** `src/theme/_shadowrun.scss` owns the `--sr-*` palette + `src/theme/variables.scss` the Ionic `--ion-*` chrome; the **base `:root` holds the plain OK-Boomer values**, and the amber/teal-on-slate deck values live under **`:root[data-theme='cyberpunk']`** (so a new surface reads plain unless it opts in — "serious looks serious" by construction). **"Flip" tokens** turn structural axes into per-theme values so components reference a token, never a literal: `--sr-deck-font` (sans↔mono), `--sr-heading`/`label`/`brand-transform` + `-tracking` (case + spacing), `--sr-radius`, `--sr-glow`/`-lg` (→ `none` in plain). Component SCSS must use these tokens (not hardcoded `uppercase`/`letter-spacing`/`--sr-mono`); purely-decorative effects (glitch, grid overlay, scanlines, LED glow, hud gradient/bevel) are gated under `:root[data-theme='cyberpunk']` / `:host-context([data-theme='cyberpunk'])`. Every surface is uniform amber (`primary`) / teal (`secondary`); `TColor` (`@shared/types.ts`) is Ionic's base palette. `@use`d once from `src/global.scss` (which also carries the Android safe-area map + `body.scanner-active` transparency).
- Deck signature pieces are **theme-aware Sass mixins** in the side-effect-free `src/theme/_deck.scss`: `panel-base` (flat) vs `panel-cyber` (gradient+bevel), `led-base` (solid dot) vs `led-glow` (bloom+pulse), `hud-corners`, `brand`; `_shadowrun.scss` wraps them as the global `.sr-panel`/`.sr-corners`/`.sr-led*`/`.sr-brand*` classes (base emitted always, cyber variant under the deck selector). Consume via `var(--sr-*)` / the `.sr-*` classes, or `@use 'theme/deck'` + `@include` where a class can't reach (`:host`/pseudo-elements); **never `@use 'theme/shadowrun'` from a component** (it emits global CSS).
- `/commlink` deck is the reference cyberpunk expression; `/soykaf`, `/trackplay`, and the grocery/office-time pages all read the same shared classes. The 5 timetracker + 4 grocery programs render as HUD tiles (SOYKAF stays `standby`).
- **Adding a third theme** = add plain-relative values on the base `:root`, a `:root[data-theme='<name>']` override block (Ionic `--ion-color-*` + `--sr-*` + flip tokens), a `TTheme` union member, and a picker option. `theme/palettes/_example.scss` is the older `.ion-palette-<name>` seam reference (superseded by `data-theme`) — do **not** import Ionic's prebuilt `dark.class.css`.
- **Still open (re-skin audit):** the grocery/cash dialog surfaces still want a contrast-vs-amber + monospace-clipping pass, the cash report chart + `_charts.scss` use off-theme hexes, and a few hardcoded German button labels ("Mhd"/"Liste"/"Kategorien") remain — see `docs/open-tasks.md`.

## Deployment

PWA build (`pnpm run build` → `www/browser`; manifest identity `CommLink`/`CL`, `theme_color`/`background_color` `#0f141b`) + Android APK (Android Studio, after `cap add`/`cap sync` + `scripts/android-postsync.sh`; `android/` is git-ignored — see Capacitor section). PWA icons are still the timetracker placeholders (shadowrun icon redesign deferred). CI wire-up (`.github/workflows/*`) is **deferred** — not yet ported from either source repo.
