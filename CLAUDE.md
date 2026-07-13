# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`np-commlink` — Ionic 8 + Angular 21 (standalone, zoneless) + Capacitor 8 app. It is the **merge of two apps**: `np-timetracker` (time/office tracking, the structural + visual base) and `np-kitchen-bot` (shopping / storage / tasks / globals grocery lists, grafted in as independent features). One Shadowrun/cyberdeck look throughout. Ships as a web app (PWA) and an Android APK.

The full merge decision log, architectural deviations, and acceptance record live in **`docs/merge-notes.md`** — read it before touching the grocery subsystem.

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
> descriptions below predate this — **`docs/target-architecture.md` (esp. §11) is the current,
> authoritative structure.**

Standalone app bootstrapped from `src/main.ts` (no `AppModule`). All providers (router, store, effects, Ionic, translate, storage) are wired in `bootstrapApplication(...)`.

### Folder layout (Hahnekamp-style, Sheriff-enforced)

Domain-first, sliced by type; every dir carries a `domain:*` + `type:*` tag (`sheriff.config.ts`).

```
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

**Sheriff dep rules** (`pnpm exec sheriff verify`): domains sealed (`domain:* → sameTag, domain:shared`). After the re-domaining the **only** explicit bridge is `barcode→office-time` (SIGIL image). The old grocery bridges (`shopping↔storage`, `shopping/storage→globals`) are gone — those are now intra-`groceries` (`sameTag`); `notifications→tracking` and `commlink→…` are gone — inverted behind `@shared` contracts. `tasks`, `notifications`, `commlink` inherit the sealed default. Type axis: `feature → smart-ui/ui/data/util/model`, `smart-ui → smart-ui/ui/data/util/model` (**relaxed** to allow smart-ui composition — kitchen-bot's dialogs compose store-connected sub-components), `ui → util/model`, `data → util/model`, `util → model`. `type:testing` may reach any layer but only `*.spec.ts` may depend on it.

### Routing (`src/app/app.routes.ts`)

Hash routing (`withHashLocation()`). Lazy pages: `commlink` (home/deck), `tracking`, `data/:listId`, `office-time`, `settings`, `barcode`, `notifications`, `soykaf` (**standby stub**), and the grocery routes `shopping/:listId`, `storage/:listId`, `tasks/:listId`, `products/:listId` (was `/database`; listId is `_products`), `list-settings`, plus `cash` and `trackplay/*`. The grocery routes + `tasks` additionally carry **lazy `providers` (state+effects) + a `datastoreHydrationResolver`** — the grocery cluster co-registers all three slices so cross-list reads never hit an unregistered sibling. `**` → `commlink`. Titles via `data.title` + `AppTitleStrategy`.

### State (NgRx)

Root (eager) `provideStore` slices: `router`, `dashboard` (commlink read-model), `settings`/`tracking`/`dialogs`/`officeTime`/`notifications` (timetracker), `quickadd`/`listSettings`/`itemDialogs` (shared grocery kit), `cash`, `trackplay`. The `products`/`shopping`/`storage`/`tasks` slices are **lazy** — registered per-route via `provideState` (`groceries/data/provide-groceries-lazy.ts`, `tasks/data/provide-tasks-lazy.ts`) and hydrated by the route resolver, not eager. Every reducer still hydrates on `ApplicationActions.loadedSuccessfully`.

- **Two item-list engines.** `@shared/data/item-list/*` is tracking-flavoured (`selectListState = state.tracking`, source `[ItemList]`). `@shared/data/grocery-list/*` is the multi-list engine (source `[GroceryList]`) — `selectListState` derives the active list from the `:listId` route param via `router.selector` + `stateByListId`.
- **Grocery slice renames vs kitchen-bot** (to avoid timetracker collisions): store keys `settings→listSettings`, `dialogs→itemDialogs`; action sources `[Settings]→[ListSettings]`, `[Dialogs]→[ItemDialogs]`, `[ItemList]→[GroceryList]`; types `ISettings→IListSettings`, `IEditItemState→IItemDialogState`, `TDialogsState→TItemDialogsState`.
- **Orchestrator effects at the shell root** (`grocery-list.effects.ts`, `item-dialogs.effects.ts`) — they import the four grocery domains, which `@shared` may not, so they live at the composition root. `app.effects.ts` `saveGroceryOnChange$` persists a grocery slice keyed off the dispatched action's source prefix.

### Persistence (`src/app/@shared/util/database.service.ts`)

`@ionic/storage-angular`, DB name `np-commlink`, keys namespaced `npc-<slice>`. `create()` loads the timetracker + grocery slices; `migrate()` (`migrations.ts`) version-checks the timetracker slices. `itemDialogs`/`quickadd` are ephemeral and **not** persisted. Fresh-install only — no migration from the old `np-time-tracker` / kitchen-bot databases.

### i18n

`@ngx-translate/core`, German default. Flat dotted keys. **All kitchen-bot keys are namespaced under `grocery.`** (`src/assets/i18n/{de,en}.json`) to avoid collisions with timetracker keys. TS keys not used via the `translate` pipe must be `marker('grocery.…')`.

### Types

Centralized in `src/app/@shared/types.ts`. `IItemList<T>` requires `categories`/`mode` (grocery reads them unguarded; the tracking list carries empty defaults). `IDatastore` is the `DatabaseService` ↔ persisted-slice contract.

### Capacitor / Android / two barcodes

`appId np.afterwork.commlink`, `webDir www/browser`. Plugins: the timetracker set + `@capacitor-mlkit/barcode-scanning`. **Two unrelated "barcode" features:** `barcode/` (SIGIL — displays an uploaded badge image, no camera) and `@shared/util/barcode-scanner.service.ts` (mlkit EAN-13 camera scanner, wired to a native-guarded scan button on the shopping/storage pages → opens the global-item dialog). The `android/` folder is **git-ignored and regenerated on demand** (not committed): `pnpm run build && npx cap add android && npx cap sync android`, then `./scripts/android-postsync.sh` re-applies the edits Capacitor strips on every sync — the mlkit `barcode_ui` `meta-data` + `CAMERA`/`FLASHLIGHT`/`POST_NOTIFICATIONS` permissions, and `versionName 1.0.0`/`versionCode 1`. The script is idempotent. The generated activity `configChanges` is already the rich Capacitor-8 set, so it needs no augmentation.

## Theming — Shadowrun / np-commlink cyberdeck

One **global** Shadowrun theme (near-black slate, amber + teal neon, monospace, HUD hairlines). **Do not restyle components one by one** — retheme the CSS custom properties.

- Tokens: `src/theme/_shadowrun.scss` (`--sr-*`), base Ionic vars in `src/theme/variables.scss`. Grocery per-domain colors (`storage`/`shopping`/`task`/`global`/`category`) are declared there in the slate family (`category` = amber). `@use`d once from `src/global.scss` (which also carries the Android safe-area map + `body.scanner-active` transparency).
- Consume via `var(--sr-*)` / `.sr-*`; **never `@use 'theme/shadowrun'` from a component**.
- `/commlink` deck is the reference expression. The 5 timetracker + 4 grocery programs render as HUD tiles (SOYKAF stays `standby`).
- **Deviation to revisit in the re-skin audit:** timetracker had removed per-section header `color` inputs for uniform amber chrome; the grocery pages re-introduce `color` on `page-header`/`item-list` for a subtle per-domain slate tint. Decide whether to keep the tint or drop it for uniformity. The grocery pages/dialogs still need a shadowrun re-skin pass (contrast vs amber, monospace clipping on long German strings, remaining hardcoded German button labels like "Mhd"/"Liste").

## Deployment

PWA build (`pnpm run build` → `www/browser`; manifest identity `CommLink`/`CL`, `theme_color`/`background_color` `#0f141b`) + Android APK (Android Studio, after `cap add`/`cap sync` + `scripts/android-postsync.sh`; `android/` is git-ignored — see Capacitor section). PWA icons are still the timetracker placeholders (shadowrun icon redesign deferred). CI wire-up (`.github/workflows/*`) is **deferred** — not yet ported from either source repo.
