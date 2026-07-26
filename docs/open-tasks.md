# np-commlink — open tasks

The single list of what's genuinely **open, deferred, or blocked**. This is *not* a changelog —
completed work lives in the git commit log. For the current architecture see `architecture.md`;
the `cash` domain keeps its own living spec in `cash-plan.md`; the ranked cleanup backlog for the
`@shared` kernel is in `quality-backlog-shared.md`.

**Status.** The timetracker × kitchen-bot merge, the `cash`/`trackplay` grafts, the DDD
re-domaining, the full lazy-module cutover (every bounded context lazy), the sheriff-tighten
pass (zero cross-domain bridges; `smart-ui` strict-leaf), the **SCSS simplification** (one
uniform Shadowrun theme, per-domain colours dropped, deck pieces extracted into `_deck.scss`
mixins, `TColor` narrowed to the Ionic base palette, second-theme seam scaffolded), and the
**persisted-context descriptor** (`providePersistedContext` — the per-context load/save/telemetry
wrapper classes, the ten empty migration ladders and the 24 route `providers`/`resolve` pairs all
collapsed; see `architecture.md § providePersistedContext`), the **single-list item-flow kit**
(tasks' and tracking's hand-copied engines replaced by shared builders), and the **`@shared`
quality backlog** (now empty AND gated — a lint rule fails domain-prefixed keys in the kernel;
`quality-backlog-shared.md` is the closed record) are all done.
Gates: `tsc -p tsconfig.app.json --noEmit` + `-p tsconfig.spec.json --noEmit` · `pnpm exec
sheriff verify src/main.ts` · `pnpm exec eslint "src/**/*.ts"` · `pnpm test` (Vitest) · `pnpm run
build` · `pnpm run e2e` — green.

---

## Blocked / needs external input

- **APK signing** — the debug APK builds (`pnpm run apk:debug`, verified on SDK 36 / JDK 21);
  `apk:release` produces `app-release-unsigned.apk` because no `signingConfig` is wired. Wiring
  one needs a keystore + its passwords — secrets, so a decision rather than a default. The
  `android/` folder itself is no longer blocked: git-ignored, `npx cap add android` once, then
  `pnpm run build:android` (which re-runs `scripts/android-postsync.sh`).
- **Shadowrun PWA icon redesign** — `public/icons/*` are still the timetracker placeholders
  (a design task — needs artwork).
- **Deploy / publish pipeline** — the CI **gate** workflow already exists
  (`.github/workflows/ci.yml`: verify + e2e jobs, no deploy). A deploy pipeline needs targets +
  secrets (a product decision); APK publishing needs the SDK.
- **Angular 22 — waiting on NgRx.** Angular `22.0.8` is `latest` (2026-07-22); we are on
  `21.2.18`, which is now the `v21-lts` line, so this is *not* an unsupported version — there is
  no urgency. **The gate is `@ngrx/*`:** `latest` is still `21.1.1` with peer
  `@angular/core: ^21.0.0`, and `next` is only `22.0.0-beta.0`. NgRx is the spine here (11 data
  layers, 47 action groups, 56 effects), so forcing the bump would mean pnpm overrides on an
  untested combination. **Bump when `@ngrx/*@22` is stable, not before.**
  - **Lockstep set — one atomic commit or none:** `@angular/*` + `@angular/cli` + `@angular/build`
    + `angular-eslint` (22.1.0 peers `@angular/cli >=22 <23`, so it cannot move early) + `@ngrx/*`.
    Their peer ranges are mutually exclusive across the v21/v22 boundary.
  - **Already compatible, no action:** `@ionic/angular` 8.8.x (peer `@angular/core >=16`),
    `@ionic/storage-angular` (peer `*`), `ng2-charts` 10 (peer `>=21`), Sheriff (no Angular peer).
  - **Sequencing:** finish `code-review-findings.md`, commit, confirm all five gates green on v21
    — *then* bump alone, as its own commit. A framework major on top of an open backlog makes a
    red gate unattributable (bump or fix?).
  - Run it as `ng update @angular/core@22 @angular/cli@22` (tested schematics) against
    `angular.dev/update-guide` 21→22; do not hand-edit `package.json`.
  - **Signal Forms is *not* gated on this bump** — tracked as **CR-160**, which owns the plan.
    Recorded here only because the version evidence is: at v21 every `@angular/forms/signals`
    symbol is `@experimental 21.0.0` and in `@angular/forms@22.0.8` the only one left is
    `provideExperimentalWebMcpForms` (`FORM_FIELD` and the rest are `@publicApi 22.0`) — but the
    v21→v22 export diff is *purely additive* (same `form()` overloads, nothing removed or renamed)
    and v21 sits on the frozen **`v21-lts`** line, so the experimental tag carries no practical
    churn risk. Adoptable today; deferred for sequencing and effort, not risk. Note v22 adds
    `minDate`/`maxDate`, which are *range* validators over `Date | null` and are **not** what
    CR-016 needs (that is `required` + `validate`, both already in v21).
- **`@ngx-translate/core` is three majors behind** — on `15.0.0`, latest is `18.0.0`. Independent
  of the Angular bump and blocked by nothing; sequence it separately so a translation regression
  stays attributable.

---

## After the code review — holiday dates as a real-data spec fixture

Deferred on purpose: **not to be started until the `code-review-findings.md` list is worked off**,
so the review and the office-time domain aren't edited from two directions at once.

CR-001 was closed by deleting the fetch, not by shipping the asset: `berlinHolidaysFor`
(`office-time/util/holidays.utils.ts`) computes Easter (Meeus/Jones/Butcher) and derives every
movable Berlin holiday as an offset from it. That is the right call for an offline-first app —
`ngsw-config.json` only prefetches `/assets/i18n/*.json` and lazily caches image/font extensions,
so a per-year holiday JSON would 404 offline in any year the user had not first visited online,
and a static file set expires while a formula does not.

Three authoritative years were nevertheless added by hand and are **staged** at
`src/assets/holidays/{2025,2026,2027}-BE.json`. Every date in them matches the formula, so their
value is as a **test fixture**, not as a shipped asset:

- Move them under `office-time/util/` (or `office-time/testing/`) and pin `berlinHolidaysFor`
  against published dates instead of against a re-derivation of its own arithmetic; unstage them
  from `src/assets/` so nothing ships them.
- Assert that **`8. Mai 2025`** is *absent* — the 80th-anniversary one-off is an act of
  parliament, not a rule a formula can carry, so the omission should read as a decision.
- Reconcile the names first: the source says `Neujahrstag` / `Frauentag` / `1. Weihnachtstag`,
  the util emits `Neujahr` / `Internationaler Frauentag` / `1. Weihnachtsfeiertag`. These strings
  are the holidays card's render keys — decide which set is canonical before writing the fixture.

---

## SOYKAF → recipe book (**shipped** — `a8c9a74`; v2 below still open)

The standby stub is gone: `/soykaf` loads `groceries/feature/recipes-page`, the `kitchen` domain is
deleted, and the tile reads `0x05 SOYKAF — 'recipe book'` at `status: 'online'` off a
`source: 'recipes'` / `metric('count')` reporter like every other program. SOYKAF's premise had gone
stale — kitchen-bot **is** merged (MARKET / STASH / CATALOG / AGENDA) — so the slot was
**repurposed, not filled**: the recipe book was the one kitchen-bot half that never shipped. What
follows is the decision record; the **Deferred (v2)** list is the part still outstanding.

**The featured function — not the book, the matcher.** The headline surface is a reverse lookup:
**"what can I cook with what's in storage right now", ranked by ingredients missing** (0 missing
first = cookable now). Two things follow: the ingredient → `IProduct` reference is *load-bearing*,
and the ranking is a cross-list selector recomposing the recipes slice with `_storage` — the same
shape as today's `selectGroceryLists`, which is trivial inside `groceries` and impossible across a
domain seal.

**The match is half id-based, half name-based — and that is forced, not sloppy.** The plan said
"matching is by product id, not by name"; only the *recipe* side can keep that promise. An
ingredient references an `IProduct` by id, but `IStorageItem` carries **no product reference** —
`createStorageItemFromProduct` copies `product.name` and nothing else — so "do I have it" resolves
`productId → product.name → a storage row with that name` (trimmed, lowercased, via `matchingTxt`).
Giving storage a `productId` is a *storage* change, which v1 explicitly excluded. Consequence to
know: renaming a product breaks the storage half of the match until the storage row is renamed too
(the recipe half survives, because it never stored the name). That is the honest price of leaving
storage untouched, and the reason a productId on `IStorageItem` belongs with the v2 work below.

**Decided:**

- **A recipe holds the standard recipe fields** besides its ingredient lines: steps, servings,
  prep time. **No photo in v1** — keep it simple. Ties in the ranking fall back to the existing
  alphabetical sort.
- **It lives in `groceries/`, not `kitchen/`.** A recipe is expressed in the grocery vocabulary —
  ingredients *are* `IProduct`s, "do I have it" *is* storage — so it is a fourth feature of the
  sealed `groceries` domain (`sameTag` reads, slice co-registered in the grocery lazy context +
  its hydration resolver). A separate `kitchen` domain would need a re-opened Sheriff bridge or a
  generic `@shared` read-port (`@shared/model` may not name a grocery type) — a lot of machinery
  to buy back access that is free one folder over. Route and codename stay `/soykaf` (route path
  ≠ folder); `kitchen/` is deleted once the page moves. *A bounded context is drawn around a
  shared language, not around a page.*
- **An ingredient references an `IProduct`** from `_products` — not free text.
- **`IProduct` gains an "always on hand" flag** — salt, oil, water, flour are excluded from the
  missing count, so the ranking stays meaningful without tracking staples in `_storage`. A boolean
  on the product, deliberately *not* a magic "staples" category: `categoryIds` are user-renamable
  and deletable, and a semantic flag the matcher depends on must not be.
- **Amount + unit sit on the ingredient line** (`1 piece`, `200 g`, `250 ml`), not on the product:
  the line's unit is a *cooking* unit, and the same product is bought by pack but consumed by
  measure (milk comes in bottles, the recipe wants ml).
- **v1 is the book only.** Cooking does **not** decrement storage, and storage stays in
  **packaging units** — `IStorageItem.quantity` unchanged ("2 × milk", unitless).
- **The missing list is read-only in v1** — it names what you lack, with no one-tap push into
  `_shopping` (that ships with the v2 cook-flow below, if at all).
- **Accepted consequence:** the storage check is therefore **presence-only** ("milk: in storage" /
  "missing"), never "you are 200 ml short". Nothing can convert 1 bottle into ml in v1.
- **No migration.** Not shipped (`0.1.0`), fresh installs only — `migrate()` stays the empty
  framework at `APP_VERSION = 1`. `bestBefore` stays one date per storage row.

**Deferred (v2 — only if presence-only proves too weak):**

- **Base unit on `IProduct` + pack sizes** (milk → `ml`; 0.5 l / 1 l bottle variants). This is the
  *purchase-unit vs. consumption-unit* bridge, and it is what a quantitative "200 ml short"
  requires. Cost: `IStorageItem.quantity` is re-interpreted as a base-unit amount, which pools
  distinct packs into one number and so **destroys per-pack `bestBefore`** (two bottles with
  different dates become "1000 ml" with one date). **Half of this already exists** and was found
  during the build, not planned: `IProduct` has carried `unit: 'ml' | 'g' | 'pieces'` plus
  `packaging` and `packagingWeight?` since kitchen-bot — no UI reads them for the matcher, but the
  fields are there, so v2 is a wiring job on products and a re-interpretation of storage, not a
  schema invention. (The recipe book leaves `IProduct.unit` alone and only *seeds* a new ingredient
  line's unit from it.)
- **A `productId` on `IStorageItem`**, retiring the name-based half of the match (see above).
- Cook → subtract ingredients from storage; missing ingredients → push into `_shopping`.
- **Recipe photos.** A slice persists as one key/value doc (recipes ride inside `npc-groceries`) that the generic save
  effect rewrites wholesale on every mutation, so base64 images would ride inside the text
  document. Needs a place for binaries before it is worth doing.

**Settled during the build — the nested aggregate got its own page, not a stretched engine:**

Recipes are the app's first nested aggregate (the shared `list-page` engine and
`IItemList<T extends IBaseItem>` model *flat* item lists, but a recipe owns a list of ingredient
lines), and the shared engine was **not** stretched to fit. `recipes-page` + `edit-recipe-dialog`
are purpose-built, and `RecipesFacade` is a plain domain facade rather than a `LIST_FACADE` binding,
because the headline rows carry a **match verdict** — pre-ranked by missing ingredients — not a name
and a swipe. Widening `IItemList<T>` to model ownership would have taxed all five flat lists to
serve one nested one.

The safety net: `recipe-match.utils.spec` (ranking, staples, case-insensitive storage match, dangling
refs), `recipes.reducer.spec` (the product-delete cascade), `recipes.selector.spec` (the cross-slice
join, incl. siblings not yet registered) and `e2e/soykaf/recipes.e2e.ts` (create → persist → cold
reload, the deck badge, and missing→cookable driven through the real dialog).

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

## Configurable deck (**shipped**; one UI question deferred)

Order and visibility of the programs are user config, shared by the deck grid and the side menu
— catalog, slice, facade, `/commlink/deck` config page, theme-scoped codenames and e2e all
landed. Design and rationale: `dashboard-customization-plan.md`.

Deliberately left open:

- **Reordering from the deck itself.** Today drag-and-drop lives only on the config page. A
  long-press-to-rearrange affordance on the grid was discussed and postponed — it is a UI
  question, not a model one (the model already supports it: `DeckFacade.reorder(ids)` takes the
  complete resolved order, which is exactly what an `ionReorderEnd` on the grid would produce).
- **Menu labels under cyberpunk.** The menu renders each entry's `page-title.*` `titleKey`, so
  it still reads *Einkaufsliste* while the tile reads MARKET. Making the deck theme rename the
  menu too needs no new keys — `deck.cyberpunk.<id>.name` already exists — only the template
  choosing `nameKey` over `titleKey`. Not done because it changes a surface nobody asked to
  change.

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

## Deliberately not abstracted (recorded so it isn't re-proposed)

Three places where the convergence sweep stopped on purpose. In each case the shared pure logic is
already extracted and what remains is genuinely irregular, so folding it in would mean widening an
abstraction to serve one caller:

- **`groceries` persistence** — one atomic load across three keys emitting a single `loaded`, and a
  save that writes the one slice named by the action-source prefix (a `[GroceryCategories]`
  mutation hits the shared catalog, so it writes all three). Keeps its own load + save effects.
- **`commlink`'s dashboard read-model** — reads a key *family* (`loadPrefixed('summary-')`) rather
  than one key, raises the storage-unavailable toast as the single eager boot reader, and gates
  persistence on `hydrate` so the reporters' initial pre-hydration `report` cannot overwrite the
  prior session's summary.
- **The list reducers' `on(...)` tables** — their pure logic is already shared (`addListItem`,
  `updateListMode`, `updateListCategory`, `updateListSearch`, …). What is left per reducer is a
  ten-line declarative table mapping this domain's action to a shared helper, whose per-domain
  return annotation (`: IProductsState`) is load-bearing for type safety. A generic factory over it
  would add inference gymnastics, add lines, and replace a table you can read at a glance with an
  indirection you have to look up.

`office-time` sits between: it takes the descriptor for load + telemetry and keeps its own save,
which serializes dayjs date maps before writing.

---

## Cosmetic / negligible (intentionally not done)

- **German label truncation** — `list-settings` "Kategorie-Schnellhinzufügen anzeigen" ellipsizes
  at 430 px. No CSS fix (ion-toggle's label is shadow DOM, exposes only `track`/`handle` as
  parts) — the only option is shortening the German, a wording call.
- ~~**`item-dialogs` `_storage` default**~~ — **gone**: the `itemDialogs` slice was retired, so
  there is no initial `listId` to default (the open-command is a nullable signal on
  `ItemDialogService`; "closed" is `null`, not a sentinel list).
- ~~**`loadChildren` code-split** of the grocery/tasks (and now every lazy) state~~ — **done**, but
  for a different reason than this entry dismissed. The KB judgement was right (1.48 → 1.40 MB raw,
  301 → 282 kB transfer, and ≈ 0 over the wire since ngsw prefetches `/*.js` and the APK ships every
  chunk); what made it worth doing is the **seal**. With the route table in the domain-less shell,
  nothing could stop `app.routes.ts` from reaching any domain's internals. Each domain now owns a
  `routes/<domain>.routes.ts` tagged `domain:<domain>` + `type:routes`, and because Sheriff resolves
  dynamic `import()` too, a `loadComponent` crossing a domain now fails `sheriff verify`. It also
  bought the hydration fix: the context moved onto each subtree root, so `cash → cash/rules →
  cash/report` reads storage once instead of per page. The grocery pages then moved under a
  `/groceries` prefix (and the tasks catalog to `/tasks/categories`) so they could share a root the
  same way — 2 reads per page → 0 between pages. Old URLs are not redirected; `**` lands them on the
  deck. See `docs/architecture.md` §5.
- **`globals`→`products` string cosmetics** — leftover i18n keys (`grocery.*.globals`),
  settings-flag identifiers (`showGlobalsInStorage`/`canAddGlobal`/…), and residual
  `_storage`/`_products` string literals in `@shared/types.ts` (the centralized-types convention —
  not couplings, no imports). The `global` theme-color token has been retired (SCSS Phase 3/5).
- **Two off-contract facade methods** (`addCategory`/`showEditDialog`) remain on the concrete
  grocery/tasks facades (deliberately off the shared `LIST_FACADE` contract — grocery/tasks-only
  ops). Minor.
- **Templates are outside the lint script's reach.** `"lint": "ng lint"` and the `pnpm exec eslint
  "src/**/*.ts"` in CLAUDE.md both skip `*.html`, so template rules — including the new
  no-domain-vocabulary gate — only run when someone passes `*.html` explicitly or via the
  lint-staged hook. Worth widening the script's glob.

---

## Known-flaky / test backlog

- ~~**`e2e/groceries/settings.e2e.ts`**~~ — **fixed**: the flake was a check-then-act re-read of
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
  reducer to carry a sentinel initial state, and the specs seed `ItemDialogService` (a per-TestBed
  instance) instead of overriding a module-level selector.

---

## Gate discipline (learned — keep applying)

- `build` / `test` run on **esbuild** (transpile-only — no type-check), so a broken *type-only*
  import passes them silently. Always run **`tsc -p tsconfig.app.json --noEmit` +
  `-p tsconfig.spec.json --noEmit`** AND **`pnpm run e2e`** as gates — between them they've caught
  a type-only-import gap and a runtime co-hydration crash the other gates missed.
- Verify a diagnostic query returns what you think **before** scoping work off it (a `grep -Lq`
  inversion once faked a "~70-component OnPush backlog").
