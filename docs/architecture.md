# np-commlink — Architecture Review

**Focus: who talks to whom, and why.** This is a communication-first review of the app after
the "fully-lazy" refactor (every bounded context is lazy) and the follow-on "sheriff-tighten"
pass (the last cross-domain bridge removed — see §4.1). It describes the *seams* — the channels
one part of the app uses to reach another — and the reasoning behind each. Open and deferred work
is tracked in `open-tasks.md`; the `cash` domain keeps its own living spec in `cash-plan.md`
(pointed at from the `cash/` code). The design history (the two-app merge, the DDD re-domaining,
the lazy cutover, the sheriff tightening) lives in the git commit log.

---

## 1. What the app is

`np-commlink` is a single Ionic 8 / Angular 21 (standalone, zoneless) / Capacitor 8 app that
merges two former apps — **np-timetracker** (time & office tracking) and **np-kitchen-bot**
(groceries / storage / tasks) — under one Shadowrun "cyberdeck" skin. It ships as a PWA and an
Android APK. There is no backend: **all state is local** (NgRx in memory, `@ionic/storage` on
disk).

Structurally it is a **super-app**: a home "deck" (`/commlink`) of independent *programs*, each
a self-contained feature. The architecture's whole job is to keep those programs **independent**
while still letting the deck (and a few genuine cross-feature behaviours) work. That tension —
sealed, independently-loaded features vs. the handful of things that must cross between them — is
what every communication channel below exists to resolve.

---

## 2. The two forces that shape every conversation

Two decisions determine *how* any two parts of the app are allowed to talk:

1. **Bounded contexts, sealed by Sheriff (compile-time).** The code is sliced into domains
   (`tracking`, `groceries`, `notifications`, …). Sheriff (`sheriff.config.ts`) forbids one
   domain from importing another — with **no exceptions** (the last bridge was removed by
   sheriff-tighten, §4.1). So a feature simply *cannot* reach another feature by a normal
   `import`.

2. **Every bounded context is lazy (runtime).** No feature's store slice, effects, or component
   code is loaded at boot; each registers and hydrates only when you navigate to its route.
   So even at runtime, one feature usually *isn't there* to be read when another is active.

Put together: **a feature is normally neither importable nor present.** Every legitimate
cross-feature interaction therefore has to go through one of a small, deliberate set of channels
(§4). If you're ever tempted to reach across a domain boundary directly, that's the signal to use
a channel instead — that constraint is the point.

> **Pattern — "shared means domain-agnostic."** The `@shared` kernel is a *library*, not a
> domain. It may be imported by anyone but knows nothing about any specific feature (no
> `state.shopping`, no `switch(listId)`). It holds only generic mechanics and the **published
> contracts** features use to talk. A shared layer that named its consumers would be a leaky
> abstraction — the whole refactor was largely about removing exactly that.

---

## 3. The module map

| Context | Role | Eager/Lazy | Talks to others via |
|---|---|---|---|
| `@shared` | shared kernel (library + published contracts) | eager (it's a library, not a bounded context) | — (it is the medium) |
| `commlink` | the home deck / super-app shell page + the dashboard read-model it owns | lazy page, **eager slice** | reads its own read-model, which suppliers feed via `DashboardActions.report` |
| `tracking` | time tracking (single-list engine) | **lazy** | writes notifications (durable port); reports telemetry; receives deep-link CTAs |
| `office-time` | office-presence dashboard, wordclock | **lazy** | reports telemetry |
| `notifications` | in-app + OS notification inbox | **lazy** | reports telemetry; deep-links to `/tracking` |
| `groceries` | shopping + storage + products (one context) | **lazy** | reports telemetry; provides a list facade |
| `tasks` | to-do list | **lazy**, fully sealed | reports telemetry; provides a list facade |
| `cash` | offline multi-account ledger | **lazy** | reports telemetry |
| `trackplay` | Shadowrun game-score tracker | **lazy** | reports telemetry |
| `barcode` | SIGIL badge image (owns its own slice) | **lazy**, fully sealed | reports no telemetry — imports nothing |
| `kitchen` | SOYKAF standby stub | lazy page | — |

The **shell** (`src/app/` root: `AppComponent`, `app.routes.ts`, `app.message.effects.ts`,
`app-title.strategy.ts`) is special — it carries only `type:shell`, no domain, so it may compose
everything. It is the wiring harness, not a feature.

---

## 4. The communication channels (the heart of it)

Everything cross-feature travels one of five channels. Each trades off differently, and each is
chosen for a specific reason.

### 4.1 Compile-time: the Sheriff import graph

*Who may `import` whom.* This is the strictest and most-preferred channel: a plain function/type
import, but only where Sheriff allows it.

- **Domain axis:** `domain:* → sameTag + domain:shared`. Every feature may import itself and the
  shared kernel — nothing else.
- **No cross-domain bridges remain.** Every domain is sealed to the default
  `domain:* → sameTag + domain:shared`. `pnpm exec sheriff verify src/main.ts` is green with
  **zero** explicit bridges — the strongest possible statement of the boundary.
- **Every coupling the older plans once listed as a bridge is gone:** `shopping↔storage` and
  `shopping/storage→products` became *intra*-`groceries` imports (`sameTag`);
  `notifications→tracking` and `commlink→{notifications,office-time}` were **inverted** into the
  contract channels below; and the last one, `barcode→office-time`, was removed by
  **sheriff-tighten** — the SIGIL badge moved out of the `officeTime` slice into `barcode`'s own
  `barcode` slice, so `barcode` is now a self-contained lazy context that imports nothing (§7).
- **Type axis** (orthogonal) enforces layering: `feature → smart-ui → ui → data → util → model`.
  `smart-ui` is a **strict leaf** (no `sameTag`): a smart component composes dumb `ui`, never
  another smart component — composing stateful components is orchestration and belongs in a
  `feature`. So the `edit-*-item-dialog` wrappers (which compose `category-input` +
  `item-edit-modal`) live in `<domain>/feature/`, and `categories-dialog` is rendered by those
  wrappers rather than nested inside `category-input` (sheriff-tighten §2). `type:testing` may
  reach any layer but only `*.spec.ts` may import it. **`@shared` has no `smart-ui` layer at all**
  — its last inhabitant, the store-bound category dialog, became a dumb `ui` component owned by
  `ListPageComponent` when the `itemDialogs` slice was retired (§4.1b).
- **`data` is a facade barrel.** Each `<domain>/data/` carries an `index.ts` (Sheriff barrel):
  outside code imports the folder (`…/data`) and gets only the public facade — the action group,
  published selectors, the `*LazyProviders`, and (where present) the domain's `ListPageFacade` —
  while the reducer, effects, and internal selectors stay hidden (a deep import into `data` is an
  encapsulation violation). Every other layer stays barrel-less; `enableBarrelLess: true`, so this
  is a per-folder public API, not a global mode. It buys information-hiding + clean imports.
  **`@shared/data` is the deliberate exception — it stays barrel-less.** The barrel pattern seals a
  *lazy context* behind its `*LazyProviders`, so the raw reducer/effects never escape. The kernel has
  no such seam: it is eager and root-wired — `main.ts` imports `settingsReducer`
  + `SettingsEffects` directly to compose `provideStore`. A
  barrel here would either re-export those (leaking exactly what a barrel hides) or force a bespoke
  eager-provider bundle purely to feed the root — ceremony for a slice every boot path already
  depends on. Sub-folder barrels (`settings/`, `item-dialogs/`, …) aren't an option either: the Sheriff
  `modules` glob is one level (`<domain>/<type>`), so a deeper `index.ts` isn't a recognised module.
  So the kernel keeps self-documenting deep imports (`@shared/data/item-dialogs/…`) by design.
  (`commlink/data` *is* a barrel — it's a domain module like any other, eager registration
  notwithstanding.)
- **`@shared` is layered so cross-layer edges point *down*.** `@shared/data` holds genuine
  NgRx **state** (the kernel `settings` slice, `item-list`/`router` selectors), the
  `ItemDialogHost` signal service (§4.1b), the
  published `DashboardActions`/`NotificationsActions` contracts + the `NotificationsStore` durable
  port, and the generic per-context load/save **effect builders** (`@shared/data/effects`, consumed
  by every domain's `data` as a `data → data` edge). The list engine's **pure logic**
  (`list.utils`, `list.selector`, `item-list.utils`, `notifications.transforms`) and the
  `LIST_FACADE` token + `IListPageFacade` live in `@shared/util`. So a domain's `data` imports
  `@shared/util`/`model` and — for the two published contracts only — `@shared/data`; every
  `domain → @shared` edge is downward on the domain axis. The horizontal `sameTag` on
  `type:data` covers **intra-slice wiring** (a slice's own `selector → reducer → actions`) and the
  contract edge, not reaching into shared *state*.

Verify with `pnpm exec sheriff verify`. **If a feature needs something from another feature and
Sheriff blocks the import, that's the design telling you to use a runtime channel below.**

### 4.1a Domain facades — NgRx is a data-layer detail

*No `@ngrx` import lives outside the data layer.* Every dispatch and every read goes through a
**domain facade** — an `@Injectable({ providedIn: 'root' })` service in `<domain>/data/` that is the
**only** place `Store` is injected for that domain's consumers. It exposes state as signals
(`readonly x = store.selectSignal(sel)`; route-parameterised reads as factory methods returning a
signal) and commands as methods (`foo() { store.dispatch(...) }`). Components inject the facade and
import zero `@ngrx`. Facades: `TrackingListPageFacade`, `TasksListPageFacade`, `GroceryListPageFacade`
(+ the small `ListSettingsFacade`), `CashFacade`, `TrackplayFacade`, `OfficeTimeFacade`,
`NotificationsFacade`, `DashboardFacade` (in `commlink/data`, the read-model's owner), and the
kernel `SettingsFacade` in `@shared/data`. The three `*ListPageFacade`s do double duty — they implement
`IListPageFacade` (provided as `LIST_FACADE`, §4.3) *and* carry their domain's page/dialog commands.
The shared edit-dialog base (`BaseEditItemDialog`) reads the open-command off `ItemDialogHost` and
delegates `save`/category ops to `void` hooks each subclass wires to its own facade — so neither the
base nor the wrappers touch `Store`.

### 4.1b Edit dialogs — a signal host, not a store slice

**No dialog state lives in NgRx.** The draft is a component-local `linkedSignal` in the wrapper
(`patch()` updaters, no per-keystroke dispatch), and the *open-command* — which item, on which
list, in which mode — is a single nullable signal on the root `ItemDialogHost`
(`@shared/data/item-dialogs/item-dialog-host.ts`, ~15 lines, no `@ngrx` import).

It used to be the eager `itemDialogs` slice. The store was the wrong primitive: the command is
transient, never persisted, and had no readers outside the dialog tree — while costing

- a duplicated `listId` guard in **every** lazy orchestrator effect, because route injectors and
  effects are never torn down, so each one saw every sibling domain's dialog actions (see §5's
  "lazy ≠ unloaded");
- a two-hop round-trip per open (action → effect reads domain state → action → reducer) whose only
  real output was a title and a button label;
- one selector + facade signal per domain, existing purely to cast the domain-blind `IBaseItem`
  back to that domain's item type.

Every open path already started in a facade method, and every facade already holds its list state
as a signal — so the seed item is now built **synchronously at the call site** and the three
orchestrator effect files are gone, guards and all. `open()` copies the item, which is what makes
the `linkedSignal` draft reseed when the same row is reopened after an aborted edit.

The category-name dialog followed: a dumb `ui` component with a local draft, owned by
`ListPageComponent` (which also owns the "in categories mode the add button names a category"
branch, previously duplicated in two guarded effects) and persisting through one optional
`IListPageFacade.saveCategory(name)`.

> **Pattern — pick the primitive by lifetime, not by habit.** A global store earns its keep for
> state that is shared, persisted, or replayed. For transient UI state it charges rent instead:
> indirection, a broadcast bus that every listener must filter, and reducers deriving what a
> `computed` derives for free. `signal` + `computed` was the whole requirement here; neither
> `@ngrx/component-store` nor a `signalStore` would have added anything.

> **Pattern — Facade + architectural fitness function.** The rule is enforced, not just documented:
> an eslint `no-restricted-imports` block bans `@ngrx/*` across `src/app/**`, re-enabled only in the
> sanctioned homes — `**/data/**` (incl. `@shared/data/effects/**`, the generic per-context load/save
> effect builders), the test kit, and `main.ts` (the composition root). `@shared/model/types.ts` used
> to be a fourth, for the `router-store` type on the old root-state interface; deleting that
> interface (§5) made the model layer NgRx-free and let the allowlist shrink. Crossing the boundary fails the build. This is the same idea as a trust boundary in infra: don't rely on
> discipline to keep the store inside `data/` — make the boundary *fail closed*.

### 4.2 Runtime message bus: NgRx actions + two published contracts

*Who reacts to whom, without importing whom.* NgRx actions are global — any effect, in any
injector, sees every dispatched action. This is how sealed/lazy features communicate at runtime
without a code dependency. Two action groups in `@shared` are elevated to **published-language
contracts** — the only actions a feature dispatches expecting *someone else* to handle:

- **`DashboardActions.report({ source, metrics })`** (`@shared/data/dashboard`) — the telemetry
  contract, and the *only* dashboard event in `@shared`. Any program pushes its own summary
  numbers here; it does not know or care who reads them. The read-model that consumes them —
  including its private `DashboardReadModelActions.load`/`hydrate` lifecycle, its state types, and
  its `summary-<source>` keyspace — lives in `commlink/data`+`commlink/model`. Sharing the whole
  slice would have put a `bySource['notifications'].metrics['unread']` selector in the
  domain-blind kernel; `hydrate` in particular *cannot* be shared, since it carries a commlink
  type. Both groups use the source string `'Dashboard'`, so devtools still reads as one timeline.
  (§6)
- **`NotificationsActions`** (`@shared/data/notification`) — the notification-write contract
  (add / upsert / markDone / remove / …). A producer dispatches these; the notifications reducer
  applies them *when it's loaded*. (When it isn't, see the durable port in §4.5.)

> **Pattern — Dependency Inversion for cross-cutting capabilities.** A capability that serves
> everyone (the dashboard, notifications) must not *import* everyone. Instead it publishes a
> contract in the shared kernel; **producers dispatch, the capability listens.** The arrow points
> from many producers to one contract, never from the capability out to the producers.

### 4.3 DI contracts: the `LIST_FACADE` token

*How one generic component serves several domains without knowing them.* Three grocery pages, the
tasks page and the tracking page all render the same list UI. The generic
`@shared/feature/list-page` component `inject()`s a `LIST_FACADE` token
(`@shared/util/list/list-page.facade.ts`); each domain **provides** its own implementation at the
route:

```text
list-page (generic, domain-blind)
   └─ inject(LIST_FACADE)
        ├─ GroceryListPageFacade    (multi-list engine: route-param → active list, cross-list buckets)
        ├─ TasksListPageFacade      (trivial single-list)
        └─ TrackingListPageFacade   (tracking-flavoured engine; no categories → [hasCategories]="false")
```

Tracking is category-less, so its facade returns `[]` for `categories`, its category-mode
operations are no-ops, and the page passes `[hasCategories]="false"` to suppress the quick-add,
display-mode toggle and edit-category dialog — the shared component renders a plain list. Its
tracking-only chrome (the reset/save toolbar buttons, the daily-sessions panel, the settings link
to `/data/daily`) is content-**projected** into the shared shell's `[toolbarActionsEnd]`,
`[searchExtras]` and `[headerEnd]` slots.

Why a DI token and not a selector? **NgRx selectors can't read DI**, so a `listId → selector`
registry can't live inside a pure selector. A facade is a *service* — it can hold
`store.selectSignal(...)` — so it resolves the "generic component needs domain-specific state"
problem cleanly. Grocery-only operations (`addProduct`, `showCreateProductDialog`) are
deliberately *off* the shared contract and live only on the concrete grocery facade.

The **manage-categories page** is the same pattern applied a second time: the domain-blind
`@shared/feature/edit-categories-page` `inject()`s a sibling `CATEGORIES_FACADE`
(`@shared/util/list/categories-page.facade.ts`) — the catalog decorated with per-list item
counts, `add`/`rename`/`remove`, `listTitleKey`/`listHref`, and `drillTo(id)`. `GroceryCategoriesPageFacade`
(shared catalog, scoped to the `:listId` route param → the fan-out `GroceryCategoriesActions`),
`TasksCategoriesPageFacade` and `CashCategoriesPageFacade` provide it at the `categories/:listId`
/ `categories/_tasks` / `cash/categories` routes; the shared component is mounted directly
(route-level provider binding, no per-domain wrapper). For grocery + tasks the list-page shell
exposes the entry point via an optional `manageCategories?()` on `IListPageFacade` (rendered only
when `hasCategories`); cash reaches it from toolbar buttons on the overview + rules pages
(**replacing the rules page's old inline category palette**). **Category→items drill:** `drillTo`
navigates to the owning list with `?filter=<categoryId>`, applied in the target page's
`ionViewWillEnter` — *after* the route resolver's `loaded` resets `filterBy`, so the filter
survives the entry (the same after-hydration timing as the §4.4 deferred-command deep-link). Cash
has no `filterBy` list, so its drill target is instead a dedicated read-only transactions view
(`cash/category/:categoryId`) — the same "one cohesive page per domain" idea, different mechanics.

### 4.4 Navigation: string-route deep-links

*How a sealed feature triggers an action in another sealed feature.* When the notifications page
needs to act on a tracking item (a CTA tap), it can't import tracking and — because tracking is
lazy — tracking's slice may not even be registered. So it navigates:

```text
notifications.page → router.navigate(['/tracking'], { queryParams: { cmd: n.id } })
```

The route string is the entire coupling — no import. Activating `/tracking` registers +
hydrates tracking; the tracking page reads the `cmd` query-param and dispatches
`TrackingActions.applyNotificationCommand(cmd)` into *its own* domain.

> **Pattern — deferred command.** The CTA is a command aimed at an aggregate that isn't loaded
> yet. Rather than execute it cross-boundary, you *defer* it: encode it in the navigation, let
> the target context load, and let the target apply it to itself.

### 4.5 Durable storage as a channel

*How to write to a feature that isn't loaded.* Tracking must update tracking-state notifications
even while you're on `/tracking` and the notifications slice is unregistered. It can't dispatch
`NotificationsActions` (no reducer to receive them). Instead it writes the **durable doc**:

- **`NotificationsStore`** (`@shared/data/notifications/notifications.store.ts`) — a
  read-modify-write port over the persisted `npc-notifications` doc. Tracking calls
  `notifications.mutate(pureTransform)`; the same **pure transforms**
  (`notifications.transforms.ts`) are used by the *reducer* on-route, so the off-route and
  on-route paths can't drift. Each durable write also `report`s the new unread count to the
  dashboard (so the badge stays live), and the notifications route re-hydrates from this doc on
  entry (so a stale in-memory slice self-corrects).

> **Pattern — shared *durable state + pure transforms*, never a live slice.** This is the general
> recipe for a lazy-module cross-boundary write: don't reach for the other module's store; reach
> for the disk it persists to, through the same pure logic its reducer uses.

---

## 5. Eager kernel vs. lazy contexts (the lifecycle)

### What boots (the eager kernel — `main.ts`)

Only the things that must always be present:

- **Store slices** (`provideStore`): `router`, `dashboard` (the read-model — reducer imported from
  `commlink/data`, which owns it; eager registration, domain ownership), the app-global
  `settings` slice (the single persisted schema `version` anchor for the migration framework)
  and the `theme` kernel slice. **No feature slice is eager** — and note
  `listSettings` + `quickadd` are *no longer* here: they were grocery-specific all along, so they
  moved into the lazy **groceries** domain (the settings re-scope). The one genuinely app-wide bit
  they carried — the `version` — became the global `settings` slice above.
- **Effects** (`provideEffects`): `AppMessageEffects` (the toast sink), `DashboardEffects` (the
  read-model's persistence), `SettingsEffects` (load + seed the version doc), and the theme effects.
- **Boot dispatches** (`provideAppInitializer`): `SettingsActions.load()`, `DashboardActions.load()`
  (hydrate the persisted deck numbers), `ThemeActions.load()`, and `NotificationService.init()`
  (OS-notification permissions/channel).

### There is no root-state type

`IAppState` is gone. Nothing anywhere names the shape of the whole store: every slice is read
through its own `createFeatureSelector<ISliceState>('key')` (NgRx's root-state selector overload is
itself deprecated), and every facade injects the bare `inject(Store)`. Where a feature needs several
slices at once it recomposes them locally — `selectGroceryLists` builds `IGroceryLists` from three
feature selectors rather than reading `state.storage/products/shopping`.

This is not squeamishness, it's forced: a *complete* root-state type is impossible here. `dashboard`
is eager but commlink-owned, and Sheriff's `'domain:*': [sameTag, 'domain:@shared']` bars
`@shared/model` from naming a domain type; every bounded context is lazy, so its key doesn't exist at
boot; and `main.ts` — the one place that *could* name the full map — may not import `type:model` at
all (`root: ['type:shell', 'type:data', 'type:util']`). A partial type pretending to be the root is
worse than none, so the only survivor is the test kit's `TMockKernelState`
(`@shared/testing/test-data`), which is honestly scoped to what the mock store seeds by default.

> **Pattern — no global schema.** The same reason services don't share one database schema: a type
> that enumerates everyone's state re-couples the modules you just sealed. Ownership follows the
> slice. And when a boundary makes a "complete" global type *impossible*, that's the design telling
> you the type shouldn't exist — not that it needs an exception.

### How a lazy context loads

Each feature route carries two things:

```text
{
  path: 'tracking',
  providers: trackingLazyProviders,          // provideState(...) + provideEffects(...)
  resolve:  { hydrated: moduleHydrationResolver(TrackingActions.load, TrackingActions.loaded) },
  loadComponent: () => import(...),           // lazy code
}
```

- **`provide-<domain>-lazy.ts`** bundles the slice(s) + all effects that touch them (load, save,
  search, telemetry, engine, dialogs). Angular builds the route's `EnvironmentInjector` during
  route *recognition*, so the reducers exist before the resolver runs.
- **`moduleHydrationResolver(load, loaded)`** (`@shared/data/module-hydration.resolver.ts`)
  dispatches the module's `load`, then blocks activation until its `loaded` fires — so the first
  paint is never a flash of empty lists. Each module reads **only its own keys** (no
  whole-datastore re-read).

> **⚠️ Lazy ≠ unloaded on exit.** Ionic's `IonicRouteStrategy` + NgRx `provideState/provideEffects`
> have no per-injector teardown: a lazy context registers on **first visit and persists for the
> session**. Consequences that shape the code:
> - Two contexts that listen to the **same action class** both fire once both are visited (NgRx
>   dedups same-class, not different-class instances). This is why the grocery and tasks dialog
>   orchestrators are **separate classes** that each **guard on `listId`** — a shared class would
>   double-dispatch across a grocery↔tasks transition.
> - "Lazy" here buys **boot-time hydration + memory**, not bundle size (the bundle is
>   ~1 MB framework-dominated; state code is negligible). That trade was made deliberately.

### Co-registration (the co-hydration rule)

`groceries` registers **all three** slices (products/shopping/storage) on **every** grocery
route, because the cross-list search buckets read sibling slices — registering only the route's
own slice would leave siblings `undefined` and crash the selector (this was a real, reverted bug).
It also co-registers the grocery-owned `listSettings` + `quickadd` slices (the settings re-scope):
`listSettings` hydrates via its own `[ListSettings] load/loaded` resolver key on the grocery
routes, and `quickadd` is ephemeral (the engine recomputes it, never persisted). The
**`/list-settings`** page is the exception — it needs only `listSettings`, so it registers just
that via `listSettingsLazyProviders`, **not** the full grocery context; pulling in the grocery
lists there would also register their telemetry reporters, which `report` on subscription and
would wrongly flip the deck tiles online with zero counts.
`office-time` is a single `officeTime` slice. (It briefly carried a second `officeTimeSettings`
feature-flag slice — renamed from the collision-prone bare `settings` when the app-global
`settings` slice was introduced — but the settings re-scope stripped it down to one dead
`showTotalTime` flag nothing read, so the whole slice was removed as dead code.) (`/barcode` used
to join that group because the SIGIL image lived in `officeTime`; after sheriff-tighten it owns its
own single `barcode` slice and registers alone.)

---

## 6. The cross-cutting capabilities (why they invert)

Two capabilities serve *every* program. If they imported their producers, they'd import the whole
app — so both are inverted.

### The dashboard read-model (CQRS)

```text
  tracking ─┐
office-time ─┤
     cash ─┼─ DashboardActions.report({source, metrics}) ─▶ dashboard slice (eager) ─▶ commlink deck
    tasks ─┤                                                        │                    └▶ shell badge
      ... ─┘                                                        └▶ npc-summary-<source> (disk)
```

- **Where the code lives — the port/read-model split.** Only the *write* side is shared:
  `DashboardActions.report` + `IDashboardTelemetry` + `createTelemetryEffect` in `@shared/data`.
  The *read* side — reducer, selectors, `DashboardFacade`, the load/hydrate/persist effects, the
  `IDashboardState`/`IDashboardSummary` types (`commlink/model`), the `summary-` keyspace, and the
  `mockDashboardState` fixture (`commlink/testing`) — lives in **`commlink`**, because the deck and
  the shell badge are its only two readers. Its ownership is exactly why no root-state type could
  ever be complete (§5); specs seed it through `mockAppState`'s `& Record<string, unknown>` hatch. That
  is what keeps `@shared` domain-blind: the badge selector hardcodes `'notifications'` + `'unread'`,
  which is a `commlink` concern, not a kernel one. Sheriff still seals the suppliers (`domain:*` may
  only reach `sameTag` + `domain:@shared`), so no producer can see `commlink` — they dispatch the
  shared action and never learn who consumes it.
- **Why eager.** The dashboard is a **capability sink**: its writers live *outside its own
  route* (every program reports while you're inside that program), so it can't be scoped to any
  one producer's lifecycle. (Same reason a metrics collector is a central always-on service, not
  a per-workload sidecar.) So although it sits in a `<domain>/data` folder, `main.ts` registers it
  in the root store — there is no `provide-commlink-lazy.ts`. *Where code lives* (ownership) and
  *when it registers* (lifecycle) are independent axes; only the shell and `main.ts` reach in, and
  both are domain-blind by tag.
- **Why persisted.** Once producers are lazy, none of them reports until you visit it — so cold
  launch would show an empty deck. `DashboardEffects` reads the small `npc-summary-*` docs at
  boot (`status: 'standby'`); a live `report` flips a tile to `status: 'online'`. Status is
  therefore *structurally* ephemeral — it can only become `online` via a live report.
- **Who reads it.** `commlink.page` reads **only** `selectDashboardState` (it imports zero
  feature domains — it's domain-blind, each tile just names a `source` + `metric`). The shell's
  notification badge reads `selectNotificationsUnread` from this same read-model, **not** the
  notifications slice — so the always-on badge never depends on a lazy domain.
- **The metrics** each program reports: `tracking→count`, `office-time→{officedays, percentage}`,
  `notifications→unread`, `shopping→active`, `storage→low`, `products→count`, `tasks→open`,
  `cash→balance`, `trackplay→games`.

### The notification sink

`notifications` used to be the coupling magnet (it imported `tracking` to watch its events). Now
the arrow is inverted three ways at once, so notifications imports **no** domain:

1. **In-app writes on-route:** producers dispatch `NotificationsActions` → reducer (§4.2).
2. **Off-route writes:** producers call `NotificationsStore.mutate(...)` → durable doc (§4.5).
3. **CTAs back to a producer:** the notifications page deep-links `/tracking?cmd=` (§4.4).

The OS-level side (`NotificationService`, `notifications/util`) is a thin Capacitor adapter,
`init()`-ed once at boot from the shell.

---

## 7. Walkthroughs — who talks to whom, and why

**Deck → every program (read only).** `commlink.page` renders a tile per program. It reads live
counts from the dashboard read-model and nothing else; it never imports a feature. Adding a
program to the deck is a config entry (`source`+`metric`), not a dependency.

**Shell badge → dashboard.** `AppComponent` shows an unread badge in the side menu. It reads
`selectNotificationsUnread` (read-model), so it works whether or not notifications is loaded.

**tracking ↔ notifications (the hard case — two lazy features).** The most instructive
relationship in the app, because *neither* side may import the other and *either* may be
unloaded:
- Toggling a tracking item → `TrackingNotificationsEffects.reconcileState$` (rides with lazy
  tracking) → `NotificationsStore.mutate(reconcile)` writes the durable doc + reports `unread`.
- Tapping a notification CTA on `/notifications` → deep-link `/tracking?cmd=<id>` → tracking page
  dispatches `applyNotificationCommand` → toggles the item → reconcile updates the notification.
- No `import` crosses the boundary in either direction; the shared surface is only the durable
  doc + the pure transforms + a route string.

**groceries internal (one context, three aggregates).** `shopping`, `storage`, `products` freely
import each other (`sameTag`) — searching shopping reads the products catalog; the cross-list
"copy to shopping/storage" rules read siblings. This *is* the intra-context coupling the DDD
refactor wanted: it's honest coupling inside one boundary, not three fake-independent domains.
The grocery multi-list engine (`groceries/data/grocery-list/*`) and dialog orchestration ride in
`groceriesLazyProviders` and guard on `listId ∈ {_shopping,_storage,_products}`.

**tasks (the sealed twin).** `tasks` reuses the same list UI but shares **no data** with
groceries. It has its own switch-free copies of the list/dialog effects and its own
`TasksListPageFacade`. It depends only on `@shared`. It proves the kit is genuinely generic.

**barcode (self-contained).** `barcode` displays the SIGIL badge image, which it now stores in
its **own** `barcode` slice (persisted `npc-barcode`), hydrated by its own route resolver like
every other lazy context. It imports no domain and reports no telemetry (SIGIL is a deck tile
with no live metric, like SOYKAF). Until sheriff-tighten the badge lived in the `officeTime`
slice and barcode read it across a `barcode→office-time` bridge; moving the slice home deleted
the app's last cross-domain import.

**office-time (self-contained).** Despite what earlier plan drafts proposed, office-time does
**not** read tracking — grep confirms no import, and Sheriff lists no such bridge. It's a
standalone context that only reports telemetry.

**The list kit.** `@shared` owns the domain-blind frame: `item-list`, `list-item`, searchbar /
toolbar / empty-state, `page-header`, the edit-modal shell, form inputs, the `LIST_FACADE`
contract, and the single-list helpers (`@shared/util/list` — `list.utils`/`list.selector`). Each
domain projects its own row/form body and keeps its item type in-domain (`<T>`). There is exactly
**one** multi-list *engine* — `groceries/data/grocery-list` (route-param driven). The single-list
domains (`tracking`, `tasks`) have **no** separate engine: each owns its slice (`state.tracking`/
`state.tasks`) and builds its list flow on those shared helpers, driving `ListPageComponent`
through its own `ListPageFacade`. Their edit dialogs ride the domain-blind `ItemDialogHost`
open-command (§4.1b) — tracking's former standalone item-list engine + `dialogs` fork were
folded onto these shared mechanics (the last merge-duplicate retired).

---

## 8. Persistence — the port

`DatabaseService` (`@shared/util/database.service.ts`) is a **dumb per-key port** over
`@ionic/storage` (DB `np-commlink`):

- Keys are namespaced `npc-<slice>`; dashboard summaries `npc-summary-<source>`.
- **`bootstrap()`** (called once at boot by `DashboardEffects`) is the *only* eager read — it
  loads just the summary docs, behind an **init-once guard** (`#ensureStorage`, memoized
  `create()`) so racing callers initialize LocalForage exactly once.
- **`load<T>(key)` / `save<K>(key, value)`** are what each lazy context's load/save effect uses
  for its own key — no slice list lives in the service. **`loadPrefixed<T>(prefix)`** is the
  counterpart for a caller owning a whole key *family* (only commlink's `summary-<source>` docs
  today). All four await the init-once guard.
- `quickadd` is ephemeral (never persisted); the dialogs hold no store state at all (§4.1b).
  `migrate()` exists as a framework
  but is empty (fresh-install only; VERSION `'1'`). The schema `version` lives in exactly **one**
  place now — the eager app-global `settings` slice (`npc-settings`), seeded on first boot by
  `SettingsEffects`. The per-slice `version` fields that `listSettings` and office-time's settings
  used to each carry were dropped in the settings re-scope, so the migration framework has a single
  anchor to read.

> **Pattern — ports & adapters.** The persistence port knows nothing about domains; domains know
> nothing about storage mechanics. The dashboard's persistence is owned *inside* `DashboardEffects`
> (in `commlink/data`) so producers stay ignorant that their telemetry is even saved — they just
> `report`. The port is now genuinely domain-blind: `bootstrap()` only initializes, and the
> dashboard-shaped `saveSummary()` was replaced by the generic `loadPrefixed<T>(prefix)` + the
> existing `save()`. **A domain owns its own keyspace** (`commlink/model` exports
> `SUMMARY_KEY_PREFIX`/`summaryKey`); the port just stores bytes under a string.

---

## 9. Context map (one picture)

```text
                         ┌──────────────────────── @shared (kernel: library + contracts) ────────────────────────┐
                         │  list kit · LIST_FACADE · DashboardActions.report · NotificationsActions · transforms  │
                         │  NotificationsStore (durable port) · DatabaseService (per-key port) · resolver         │
                         └───────────────────────────────────────────────────────────────────────────────────────┘
                              ▲ dispatch / inject                                    ▲ dispatch report
   report telemetry ─────────┼──────────────────────────────────────────────┐      │
        │                    │                                               │      │
  ┌─────┴─────┐   deep-link  │   durable write        ┌──────────────┐   ┌───┴──────┴───┐   reads only
  │ tracking  │◀─ /tracking?─┤   NotificationsStore ─▶│ npc-notif doc│   │  dashboard   │◀──────────── commlink deck
  │  (lazy)   │─ report ─────┤◀─ notifications (lazy) ─┘  (+ report)  │   │ (eager R-M)  │◀──────────── shell badge
  └───────────┘              │                                       │   └──────────────┘
  office-time (lazy) ─report─┤   barcode (lazy) ─── owns its own SIGIL slice, imports nothing
  groceries  (lazy) ─report─┤   groceries pages ─provide─▶ LIST_FACADE ◀─inject─ @shared/list-page
  tasks/cash/trackplay ─────┘   tasks page ──────provide─▶ LIST_FACADE ◀────────────┘
```

Legend: **solid feature→@shared arrows are the only allowed couplings.** No feature→feature arrow
exists at all — **zero** cross-domain bridges. Everything cross-feature crosses via report /
dispatch / durable write / deep-link / facade — never a direct import.

---

## 10. Notes — proposals that were considered but never built

Kept so their absence doesn't read as an oversight (the "why" is in the git history):

- **`office-time → tracking` was never built.** An early design had office-time read a tracking
  read-model selector; the realized office-time is standalone and only reports telemetry.
- **`notify({ level })` as a generic action was not built.** The realized notification contract is
  `NotificationsActions` + the durable `NotificationsStore` (§4.2/§4.5), with `AppMessageEffects`
  turning tracking toasts into UI messages.
- **The last two "eager sinks" are gone.** Interim designs kept `tracking` + `notifications`
  eager (a background timer bridged them); `feature/fully-lazy` deleted the timer and made both
  lazy (§5). The only eager things now are the kernel: `router` + the shared-kernel library slices
  + the toast/read-model effects, plus the `dashboard` read-model (eager, but owned by
  `commlink/data` rather than `@shared` — §6). No *supplier* feature slice is eager.
- **The last cross-domain bridge is gone.** `feature/tighten-sheriff` moved the SIGIL badge into
  its own `barcode` slice (removing `barcode→office-time`) and made `smart-ui` a strict leaf
  (§4.1). `sheriff verify` is now green with zero explicit bridges.

---

## Appendix — patterns named (for the toolbox)

| Pattern | Where it shows up here |
|---|---|
| Bounded context / shared kernel | Sheriff domains; `@shared` as library |
| Dependency Inversion (cross-cutting capability) | dashboard + notifications invert onto `@shared` contracts |
| CQRS read-model | eager `dashboard` slice in `commlink/data`, fed by the shared `report`, read by the deck |
| Shared port ≠ shared read-model | only `DashboardActions.report` is in `@shared`; the slice it feeds belongs to its reader |
| Published Language / Open Host Service | `DashboardActions.report`, `NotificationsActions` |
| Ports & Adapters | `DatabaseService` (per-key), `NotificationsStore` (durable write port), `NotificationService` (OS adapter) |
| Deferred command | notification CTA → `/tracking?cmd=` deep-link |
| Facade + DI token | `LIST_FACADE` decoupling the generic list page from domains |
| Idempotent initialization | `DatabaseService.#ensureStorage()` memoized `create()` |
| Strangler Fig / Expand-Contract | the migration approach throughout (see git history) |
| Capability sink stays central | dashboard eager despite everything else lazy |
