# np-commlink — Full lazy modules: implementation plan (2026-07-14)

**Extends** `target-architecture.md` §5 (State, persistence & lazy loading) and completes the
half deferred in §11 ("Only grocery + tasks are lazy … dashboard needs no boot-summary-doc
machinery"). This plan makes **every bounded context lazy** — code, store slice, effects, and
data — and turns the dashboard into a **persisted** read-model so the deck still shows numbers
for programs that aren't loaded.

Companion to `merge-notes.md`, `cash-plan.md`. Written from a Socratic design drill; the design
decisions and their rationale are captured inline as **Decision:** callouts.

---

## 0. The target (what "done" means)

The four requirements, restated precisely:

1. **Every module is lazy-loaded (code).** — already met (every route is `loadComponent`).
2. **Every module owns its store + a lazy feature slice.** — met only for `groceries`+`tasks`;
   `tracking`/`office-time`/`notifications`/`cash`/`trackplay` are still eager in `provideStore`.
3. **Every module saves and loads its own data, lazily.** — met **nowhere**: `DatabaseService.
   create()` reads *every* `npc-*` key at boot, and the grocery resolver re-reads them again.
4. = 1 (duplicate).

**One deliberate exception, forced by topology:** the `dashboard` slice stays **eager**. It is
the aggregation sink every module *writes to* while you're inside that module — its writers live
outside its own route — so it cannot be scoped to any one producer's lifecycle. (Same reason a
metrics collector is a central always-on service, not a per-workload sidecar.) `listSettings`
and the ephemeral UI slices (`quickadd`, `itemDialogs`, tracking `dialogs`) are **shared-kernel
library state**, not bounded contexts — they stay eager too (see §6). Everything that is a
*bounded context* goes lazy.

---

## 1. Current state (audit — verified 2026-07-14)

| Slice / effects | Registration | Persisted key | Hydrates on |
|---|---|---|---|
| `router` | eager | — | — |
| `dashboard` | eager | **none (ephemeral)** | nothing — rebuilt by live push each run |
| `tracking`, `dialogs` | **eager** | `npc-tracking` (dialogs ephemeral) | `ApplicationActions.loadedSuccessfully` |
| `settings`, `officeTime` | **eager** | `npc-settings`, `npc-officeTime` | `loadedSuccessfully` |
| `notifications` | **eager** | `npc-notifications` | `loadedSuccessfully` |
| `cash` | **eager** | `npc-cash` | `loadedSuccessfully` |
| `trackplay` | **eager** | `npc-trackplay` | `loadedSuccessfully` |
| `listSettings` | eager | `npc-listSettings` | `loadedSuccessfully` |
| `quickadd`, `itemDialogs` | eager | ephemeral | (reset) |
| `products`, `shopping`, `storage` | **lazy** (`provide-groceries-lazy`) | `npc-*` | `loadedSuccessfully` (via resolver re-dispatch) |
| `tasks` | **lazy** (`provide-tasks-lazy`) | `npc-tasks` | `loadedSuccessfully` (via resolver) |

Key facts:
- **One global hydration action.** Every reducer hydrates on `ApplicationActions.
  loadedSuccessfully(IDatastore)` — the single thing that makes loading non-lazy
  (`application.actions.ts`). Even the "lazy" grocery/tasks reducers hydrate on it; their
  resolver just **re-dispatches `ApplicationActions.load()`**, which re-reads the *whole*
  datastore (`datastore-hydration.resolver.ts`).
- **`DatabaseService.create()`** reads all 11 slices up front, runs `migrate()`, returns the
  full `LoadedDatastore` (`database.service.ts:14`).
- **Save effects are centralized at the shell root** in `app.effects.ts`: `saveOnChange$`
  (tracking), `saveNotificationsOnChange$`, `saveGroceryOnChange$` (matches
  `[Products|Shopping|Storage|Tasks|Trackplay]`), `saveCashOnChange$`. Office-time/settings save
  in their own `*.effects.ts`.
- **Dashboard telemetry already exists as a clean CQRS contract.** `DashboardActions.report({
  source, metrics })` (`@shared/data/dashboard/dashboard.actions.ts`); reporters are
  `store.select(summarySelector).pipe(map(report))` effects (`office-time-telemetry.effects.ts`,
  `notifications-telemetry.effects.ts`) — **currently eager** in `main.ts`. `commlink.page.ts`
  reads only `selectTelemetry('notifications'|'office-time')`. Only those two sources report
  today; `tracking`/`cash`/`trackplay`/grocery tiles show static config, no live metric.
- **`IDashboardState` is `{ bySource }`, ephemeral, NOT in `IDatastore`** (`types.ts:146`).

---

## 2. The uniform pattern (the whole design in one rule)

> **Every slice follows `[X] load` → read its own key(s) → `[X] loaded(data)` → reducer
> hydrates.** The *only* difference between eager and lazy is **where it registers and where
> `load` is dispatched.**

| | registers via | `load` dispatched by | when |
|---|---|---|---|
| **eager core** (`dashboard`, `listSettings`) | `provideStore` in `main.ts` | `provideAppInitializer` | app boot |
| **lazy module** (everything else) | route `providers: [provideState, provideEffects]` | that module's **route resolver** | route entry |

This kills the global `ApplicationActions.loadedSuccessfully(IDatastore)`. Each module owns its
`[Module] load/loaded`; `DatabaseService` collapses to per-key get/set; the resolver blocks
activation until `[Module] loaded` (no empty-list flash — the current resolver's purpose,
preserved). "Module" = **bounded context**, so a context with several slices (groceries,
office-time, tracking) gets **one** `load/loaded` that hydrates all its slices together.

**Decision — resolver factory, not N copies.** Replace the single `datastoreHydrationResolver`
with a factory:

```ts
// @shared/data/module-hydration.resolver.ts
export function moduleHydrationResolver(
  load: ActionCreator, loaded: ActionCreator
): ResolveFn<boolean> {
  return () => {
    const store = inject(Store), actions$ = inject(Actions);
    const done = firstValueFrom(actions$.pipe(ofType(loaded), take(1)));
    store.dispatch(load());
    return done.then(() => true);
  };
}
```
Route: `resolve: { hydrated: moduleHydrationResolver(TrackingActions.load, TrackingActions.loaded) }`.

---

## 3. The dashboard: ephemeral → persisted read-model

This is the enabler (target-arch §5). Today the deck fills because eager reporters fire at boot;
once modules are lazy, nothing reports until you visit — so the persisted summary must carry the
cold-launch numbers.

**Decision — reducer owns `status`; reporters send only metrics.** A `report` means "I'm live":
reducer stamps `status: 'online'`. Boot-hydrate stamps `status: 'standby'`. So `status` is
**structurally ephemeral** — it can only ever become `'online'` via a live `report`, which only
happens once a module's lazy reporter registers on entry. This *is* the standby→ready lifecycle,
enforced by the reducer, not by remembering to strip a field.

**Decision — the dashboard persists summaries centrally (mapper = "metrics only").** Modules
don't know the dashboard persists; they just `report`. One eager dashboard effect mirrors each
report to `npc-summary-<source>` (metrics only — `status` never touches disk). This is the
persistence-model-vs-app-model split the drill converged on, owned in one place.

Changes:
- `types.ts`: keep `IDashboardTelemetry { source; status?; metrics }`. Add a persisted shape
  `IDashboardSummary = { source: string; metrics: Record<string, number|string> }` (no status).
  `IDashboardState` stays `{ bySource }` but is now hydrated at boot.
- `dashboard.actions.ts`: add `load: emptyProps()`, `hydrate: (summaries: IDashboardSummary[])`.
  Keep `report`.
- `dashboard.reducer.ts`:
  - `on(report, (s,{telemetry}) => ({ bySource: { ...s.bySource, [telemetry.source]: { ...telemetry, status: 'online' } } }))`
  - `on(hydrate, (_,{summaries}) => ({ bySource: fromEntries(summaries.map(x => [x.source, { ...x, status: 'standby' }])) }))`
- `dashboard.effects.ts` (**new, eager**):
  - `load$`: `on(load)` → `from(database.bootstrap())` → `map(({summaries}) => hydrate(summaries))`
    (bootstrap also runs migrations — §5).
  - `persistSummary$` (`{dispatch:false}`): `on(report)` → `database.saveSummary(source, metrics)`.
- `main.ts`: `provideAppInitializer` dispatches `DashboardActions.load()` (replaces
  `ApplicationActions.load()`); keep `NotificationService.init()`.

**First-ever boot** (no summary docs yet): tiles render at their config baseline (empty/0),
`standby`, until first visit — matches target-arch §5.

**Reporters move to lazy providers** (§4). They already auto-fire on registration
(`store.select(...)`), so registering with the module = "report on entry" = **override on
entry**, and every in-module change re-emits = **live sync**. New reporters are needed for the
tiles that currently show no metric (tracking count, shopping unbought, storage low-stock, tasks
open, cash balance, trackplay games) — one `*-telemetry.effects.ts` per module, each a
`store.select(ownSummarySelector).pipe(map(report))`.

---

## 4. Per-module work checklist

For **each** bounded context below, the recipe is identical:

1. **Actions** — add `load: emptyProps()` + `loaded: (data) => ({ data })` to the module's
   action group (source already exists, e.g. `[Tracking]`).
2. **Reducer(s)** — replace `on(ApplicationActions.loadedSuccessfully, (s,{datastore}) =>
   hydrate(datastore.X))` with `on(ModuleActions.loaded, (s,{data}) => hydrate(data.X))`. A
   multi-slice context's `loaded` payload carries all its slices.
3. **Load effect** (in the module's lazy effects) — `on(load)` → read own `npc-*` key(s) via
   `database.load(...)` → `map(loaded)`; `catchError` → `loaded(null-payload)` (reducer
   initialState fallback), plus the storage-unavailable toast (moved from
   `AppEffects.initializeApplication$`).
4. **Save effect** — move the module's `saveXOnChange$` out of `app.effects.ts` into the
   module's lazy effects (unchanged logic, just relocated).
5. **Telemetry effect** — move the existing reporter (or add a new one) into the module's lazy
   providers.
6. **`provide-<module>-lazy.ts`** — `provideState(...)` + `provideEffects(load, save, telemetry,
   + the module's existing effects)`.
7. **Route** — add `providers: <module>LazyProviders` + `resolve: { hydrated:
   moduleHydrationResolver(ModuleActions.load, ModuleActions.loaded) }`.
8. **`main.ts`** — remove the module's reducers from `provideStore` and its effects from
   `provideEffects`.

| Module | Slices (persisted keys) | Effects to relocate | Existing lazy files? |
|---|---|---|---|
| **tracking** | `tracking` (`npc-tracking`) + `dialogs` (ephemeral) | `ItemListEffects`, `TrackingEffects`, tracking search effects (`addItemFromSearch$`/`addOrUpdateItem$`/`clearSearch$`/`updateSearch$` from `AppEffects`), `saveOnChange$`, `TrackingNotificationsEffects` ⚠️ | new `provide-tracking-lazy.ts` |
| **office-time** | `settings` (`npc-settings`) + `officeTime` (`npc-officeTime`) | `SettingsEffects`, `OfficeTimeEffects`, `OfficeTimeTelemetryEffects`, their save effects | new |
| **notifications** | `notifications` (`npc-notifications`) | `NotificationsTelemetryEffects`, `saveNotificationsOnChange$` (new save effect class) | new |
| **groceries** | `products`+`shopping`+`storage` | already lazy; **fold in** `saveGroceryOnChange$` (P/S/S branches), `GroceryListEffects`, `ItemDialogsEffects` (audit — see ⚠️); add grocery telemetry reporters | `provide-groceries-lazy.ts` |
| **tasks** | `tasks` | already lazy; add `[Tasks]` save (from `saveGroceryOnChange$`), add tasks telemetry reporter | `provide-tasks-lazy.ts` |
| **cash** | `cash` | `saveCashOnChange$`, add cash telemetry reporter | new |
| **trackplay** | `trackplay` | `TrackplayEffects`, `[Trackplay]` save (from `saveGroceryOnChange$`), add trackplay telemetry reporter | new |

Also: **groceries/tasks resolvers** switch from the global `datastoreHydrationResolver` to
`moduleHydrationResolver([Groceries].load, .loaded)` / `([Tasks].load, .loaded)`, and their
reducers hydrate on the scoped `loaded` (step 2). This removes the "re-read the whole datastore
on every grocery-route entry" nit (target-arch §11): now entering a grocery route reads only the
grocery keys.

---

## 5. `DatabaseService` rewrite

```ts
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  readonly #storage = inject(Storage);

  /** Boot: init storage, run migrations on RAW keys, return dashboard summaries. */
  async bootstrap(): Promise<{ summaries: IDashboardSummary[] }> {
    await this.#storage.create();
    await this.#migrateRawKeys();               // §6
    return { summaries: await this.#loadSummaries() };
  }

  load<T>(key: string): Promise<T | null> { return this.#storage.get('npc-' + key); }
  save<T>(key: string, value: T | null | undefined) { return this.#storage.set('npc-' + key, value); }

  loadSummary(source: string) { return this.#storage.get('npc-summary-' + source); }
  saveSummary(source: string, metrics: Record<string, number|string>) {
    return this.#storage.set('npc-summary-' + source, { source, metrics });
  }

  async #loadSummaries(): Promise<IDashboardSummary[]> {
    const out: IDashboardSummary[] = [];
    await this.#storage.forEach((v: IDashboardSummary, k: string) => {
      if (k.startsWith('npc-summary-')) out.push(v);
    });
    return out;
  }
}
```

- `create()` and the whole-datastore `#loadAs` path are **deleted**. The `npc-globals →
  npc-products` fallback and the `listSettings` flag-key rename were **already removed in the
  migration reset (2026-07-14, see §6)** — start-fresh, no legacy survival — so grocery /
  listSettings load reads plain `npc-*` keys with no special-casing.
- Lazy modules call `database.load('tracking')` etc. in their load effect; save in their save
  effect. No slice list lives in `DatabaseService` anymore — it's a dumb key/value port.

---

## 6. Migrations (reset to a fresh baseline — DONE 2026-07-14)

**Already landed (uncommitted, working tree on `main`).** The store was reset to a clean
baseline: `migrations.ts` `VERSION` is `'1'` and the `migrations` array is **empty**; the two
pre-1 data-format steps (`targetPercentage→days`, notifications backfill) and the two
Expand/Contract *rename* survival paths in `DatabaseService` (`npc-globals→npc-products`
fallback, `listSettings` `show*Globals*`→`show*Products*` flag remap) were **deleted**. The
`Migration` type + `migrate()` function are kept — the framework is alive, just empty. Specs
updated (`migrations.spec.ts` now pins framework behaviour; `database.service.spec.ts` drops the
two rename blocks; `test-data.ts` settings version `'3'→'1'`). Gates green (620 unit · tsc · lint
· sheriff).

Consequence for this plan: `migrate()` at rollout is a genuine **no-op** (empty step list), so
the boot-time migration step is essentially free. Any locally-persisted older-build data just
gets its version stamp normalized to `'1'` on next boot (data shape already current — nothing
transformed).

**Decision — when steps return, they run at boot on RAW storage, independent of slice
registration.** A migration is a pure transform on persisted JSON; it needs no reducer. A future
`#migrateRawKeys()` reads the specific keys a step touches, runs `migrate()`, and writes back
changed keys before any lazy module loads — so a lazily-loaded module reads already-migrated
data. `VERSION` stays in `migrations.ts`; `settings.reducer.ts` keeps stamping it.

*Future cleanup (not in scope):* per-slice versioning so each module migrates itself on load.

---

## 7. The cross-cutting effects that are NOT in-module (deferred-scope risks)

The drill postponed "a stat changes while its module isn't open." Three existing effects violate
the "only in-module user actions" invariant and **cannot naively become lazy**:

1. **`TrackingNotificationsEffects.runningUpdates$`** — a `timer()` (keyed off
   `loadedSuccessfully`) that rewrites running-tracking notification bodies every minute. If it
   becomes lazy in `tracking`, it only runs while the tracking route is active → running-item
   notifications stop updating when you leave. That's the postponed background case.
2. **`TrackingNotificationsEffects.triggerAction$`** — responds to `NotificationsActions.
   triggerAction` (a notification **CTA tap**, fired from the *notifications* page) by toggling a
   tracking item. If lazy in `tracking`, tapping a tracking CTA while on `/notifications` does
   nothing. A real regression.
3. **`AppMessageEffects`** / the `notify` sink — the published-language listener that turns
   `notify(...)` into toasts/OS notifications. Like `dashboard`, it's a **capability sink** every
   module writes to → **stays eager** (correct by the same topology argument).

**Plan:** `AppMessageEffects` stays eager (§by design). Split the tracking↔notifications bridge:
`reconcileState$` (fires only on tracking mutations) goes **lazy** with `tracking`;
`runningUpdates$` + `triggerAction$` either **stay eager** (a small always-on
`TrackingNotificationsBridgeEffects` registered in `main.ts`, reading `state.tracking` by shape)
**or** are redesigned when the deferred background-change decision is taken. Recommend: keep them
eager now (smallest, correct), and revisit under the postponed decision. Flag in `todo.md`.

⚠️ These are the reason the checkbox "every effect is lazy" is **not** 100% achievable without
the deferred decision — the honest boundary is "every *write-model* effect is lazy; capability
**sinks** stay eager."

---

## 8. Sheriff, types, testing impact

- **Sheriff:** telemetry reporters already import only `@shared` + own selector — sealed-safe.
  Moving save/load effects into a module keeps them intra-domain. The resolver factory is
  `@shared`. No new bridges. Run `pnpm exec sheriff verify` after each module.
- **Types:** `IAppState` is unchanged (feature keys stay flat top-level). Add
  `IDashboardSummary`. `LoadedDatastore` shrinks in relevance (per-module `loaded` payloads type
  their own slice); keep it as the migration view or replace with per-key types.
- **Tests:**
  - Reducer specs: swap `loadedSuccessfully` → `[Module] loaded` in hydration tests.
  - New: `dashboard.reducer` hydrate-sets-standby / report-sets-online; `DatabaseService.
    bootstrap` migration + summary read; each module's load effect (read key → `loaded`) and
    save effect (already partly covered).
  - e2e: a **cold-launch deck** test — seed `npc-summary-*`, assert tiles show numbers with **no
    module route visited**; then enter a module and assert the tile flips `standby→online` and
    the number reconciles. This is the acceptance test for the whole change.
  - `provideMockStore` component specs unaffected (no `detectChanges`, per testing philosophy).

---

## 9. Phased, gated sequence

Gates after every phase (target-arch §7): `tsc -p tsconfig.app.json --noEmit` + `-p
tsconfig.spec.json` · `pnpm exec sheriff verify` · `pnpm exec eslint "src/**/*.ts"` · `pnpm test`
· `pnpm run e2e`. Strangler/Expand-Contract throughout — the tree builds after each phase.

- **Phase A — persist the dashboard (no laziness yet). ✅ DONE 2026-07-14.** Added
  `IDashboardSummary` (metrics-only persistence shape), `DashboardActions.load/hydrate`, the
  reducer status lifecycle (`report`→`online`, `hydrate`→`standby`), eager `DashboardEffects`
  (`load$` boot-hydrate with empty-fallback on storage failure / `persistSummary$` mirror-to-disk),
  and `DatabaseService.bootstrap()`/`saveSummary()`/`#loadSummaries()` alongside the still-present
  `create()`. Added an **init-once storage guard** (`#ensureStorage()`) so `create()` + `bootstrap()`
  racing at boot init the LocalForage backend exactly once. `main.ts` registers `DashboardEffects`
  and dispatches `DashboardActions.load()` next to `ApplicationActions.load()`. Modules still eager.
  Tests: reducer online/standby + hydrate-replaces; new `dashboard.effects.spec` (load hydrate /
  fail-fallback / persist); `database.service.spec` bootstrap-filters-summaries + init-once. Gates
  green (630 unit · tsc app+spec · sheriff · eslint · 23 e2e). **Bankable win, zero lazy risk.**
  - **Review-driven hardening (adversarial review, 2026-07-14).** The eager telemetry reporters
    (still in `main.ts` this phase) emit their first `report` *synchronously at effect-registration*
    (`ENVIRONMENT_INITIALIZER`), i.e. **before** `provideAppInitializer` dispatches the load actions
    that call `storage.create()`. Two consequences fixed: **(1)** `saveSummary()` bypassed
    `#ensureStorage()`, so `storage.set()` threw `'Database not created'` on every cold boot
    (`persistSummary$` survived via NgRx retry but logged + dropped the write, and would exhaust the
    10-retry budget once Phase B adds more eager reporters) → `saveSummary` now `await`s the guard.
    **(2)** that pre-hydration boot `report` (initialState metrics) would clobber the prior session's
    good summary on disk before `bootstrap()` reads it → `persistSummary$` is now gated
    `skipUntil(hydrate)`, so nothing persists until the read-model has hydrated from disk. Both are
    no-ops in the lazy end-state (reporters register post-boot). The read-model-clobber and
    `#ensureStorage` `??=` race concerns raised in review were **refuted** (nothing consumes
    `status` yet; the `??=` assignment is synchronous/atomic). +2 effect specs.
- **Phase B — add missing reporters + cold-launch e2e. ✅ DONE 2026-07-14.** Seven new
  `*-telemetry.effects` push one live metric each: `tracking`→`count`, `cash`→`balance` (net €),
  `trackplay`→`games` register **eager** in `main.ts` (their slices are eager); `shopping`→`active`,
  `storage`→`low`, `products`→`count`, `tasks`→`open` register in the **lazy** providers
  (`provide-groceries-lazy` / `provide-tasks-lazy`) — the plan said "still eager", but those slices
  are already lazy (Phase A baseline), so an eager reporter would read undefined state; registering
  the reporter with its slice is the only correct option and is a no-op for the end-state. The deck
  (`commlink.page`) stays domain-blind: each program carries a `source`+`metric`, and a `badge()`
  accessor reads the persisted read-model signal (`selectDashboardState`) to render a per-tile badge
  (non-positive values render nothing — a 0 count / overdraft is not a glanceable flag). Cold-launch
  e2e uses the **lazy** MARKET(shopping) tile: seed a summary via the route, reload onto the deck
  without re-visiting, assert the badge shows the persisted number (a lazy slice can't re-report at
  boot, so only the persisted summary can supply it) — the acceptance test for the whole change;
  plus a reconcile test (open module → tile flips to the live count). Review (adversarial, 6/7
  refuted): only a cash-balance-rounding/overdraft **test-coverage** gap was confirmed → added
  non-round + negative projector cases. Gates green (653 unit · tsc app+spec · sheriff · eslint · 25
  e2e). *Verify:* every tile has a live metric.
- **Phase C/E groceries+tasks hydration cutover — ✅ DONE 2026-07-14 (partial C, E-hydration).**
  Landed the shared infra — `DatabaseService.load<T>(key)` (per-key getter behind the init-once
  guard) and the `moduleHydrationResolver(load, loaded)` factory — and cut the two **lazy** contexts
  over to their own scoped hydration: `GroceriesActions.load/loaded({products,shopping,storage})`
  (one atomic co-hydration action, `GroceriesLoadEffects` reads the three keys) and
  `TasksActions.load/loaded`. Their reducers hydrate on the scoped `loaded`; the grocery/tasks routes
  resolve via `moduleHydrationResolver` and the old `datastoreHydrationResolver` (whole-datastore
  re-read on every grocery-route entry) is **deleted**. Eager modules still use the global
  `ApplicationActions.loadedSuccessfully`/`create()` for now. **Review caught a critical bug:**
  `TasksActions.load/loaded` share the `[Tasks]` source that the eager `saveGroceryOnChange$`
  matches, so `[Tasks] load` (fired at empty initialState before the load effect reads) persisted
  empty state and clobbered saved tasks on route entry (deterministic — `save()` skips the storage
  guard, `load()` awaits it, so the empty write lands before the read). Fixed by excluding the
  `load`/`loaded` lifecycle from the persist filter (hydration is not a mutation — a general
  invariant for all future cutovers) + regression unit test + a tasks-reload e2e. Gates green (658
  unit · tsc app+spec · sheriff · eslint · 26 e2e). *Remaining for C/D:* per-module `load/loaded` for
  the eager modules, delete `ApplicationActions`/`create()`, then registration-laziness (Phase D).
- **Phase C — retire the global load; per-module `load/loaded` (still eager). ✅ DONE 2026-07-15.**
  All 7 eager contexts (`tracking`, `settings`, `officeTime`, `notifications`, `cash`, `trackplay`,
  `listSettings`) got `load/loaded` on their own action groups; each reducer hydrates on its scoped
  `loaded`; per-module load effects read own keys (`DatabaseService.load<T>(key)`); `main.ts`
  dispatches the 7 loads at boot instead of `ApplicationActions.load()`. The two §7 tracking effects
  (`trackTime$`, `runningUpdates$`) rekeyed to `TrackingActions.loaded`; the two ephemeral no-op
  reducer handlers (tracking `dialogs`, `itemDialogs`) deleted. Storage-unavailable toast moved to
  the single eager boot reader `DashboardEffects.load$`. **Deleted:** `ApplicationActions` (whole
  file), `AppEffects.initializeApplication$`, `DatabaseService.create()`/`#loadAs`. `migrate()`/
  `VERSION` kept as the (now boot-unused) framework — migrations no longer run at boot (empty list,
  VERSION `'1'`, §6). **Review caught a critical bug:** the `[Cash] load/loaded` clobber — I added
  the `load|loaded` persist-exclusion to `saveGroceryOnChange$` but missed `saveCashOnChange$` (and
  even wrote a comment claiming it existed). Fixed + regression tests (persist-on-mutation /
  not-on-lifecycle). Gates green (659 unit · tsc app+spec · sheriff · eslint · 26 e2e). Expand/
  Contract on hydration — load path changed, registration still eager (that's Phase D).
- **Phase D — go lazy, one module at a time. ✅ DONE 2026-07-15 (`3c6dfb4`).** Made the three
  **cleanly-isolatable** contexts lazy: `cash` (`/cash`), `trackplay` (the five `/trackplay/*`
  routes), `office-time` (`/settings` + `/office-time` + `/barcode`, two co-registered slices;
  `/barcode` joins because the SIGIL badge lives in the `officeTime` slice). Each got a
  `provide-<m>-lazy.ts` (state + load + save + telemetry + domain effects) + a route resolver, and
  was removed from `main.ts`. Saves relocated to lazy `CashSaveEffects` / `TrackplaySaveEffects`
  (trackplay SPLIT out of `saveGroceryOnChange$`, keeping the `!/\] (load|loaded)$/` exclusion).
  Office-time saves already lived in its own effects (`SettingsEffects.saveSettingsOnChange$`,
  `OfficeTimeEffects.saveOn$/saveOfficeTime$`), no relocation needed. Adversarial review (5
  dimensions, refute-by-default): **0 correctness findings**; the one confirmed test-coverage gap
  (cash) was closed. Added a trackplay reload-persistence e2e + a cash first-paint wiring e2e.
  Gates: tsc app+spec · sheriff · eslint · **661 unit · 28 e2e**.
  - **DEVIATION (verified from code topology; the §7 honest boundary): `tracking` + `notifications`
    stay EAGER.** `TrackingNotificationsEffects.runningUpdates$` is a background `timer()` that reads
    `state.tracking` off-route every minute and writes `state.notifications`, and `reconcileState$`
    writes notifications from the *tracking* route — so notifications is a capability **sink** (like
    `dashboard`) written to from other routes, and tracking is locked to it by the eager bridge.
    Lazifying either breaks background running-timer notifications / cross-route notification writes.
    This is precisely the postponed §7 background-stat-change decision, so §4's aspiration to lazify
    all five modules is knowingly **not** met for these two. Honest end-state: write-model effects
    lazy, capability sinks (`dashboard`, `notifications`, `AppMessageEffects`, the
    tracking-notifications bridge) eager.
- **Phase E — groceries/tasks cutover. ✅ DONE (split across `2c2d17b` + `f9dc8d2`).** The resolver
  cutover (`moduleHydrationResolver` with scoped `[Groceries]`/`[Tasks] loaded`, reducers hydrate on
  scoped `loaded`, whole-datastore re-read removed) landed in `2c2d17b` (Phase C/E). The save-fold
  landed 2026-07-15 (`f9dc8d2`): `saveGroceryOnChange$` split into lazy `GrocerySaveEffects`
  (`[Products|Shopping|Storage]`, in `groceriesLazyProviders`) + `TasksSaveEffects` (`[Tasks]`, in
  `tasksLazyProviders`) and deleted from `AppEffects`. The shell orchestrators `GroceryListEffects` +
  `ItemDialogsEffects` stay eager — they are `type:shell` bridges spanning BOTH groceries and tasks
  (one generic effect routes all four lists), can't live in a domain data layer, and registering one
  shared class in both route injectors would double-dispatch across a grocery↔tasks transition.
  Adversarially verified SOUND (reducer S ⟺ save S share one injector lifecycle → no off-route
  data-loss). Gates: **663 unit · 28 e2e**.
- **Phase F — cleanup. ✅ DONE 2026-07-15.** `ApplicationActions` + `DatabaseService.create()`/
  `#loadAs` were already gone (Phase C). Removed the dead `DatabaseService.store` field + `Store`
  import; fixed stale `create()`-era comments (init-once guard doc + `bootstrap()` doc). The
  storage-unavailable toast lives once in `DashboardEffects.load$` (no duplication). `LoadedDatastore`
  + `IDatastore` are kept — the live migration-view type + the persisted-slice `save<K>` contract.
  Updated `CLAUDE.md` (State section), target-arch §11, and this §9. `docs/todo.md` deliberately not
  touched (carries an unrelated pre-existing WIP rewrite). **Final `main.ts` shape:** `provideStore`
  = `{ router, dashboard, tracking, dialogs, notifications, itemDialogs, listSettings, quickadd }`
  (the eager kernel + the §7-deferred tracking/notifications); every other bounded context registers
  via its route `providers`. `provideEffects` = the eager sinks + tracking/notifications write-model
  + the shell grocery orchestrators (`GroceryListEffects`, `ItemDialogsEffects`).
  - **Deferred (flagged):** a full cash mutate→reload persistence e2e (parity with trackplay/tasks) —
    blocked on the P1 cash ledger UI (the P0 page is a read-only scaffold; only the load/hydrate
    wiring is e2e-guarded today). And the §7 background-stat-change decision that would let
    tracking + notifications go lazy.

**Stop points with banked value:** after **A** the dashboard survives reboot (the hard part of
the design); after **C** the global load is gone; after **D/E** the requirement is met for every
context except the two §7-deferred eager sinks (`tracking`, `notifications`).

---

## 10. Requirements → done criteria

| Req | Done when |
|---|---|
| ① / ④ lazy code | already true (`loadComponent` everywhere) — unchanged |
| ② own store + lazy slice | `main.ts` `provideStore` holds only `router` + eager kernel (`dashboard`, `listSettings`, ephemeral UI); every bounded context registers via route `providers` |
| ③ lazy save/load of own data | `DatabaseService` has no slice list; each module reads/writes only its own `npc-*` key in its own lazy effects; boot reads only `npc-summary-*` (+ migration raw keys) |
| dashboard still works | cold-launch e2e: deck shows persisted numbers with no module loaded; entering a module flips `standby→online` and reconciles |

**Explicit non-goals / deferred:** bundle-size reduction (framework-dominated per §11 — the win
is boot hydration + memory, not KB); per-slice migration versioning (§6); the background/
cross-module stat-change mechanism and the fate of `runningUpdates$`/`triggerAction$` (§7).
