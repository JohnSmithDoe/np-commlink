# np-commlink — TODO

Open work, validated **2026-07-13**. The timetracker × kitchen-bot merge is done and
committed; two new domains (`cash`, `trackplay`) have since been grafted in. This file
tracks what is genuinely left. For merge history/decisions see `merge-notes.md`; for the
cash ledger see `cash-plan.md`.

> **✅ DDD refactor complete** (branch `feature/ddd-refactor`, 16 commits — supersedes the
> old items 1/2 below). `@shared` is domain-blind, `groceries` is one bounded context
> (shopping/storage/products), `tasks` is sealed via a `ListPageFacade`, notifications +
> commlink are inverted behind `@shared` contracts, `globals`→`products`, and the grocery
> cluster + tasks are lazy (co-hydrated). All gates + `tsc` + 23 e2e green. **Full record +
> DoD scorecard: `target-architecture.md` §11.**
>
> **Gate note (learned):** `build`/`test` use esbuild (no type-check) — always run
> `tsc --noEmit` (filter TS6307) AND `pnpm e2e` as gates; between them they caught a
> type-only-import gap and a runtime co-hydration crash the other gates missed.
>
> **Deferred polish (low-risk, non-blocking — see §11):**
> - String cosmetics from the rename: i18n keys (`grocery.*.globals`), settings-flag identifiers
>   (`showGlobalsInStorage`/`canAddGlobal`/…), the `global` theme-color token.
> - `item-dialogs` initial `listId: '_storage'` default + residual list-id literals in
>   `@shared/types` (the centralized type union — legitimate, but the one item-dialogs default is a leak).
> - Two off-contract facade methods on the concrete grocery/tasks facades; persistence
>   `npc-globals→npc-products` fallback unit test; hydration resolver re-dispatches `load()` per
>   grocery-route entry (perf nit); the office-time telemetry reporter spec + re-emit coverage.
> - `e2e/grocery/settings.e2e.ts` toggle-read race (pre-existing flaky under CI mode).
> - Code-split the (tiny) grocery/tasks state via `loadChildren` — negligible bundle gain,
>   deferred; lazy for the other feature domains (tracking/office-time/…) — deferred (kept eager
>   so the dashboard needs no boot-summary-docs).

## Validated gate status (2026-07-13, clean cache)

| Gate | Result |
|---|---|
| `pnpm build` | ✅ builds to `www/`. Only the expected `commlink.page.scss` budget warning (+1.14 kB) — the 6 `NG8011` content-projection warnings are fixed. |
| `npx sheriff verify src/main.ts` | ✅ No issues found |
| `pnpm exec eslint "src/**/*.ts"` | ✅ 0 problems |
| `pnpm test` | ✅ 107 files / 600 tests (was 94/554 at merge; cash + trackplay + shared list-item added tests) |
| `pnpm e2e` | ⚠️ **not run this session** — must be run to validate the lazy-store change (item 2); merge baseline was 14/14 |

---

## 1. Simplify components (improvements #1) — IN PROGRESS

Goal: one unified design, fewer components, minimal SCSS.

- **Done:** `@shared/ui/list-item/list-item.component.ts` replaces the four per-domain
  item renderers (`global-item`/`shopping-item`/`storage-item`/`task-item` deleted,
  commit `2eba7ed`, net −349 lines).
- **Done:** the shared list-item had introduced 6 `NG8011` warnings (storage + tasks
  pages projected two root nodes — `<ion-note itemDetails>` + `<br itemDetails />` —
  into the `[itemDetails]` slot from a single `@if`). Fixed by wrapping each multi-node
  `@if` body in one `<ng-container itemDetails>`. Build is warning-clean again.
- **Open:** sweep for `signal`/`computed`/`input()` usage where observables/`@Input` are
  still used in components (effects may stay RxJS for now). Revisit whether any effect
  streams can be dropped.

## 2. Lazy-loaded grocery store (improvements #2) — IN PROGRESS (uncommitted)

Working tree (uncommitted) moves the four grocery slices out of the root `provideStore`
and loads them per-route:

- Each grocery reducer now also exports a `createFeature({...})` (`globalsFeature`,
  `shoppingFeature`, `storageFeature`, `tasksFeature`).
- `app.routes.ts` `provideLazyGroceryState(...)` registers `provideState(feature)` +
  `provideEffects(...)` on each grocery route and, via an `ENVIRONMENT_INITIALIZER`
  guarded by a module-level `groceryStateHydrated` flag, re-dispatches
  `ApplicationActions.load()` so the freshly-registered lazy reducer catches
  `loadedSuccessfully` (bootstrap's `load()` fires before the lazy reducers exist).
- Shared slices stay eager (`listSettings`/`itemDialogs`/`quickadd`) as intended; `cash`
  and `trackplay` are still eager in root.

**To finish:**
- Remove the `as never` cast on each `createFeature({...})` — find and fix the real type
  mismatch rather than casting it away.
- **Verify grocery hydration at runtime** — build + unit tests pass, but the re-dispatch
  design is only proven by `e2e/grocery/first-paint.e2e.ts`. Run `pnpm e2e` before committing.
- Reconsider the module-global mutable `groceryStateHydrated` flag (works, but is shared
  mutable state); confirm re-loading the whole datastore on first grocery nav is acceptable.
- Commit once green.

## 3. PWA asset caching (improvements #3) — PARTIALLY DONE

Service worker is wired (`provideServiceWorker` + `ngsw-config.json`).

- **Done:** icons/images cached — the `assets` assetGroup globs
  `svg|png|jpg|jpeg|...|woff2` (lazy install, prefetch update).
- **⚠️ Missing:** `de.json` / `en.json` are **not** cached — no `*.json` glob in
  `ngsw-config.json`. Add `/assets/i18n/*.json` (or `/**/*.json`) to an assetGroup so the
  app has translations offline.
- **Cosmetic:** the first assetGroup is still named `"np-timetracker"` — rename to
  `np-commlink`.

## 4. Deferred from the merge (product/ops decisions)

- **APK build** — needs the Android SDK / Android Studio (out of this environment).
  `android/` is git-ignored and regenerated: `pnpm run build && npx cap add android &&
  npx cap sync android`, then `./scripts/android-postsync.sh`.
- **Shadowrun PWA icon redesign** — `public/icons/*` are still the timetracker placeholders.
- **CI** — no `.github/workflows/*` yet (confirmed absent). Neither source repo's CI was
  ported; secrets/targets are a product decision.

## 5. Minor / cosmetic

- `list-settings` longest German toggle label ("Kategorie-Schnellhinzufügen anzeigen")
  truncates with an ellipsis at 430 px — shorten the German if it bothers you.
</content>
</invoke>
