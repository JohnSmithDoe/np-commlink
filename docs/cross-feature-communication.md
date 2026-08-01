# Cross-feature communication — the five channels and the two capabilities

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §3 the five channels every cross-feature interaction must use (import graph · NgRx
> published contracts · DI facade tokens · deep-links · eager fan-in sinks) and §6 the two
> cross-cutting capabilities that are inverted onto them (the dashboard read-model, the
> notification sink), ending in the context map. **Read this first** when a feature needs
> something from another feature. **See also:** what Sheriff actually allows (§2.3) →
> [architecture.md](./architecture.md) · why the sinks boot eagerly (§4) →
> [lifecycle-and-persistence.md](./lifecycle-and-persistence.md).

## 3. The communication channels

Everything cross-feature travels one of five channels.

### 3.1 Compile-time: the Sheriff import graph

The strictest and most-preferred — a plain function/type import, where §2.3 allows it. **If a
feature needs something from another feature and Sheriff blocks the import, that's the design
telling you to use a runtime channel below.**

### 3.2 Runtime message bus: NgRx actions + two published contracts

NgRx actions are global — any effect in any injector sees every dispatched action. This is how
sealed/lazy features communicate without a code dependency. Two `@shared/data/actions` groups are
elevated to **published-language contracts**, the only actions a feature dispatches expecting
_someone else_ to handle:

- **`DashboardActions.report({ source, metrics })`** — the telemetry contract, and the _only_
  dashboard event in `@shared`. Any program pushes its own summary numbers; it never learns who
  reads them. The read-model that consumes them lives in `commlink` (§6).
- **`NotificationsActions`** — the notification-write contract: `notify` (publish/refresh),
  `project` (declare a producer's complete row set), `dismiss`, `remove`. Write-**only**: `project`
  is what removed the read half. A producer keeping rows in sync with its own state used to need the
  current inbox to merge against, so `@shared` also published the slice's root selector — the one
  place the kernel named another domain's store key. Handing over the whole set moves the merge into
  the reducer, where the aggregate decides what a re-projection means for rows the user has since
  touched (`origin.owner` scopes the sweep, `origin.variant` decides whether `updatedAt` is
  re-stamped). The inbox's own lifecycle and view state stay private as `NotificationsListActions`.
- **`NotificationsActions.toast({ key, parameters?, color? })`** — the same contract's _transient_ event,
  and **the reason there is no `ToastService`.** It reaches no reducer: the message is data, and
  `NotificationsToastEffects` (eager) is the single holder of Ionic's `ToastController` and the
  `translate.instant` that resolves the key. Producers stay ignorant of both — a component reaches it
  through its own facade (`BarcodeFacade.reportUploadFailure()`,
  `CashFacade.reportRulesApplied(count)`), since components may not dispatch. Deliberate exception:
  trackplay's undo toast keeps its own `ToastController` — a toast with a button that dispatches
  `restore` and supersedes its predecessor is an _interaction_, not a message.

> **Pattern — Dependency Inversion for cross-cutting capabilities.** A capability serving everyone
> must not _import_ everyone. It publishes a contract in the shared kernel; **producers dispatch, the
> capability listens.** The arrow points from many producers to one contract, never outward.

### 3.3 DI contracts: `LIST_FACADE` and `CATEGORY_LIST_FACADE`

How one generic component serves several domains without knowing them. The generic
`@shared/feature/item-lists/list-page` `inject()`s a `LIST_FACADE` token; each domain **provides** its own
implementation at the route:

```text
list-page (generic, domain-blind)
   └─ inject(LIST_FACADE)
        ├─ GroceryListPageFacade    (multi-list engine: route-param → active list, cross-list buckets)
        ├─ TasksListPageFacade      (trivial single-list)
        └─ TrackingListPageFacade   (tracking-flavoured; no categories → omits manageCategories)
```

Tracking is category-less, so its facade returns `[]` and its category-mode operations are no-ops;
omitting the optional `manageCategories` is what suppresses the shell's entry button to a catalog
page. The quick-add row needs no suppressing — it is a slot grocery pages project into and tracking
simply does not. Its tracking-only chrome is content-**projected** into the shell's
`[toolbarActionsEnd]`, `[searchExtras]` and `[headerEnd]` slots.

Why a token and not a selector? **NgRx selectors can't read DI**, so a `listId → selector` registry
can't live inside a pure selector. A facade is a _service_ — it can hold `store.selectSignal(...)`.
Grocery-only operations (`addProduct`, `showCreateProductDialog`) are deliberately _off_ the shared
contract and live only on the concrete facade — putting them on it would force `tracking` to
implement operations it has no concept of.

The **catalog page** applies the pattern a second time: the domain-blind
`@shared/feature/categories/category-list-page` injects `CATEGORY_LIST_FACADE` — which *extends* the list
contract, because a catalog IS a list, and adds only what a category row does that an item row does
not (`countById`, `listHref`, `drillTo(id)`, `saveCategory`/`removeCategory`/`showEditDialog`).
Grocery, tasks and cash provide ONE facade bound to BOTH tokens via `provideCategoryListFacade` at
their own routes; the shared component is mounted directly, no per-domain wrapper.
**Category→items drill:** `drillTo` navigates to the owning list with `?filter=<categoryId>`,
applied in `ionViewWillEnter` — _after_ the resolver's `loaded` resets `filterBy`, so the filter
survives entry. Cash has no `filterBy` list, so its drill target is a dedicated read-only
transactions view (`cash/category/:categoryId`).

### 3.4 Navigation: string-route deep-links

When the notifications page must act on a tracking item, it can't import tracking and — tracking
being lazy — tracking's slice may not even be registered. So it navigates:

```text
notifications.page → router.navigate(['/tracking'], { queryParams: { cmd, target } })
```

The route string is the entire coupling. Activating `/tracking` registers + hydrates tracking; the
page reads the params and dispatches `applyNotificationCommand` into _its own_ domain. The link
carries the **command**, not the row id, so tracking resolves it against its own items.

> **Pattern — deferred command.** The CTA is aimed at an aggregate that isn't loaded yet. Rather than
> execute it cross-boundary, encode it in the navigation and let the target apply it to itself.

### 3.5 Fan-in sinks boot eagerly

How to write to a feature whose page you're not on: make sure it is loaded. The notifications inbox
is a **fan-in sink** — every module publishes into it, the shell badge reads it on every screen — so
it registers in the eager kernel and a producer simply dispatches (§3.2). `/notifications` stays a
lazy _page_; that's `loadComponent`, independent of where the slice lives.

This replaced a durable-write channel. While the slice was routed, tracking had to read-modify-write
the persisted `npc-notifications` doc through a `NotificationsStore` port, sharing the reducer's pure
transforms so the two paths could not drift. It cost a second write path to keep provably identical,
a doc read where a `select` would do, and a re-hydrate on route entry to correct a slice that could
be stale — all to save a few ms of boot for a slice the badge needs anyway. The port is deleted.

> **Pattern — route a context by its writers, not by its page.** Laziness fits a context whose reads
> and writes both live on its own route. A capability written from everywhere has no such route, and
> scoping it to one forces a second channel — two channels into one aggregate is a drift risk you pay
> for forever. (The tell for both eager sinks: they are read by always-on shell chrome.)

---

## 6. The two cross-cutting capabilities

Two capabilities serve _every_ program. If they imported their producers they'd import the whole
app, so both are inverted.

### The dashboard read-model (CQRS)

```text
  tracking ─┐
office-time ─┤
     cash ─┼─ DashboardActions.report({source, metrics}) ─▶ dashboard slice (eager) ─▶ commlink deck
    tasks ─┤                                                        │                    └▶ shell badge
      ... ─┘                                                        └▶ npc-summary-<source> (disk)
```

- **The port/read-model split.** Only the _write_ side is shared: `DashboardActions.report` +
  `IDashboardTelemetry` + `createTelemetrySliceEffect` in `@shared/data`. The _read_ side — reducer,
  selectors, `DashboardFacade`, the load/hydrate/persist effects, the `IDashboardState` /
  `IDashboardSummary` types (`commlink/model`), the `summary-` keyspace — lives in **`commlink`**,
  because the deck and the shell badge are its only two readers. There is no shared fixture and no
  `commlink/testing` folder: a summary is a two-field literal, so each of the three dashboard specs
  writes its own, and `@shared/testing/test-data.ts` says in a comment why it holds none (it is
  tagged `domain:@shared`, and Sheriff checks every `fromTag`, so it could not name
  `IDashboardSummary` even though `type:testing` may reach any layer). Sharing the whole slice would
  have put a
  `bySource['notifications'].metrics['unread']` selector in the domain-blind kernel. The read-model's
  own `load`/`hydrate` group is commlink-owned (`DashboardReadModelActions`) — `hydrate` carries
  `IDashboardSummary`, which `@shared` may not name. Both groups use the source string `'Dashboard'`,
  so devtools reads as one timeline.
- **Why eager.** It is a **capability sink**: its writers live outside its own route, so it can't be
  scoped to any producer's lifecycle. (Same reason a metrics collector is a central always-on
  service, not a per-workload sidecar.)
- **Why persisted.** Once producers are lazy, none reports until you visit it — cold launch would
  show an empty deck. Boot reads the small `npc-summary-*` docs (`status: 'standby'`); a live `report`
  flips a tile to `'online'`, so status is _structurally_ ephemeral. **`hydrate` fills gaps rather
  than overwriting:** an eager reporter can emit its first `report` before the storage read resolves,
  and that report read its own hydrated slice, which is fresher. Overwriting would park that source
  at its persisted value + `standby` for the session, because `select` only re-emits on change.
- **Who reads it.** `commlink.page` reads only `selectDashboardState` — domain-blind, each tile just
  names a `source` + `metric`. The shell's notification badge reads `selectNotificationsUnread` from
  this read-model, **not** the notifications slice, so the shell stays domain-blind and a cold launch
  has its count before any producer's `load` returns.
- **The metrics:** `tracking→count`, `office-time→{officedays, percentage}`, `notifications→unread`,
  `shopping→active`, `storage→low`, `products→count`, `recipes→count`, `tasks→open`, `cash→balance`,
  `trackplay→games`.

### The notification sink

`notifications` used to be the coupling magnet (it imported `tracking` to watch its events). The
arrow is inverted, so it now imports **no** domain:

1. **Writes, from any route:** producers dispatch `NotificationsActions`; the eager reducer receives
   it and the inbox's own save effect persists it.
2. **No reads at all:** a producer owning a set of rows dispatches `project` with the whole set and
   the reducer merges — other owners' rows untouched, a row the producer stopped projecting dropped,
   and an unchanged `variant` keeps its `updatedAt` so an unrelated toggle can't drag it to the top.
3. **CTAs back to a producer:** deep-link `/tracking?cmd=&target=` (§3.4).
4. **Transient messages:** the same `toast` dispatch, presented and forgotten.

Also here: the background `runningUpdates$` timer was **deleted** — a notification is a point-in-time
event, not a live dashboard. The OS-level side (`NotificationService`, `notifications/util`) is a thin
Capacitor adapter, `init()`-ed once at boot from the domain's own eager providers.

### Context map

```text
        ┌──────────────── @shared (kernel: library + contracts) ────────────────┐
        │ list kit · LIST_FACADE · DashboardActions.report · NotificationsActions │
        │ ItemDialogService · DatabaseService (per-key port) · context provider   │
        └────────────────────────────────────────────────────────────────────────┘
             ▲ dispatch / inject                              ▲ dispatch report
  ┌──────────┴┐  deep-link      ┌───────────────┐        ┌────┴─────────┐   reads only
  │ tracking  │◀── /tracking? ──│ notifications │        │  dashboard   │◀────── commlink deck
  │  (lazy)   │─── project ────▶│ (eager sink)  │─report▶│ (eager R-M)  │◀────── shell badge
  └───────────┘                 └───────────────┘        └──────────────┘

  office-time · groceries · tasks · cash · trackplay (all lazy) ── report ──▶
  barcode (lazy) ── owns its own SIGIL slice, imports nothing, reports nothing
  groceries/tasks/tracking pages ─provide─▶ LIST_FACADE ◀─inject─ @shared/list-page
  geist (lazy page, no slice) ─inject─▶ @shared LanguageModelService ─▶ Chrome Prompt API
```

**Solid feature→@shared arrows are the only allowed couplings.** No feature→feature arrow exists at
all — zero cross-domain bridges. Everything cross-feature crosses via report / dispatch / deep-link /
facade.

