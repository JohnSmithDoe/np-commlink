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
into shared mixins. What it deliberately did **not** touch remains open here:
- Remaining hardcoded German button labels ("Mhd" / "Liste" / "Kategorien").
- The cash report chart palette (`#2dd36f`/`#eb445a`/category ramp) and `_charts.scss`
  (`#078507`/`#a82727`) are Ionic-default / off-theme hexes, not `--sr-*` tokens — pull them
  onto the theme (explicitly out of scope for the SCSS simplification).
- A grocery-dialog contrast-vs-amber + monospace-clipping pass (long German strings) on the
  account/transaction/rule/transfer modals, import preview, and rules/report pages.

---

## Cash domain — deferred polish

Non-blocking follow-ups on the completed CREDSTICK roadmap (P0–P5 done). Full detail lives in
`cash-plan.md § Deferred polish`:
- **Windows-1252 CSV decode fallback** — P4a reads via `file.text()` (UTF-8), fine for the two
  example exports; real Volksbank exports are often Windows-1252 → add a `TextDecoder` fallback.
- **DKB import driven live** — the DKB parser is unit-tested against `docs/example2.csv`; only
  Volksbank was driven end-to-end in-app. Do a manual DKB pass when convenient.
- **Full cash mutate→reload persistence e2e** — parity with trackplay/tasks; only
  `e2e/cash/first-paint.e2e.ts` (load/hydrate wiring) exists today.
- **Rules drag-reorder** — rules reorder via up/down controls; a drag (`ion-reorder-group`) was
  deferred (the app wires no reorder-group anywhere).
- **Category input unification** — a manual txn's category is free text while a rule assigns from
  the managed palette; consider a shared category input backed by `categories`.
- **Un-reconcile affordance** — reconciliation is one-way in the UI; a "detach" (clear
  `matchedTxnId`, restore `pending`) would make it reversible.

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
- **`item-dialogs` `_storage` default** — the initial-`listId` default keys off persisted state;
  there's no domain-neutral valid `TItemListId`. Negligible.
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

- **`e2e/grocery/settings.e2e.ts`** — a pre-existing toggle-read race (flaky under CI mode).

---

## Gate discipline (learned — keep applying)

- `build` / `test` run on **esbuild** (transpile-only — no type-check), so a broken *type-only*
  import passes them silently. Always run **`tsc -p tsconfig.app.json --noEmit` +
  `-p tsconfig.spec.json --noEmit`** AND **`pnpm run e2e`** as gates — between them they've caught
  a type-only-import gap and a runtime co-hydration crash the other gates missed.
- Verify a diagnostic query returns what you think **before** scoping work off it (a `grep -Lq`
  inversion once faked a "~70-component OnPush backlog").
