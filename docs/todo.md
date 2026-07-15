# np-commlink — TODO

Open work, revalidated **2026-07-14** against the merged DDD refactor (was 2026-07-13).
The timetracker × kitchen-bot merge is done and committed; two new domains (`cash`,
`trackplay`) have since been grafted in; the DDD re-domaining is merged to `main`. This file
tracks what is genuinely left. For merge history/decisions see `merge-notes.md`; for the
cash ledger see `cash-plan.md`; for the DDD outcome see `target-architecture.md` §11.

> **Reconciliation (2026-07-14).** Items 1 & 2 below were superseded by the DDD refactor
> and are marked done. Item 3 (PWA caching) is now **done** (i18n precached + assetGroup
> renamed) and item 1's signal-input migration is now **done** (all 10 files, gated green).
> What genuinely remains is a subjective German-wording tweak (item 5) and the product/ops
> deferrals (item 4). See each item.

> **✅ DDD refactor complete and merged to `main`** (merge `0b7d9fc` + polish `576d735`/`9cff171`;
> supersedes the old items 1/2 below). `@shared` is domain-blind, `groceries` is one bounded
> context (shopping/storage/products), `tasks` is sealed via a `ListPageFacade`, notifications +
> commlink are inverted behind `@shared` contracts, `globals`→`products`, and the grocery cluster
> + tasks are lazy (co-hydrated). All gates + `tsc` + **622 unit / 23 e2e** green. **Full record +
> DoD scorecard: `target-architecture.md` §11.**
>
> **Gate note (learned):** `build`/`test` use esbuild (no type-check) — always run
> `tsc --noEmit` (filter TS6307) AND `pnpm e2e` as gates; between them they caught a
> type-only-import gap and a runtime co-hydration crash the other gates missed.
>
> **Polish pass done:** trimmed off-contract facade methods; added persistence-fallback unit
> tests; strengthened the office-time telemetry spec (concrete value + re-emit + pinned clock);
> de-flaked `settings.e2e.ts`; renamed residual `globals`/`database` **i18n keys** → `products`.
>
> **Deferred-items pass (2026-07-14):**
> - ✅ **CI** — gate-running GitHub Actions workflow added (`.github/workflows/ci.yml`, commit
>   `0a9d9d0`). See item 4.
> - ✅ **`en.json` completed** — was 86/268 keys (partial stub). Regenerated to mirror `de.json`
>   1:1 (268/268, identical order, placeholders verified), dropped 4 stale keys, and fixed 2
>   pre-`products`-rename English strings (`"Show globals"` → `"Show permanent entries"` etc.).
> - **Hydration resolver re-dispatch — kept (not a safe quick win).** Investigated: the lazy
>   grocery/tasks slices live in the route's `EnvironmentInjector`, torn down on leaving the
>   subtree, so the per-entry `load()` re-dispatch is what re-hydrates them on re-entry
>   (`storage.e2e.ts` "keeps items across a navigation round-trip" depends on it). A flag-guard
>   would break that; the real fix is the scoped-load refactor (§5), a larger effort. Left as-is.
> - **`loadChildren` code-split** — negligible bundle gain (framework-dominated). Left as-is.
>
> - ✅ **`global`→`products` rename — DONE (full & careful).** Renamed the ~100 residual
>   `global`/`globals`/`Global` refs across ~35 files: settings-flag identifiers
>   (`showGlobalsInStorage`→`showProductsInStorage`, `canAddGlobal`→`canAddProduct`, …), the
>   `--ion-color-global` theme token + `TColor 'global'` + `color="global"` bindings, the 3
>   grocery `.global.` i18n keys (de+en), selectors/effects/methods/factories, and the
>   `'Global Items'` title literal. Persisted `listSettings` flag keys are migrated via a new
>   **`#loadListSettings` Expand/Contract** (mirrors `#loadProducts`; unit-tested — a returning
>   user keeps their toggles). Compiler-verified (exact-identifier codemod); the legacy
>   `npc-globals` fallback key + migration maps intentionally keep the old names. Gates: tsc ·
>   sheriff · eslint · 624 unit · 23 e2e · prod build — all green.
>
> **Still deferred (blocked or negligible — intentional):**
> - `item-dialogs` `_storage` default — keys off persisted state; centralized-types convention
>   (no domain-neutral valid `TItemListId`); low value.
> - **APK build** — 🚫 blocked: no Android SDK in this environment.
> - **PWA icon redesign** — needs actual Shadowrun artwork (design task).

## Validated gate status (2026-07-13, clean cache)

| Gate | Result |
|---|---|
| `pnpm build` | ✅ builds to `www/`. Only the expected `commlink.page.scss` budget warning (+1.14 kB) — the 6 `NG8011` content-projection warnings are fixed. **Re-run 2026-07-14** after the `ngsw-config.json` change: still green, same single budget warning; `ngsw.json` now precaches the i18n JSON. |
| `npx sheriff verify src/main.ts` | ✅ No issues found |
| `pnpm exec eslint "src/**/*.ts"` | ✅ 0 problems |
| `pnpm test` | ✅ 107 files / 600 tests (was 94/554 at merge; cash + trackplay + shared list-item added tests) |
| `pnpm e2e` | Merge baseline 23/23 (per `target-architecture.md` §11); the lazy-store change from old item 2 is **merged** — no longer pending. |

---

## 1. Simplify components (improvements #1) — ✅ DONE (2026-07-14)

Goal: one unified design, fewer components, minimal SCSS.

- **Done:** `@shared/ui/list-item/list-item.component.ts` replaces the four per-domain
  item renderers (`global-item`/`shopping-item`/`storage-item`/`task-item` deleted,
  commit `2eba7ed`, net −349 lines).
- **Done:** the shared list-item had introduced 6 `NG8011` warnings (storage + tasks
  pages projected two root nodes — `<ion-note itemDetails>` + `<br itemDetails />` —
  into the `[itemDetails]` slot from a single `@if`). Fixed by wrapping each multi-node
  `@if` body in one `<ng-container itemDetails>`. Build is warning-clean again.
- **✅ Done (signal-input sweep) — 2026-07-14.** Migrated the last **10 files** still on
  `@Input()`/`@Output()` decorators (the older timetracker-base shared list kit + form inputs:
  `@shared/ui/{category-note.directive,category-item,forms/{number,date}-input,
  item-list/item-list-search-result}`, `@shared/smart-ui/{item-edit-modal,category-input,
  item-list-quick-add}`, `@shared/feature/list-page`, plus `groceries/ui/grocery-search-result`)
  to the signal-based `input()`/`output()` API. The rest of the app already used them; now
  **zero** `@Input`/`@Output`/`EventEmitter` remain in non-spec source.
  - **How:** hand migration (Angular 21 doesn't ship the `signal-input`/`output` schematics
    in this install). Internal reads → `this.x()`; template refs → `x()`; required inputs →
    `input.required()`. `date-input`'s output was widened to `output<string | undefined>()`
    (matches what it emits; both consumers already accept it). `category-note` (a setter-input
    doing DOM side effects) was converted with `input()` + `effect()` — **not** left as an exception.
  - **Spec churn:** signal inputs are read-only, so specs that assigned inputs switched to
    `fixture.componentRef.setInput('x', …)` (category-item, category-input, item-edit-modal,
    grocery-search-result). Output specs (`.subscribe`/`.emit`) needed no change.
  - **Gates:** tsc app+spec clean · sheriff clean · eslint 0 · **622 unit** · **23 e2e** — all green.
- **✅ Component modernization audit (2026-07-14) — done, was a near-non-issue.** An earlier
  note here estimated "~70 components without `OnPush` / ~46 using constructor DI" — that was
  a **buggy grep** (`grep -Lq` inverts, listing files that *have* the match). The truth:
  **zero** components use constructor-parameter DI (the app already does all DI via `inject()`;
  the 45 `constructor()` bodies are param-less `addIcons(...)` calls or empty), and **66 of 71**
  components already had `ChangeDetectionStrategy.OnPush`. Added OnPush to the **5** stragglers
  (all signal/input/computed-driven → safe: `item-edit-modal`, `category-input`, `list-page`,
  `grocery-search-result`, `shopping-action-sheet`) and removed 4 dead empty `constructor() {}`
  bodies. Now **71/71** OnPush. Gates: tsc · sheriff · eslint · 622 unit · 23 e2e — all green.

## 2. Lazy-loaded grocery store (improvements #2) — ✅ DONE (merged)

Superseded by the DDD refactor's **phase 5** (`5524ca9`, merged to `main`). The grocery
cluster + `tasks` left the root `provideStore` and now register per-route via lazy
`providers` + a `datastoreHydrationResolver` that **co-hydrates the cluster as one chunk** —
which fixed the cross-list co-hydration crash the old per-slice WIP hit. The stale
`createFeature({...}) as never` casts and the module-global `groceryStateHydrated` flag from
that WIP no longer exist. Full record: `target-architecture.md` §5 + §11.

## 3. PWA asset caching (improvements #3) — ✅ DONE (2026-07-14)

Service worker is wired (`provideServiceWorker` + `ngsw-config.json`).

- **Done:** icons/images cached — the `assets` assetGroup globs
  `svg|png|jpg|jpeg|...|woff2` (lazy install, prefetch update).
- **Done:** `de.json` / `en.json` now precached. Added a dedicated **`i18n` assetGroup**
  (`installMode: prefetch`, glob `/assets/i18n/*.json`) so translations are guaranteed
  available on a cold offline start — not merely cached lazily after first fetch. Verified
  in the generated `www/browser/ngsw.json` (both files listed, content-hashed).
  *Pattern: precache (prefetch) vs runtime-cache (lazy) — render-critical assets prefetch.*
- **Done:** the first assetGroup was renamed `np-timetracker` → `np-commlink`.

## 4. Deferred from the merge (product/ops decisions)

- **APK build** — needs the Android SDK / Android Studio (out of this environment).
  `android/` is git-ignored and regenerated: `pnpm run build && npx cap add android &&
  npx cap sync android`, then `./scripts/android-postsync.sh`.
- **Shadowrun PWA icon redesign** — `public/icons/*` are still the timetracker placeholders.
- **CI** — ✅ **gate-running workflow added** (`.github/workflows/ci.yml`, `0a9d9d0`): two
  parallel jobs (verify = eslint/sheriff/tsc/unit/build; e2e = playwright) on push-to-main + PR.
  Needs no secrets (verification only). **Deploy/publish CI is still deferred** — targets +
  secrets remain a product decision, and the APK path needs the Android SDK.

## 5. Minor / cosmetic

- `list-settings` longest German toggle label ("Kategorie-Schnellhinzufügen anzeigen")
  truncates with an ellipsis at 430 px. **Note (2026-07-14):** the clean CSS fix (let it
  wrap) isn't available — `ion-toggle` renders its label in **shadow DOM** and exposes only
  `track`/`handle` as CSS parts, not the label wrapper (which is `white-space: nowrap`), so
  `::ng-deep` can't pierce it. The pragmatic fix is to **shorten the German** (e.g. drop the
  redundant "anzeigen", or "Kategorie-Schnellhinzufügen" → "Kategorie-Quickadd") — a wording
  call left to you.
</content>
</invoke>
