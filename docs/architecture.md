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
| `tracking` | time tracking (single-list engine) | **lazy** | publishes notifications (contract); reports telemetry; receives deep-link CTAs |
| `office-time` | office-presence dashboard, wordclock | **lazy** | reports telemetry |
| `notifications` | in-app + OS notification inbox | lazy page, **eager slice** | receives `NotificationsActions` from any producer; reports telemetry; deep-links to `/tracking` |
| `groceries` | shopping + storage + products + the SOYKAF recipe book (one context) | **lazy** | reports telemetry; provides a list facade |
| `tasks` | to-do list | **lazy**, fully sealed | reports telemetry; provides a list facade |
| `cash` | offline multi-account ledger | **lazy** | reports telemetry |
| `trackplay` | Shadowrun game-score tracker | **lazy** | reports telemetry |
| `barcode` | SIGIL badge image (owns its own slice) | **lazy**, fully sealed | reports no telemetry — imports nothing |
| `geist` | GEIST — console onto Chrome's on-device model | lazy page, **no slice at all** | nothing: no state, no telemetry, no contract |

The **shell** (`src/app/` root: `AppComponent`, `app.routes.ts`, `app.message.effects.ts`,
`app-title.strategy.ts`) is special — it carries only `type:shell`, no domain, so it may compose
everything. It is the wiring harness, not a feature.

That licence is exactly why the shell composes as *little* as possible. `app.routes.ts` is a table
of `path → loadChildren` and names no domain internals; each domain publishes its own route
manifest under `<domain>/routes/`, which carries `domain:<domain>` and is therefore sealed like any
other domain module (§4.1, §5).

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
- **Type axis** (orthogonal) enforces layering: `routes → feature → smart-ui → ui → data → util →
  model`.
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
  published selectors, the `<domain>Context` bundle, and (where present) the domain's
  `ListPageFacade` —
  while the reducer, effects, and internal selectors stay hidden (a deep import into `data` is an
  encapsulation violation). Every other layer stays barrel-less; `enableBarrelLess: true`, so this
  is a per-folder public API, not a global mode. It buys information-hiding + clean imports.
  **`@shared/data` is the deliberate exception — it stays barrel-less.** The barrel pattern seals a
  *domain* module behind its context bundle, so the raw reducer/effects never escape; `@shared/data`
  has no slice of its own to seal. Eager state does **not** live here — the three eager slices are
  domain modules with their own barrels (`commlink/data`, `settings/data`, `notifications/data`),
  each exposing the same bundle a routed context hands to its route (the bundle
  an earlier design dismissed as "ceremony" is exactly the seam that lets an eager slice stay
  sealed). What remains in `@shared/data` is a **library**: the published
  `DashboardActions`/`NotificationsActions` contracts, `providePersistedContext` + the functional
  load/save/telemetry effects it composes, `bootHydrationProvider`, `moduleHydrationResolver`, and
  the `item-list` events — a grab-bag of
  unrelated helpers with no single public API to hide behind one barrel, so it keeps
  self-documenting deep imports (`@shared/data/actions/…`, `@shared/data/effects/…`) by design.
  Sub-folder barrels aren't an option either: the
  Sheriff `modules` glob is one level (`<domain>/<type>`), so a deeper `index.ts` isn't a recognised
  module.
- **Inside `data/`, files are sliced by NgRx role, not by slice.** Every data module — `@shared/data`
  included — reads the same way: `actions/`, `reducer/`, `selectors/`, `effects/`, with the
  DI-facing surface at the root (`<x>.facade.ts`, `<domain>.providers.ts`, `index.ts`). Specs sit next to what they test. The role folders are what make a multi-slice domain
  navigable: `groceries/data` holds eight action groups and five reducers, and "where is the storage
  reducer" has one answer (`reducer/storage.reducer.ts`) instead of depending on whether that slice
  happened to get its own sub-folder. Sheriff tags from the two path segments
  (`src/app/<domain>/<type>`), so the depth below `data/` is free — the folders carry no boundary,
  only a convention.
- **Pure logic is not a data role — it leaves `data/` entirely** (`405928e`). The role folders above
  are the NgRx roles; a `<slice>.utils.ts` importing no `@ngrx` is none of them, so it belongs in the
  domain's own `<domain>/util/` and its consumers reach down (`data → util`). This closed the last
  split: `office-time` kept `wordclock.utils` in `util/` and `office-time.utils` in `data/utils/`
  by nothing but the order they were written, and `groceries`' `grocery-list.utils` already imported
  *down* into `groceries/util/grocery.factory`. The same test un-shares from `@shared`:
  `notifications.transforms` sat in `@shared/util` from when the inbox had two write paths, but once
  `0bbb899` deleted the second its only two importers were both in `notifications/data` — shared by
  location, not by use — so it moved to `notifications/util`. **Pattern:** shared-ness is a property
  of who imports a thing, not of where it happens to live; re-check it whenever the second consumer
  goes away.
- **`@shared` is layered so cross-layer edges point *down*.** `@shared/data` holds only what is
  genuinely NgRx (the eager `settings` slice moved out to its own `settings/data` domain, as
  `dashboard`/`notifications` already had): the
  published `DashboardActions`/`NotificationsActions` contracts (the latter with the notifications
  slice-read selector, its other half), the shared `item-list` event group, and the generic
  per-context load/save **effect builders** (`@shared/data/effects`, consumed
  by every domain's `data` as a `data → data` edge). The list engine's **pure logic**
  (`list.utils`, `list.selector`), the `ItemDialogService` signal
  service (§4.1b — it holds no NgRx, so it belongs a layer down) and the
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
`NotificationsFacade` (in `notifications/data`), `DashboardFacade` (in `commlink/data`, the
read-model's owner), and `SettingsFacade` (in the sealed `settings/data` domain). The three `*ListPageFacade`s do double duty — they implement
`IListPageFacade` (provided as `LIST_FACADE`, §4.3) *and* carry their domain's page/dialog commands.
The shared edit-dialog base (`BaseEditItemDialog`) reads the open-command off `ItemDialogService` and
delegates `save`/category ops to `void` hooks each subclass wires to its own facade — so neither the
base nor the wrappers touch `Store`.

### 4.1b Edit dialogs — a signal host, not a store slice

**No dialog state lives in NgRx.** The draft is a component-local `linkedSignal` in the wrapper
(`patch()` updaters, no per-keystroke dispatch), and the *open-command* — which item, on which
list, in which mode — is a single nullable signal on the root `ItemDialogService`
(`@shared/util/item-dialog.service.ts`, ~15 lines, no `@ngrx` import — which is why it sits in
`util`, not `data`).

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

**Two dialog idioms, one draft mechanic.** The app has two dialog lifetimes, and they get two
sibling bases in `@shared/feature/` rather than one generic one:

| | `BaseEditItemDialog` | `BaseModalDialog` |
|---|---|---|
| Opened | declaratively — always mounted, `[isOpen]` off `ItemDialogService` | imperatively — `ModalController.create()` |
| Draft | `T \| undefined` (must model "closed") | `TForm`, never undefined (only exists while open) |
| Seeded from | the host's command | a `componentProps` id → `existing` lookup |
| Used by | the list-item dialogs (grocery/tasks/tracking) | cash + trackplay |

Forcing both through one base would mean `Partial<TForm | undefined>` to save six trivial lines, so
they stay siblings and each types its draft precisely. `BaseModalDialog` removed the skeleton nine
components had each hand-written: an `ngOnInit` copying an entity into N field signals, one setter
per field, an `isEdit` flag, and a confirm branching create-vs-update before dismissing. The id is a
signal there (Ionic's `componentProps` does a plain property write, so each subclass keeps a
domain-named setter that writes into it), which makes `existing`/`draft` reactive and means **no
subclass implements `OnInit`**.

Its `TForm` is deliberately a **view-model, not the entity**: these dialogs edit mapped fields
(cents as a de-DE string, a signed amount as magnitude + direction), so the subclass supplies
`toForm` in and `persist` out. Three of the seven converted dialogs had no tests at all before.

Left on plain `ModalController`: `cash/…/reconcile-modal` and `cash/…/import-preview-modal` (confirm
and preview actions — no entity to edit) and `trackplay/…/game-settings-popover` (a popover). A draft
base would be abstraction for its own sake there.

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

- **`DashboardActions.report({ source, metrics })`** (`@shared/data/actions`) — the telemetry
  contract, and the *only* dashboard event in `@shared`. Any program pushes its own summary
  numbers here; it does not know or care who reads them. The read-model that consumes them —
  including its private `DashboardReadModelActions.load`/`hydrate` lifecycle, its state types, and
  its `summary-<source>` keyspace — lives in `commlink/data`+`commlink/model`. Sharing the whole
  slice would have put a `bySource['notifications'].metrics['unread']` selector in the
  domain-blind kernel; `hydrate` in particular *cannot* be shared, since it carries a commlink
  type. Both groups use the source string `'Dashboard'`, so devtools still reads as one timeline.
  (§6)
- **`NotificationsActions`** (`@shared/data/actions`) — the notification-write contract:
  `notify` (publish/refresh), `project` (declare a producer's complete row set), `dismiss` (mark
  handled), `remove` (retract). A producer dispatches these and the inbox reducer applies them —
  always, because the inbox slice is **eager** (§4.5). The contract is write-**only**: `project` is
  what removed the read half. A producer that keeps a set of rows in sync with its own state needed
  the current inbox to merge against, so `@shared` also published the slice's root selector — the
  one place the kernel named another domain's store key. Handing over the whole set instead moves
  the merge into the reducer, where the aggregate decides what a re-projection means for rows the
  user has since touched (`origin.owner` scopes the sweep, `origin.variant` decides whether
  `updatedAt` is re-stamped). The inbox's own lifecycle
  and view state (`load`/`loaded`, done-section, page-viewed, debug) stay private to
  `notifications/data` as `NotificationsListActions` — the same split as `DashboardActions` vs
  `DashboardReadModelActions`, under the same `'Notifications'` source string.
- **`NotificationsActions.toast({ key, params?, color? })`** — the same contract's *transient*
  event, and the reason there is no `ToastService`. It reaches **no reducer**: the message is
  data, and `NotificationsToastEffects` (eager, `notifications/data`) is the single place it is
  presented — the only holder of Ionic's `ToastController` and of the `translate.instant` that
  resolves the key. Producers stay ignorant of both: tracking's five mutation reactions are plain
  dispatching effects, commlink's failed-storage fallback emits it alongside `hydrate([])`, and a
  component reaches it through its own facade (`BarcodeFacade.reportUploadFailure()`,
  `CashFacade.reportRulesApplied(count)`), since components may not dispatch (§4.3). Deliberate
  exception: trackplay's undo toast keeps its own `ToastController` — a toast with a button that
  dispatches `restore` and supersedes its predecessor is an *interaction*, not a message, and
  putting a producer's action into the shared payload would invert the contract.

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
(`@shared/util/categories/categories-page.facade.ts`) — the catalog decorated with per-list item
counts, `add`/`rename`/`remove`, `listTitleKey`/`listHref`, and `drillTo(id)`. `GroceryCategoriesPageFacade`
(shared catalog, scoped to the `:listId` route param → the fan-out `GroceryCategoriesActions`),
`TasksCategoriesPageFacade` and `CashCategoriesPageFacade` provide it at the
`groceries/categories/:listId` / `tasks/categories` / `cash/categories` routes; the shared component is mounted directly
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

### 4.5 Fan-in sinks boot eagerly (the durable-write channel, retired)

*How to write to a feature whose page you're not on.* You make sure it is loaded. The notifications
inbox is a **fan-in sink** — every module publishes into it from its own route, and the shell badge
reads it on every screen — so it registers in the eager kernel (`notificationsContext`) and a
producer simply dispatches the §4.2 contract. `/notifications` stays a lazy *page*; that is
`loadComponent`, independent of where the slice lives.

This replaced a durable-write channel: while the slice was routed, tracking had to read-modify-write
the persisted `npc-notifications` doc through a `NotificationsStore` port, using the same pure
transforms as the reducer so the on-route and off-route paths could not drift. It worked, but it cost
a second write path to keep provably identical, a doc read where a `select` would do, an
inbox-shaped `mutate(transform)` port in the shared kernel, and a re-hydrate on route entry to
correct a slice that could be stale. All of that bought a few milliseconds of boot for a slice the
badge needs anyway.

> **Pattern — route a context by its writers, not by its page.** Laziness is scoped to a
> *lifecycle*: it fits a context whose reads and writes both live on its own route. A capability
> written from everywhere has no such route, so scoping it to one forces a second channel to reach
> it — and two channels into one aggregate is a drift risk you pay for forever. Give the sink the
> lifecycle its writers imply. (The dashboard read-model is eager for exactly the same reason;
> the tell is that both are read by always-on shell chrome.)

---

## 5. Eager kernel vs. lazy contexts (the lifecycle)

### What boots (the eager kernel — `main.ts`)

Only the things that must always be present:

`main.ts` names none of it: it calls `provideAppKernel()` (`app.providers.ts`), which spreads the
store root plus one `<domain>.providers.ts` bundle per eager domain. Each of those bundles its own
slice + effects + boot `load` (via `bootHydrationProvider`), exactly as a routed context bundles
its own in the same `<domain>.providers.ts` file — one file name, one shape; eager vs routed is a
property of *where the providers are composed*, never of who is allowed to name a reducer.

All three are `TContextBundle`s — the *same* `{providers, resolve}` shape a routed context hands to
its route, spread here instead. That is the whole of what "eager" means, and it is why the kernel can
read as `kernelContexts.flatMap((context) => context.providers)`: their `resolve` halves are empty by
construction (`hydrate: 'boot'`), so nothing at the composition site has to know which of the twelve
domains is eager.

- **The store root** (composed inline in `app.providers.ts`): `provideStore({ router })` +
  `provideRouterStore()`. `router` is the only genuine root reducer left; `app.providers.ts` is on
  the eslint `@ngrx` allowlist so the composition can name it directly.
- **`commlinkContext`**: the `dashboard` read-model — slice, `DashboardEffects`
  (load/persist), boot `load`.
- **`settingsContext`**: the app-global `settings` slice (persisted schema `version` anchor +
  the selected theme), `SettingsEffects`, boot `load`.
- **`notificationsContext`**: the inbox slice, its debug + toast effects, boot
  `load`, and the OS reminder (`NotificationService.init()`) — one boot entry point for the domain,
  so the shell no longer reaches into `notifications/util`. Load, save and telemetry come from the
  descriptor (`hydrate: 'boot'`).

**No *routed* context is eager**, and note `listSettings` + `quickadd` are not here: they were
grocery-specific all along and moved into the lazy **groceries** domain (the settings re-scope). The
one genuinely app-wide bit they carried — the `version` — became the global `settings` slice.

What earns a slice a place here is being needed before its own page is: the dashboard read-model and
the notifications inbox are cross-module sinks behind always-on shell chrome, and the theme must
apply under the boot splash before first paint.

### There is no root-state type

`IAppState` is gone. Nothing anywhere names the shape of the whole store: every slice is read
through its own `createFeatureSelector<ISliceState>('key')` (NgRx's root-state selector overload is
itself deprecated), and every facade injects the bare `inject(Store)`. Where a feature needs several
slices at once it recomposes them locally. Groceries no longer needs to: its aggregates are one
slice, so `selectGroceriesState` *is* the cross-list read and each aggregate's base selector derives
from it.

This is not squeamishness, it's forced: a *complete* root-state type is impossible here. `dashboard`
and the other eager slices (`settings`, `notifications`) are domain-owned, and Sheriff's
`'domain:*': [sameTag, 'domain:@shared']` bars `@shared/model` from naming a domain type; every
other context is lazy, so its key doesn't exist at boot; and `main.ts` — the one place that *could* name the full map — may not import `type:model` at
all (`root: ['type:shell', 'type:data', 'type:util']`). A partial type pretending to be the root is
worse than none, so the only survivor is the test kit's `TMockKernelState`
(`@shared/testing/test-data`), which is honestly scoped to what the mock store seeds by default.

> **Pattern — no global schema.** The same reason services don't share one database schema: a type
> that enumerates everyone's state re-couples the modules you just sealed. Ownership follows the
> slice. And when a boundary makes a "complete" global type *impossible*, that's the design telling
> you the type shouldn't exist — not that it needs an exception.

### How a lazy context loads

The composition root delegates; the domain declares. `app.routes.ts` maps a URL to the manifest of
the domain that owns it and knows nothing else about it:

```text
// app.routes.ts — type:shell
{ path: 'cash', loadChildren: () => import('./cash/routes/cash.routes').then((m) => m.cashRoutes) }

// cash/routes/cash.routes.ts — domain:cash + type:routes
export const cashRoutes: Routes = [
  {
    path: '',
    ...cashContext,                      // providers (state + effects) + resolve (hydration)
    children: [
      { path: '', data: { title }, loadComponent: () => import(...) },
      { path: 'rules', data: { title }, loadComponent: () => import(...) },
      …
    ],
  },
];
```

Three properties fall out of that shape:

- **The domain data layer leaves the initial chunk.** A static `import` of eleven `data` barrels at
  the root put every reducer, effect and facade in the initial bundle: "lazy" deferred registration
  and hydration but never download or parse. The `loadChildren` edge is the only import from shell
  into domain — initial bundle 1.48 → 1.40 MB raw (301 → 282 kB transfer), 42 → 34 initial chunks.
  Over the wire that is ≈ 0 (the service worker prefetches `/*.js`, and the APK ships every chunk on
  disk); what it buys is ~80 kB less JS *evaluated at boot*.
- **A domain's routing is sealed.** The manifest sits at `src/app/<domain>/routes/`, so the existing
  `src/app/<domain>/<type>` pattern tags it `domain:<domain>` + `type:routes` and the domain axis
  applies. Sheriff resolves imports through `ts.preProcessFile`, which reports dynamic `import()`
  too, so a `loadComponent` reaching another domain fails `sheriff verify` (`from tag domain:cash to
  tags domain:trackplay, type:feature`) — impossible to catch while the table lived in the
  domain-less shell. The manifest is **not** in `feature/`: `type:feature` has no `sameTag` since
  sheriff-tighten §2/§3, so lazy-loading a sibling page from there would have meant re-opening a
  deliberately tightened rule. The new `type:routes` rule is purely additive.
- **The context sits on the subtree root, once.** A componentless parent carries
  `...<domain>Context` for all its pages, and Angular reuses a parent whose params don't change —
  so `cash → cash/rules → cash/report` dispatches `[Cash] load` **once** (measured: 4× before),
  while re-entering the subtree from outside re-hydrates. Every domain owns a URL prefix, which is
  what makes that possible: the grocery pages moved under **`/groceries/{shopping,storage,products,
  categories}/…`** and the tasks catalog from `/categories/_tasks` to **`/tasks/categories`**, so
  entering the grocery subtree hydrates twice (`[Groceries]` + `[ListSettings]`) and then costs
  **nothing** to move between its four pages (measured: 2 reads *per page* before). Two paths stay
  off their folder on purpose — `/soykaf` and `/data/:listId` are deck programs, product surfaces
  rather than structure — and they are their own mounts, so they re-hydrate on entry like any other
  program switch. `**` → `commlink` catches the pre-prefix URLs; there are deliberately no legacy
  redirects.

  `/groceries/list-settings` is now a plain **child** of the grocery context root. It used to be a
  sibling so it could register only the `listSettings` slice, keeping the lists' telemetry reporters
  (which `report` on subscribe) from publishing zero counts on a cold launch straight there. With one
  grocery slice the flags cannot be registered without the lists anyway — and entering the subtree
  hydrates them, so the reporters see real counts. The scoping bought nothing once the model was
  right, and being a child means moving between the flags page and a list costs no re-read.

- **`<domain>.providers.ts`** declares the context through
  **`providePersistedContext({...})`** and exports the resulting `<domain>Context` bundle —
  `{ providers, resolve }`, so the route spreads one reference. Angular builds the route's
  `EnvironmentInjector` during route *recognition*, so the reducers exist before the resolver runs.
- **`moduleHydrationResolver(load, loaded)`** (`@shared/data/module-hydration.resolver.ts`)
  dispatches the module's `load`, then blocks activation until its `loaded` fires — so the first
  paint is never a flash of empty lists. Each module reads **only its own keys** (no
  whole-datastore re-read).

### `providePersistedContext` — the context contract

Owning a persisted slice used to cost five near-empty files per context: a `*-load.effects.ts`
wrapper class, a `*-save.effects.ts` wrapper, a `*-telemetry.effects.ts` wrapper, an
always-empty `*.migrations.ts` ladder, and a providers bundle that exported its resolver
separately — 37 files and 988 lines whose only content was the six values that actually differ.
`app.routes.ts` then repeated `providers: xProviders, resolve: { hydrated: xHydrationResolver }`
24 times.

One descriptor (`@shared/data/persisted-context.provider.ts`) now names what a context owes the
kernel, and returns the `{ providers, resolve }` pair a route (or `provideAppKernel()`) spreads:

```ts
export const cashContext = providePersistedContext({
  key: 'cash',                       // storage key AND store feature name
  reducer: cashReducer,
  lifecycle: CashActions,            // its own load / loaded
  select: selectCashState,
  save: { sources: ['[Cash]'] },     // or { on: [...creators] }, or both
  telemetry: [{ source: 'cash', select: selectCashBalanceEuros, metrics: createMetric('balance') }],
  effects: [CashEffects],            // the domain's own, non-generic effects
  // ladder: [] by default · hydrate: 'route' by default
});
```

The three effects it composes are **functional** (NgRx 21 `{ functional: true }`), so
`provideEffects` takes the object directly and no wrapper class exists. Crucially this does **not**
reopen the *lazy ≠ unloaded* cross-firing hazard: each context's call produces its own effect
identities, which is precisely why per-domain classes were needed before.

- **`save`** is a trigger spec, not an effect. `{ sources }` sweeps action-source prefixes while
  **excluding `load`/`loaded`** — hydration dispatches `[X] load` while the slice is still at empty
  `initialState`, so persisting on it would clobber the saved doc (a real data-loss bug, guarded by
  the reload e2e). It is a *list* because a context can own several action groups: the combined
  `groceries` slice sweeps `[Products]`, `[Shopping]`, `[Storage]`, `[GroceryCategories]` and
  `[Recipes]`. `{ on: [...] }` names exact creators instead, for a context that must skip a
  high-frequency action (tracking's per-second tick) or a request its own effect answers
  (`[ListSettings] toggleFlag`, which would write the pre-toggle flags). The two compose. Omit
  `save` entirely and the context keeps its own.
- **`telemetry`** is likewise a list: one slice can feed several deck tiles — `groceries` reports a
  product count, an active-shopping count, a low-stock count and a recipe count from one state.
- **`hydrate`** is the eager/routed axis: `'route'` returns a `moduleHydrationResolver` keyed by
  the slice key, `'boot'` returns a `bootHydrationProvider` and an empty resolve map. Ownership and
  lifecycle stay independent — same file, same shape, either way.
- **`mergeContexts(...)`** composes co-registered contexts. Because each resolver is keyed by its
  slice key, merged resolve maps cannot collide. One caller is left: `groceriesContext` merges the
  persisted grocery context with the ephemeral, never-persisted `quickadd` reducer.
- **`TStored` vs `TState`.** The descriptor is generic over both the on-disk and in-store shapes,
  defaulting the former to the latter. Nine contexts don't notice; `office-time` does — it persists
  its dayjs date maps as strings, so its `loaded` payload is `IOfficeTimeStateStorage` while its
  reducer and selectors work in `IOfficeTimeState`. The type split made an asymmetry explicit that
  a single type param had quietly conflated.

**One context deliberately opts out**, and the distinction is the point: it is irregular, not merely
verbose.

- **`commlink`**'s dashboard read-model — reads a key *family* (`loadPrefixed('summary-')`) rather
  than one key, raises the storage-unavailable toast as the single eager boot reader, and gates
  persistence on `hydrate` so the reporters' initial pre-hydration `report` cannot overwrite the
  prior session's summary. The generic save effect has no such gate, and adding one for a single
  caller would put an ordering rule in the shared path that only this context needs.

`office-time` sits between: it takes the descriptor for load + telemetry and keeps its own save,
which serializes before writing.

**`groceries` used to be the second opt-out**, and its return is the more interesting half of the
story. It hand-rolled a load that read three keys to emit one atomic `loaded`, plus a save that
routed the write by action-source prefix. Both existed only because the *state* was shaped wrong:
four aggregates that cross-read each other, each in its own slice and its own doc, need
co-registration, an atomicity trick and prefix-routed writes to behave as the one thing they already
were. Collapsing them into a single `groceries` slice (one `combineReducers` over the five unchanged
aggregate reducers, one `npc-groceries` doc) made its persistence a plain slice dump again — so it
rides the descriptor with no widening beyond `save.sources`/`telemetry` becoming lists, which is
plurality, not a special case.

> **Pattern — before widening the abstraction, check whether the caller is the wrong shape.** An
> irregular *mechanism* is often an irregular *model* wearing a disguise: groceries' bespoke
> load/save was a symptom of four slices that were one bounded context. Absorb plurality (n sources,
> n metrics); refuse genuine special cases (commlink's key family and its ordering gate). An
> abstraction that absorbs every exception stops describing anything — and one that is dodged by
> every caller with an awkward model describes the wrong thing.

The generic mechanics are proven once in `persisted-slice.effects.factory.spec.ts` against a probe context
(the save-exclusion invariant, both trigger shapes, the storage-failure fallback, telemetry
reporting live on subscription). That replaced 17 per-domain effect specs which had been testing
the same shared builders through 17 different front doors; what was genuinely domain-specific in
them — the derived telemetry selectors — moved into the matching `selectors/*.spec.ts` as
`.projector()` tests.

### The single-list item flow

Four behaviours every list-backed domain needs — add-from-search (with duplicate detection),
resolve add-or-update, reset the search box, re-sync the query after a rename — live once in
`@shared/data/effects/item-list.effects.factory.ts` as **effect builders**, and each domain composes the
ones it has:

```ts
export const tasksListEffects = {
  ...listItemFlow({ actions: TasksActions, select: selectTasksState, create: … }),
  clearSearch$: clearSearchAfter(TasksActions.updateSearch, [ … ]),
  clearFilter$: clearFilterWhenLeavingCategories(TasksActions),   // tracking omits: no categories
};
```

Builders rather than a shared class, and that distinction is the reason they exist: NgRx dedups
same-class instances and route injectors are never torn down, so ONE class registered in two of
them double-dispatches across a transition — which is exactly why `tasks` and `tracking` each
carried a hand-copied version before. Every caller of a builder gets its own effect identities, so
the hazard is structurally absent instead of avoided by duplication.

It is **not** a line saving (166 → 196). What it buys is one definition instead of two, and a call
site that reads as the list of behaviours a domain has rather than 98 lines of RxJS.

The **grocery engine does not use it**: it is a multi-list *router* — generic `GroceryListActions`
resolved to a concrete list's group via the action's source prefix, plus the cross-list copy rules —
so its versions of these behaviours carry a `listId` the single-list builders cannot know about.
Same call as groceries keeping its own load/save.

> **Pattern — share the behaviour, not the instance.** When a framework's identity rules make a
> shared singleton unsafe, the fix is a factory, not a copy. Copies drift; a factory cannot.

A route carries neither when there is nothing to hydrate. `/notifications` and `/settings` are lazy
*pages* over eager slices; `/geist` has **no slice at all** — its transcript is a component signal
and its session lives in the browser, so the domain is `feature` + `model` + `util` with no `data/`
folder to provide. (`/soykaf` was the other such route until the recipe book replaced its stub.) Page laziness and slice lifecycle stay independent axes, and
"which layers a domain has" follows from what it actually owns rather than from a template.

> **⚠️ Lazy ≠ unloaded on exit.** Ionic's `IonicRouteStrategy` + NgRx `provideState/provideEffects`
> have no per-injector teardown: a lazy context registers on **first visit and persists for the
> session**. Consequences that shape the code:
> - Two contexts that listen to the **same action class** both fire once both are visited (NgRx
>   dedups same-class, not different-class instances). This is why the grocery and tasks dialog
>   orchestrators are **separate classes** that each **guard on `listId`** — a shared class would
>   double-dispatch across a grocery↔tasks transition.
> - "Lazy" here buys **boot-time hydration + memory**, not bundle size (the bundle is
>   ~1 MB framework-dominated; state code is negligible). That trade was made deliberately.

### Co-registration (retired — the model absorbed it)

Co-registration was a *rule* for as long as the grocery aggregates were separate slices: every
grocery route had to register all of products/shopping/storage (the cross-list search buckets read
sibling slices — registering only the route's own left siblings `undefined` and crashed the selector,
a real, reverted bug), `/soykaf` had to register more than the lists (the matcher joins recipes
against `_products` and `_storage`), and `/groceries/list-settings` deliberately registered less (the
lists' telemetry reporters `report` on subscription and would have flipped the deck tiles online with
zero counts).

Three route-level rules, all of them protecting invariants of **one** bounded context. The single
`groceries` slice makes them unstateable: there is one reducer, one doc and one
`[Groceries] load/loaded`, so a page cannot enter with a sibling missing, `/soykaf` and
`/groceries/list-settings` spread the same bundle as the lists, and every grocery page hydrates the
same state. `quickadd` stays outside the slice — it is derived, ephemeral, never persisted — and is
merged in as a bare reducer with no lifecycle.

> **Pattern — prefer an invariant you cannot express wrongly to a rule you must remember.** The
> co-registration rule was correct and documented, and still cost a reverted crash. Aggregates that
> must be present together are one slice; the rule then has nowhere to be broken.

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
  `DashboardActions.report` + `IDashboardTelemetry` + `createTelemetrySliceEffect` in `@shared/data`.
  The *read* side — reducer, selectors, `DashboardFacade`, the load/hydrate/persist effects, the
  `IDashboardState`/`IDashboardSummary` types (`commlink/model`), the `summary-` keyspace, and the
  `mockDashboardState` fixture (`commlink/testing`) — lives in **`commlink`**, because the deck and
  the shell badge are its only two readers. Its ownership is exactly why no root-state type could
  ever be complete (§5); specs seed it through `mockKernelState`'s `& Record<string, unknown>` hatch. That
  is what keeps `@shared` domain-blind: the badge selector hardcodes `'notifications'` + `'unread'`,
  which is a `commlink` concern, not a kernel one. Sheriff still seals the suppliers (`domain:*` may
  only reach `sameTag` + `domain:@shared`), so no producer can see `commlink` — they dispatch the
  shared action and never learn who consumes it.
- **Why eager.** The dashboard is a **capability sink**: its writers live *outside its own
  route* (every program reports while you're inside that program), so it can't be scoped to any
  one producer's lifecycle. (Same reason a metrics collector is a central always-on service, not
  a per-workload sidecar.) So although it sits in a `<domain>/data` folder, `provideAppKernel()`
  registers it in the root store — `commlinkContext` is composed there rather than handed to a
  route, and it is the one providers bundle with no hydration resolver. *Where code lives*
  (ownership) and
  *when it registers* (lifecycle) are independent axes; only the shell and `main.ts` reach in, and
  both are domain-blind by tag.
- **Why persisted.** Once producers are lazy, none of them reports until you visit it — so cold
  launch would show an empty deck. `DashboardEffects` reads the small `npc-summary-*` docs at
  boot (`status: 'standby'`); a live `report` flips a tile to `status: 'online'`. Status is
  therefore *structurally* ephemeral — it can only become `online` via a live report.
  **`hydrate` fills gaps rather than overwriting:** an eager reporter (the inbox, since it registers
  in the kernel) can emit its first `report` before this storage read resolves, and a report read the
  live slice, which is fresher than the doc. Overwriting would have parked that source at its
  persisted value + `standby` for the rest of the session, because `select` only re-emits on change.
  `hydrate` fires exactly once at boot, so "already present" can only mean "reported live".
- **Who reads it.** `commlink.page` reads **only** `selectDashboardState` (it imports zero
  feature domains — it's domain-blind, each tile just names a `source` + `metric`). The shell's
  notification badge reads `selectNotificationsUnread` from this same read-model, **not** the
  notifications slice — so the shell stays domain-blind and a cold launch has its count before any
  producer's own `load` returns.
- **The metrics** each program reports: `tracking→count`, `office-time→{officedays, percentage}`,
  `notifications→unread`, `shopping→active`, `storage→low`, `products→count`, `tasks→open`,
  `cash→balance`, `trackplay→games`.

### The notification sink

`notifications` used to be the coupling magnet (it imported `tracking` to watch its events). Now
the arrow is inverted, so notifications imports **no** domain:

1. **Writes, from any route:** producers dispatch `NotificationsActions` → the eager inbox reducer
   receives it, and the inbox's own save effect persists it — producers never touch storage (§4.2).
2. **No reads at all:** a producer that owns a set of rows dispatches `project` with the whole set
   and the reducer merges — rows other owners published are untouched, a row the producer stopped
   projecting is dropped, and one whose `variant` is unchanged keeps its `updatedAt` so an unrelated
   toggle can't drag it to the top or re-flag it as unread.
3. **CTAs back to a producer:** the inbox page deep-links `/tracking?cmd=&target=`, handing over the
   command it already holds so the producer resolves it against its own state (§4.4).
4. **Transient messages:** the same `toast` dispatch, presented and forgotten — the sink owns
   *telling the user something*, whether or not the message is worth keeping (§4.2).

The badge still reads the `dashboard` read-model rather than this slice — the inbox reports `unread`
as telemetry like any other program, which keeps the shell domain-blind and gives a cold launch its
persisted count before the inbox's own `load` returns.

The OS-level side (`NotificationService`, `notifications/util`) is a thin Capacitor adapter,
`init()`-ed once at boot from the domain's own eager providers.

---

## 7. Walkthroughs — who talks to whom, and why

**Deck → every program (read only).** `commlink.page` renders a tile per program. It reads live
counts from the dashboard read-model and nothing else; it never imports a feature. Adding a
program to the deck is a config entry (`source`+`metric`), not a dependency.

**Shell badge → dashboard.** `AppComponent` shows an unread badge in the side menu. It reads
`selectNotificationsUnread` (read-model), so it works whether or not notifications is loaded.

**tracking ↔ notifications (the instructive case).** Neither side may import the other, and
tracking is lazy while the inbox is eager:
- Toggling a tracking item → `TrackingNotificationsEffects.reconcileState$` (rides with lazy
  tracking) derives the rows tracking claims **from its own items alone** and dispatches one
  `project`. It cannot read the inbox and does not need to: rows for items that are gone (or whose
  tracking was reset) are simply absent from the set, and the reducer retires them. The trade is one
  idempotent write per mutation instead of a diff computed against foreign state.
- Tapping a notification CTA on `/notifications` → deep-link `/tracking?cmd=<command>&target=<itemId>`
  → tracking page dispatches `applyNotificationCommand` → toggles the item → reconcile updates the
  row. The link carries the command rather than the row's id, so tracking resolves it against its own
  items; if the item is gone there is nothing to toggle, so it re-projects and the stale row retires
  with the set.
- No `import` crosses the boundary in either direction; the shared surface is the write contract, the
  aggregate's types, and a route string.

**groceries internal (one context, three aggregates).** `shopping`, `storage`, `products` freely
import each other (`sameTag`) — searching shopping reads the products catalog; the cross-list
"copy to shopping/storage" rules read siblings. This *is* the intra-context coupling the DDD
refactor wanted: it's honest coupling inside one boundary, not three fake-independent domains.
The grocery multi-list engine (`groceries/data`'s `grocery-list.*` files) and dialog orchestration ride in
`groceriesContext` and guard on `listId ∈ {_shopping,_storage,_products}`.

**tasks (the sealed twin).** `tasks` reuses the same list UI but shares **no data** with
groceries. It has its own switch-free copies of the list/dialog effects and its own
`TasksListPageFacade`. It depends only on `@shared`. It proves the kit is genuinely generic.

**barcode (self-contained).** `barcode` displays the SIGIL badge image, which it now stores in
its **own** `barcode` slice (persisted `npc-barcode`), hydrated by its own route resolver like
every other lazy context. It imports no domain and reports no telemetry (SIGIL is a deck tile
with no live metric — as SOYKAF was, before the recipe book gave it a count to report). Until sheriff-tighten the badge lived in the `officeTime`
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
through its own `ListPageFacade`. Their edit dialogs ride the domain-blind `ItemDialogService`
open-command (§4.1b) — tracking's former standalone item-list engine + `dialogs` fork were
folded onto these shared mechanics (the last merge-duplicate retired).

---

## 8. Persistence — the port

`DatabaseService` (`@shared/util/db/database.service.ts`) is a **dumb per-key port** over
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
                         │  list kit · LIST_FACADE · DashboardActions.report · NotificationsActions + read  │
                         │  transforms · DatabaseService (per-key port) · resolver · boot provider           │
                         └───────────────────────────────────────────────────────────────────────────────────────┘
                              ▲ dispatch / inject                                    ▲ dispatch report
   report telemetry ─────────┼──────────────────────────────────────────────┐      │
        │                    │                                               │      │
  ┌─────┴─────┐   deep-link  │   notify / remove      ┌──────────────┐   ┌───┴──────┴───┐   reads only
  │ tracking  │◀─ /tracking?─┤ ─────────────────────▶ │ notifications│   │  dashboard   │◀──────────── commlink deck
  │  (lazy)   │─ report ─────┤ ◀── select (merge) ─── │ (eager sink) │   │ (eager R-M)  │◀──────────── shell badge
  └───────────┘              │                        └──────┬───────┘   └──────────────┘
                             │                    report unread ─────────────▶
  office-time (lazy) ─report─┤   barcode (lazy) ─── owns its own SIGIL slice, imports nothing
  groceries  (lazy) ─report─┤   groceries pages ─provide─▶ LIST_FACADE ◀─inject─ @shared/list-page
  tasks/cash/trackplay ─────┘   tasks page ──────provide─▶ LIST_FACADE ◀────────────┘

  geist (lazy page, no slice) ─inject─▶ @shared LanguageModelService ─▶ Chrome Prompt API
      no state · no telemetry · no contract — the deck reads its *capability*, not its data
```

Legend: **solid feature→@shared arrows are the only allowed couplings.** No feature→feature arrow
exists at all — **zero** cross-domain bridges. Everything cross-feature crosses via report /
dispatch / deep-link / facade — never a direct import.

---

## 10. Notes — proposals that were considered but never built

Kept so their absence doesn't read as an oversight (the "why" is in the git history):

- **`office-time → tracking` was never built.** An early design had office-time read a tracking
  read-model selector; the realized office-time is standalone and only reports telemetry.
- **`notify({ level })` as a generic action was not built.** The realized notification contract is
  `NotificationsActions` (§4.2), with `AppMessageEffects` turning tracking toasts into UI messages.
- **"Every context lazy" did not survive contact with the notification inbox.** `feature/fully-lazy`
  routed both remaining eager sinks: `tracking` (a background timer bridged it to notifications —
  the timer was deleted, correctly) and `notifications`. Routing the inbox forced the durable-write
  port described in §4.5; that port is now gone and the inbox is eager again, for the same reason the
  dashboard read-model always was. Uniform lifecycle was the wrong goal — the right one is a
  lifecycle that matches where a slice is written and read. No *supplier* feature slice is eager.
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
| Published Language / Open Host Service | `DashboardActions.report`, `NotificationsActions` (+ its read selector) |
| Ports & Adapters | `DatabaseService` (per-key), `NotificationService` (OS adapter) |
| Deferred command | notification CTA → `/tracking?cmd=` deep-link |
| Facade + DI token | `LIST_FACADE` decoupling the generic list page from domains |
| Idempotent initialization | `DatabaseService.#ensureStorage()` memoized `create()` |
| Strangler Fig / Expand-Contract | the migration approach throughout (see git history) |
| Capability sink stays central | dashboard read-model + notification inbox eager despite everything else lazy |
| Domain-owned route manifest | `<domain>/routes/<domain>.routes.ts`; the shell is a `path → loadChildren` table |
