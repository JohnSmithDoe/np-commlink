# np-commlink — Target Architecture (DDD refactor)

**Status:** ARCHITECTURALLY COMPLETE (2026-07-13) on branch `feature/ddd-refactor` — 16
commits, all gates green (tsc · sheriff · lint · 619 unit · 23 e2e). See §11 for the
Definition-of-Done scorecard + the deferred polish. The substantive target — bounded contexts,
domain-blind `@shared`, one `groceries` context, sealed `tasks`, inverted cross-cutting
capabilities, `products` naming, lazy grocery state — is reached. Companion docs:
`merge-notes.md` (merge history/decisions), `todo.md` (tracked work + deferred polish),
`cash-plan.md` (cash ledger).

This is the outcome of a DDD drill on the current app. It records the target bounded
contexts, the principles behind them, the context map (who may depend on whom and how),
and a sequenced, safety-first migration plan that keeps the tree buildable after every step.

## Locked decisions

1. **Lazy state *and* code.** Every feature domain defers both its route/component bundle
   *and* its store registration + hydration. Consequence: the home dashboard can't read
   unopened domains, so the eager **dashboard read-model (§5)** is mandatory, and it must
   land *before* state goes lazy.
2. **`globals` → `products`.** The master list is `products`; each item is an **`IProduct`**
   (unit, packaging, weight, bestBeforeTimespan). listId `_globals` → `_products`;
   `canAddGlobal` → `canAddToProducts`; retire the `/database` route + `app-page-database`
   selector. shopping/storage rows **embed a snapshot** of an `IProduct` at add-time (not a
   reference) — `products` is the catalog they add *from*, not a dependency of the stored entry.

---

## 1. Why — what's wrong today

Evidence from the current tree:

- **`@shared` is not domain-agnostic.** Five `@shared` files hardcode the grocery lists:
  `grocery-list.utils.ts` (`stateByListId` and `updateQuickAddState` `switch` over
  `_storage/_globals/_shopping/_tasks` and read `state.storage/globals/shopping/tasks`
  by name), `grocery-list.selector.ts` (cross-list search buckets), `item-dialogs.reducer.ts`
  (`_storage`/`_globals`), plus `types.ts` and `testing/test-data.ts`. A "shared" layer
  that knows its consumers' identities is a **leaky abstraction**.
- **The four "independent" grocery domains are not independent.** `shopping`/`storage`/
  `products` cross-read each other (searching shopping reads `state.globals.items`;
  storage reads shopping; products reads storage) and carry three Sheriff bridges
  (`shopping↔storage`, `shopping→globals`, `storage→globals`). Only **`tasks`** is truly
  sealed — it never appears in the cross-list selector buckets.
- **Lazy state was tried and reverted.** The committed WIP (`09add83`, "part i") registered
  the four grocery slices independently per route, but the selector reads `state.globals`
  while searching shopping → 6 grocery e2e failed at runtime (unit tests didn't catch it).
  Reverted to eager (`539251c`); the slices that cross-read **must** hydrate together — phase 5.
- **`notifications` is a coupling magnet.** The `notifications→tracking` bridge points the
  wrong way: notifications imports tracking to watch its events. Extending that to
  office-time/trackplay/cash would make notifications import every domain.
- **The commlink dashboard vs lazy state.** A home dashboard that shows telemetry from
  every program cannot read lazily-registered slices that don't exist yet.

---

## 2. Bounded contexts (target domain map)

A *bounded context* is a language boundary; an *aggregate* is a consistency boundary
inside it. Subdomain types: **core** (the product), **supporting** (exists to serve a
core), **generic** (could be a library).

| Context | Type | Contents | Notes |
|---|---|---|---|
| `@shared` | generic (shared kernel) | domain-blind list kit (`item-list`/`list-item`/edit-modal shell/form inputs + generic reducer helpers, all `<T extends IBaseItem>`); **published-language contracts** (`notify`, `dashboardTelemetry`) | No list identities. No `switch(listId)`. Always available — it's a library, not state. |
| `groceries` | core | aggregates `shopping`, `storage`, `products` (+ `list-settings` feature flags); the multi-list engine, cross-list rules, `item-dialogs`, `quick-add`'s grocery bits | The three current bridges become **intra-domain** and disappear. One domain folder (§6). |
| `tasks` | core | todo list (dueAt/prio) | Own domain. Reuses the kit; shares **no data** with groceries. |
| `tracking` | core | time tracking + single-list engine; owns the tracking→notify effect | **Not** re-domained. Publishes a read-model selector (§4). |
| `office-time` | core | presence dashboard, wordclock; owns the SIGIL image | Own context; reads a little tracking data via a published selector (§4). |
| `cash` | core | offline multi-account ledger | See `cash-plan.md`. Not a "list". Dispatches `notify` + reports telemetry. |
| `trackplay` | core | shadowrun game scoring | Not a "list". Dispatches `notify` + reports telemetry. |
| `barcode` | supporting | SIGIL badge image display | Reads office-time state (published). |
| `notifications` | supporting/generic | OS + in-app notification sink | **Knows no domain** — listens for the shared `notify` action. |
| `commlink` | supporting | the deck/home dashboard | Aggregates telemetry from all programs — reads only the shared read-model (§5). |

### Ubiquitous language

Name things for the domain, not the storage. `globals` was an implementation name; the
concept is a list of **products** (things you can buy), each an **`IProduct`**. A shopping or
storage row is an **entry** that **embeds a snapshot** of an `IProduct` at add-time — not a
reference it later resolves — so once added it is self-contained. `products` is the catalog
they add *from* (the search assist reads it live), not a runtime dependency of the stored entry.

---

## 3. Principles (reusable)

**Design principles:**
1. **"Shared" means domain-agnostic.** A shared layer that hardcodes its consumers'
   identities is a leaky abstraction. Draw the module boundary around the *real coupling*
   (the bounded context) and demote generic mechanics to a shared kernel/library.
2. **Cross-cutting capabilities invert their dependencies** (Dependency Inversion). A
   capability serving everyone (notifications, dashboard) must not import everyone. Publish
   a contract in the shared kernel; consumers *dispatch*, the capability *listens*.
3. **Context mapping for cross-context reads:** **1:1 read** → upstream exposes a stable
   **published read-model selector** (Open Host Service); downstream depends on that
   selector only. **1:many aggregation** → **invert**: suppliers push to a shared read-model.
   **Anticorruption Layer** only when models genuinely diverge (YAGNI for a count).
4. **CQRS for the dashboard under lazy state.** The dashboard is a **read model**
   (materialized view), eager and independent of the lazy write models.
5. **List UI: unify the frames, project the bodies.** Shared shells + form inputs (`<T>`);
   each domain projects its row/form markup and keeps its item type **in-domain**.

**Refactoring patterns that keep the tree green (this is a big change — lean on them):**
- **Strangler Fig** — stand the new structure up beside the old and flip consumers over
  gradually; never a big-bang cutover.
- **Branch by Abstraction** — to genericise the shared kit: introduce the generic
  abstraction, migrate consumers onto it, then delete the old grocery-specific code.
- **Expand / Contract (parallel change)** — for every rename (store keys, persistence keys,
  action sources): add the new, migrate reads/writes, remove the old — so no step loses data
  or breaks the build.
- **Characterization tests** — before moving behaviour (cross-list copy, `canAddToProducts`,
  search buckets), pin it with tests so the move is provably behaviour-preserving.

---

## 4. Context map (dependency arrows)

```
        every domain ──dispatch notify()──▶  @shared (published language)  ◀──listens── notifications
        every domain ──report telemetry──▶  @shared (dashboard read-model) ◀──reads──── commlink

        office-time ──reads published selector──▶ tracking      (1:1, Open Host Service)
        barcode     ──reads published state─────▶ office-time   (existing, keep)

        groceries: shopping ⇄ storage ⇄ products →  INTERNAL to the context (no bridges)
        tracking / tasks / cash / trackplay      →  self-contained; depend only on @shared
```

**Sheriff bridge deltas:**
- **Delete:** `notifications→tracking` (inverted via `notify`); `shopping↔storage`,
  `shopping→globals`, `storage→globals` (absorbed into `domain:groceries`);
  `commlink→notifications`, `commlink→office-time` (replaced by the shared read-model).
- **Keep:** `barcode→office-time`.
- **Add:** `office-time→tracking` narrowed to a *published selector* import only.

### Published contracts (pin the shapes before phase 1/2)

- `notify({ level: 'info' | 'warn' | 'urgent', title, body?, source, at?, dedupeKey? })` —
  the effect decides in-app toast vs OS notification from `level` + platform; `source` is the
  emitting context (for grouping); `dedupeKey` suppresses duplicates.
- `dashboardTelemetry.report({ source, status: 'online' | 'standby', metrics: Record<string, number | string> })`
  — the read-model keeps the latest per `source`; the persisted `npc-summary-<source>` doc
  mirrors it.

---

## 5. State, persistence & lazy loading

**Eager core (always registered):** `router` + the **dashboard read-model** slice. Nothing
else. The shared kernel is a library, not state, so it's always importable regardless.

**Every feature domain is lazy (state + code):**
- Route-level `loadComponent` gives lazy *code*; route-level `providers:
  [provideState(feature), provideEffects(...)]` gives lazy *state*.
- **groceries loads as one chunk.** A parent `/groceries` route registers all three
  aggregate slices + the engine effects *together* and hydrates them in one **route
  resolver** (fixes the co-hydration crash); children `shopping`/`storage`/`products` lazy-
  load only their components under it. `tasks` (no cross-reads) loads on its own.
- Replaces the current module-global `groceryStateHydrated` flag + re-dispatched
  `ApplicationActions.load()`.

**Dashboard read-model (CQRS) — the enabler for lazy state:**
- A small **eager** `dashboard` slice in `@shared` holds only per-tile summaries
  (`{ tracking:{count}, shopping:{unbought}, storage:{lowStock}, … }`).
- **Populated from persisted *summary docs*, not by scanning full blobs.** Each domain, on
  save, also writes a tiny `npc-summary-<domain>` doc (just its counts). At boot the
  dashboard reads only those small docs — it does **not** deserialize the full slice blobs,
  which would re-pay the hydration cost lazy state is meant to avoid. Live updates while a
  domain is active come via `dashboardTelemetry.report(...)`. First-ever boot (no summary
  yet) shows the tile empty until first visit.
- Commlink reads **only** this slice. Static tile data (codename/route/status) is config.

**Hydration must move from boot-time-everything to per-feature.** Today `DatabaseService.
create()` loads *every* slice at boot and every reducer hydrates on one global
`ApplicationActions.loadedSuccessfully(IDatastore)` — which directly contradicts lazy state.
Redesign:
- Boot loads only the eager core (`router`, `dashboard` summaries).
- Each lazy feature hydrates itself in its route **resolver**, dispatching a *scoped* load
  (e.g. `GroceriesActions.loaded(data)`), not the monolithic datastore action. Migrate with
  Expand/Contract (support both actions, move consumers, delete the monolith).
- **save-on-change + orchestrators move into the domain.** `app.effects.ts
  saveGroceryOnChange$` and the shell-root orchestrators (`grocery-list.effects`,
  `item-dialogs.effects`) fold **into `groceries`** — they only touch grocery aggregates now,
  so they belong in the (lazy) domain and register with it. The save effect also writes the
  `npc-summary-<domain>` doc.

**Persistence renames use Expand/Contract:** `globals`→`products` renames `npc-globals`. On
load, read `npc-products`, else fall back to `npc-globals` once and re-persist. NgRx feature
*keys* stay flat top-level (`state.products` etc.) regardless of the `groceries/` folder, so
the state *shape* barely changes — only `globals`→`products`.

---

## 6. The list kit + folder shape

- **Stays generic in `@shared`:** `IBaseItem`, `IListState<T>`, `ISearchResult<T>`; generic
  reducer helpers (`addListItem`, `updateListItem`, `removeListItem`, `updateListMode`,
  category helpers); the UI (`item-list`, `list-item`, searchbar/toolbar/empty, `page-header`);
  the **edit-modal shell** + form inputs (`category-input`, `date-input`, `number-input`).
- **Moves into `groceries`:** `stateByListId`, the cross-list search buckets, the
  grocery-specific `item-dialogs` open-actions, the concrete item types and `TItemListId`.
- **Genericise `quick-add` + `item-dialogs`.** `canAddLocal`/`canAddCategory`/search-matching
  are **generic mechanics** → `@shared`, config-driven over the passed `IListState<T>` (no
  `switch(listId)`). `canAddToProducts` references the `products` aggregate → lives in
  `groceries`.
- **Edit dialogs** are already thin wrappers over the shared modal + inputs dispatching to
  one `item-dialogs` slice; keep that shape, project the per-domain form body. Item type
  stays in-domain (`<T>`), so no discriminated union in `@shared`.

**Folder shape (Sheriff `<domain>/<type>`):** `groceries` is **one** domain folder, so its
aggregates live side by side inside it — `groceries/data/{shopping,storage,products}.reducer.ts`,
`groceries/data/list/*` (the moved engine), `groceries/feature/{shopping,storage,products,
list-settings}-page/`, `groceries/ui/*-item/`, `groceries/smart-ui/edit-*-item-dialog/`. They
import each other freely (`sameTag`), which is exactly the intra-context coupling we want.

### Design: sealing `tasks` off the shared page (recon 2026-07-13)

The shared `grocery-list-page` is **~90% generic** — page-header, searchbar, toolbar (with a
projected `[toolbarActions]` slot), quick-add, `item-list`, empty-state, and the category
dialog are all domain-blind list machinery. The **only** grocery-specific part is one block:
`<app-grocery-search-result>` (the cross-list product/storage/shopping search buckets) + its
`addProduct`/`addStorageItem`/`addShoppingItem` handlers + `quickCreateGlobal`. `tasks` never
uses that block (its buckets are always empty). So the cut is: **promote the page to a generic
`@shared` `list-page`, and move the grocery buckets/catalog block into `groceries`** (grocery
pages project it via a new `[searchExtras]` slot; `tasks` omits it).

**The design constraint that shaped this:** how does a *generic* `list-page` obtain the active
list's state? Today it reads `selectListState` (route-param → `stateByListId`, which `switch`es
over the hardcoded listIds — the leak). NgRx **selectors can't read DI**, so a "registry" of
`listId → selector` can't be injected into a pure selector.

**Decision — (b) per-domain `ListPageFacade` via DI.** The generic `list-page` injects a
`LIST_FACADE` token; each domain *provides* a facade (an injectable service) exposing the list
signals (`state`/`items`/`categories`/`searchResult`) + dispatch methods (`search`/`sort`/
`mode`/`addFromSearch`/`selectCategory`/…). This solves the selector-DI constraint (the facade
is a service, so it can hold `store.selectSignal(...)`), keeps the page smart-but-domain-blind,
and beats **(a)** input-driven shell (heavy per-page boilerplate) and **(c)** duplicate-for-tasks
(code duplication). `groceries`' facade carries the multi-list engine (`stateByListId` + the
cross-list buckets, rendered into a `[searchExtras]` slot); `tasks`' facade is a trivial
single-list one → `tasks` sealed, depends only on `@shared`.

**Sub-step sequence (each gated: tsc + sheriff + e2e):**
1. Introduce `IListPageFacade` + `LIST_FACADE` token in `@shared`; make `list-page` inject it
   (Branch by Abstraction — keep behaviour via a temporary grocery facade).
2. Move the cross-list buckets/catalog block out of the page into a grocery `[searchExtras]`.
3. Give `tasks` its own single-list facade; point the tasks page at the generic `list-page`.
4. Relocate the multi-list engine (`stateByListId`, buckets, `canAddProduct`) into `groceries`;
   `@shared` keeps only the generic list machinery + facade contract.
5. Delete the remaining grocery bridges; `sheriff verify`.

---

## 7. Migration plan

Each phase is a separate branch/PR, revertable, tree buildable + gated after it:
`pnpm build` (clean cache) · `sheriff verify` · `eslint` · **`tsc -p tsconfig.app.json --noEmit`
+ `-p tsconfig.spec.json` (filter cosmetic TS6307)** · `pnpm test` · `pnpm e2e`.
**Gate lesson (phase 2):** `build` and `test` run on **esbuild** (transpile-only — no full
type-check), so a broken *type-only* import (e.g. a missing exported type) passes them silently.
The `tsc --noEmit` step is what catches it — treat it as a required gate, not optional.
Phases 1→2→3 are low-risk and independently valuable; 4 is the big one; 5 depends on 2 **and** 4.

**Phase 0 — safety net & baseline.**
- *Goal:* make the refactor provably behaviour-preserving and measurable.
- *Changes:* the lazy WIP is already committed (`09add83`, "part i" — independent per-slice
  `provideState` + a global-flag hydration hack). **Leave it — do not reset `main`** (history
  rewrite buys nothing; it's orthogonal to phases 1–4); **phase 5 supersedes it** with the
  resolver + one-chunk architecture. Add **characterization tests** for the behaviours about
  to move — cross-list copy-to-shopping, `canAddGlobal`, the search buckets, edit-dialog save
  per domain. Record a **bundle-size baseline** per route (the number lazy loading must beat)
  and the gate baseline (build/sheriff/lint/600 tests/e2e).
- *Verify:* new tests green; baseline captured in this doc.
- *Safety:* additive only — new tests + a doc baseline, no production code touched.
- *Baseline captured (2026-07-13, clean cache, HEAD `09add83`):* initial **1.38 MB raw /
  287.6 kB transfer**; `main` 102 kB; the bulk is a **1.06 MB framework vendor chunk**.
  Feature pages are **already lazy code** (`shopping-page` 6 kB, `storage-page` 5.9 kB are
  lazy chunks) — so lazy *state*'s win is **boot hydration + memory, not bundle size**.
  Characterization net already exists (`grocery-list.utils.spec`, `grocery-list.selector.spec`,
  `quick-add.*.spec`) — **except** the notification effects (see phase 1). Gate baseline: 600
  tests, sheriff clean, 0 lint.

**Phase 1 — invert notifications. ✅ DONE (`77e0a11`).**
- *Result:* all gates green (599 tests — one redundant smoke spec dropped with the merged
  effect class); notifications imports zero domains (verified by grep + `sheriff verify`);
  reconciler + `triggerAction$` + debug moved **verbatim** into `TrackingNotificationsEffects`
  (correctness review diffed them char-for-char); `NotificationsActions` now the `@shared`
  contract. **Gap closed:** the review found those effects were only *instantiation*-smoke-tested,
  so behavioural unit tests were added for `reconcileState$` (drift/orphan/touched),
  `triggerAction$` (the `hintState` flip both directions + markDone-when-gone), `runningUpdates$`,
  and `addDebugNotification$` (610 tests total). The unused `provideEffectsTestingProviders`
  helper was removed — effects specs now wire `provideMockActions`/`provideMockStore` inline.
- *Goal:* the `notifications` domain imports **zero** other domains (delete the
  `notifications→tracking` bridge).
- *Recon finding (bigger than a mapper):* the coupling is threefold — (i)
  `notifications-from-tracking.effects` is a **stateful reconciler** (reads `state.tracking` +
  `state.notifications`, upserts/removes tracking-keyed `INotification`s with `updatedAt`-drift
  logic); (ii) `NotificationsEffects.triggerAction$` imports `TrackingActions` and toggles
  tracking on a CTA tap (with a `hintState` flip); (iii) `addDebugNotification$` reads tracking.
  The notification *model* (`INotification`, `TNotificationAction`) already lives in
  `@shared/types`.
- *Design (best-DDD-fit inversion):* relocate the **notification write-action contract**
  (`NotificationsActions`: add/upsert/updateBody/remove/…) to `@shared/data/notifications` (the
  published language). Move **all three tracking-aware effects** (reconciler + triggerAction
  handling + debug) into a `tracking` effect — there they read `state.tracking` (same domain),
  read `state.notifications` by *shape* (type-level, no import), and dispatch the `@shared`
  contract. `notifications` keeps only its reducer/selector/page/OS-service and consumes the
  `@shared` contract. Tracking imports the `@shared` contract, **not** the notifications domain
  → no reverse bridge. Then delete `notifications→tracking`.
- *Verify:* gates; toggling a tracking item still upserts its notification; tapping a CTA still
  toggles tracking; `sheriff verify` clean with the bridge removed.
- *Safety:* behaviour-preserving **relocation** (move code, rewrite imports) — not a rewrite;
  `notifications-from-tracking.effects.spec` + notifications specs guard it.

**Phase 2 — dashboard read-model (live push). ✅ DONE (`b853e8d`).**
- *Result:* eager ephemeral `@shared/data/dashboard` slice + `DashboardActions.report` contract;
  **store-driven reporter effects** in notifications & office-time (`store.select(sel).pipe(map(→report))`
  — fires the initial value on registration + on every change, lazy-safe); commlink reads only
  `selectTelemetry('notifications'|'office-time')` and imports **zero** domains; both commlink
  bridges deleted. Gates green + `tsc` clean; 619 tests. Minor open (test-coverage lens, non-blocking):
  the office-time reporter spec type-checks `percentage` rather than asserting a value, and neither
  reporter spec exercises re-emit-on-change — logged in `todo.md`.
- *Changes:* eager `@shared` `dashboard` slice + `dashboardTelemetry.report` action; each
  domain reports; commlink reads only the read-model; **delete** `commlink→notifications`,
  `commlink→office-time` bridges. (State still eager here, so live push suffices.)
- *Verify:* gates; deck tiles show the same counts as before.
- *Safety:* Strangler — read-model runs alongside the old selectors until commlink flips.

**Phase 3 — genericise the shared kit (Branch by Abstraction).**
- *Goal:* `@shared` becomes domain-blind; `tasks` depends only on the generic kit.
- *Changes:* split `quick-add` + `item-dialogs` into generic mechanics (`@shared`,
  config-driven, no `switch(listId)`) and grocery-specific rules (isolated, still wired).
  Migrate all consumers onto the generic abstraction; delete the old grocery-coupled code
  paths from `@shared`.
- *Verify:* gates; Phase-0 characterization tests still green (behaviour preserved).
- *Safety:* both paths coexist mid-phase; remove old only after consumers migrate.

**Phase 4 — create `domain:groceries` (the big one).**
- *Goal:* fold the real bounded context into one sealed domain.
- *Changes (sub-steps, each buildable):* (a) create the `groceries/` folder shape + Sheriff
  tag; (b) move the grocery-specific engine/`item-dialogs`/`quick-add` bits out of `@shared`
  into `groceries/data`; (c) relocate `shopping`/`storage`/`products`/`list-settings`
  features under `groceries` and rename `globals→products` (Expand/Contract on store +
  persistence keys); (d) delete the three grocery bridges; update routes → `/groceries/...`.
  Also churns `@shared/testing` factories (`mockGlobalItem→mockProductItem`), the `grocery.*`
  i18n keys (`globals`/`database` → `products`), and e2e hash routes.
- *Verify:* gates after each sub-step; `sheriff verify` right after sub-step (b).
- *Safety:* smallest sub-steps that still compile; the rename uses parallel keys.

**Phase 5 — go lazy (state + code).**
- *Goal:* realise the bundle + boot-time win, safely.
- *Changes:* parent `/groceries` route registers the three slices + engine as one chunk via
  `providers` + a hydration **resolver** (co-hydration); children lazy `loadComponent`;
  `tasks` lazy alone; add the **boot summary-doc read** to the dashboard read-model; remove the
  global-flag hack and the eager grocery registrations from `main.ts`. **Supersedes the
  committed WIP `09add83`** — overwrite those files here (a normal commit, no history rewrite).
- *Verify:* gates; **bundle size beats the Phase-0 baseline**; `e2e/*/first-paint` green
  under lazy; home dashboard shows counts with no domain loaded.
- *Safety:* the read-model (Phase 2) already makes the dashboard independent — this is why 5
  follows 2.

**Phase 6 — cleanup.**
- Delete dead bridges/actions/flags; confirm the context map matches `sheriff.config.ts`;
  update `CLAUDE.md`, `todo.md`, and this doc's status to "implemented".

---

## 8. Decisions (all resolved)

- **`products` is embedded, not referenced.** A shopping/storage **entry stores a snapshot**
  of the product fields at add-time — it does not hold a product id it later resolves. Each
  entry is self-contained, which *reduces* runtime coupling (rendering an entry needs nothing
  from the `products` slice). The `products` slice is still read **live** for the "add from
  catalog" search assist (the cross-list buckets) — a create-time convenience, distinct from
  the stored entry. So within `groceries`, `products` behaves as a referenced catalog for
  *creation*, not a consistency dependency of existing entries.
- **`list-settings` folds into `groceries`.** It only configures grocery behaviour (read by
  the quick-add/engine), so it belongs in that bounded context — not merged into office-time's
  `/settings` shell.
- **office-time ← tracking** is a 1:1 published read-model selector (Open Host); the exact
  selector name is chosen at implementation, not a blocker.

*(Also resolved earlier: lazy state+code — yes; naming — `products`/`IProduct`; commlink —
invert to the read-model; persistence renames — Expand/Contract; the committed lazy WIP
`09add83` is superseded by phase 5, not reset.)*

---

## 9. Risks

- **Store-key + action-source renames** ripple across selectors/effects/specs. Compile errors
  catch most; grep `select(...)` sites. Use Expand/Contract, not in-place renames.
- **Persistence key renames wipe local data** unless the `npc-globals`→`npc-products` fallback
  (§5) is added. Acceptable today (fresh-install), but cheap to guard.
- **The co-hydration bug (§1) was real and is now fixed.** The committed lazy WIP (`09add83`)
  failed 6 grocery e2e — shopping/storage/globals cross-read and never co-hydrated; `tasks`
  passed (self-contained), which confirmed the thesis. **Reverted to eager grocery in
  `539251c` (e2e 23/23).** Phase 5 must redo lazy via a route resolver that co-hydrates the
  grocery cluster as **one chunk** — independent per-slice lazy state is proven unsafe.
- **Phase 4 is large** — its value depends on staying green at each sub-step; if a sub-step
  can't compile, it's too big — split it further.
- **Sheriff cadence:** run `sheriff verify` immediately after the first moved slice in Phase 4.
- **Hydration redesign is load-bearing (§5):** moving off the monolithic
  `loadedSuccessfully(IDatastore)` to per-feature scoped loads touches every reducer's
  hydration branch — do it as Expand/Contract (support both, migrate, remove), not a rename.
- **Test churn:** the `globals→products` rename + `/groceries` routes touch `@shared/testing`
  factories and e2e hash URLs; budget for it in phases 4–5.

---

## 10. Definition of done & incremental value

**Overall DoD (holistic, not per-phase):**
- `grep` proves `@shared` has **zero** domain-name references (no `state.shopping`,
  `_storage`, `[Globals]`, etc.).
- `sheriff.config.ts` has **4 fewer bridges** (notifications→tracking + the three grocery
  ones) and no `commlink→supplier` bridges.
- Eager boot excludes every feature domain; **initial/home bundle beats the phase-0
  baseline** by a recorded margin.
- Home dashboard renders correct counts with **no** feature domain loaded.
- All gates green; e2e first-paint green under lazy routing.

**Incremental value — where you can stop and still have banked a win:**
- After **phase 2**: notifications + commlink no longer import any domain (coupling magnets
  gone).
- After **phase 3**: `@shared` is genuinely domain-blind and `tasks` is cleanly sealed — the
  SoC goal from `todo.md` item 1 is met.
- After **phase 4**: one honest `groceries` bounded context; the "two engines" confusion is
  gone.
- Phases **5–6** are the lazy-loading payoff (depend on 2 **and** 4) — the largest
  investment, deferrable.

**Out of scope:** `cash`/`trackplay` internals (they only gain `notify`/telemetry wiring);
PWA icon redesign and CI (see `todo.md`).

**Deferred decision:** a runtime feature flag to toggle lazy-vs-eager state for the phase-5
flip in the deployed PWA — de-risks rollback; adopt if the flip proves fragile.
</content>

---

## 11. Outcome — Definition-of-Done scorecard (2026-07-13)

Delivered on `feature/ddd-refactor` (16 commits). Every step was gated (tsc app+spec ·
sheriff · eslint · 619 unit · 23 e2e) and reviewed by adversarial lenses.

| DoD item | Status |
|---|---|
| `@shared` imports **zero** domains | ✅ grep-verified — the real boundary |
| `notifications` imports no domain (inverted via `@shared` contract) | ✅ `77e0a11` |
| `commlink` imports no domain (dashboard read-model) | ✅ `b853e8d` |
| One `groceries` bounded context (shopping/storage/products + engine) | ✅ `e1f5fc3` |
| `tasks` sealed (ListPageFacade; no grocery imports) | ✅ `4c6846b` |
| Sheriff bridges collapsed (was 5 → now 1: only `barcode→office-time`) | ✅ |
| `globals`→`products` ubiquitous language (code/route/persistence) | ✅ `0778df0` |
| Lazy state for the grocery cluster (co-hydrated) + tasks | ✅ `5524ca9` (deferred registration + boot-hydration) |
| Home dashboard renders with feature domains not loaded | ✅ |

**Realized-vs-planned nuances (honest):**
- **Lazy = deferred *registration + hydration*, not bundle.** The grocery/tasks slices left
  the eager `provideStore` and no longer hydrate at boot, but their (tiny) reducer/effect
  *code* stays in the initial bundle (`app.routes.ts` statically imports the provider arrays).
  The bundle is framework-dominated (~1.06 MB vendor), so code-splitting the state (needs
  `loadChildren`) is negligible gain — deliberately not chased (matches the phase-0 baseline).
- **Only grocery + tasks are lazy.** tracking/office-time/notifications/cash/trackplay stay
  eager by design, so the dashboard read-model needs no boot-summary-doc machinery.

**Deferred polish (low-risk, non-blocking):**
- Residual `_storage`/`_products` etc. **string literals** in `@shared/types` (the centralized
  item-type union — legitimate per the app's centralized-types convention) + one `item-dialogs`
  initial-`listId: '_storage'` default. Not couplings (no imports); DoD's "zero domain-name
  references" is met for imports/couplings.
- Deferred string cosmetics from the rename: i18n keys (`grocery.*.globals`), settings-flag
  identifiers (`showGlobalsInStorage`/`canAddGlobal`/…), the `global` theme-color token.
- Two off-contract facade methods (`addCategory`/`showEditDialog`) still on the concrete
  grocery/tasks facades; the persistence `npc-globals→npc-products` fallback lacks a unit test;
  the hydration resolver re-dispatches `load()` on every grocery-route entry (perf nit);
  `e2e/grocery/settings.e2e.ts` has a pre-existing toggle-read race (flaky under CI mode).
