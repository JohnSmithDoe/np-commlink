# np-commlink — open tasks

The single list of what's genuinely **open, deferred, or blocked**. This is *not* a changelog —
completed work lives in the git commit log. For the current architecture see `architecture.md`;
the `cash` domain keeps its own living spec in `cash-plan.md`.

**Status.** The timetracker × kitchen-bot merge, the `cash`/`trackplay` grafts, the DDD
re-domaining, the full lazy-module cutover (every bounded context lazy), the sheriff-tighten
pass (zero cross-domain bridges; `smart-ui` strict-leaf), and the **SCSS simplification** (one
uniform Shadowrun theme, per-domain colours dropped, deck pieces extracted into `_deck.scss`
mixins, `TColor` narrowed to the Ionic base palette, second-theme seam scaffolded) are all done.
Gates: `tsc -p tsconfig.app.json --noEmit` + `-p tsconfig.spec.json --noEmit` · `pnpm exec
sheriff verify src/main.ts` · `pnpm exec eslint "src/**/*.ts"` · `pnpm test` (Vitest) · `pnpm run
build` · `pnpm run e2e` — green.

---

## Blocked / needs external input

- **APK build** — needs the Android SDK / Android Studio (out of this environment). `android/`
  is git-ignored and regenerated: `pnpm run build && npx cap add android && npx cap sync
  android`, then `./scripts/android-postsync.sh` (re-applies the mlkit `barcode_ui` meta-data +
  `CAMERA`/`FLASHLIGHT`/`POST_NOTIFICATIONS` permissions + `versionName`/`versionCode`).
- **Shadowrun PWA icon redesign** — `public/icons/*` are still the timetracker placeholders
  (a design task — needs artwork).
- **Deploy / publish pipeline** — the CI **gate** workflow already exists
  (`.github/workflows/ci.yml`: verify + e2e jobs, no deploy). A deploy pipeline needs targets +
  secrets (a product decision); APK publishing needs the SDK.

---

## Shadowrun re-skin audit (grocery + cash surfaces)

The SCSS simplification (done — see git log `scss-simplification Phase 1–6`) settled the
per-domain-tint question app-wide (dropped for uniform amber/teal) and pulled the deck pieces
into shared mixins. The follow-up re-skin items are now also **done** (git log `re-skin audit`):
chart palettes tokenised onto the theme (`@shared/util/chart-colors` reads the live tokens for
the canvas charts; `_charts.scss` uses `--ion-color-success`/`--sr-red-deep`); the last
hardcoded button labels moved to i18n (`A-Z`, `Share Data`, `Ansicht` — the audit-named
MHD/Liste/Kategorien were already i18n'd); and the grocery dialog clipping fixed by putting the
shared form inputs on `labelPlacement="stacked"` (matching cash, which was already stacked).

Still genuinely open: none — the last item (cash's English `aria-label`s) is now done: all 16
cash toolbar/form `aria-label`s moved to the `cash.a11y.*` i18n group (de + en) and bound via
`[attr.aria-label] | translate`.

---

## Cash domain — deferred polish

Non-blocking follow-ups on the completed CREDSTICK roadmap (P0–P5 done). Full detail lives in
`cash-plan.md § Deferred polish`:
- ~~**Windows-1252 CSV decode fallback**~~ — **done**: the import reads bytes via
  `file.arrayBuffer()` and decodes through the pure `cash/util/import/read-csv.ts` `decodeCsv()`
  (strict UTF-8, then Windows-1252 fallback). Spec'd in `read-csv.spec.ts`.
- **DKB import driven live** — the DKB parser is unit-tested against `docs/example2.csv`; only
  Volksbank was driven end-to-end in-app. Do a manual DKB pass when convenient.
- ~~**Full cash mutate→reload persistence e2e**~~ — **done**: `e2e/cash/persistence.e2e.ts`
  drives create-account → add-transaction → cold reload and asserts both survive (covers
  CashSaveEffects), parity with the trackplay/tasks reload guards.
- **Rules drag-reorder** — rules reorder via up/down controls; a drag (`ion-reorder-group`) was
  deferred (the app wires no reorder-group anywhere).
- ~~**Category input unification**~~ — **done**: one shared custom selectable-list picker
  (`@shared/ui/categories-dialog`, `multiple` flag → checkbox-style multi vs single-select, per-row
  swipe rename/delete) now drives grocery items (multi) **and** the cash transaction + rule dialogs
  (single); cash gained `updateCategory` (rename cascade) + `removeCategory` cascade. The
  `{id,name}`-by-id model was deliberately deferred (see the plan) — this stays on the name model.
- ~~**Un-reconcile affordance**~~ — **done**: a survivor txn that absorbed a manual leg now
  shows a start-swipe "detach" option (`CashActions.unreconcileTransaction` → clears
  `matchedTxnId`, restores `pending`). `selectTransactionsForAccount` tags survivors with
  `reconciledManualId`; reducer + selector spec'd.

---

## App-wide bilingual / locale (not cash-specific)

The app is hardwired to German: `LOCALE_ID: 'de-DE'`, `dayjs.locale('de')`,
`registerLocaleData(de)`, and `cash/util/money.ts` + `trackplay/util/score.pipe.ts` hardcode
`de-DE`. `en.json` exists and mirrors `de.json` 1:1 but is **dead** — no `translate.use()`, no
switcher. Wiring English means a switcher + `translate.use()` + a runtime-swapped `LOCALE_ID`,
**and** making number/money parsing locale-aware in the same pass (an `en` user typing `12.34`
must not become `1234 €`). Cash display already routes through `moneyEur` → `formatEur(cents,
locale)`, so the cash side is a one-line change once a locale source exists.

---

## Cosmetic / negligible (intentionally not done)

- **German label truncation** — `list-settings` "Kategorie-Schnellhinzufügen anzeigen" ellipsizes
  at 430 px. No CSS fix (ion-toggle's label is shadow DOM, exposes only `track`/`handle` as
  parts) — the only option is shortening the German, a wording call.
- ~~**`item-dialogs` `_storage` default**~~ — **gone**: the `itemDialogs` slice was retired, so
  there is no initial `listId` to default (the open-command is a nullable signal on
  `ItemDialogHost`; "closed" is `null`, not a sentinel list).
- **`loadChildren` code-split** of the grocery/tasks (and now every lazy) state — negligible
  bundle gain: the bundle is framework-dominated (~1 MB vendor); lazy state buys boot-hydration +
  memory, not KB. Deliberately not chased.
- **`globals`→`products` string cosmetics** — leftover i18n keys (`grocery.*.globals`),
  settings-flag identifiers (`showGlobalsInStorage`/`canAddGlobal`/…), and residual
  `_storage`/`_products` string literals in `@shared/types.ts` (the centralized-types convention —
  not couplings, no imports). The `global` theme-color token has been retired (SCSS Phase 3/5).
- **Two off-contract facade methods** (`addCategory`/`showEditDialog`) remain on the concrete
  grocery/tasks facades (deliberately off the shared `LIST_FACADE` contract — grocery/tasks-only
  ops). Minor.

---

## Known-flaky / test backlog

- ~~**`e2e/grocery/settings.e2e.ts`**~~ — **fixed**: the flake was a check-then-act re-read of
  `aria-checked` (which flips through transient values via the async `toggleFlag` effect + Ionic's
  optimistic flip). Now derives the expected post-toggle value from the settled `before` and
  asserts it with a web-first retrying `toHaveAttribute`. Stable over 15× serial reruns.
- ~~**item-dialogs effects specs (`{grocery,tasks,tracking}-item-dialogs.effects.spec.ts`)**~~ —
  **fixed**: the `@angular/build:unit-test` runner forces **`isolate: false`**, so the module-level
  `selectEditState`/`selectTasksState`/`selectTrackingState` are shared across spec files; a read
  fed through `provideMockStore({initialState})` could intermittently see a sibling file's state.
  The item-dialogs effects were uniquely exposed because their `listId` guard *passes* on the
  reducer's initial `_storage` dialog, emitting a spurious `add({name:''})`. Now each such read is
  pinned with `store.overrideSelector(...)` + `store.refreshState()`, released in
  `afterEach(() => store.resetSelectors())` (else the override itself leaks into other files).
  Stable over 24× reruns (was ~15–30% flaky). **Since obsolete**: all three specs are deleted with
  their effects — the class of flake is structurally gone, because the open-command no longer has a
  reducer to carry a sentinel initial state, and the specs seed `ItemDialogHost` (a per-TestBed
  instance) instead of overriding a module-level selector.

---

## Gate discipline (learned — keep applying)

- `build` / `test` run on **esbuild** (transpile-only — no type-check), so a broken *type-only*
  import passes them silently. Always run **`tsc -p tsconfig.app.json --noEmit` +
  `-p tsconfig.spec.json --noEmit`** AND **`pnpm run e2e`** as gates — between them they've caught
  a type-only-import gap and a runtime co-hydration crash the other gates missed.
- Verify a diagnostic query returns what you think **before** scoping work off it (a `grep -Lq`
  inversion once faked a "~70-component OnPush backlog").
