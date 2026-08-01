# Lifecycle & persistence — eager kernel, lazy contexts, the per-key store

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §4 what boots vs what registers per route — the kernel, the global error boundary,
> the `providePersistedContext` descriptor every context is built from, the shared list-flow
> effect builders, and the **lazy ≠ unloaded** rule — plus §5 `DatabaseService`, the dumb per-key
> port. **Touch this file's rules before adding a slice, a context or a persisted key.**
> **See also:** the Sheriff/type layers (§2.2–2.3) → [architecture.md](./architecture.md) ·
> why the two sinks are eager (§3.5, §6) →
> [cross-feature-communication.md](./cross-feature-communication.md).

## 4. Eager kernel vs lazy contexts

### What boots

`main.ts` names none of it — it calls `provideAppKernel()` (`app.providers.ts`), which spreads the
store root plus one `<domain>.providers.ts` bundle per eager domain:

- **The store root** (inline): `provideStore({ router })` + `provideRouterStore()`. `router` is the
  only genuine root reducer left.
- **`commlinkContext`** — `mergeContexts` of **two** slices: `dashboard` (the read-model; a sink every
  module writes to, badge always-on) and `deck` (the user's catalog config, §7.1).
- **`settingsContext`** — the app-global `settings` slice: the persisted schema `version` anchor, the
  selected `theme` and the UI `language`. `SettingsEffects` mirrors theme onto `<html data-theme>`
  and lifts the boot splash.
- **`notificationsContext`** — the inbox slice, its debug + toast effects, and the OS reminder
  (`NotificationService.init()`), so the shell no longer reaches into `notifications/util`.

All three are `TContextBundle`s — the _same_ `{providers, resolve}` shape a routed context hands to
its route, spread here instead. Their `resolve` halves are empty by construction (`hydrate: 'boot'`),
which is why the kernel reads as `kernelContexts.flatMap((c) => c.providers)` and nothing at the
composition site knows which domain is eager.

What earns a slice a place here: being needed before its own page is. `listSettings` and `quickadd`
are **not** here — they were grocery-specific all along and moved into the lazy `groceries` domain in
the settings re-scope; the one app-wide thing they carried, the `version`, became the global
`settings` slice. Ownership (which domain owns the reducer) and lifecycle (eager vs routed) are
independent axes.

### The last-resort error boundary

`provideAppKernel()` spreads **`provideGlobalErrorHandler()`** first, before the i18n root and the
store, so a throw while the rest of the kernel composes is already covered. It is two providers
(`@shared/util/errors/global-error-handler.ts`): `provideBrowserGlobalErrorListeners()` and a
`GlobalErrorHandler` that presents **one `ion-alert` whose only button reloads** via the existing
`AppReloadService`.

Four decisions, each of which is the whole reason it works:

- **`provideBrowserGlobalErrorListeners()` is a prerequisite, not garnish.** Angular routes only its
  _own_ execution into `ErrorHandler` — lifecycle hooks, event handlers, change detection — so a
  rejected promise or a raw `window.onerror` is invisible without it, and a **zoneless** app has no
  `NgZone.onError` to fall back on. The async failures are the ones most worth catching, and
  `e2e/errors/uncaught-error.e2e.ts` throws from a `setTimeout` precisely so removing this listener
  turns the spec red.
- **`AlertController`, never `<ion-alert [isOpen]>`.** A bound overlay needs a change-detection pass to
  open, which is exactly what cannot be trusted when the error came _from_ change detection. An
  imperative Ionic overlay is a Stencil component that renders itself and invokes a button's `handler`
  as a plain callback, so it survives a broken Angular. Both patterns exist in this repo (the shopping
  action sheet is the bound one) and only one of them is safe here.
- **Reload is the only action.** Every _anticipated_ failure already carries its own `catchError` and
  reports through a facade (`reportScanFailure`, `reportUploadFailure`, the storage-unavailable
  fallback), so anything reaching this handler is by construction unanticipated — and continuing from
  an unknown fault is how the app ends up looking healthy with a dead subtree. A restart costs almost
  nothing besides, since every slice persists on write. Hence `backdropDismiss: false` and no cancel.
- **One alert per session.** A `computed` that throws stays errored and re-throws on **every read**
  until a dependency changes, so `handleError` fires once per change-detection cycle; without the latch
  the screen fills with alerts (this is also why a toast was rejected — it would have been a storm).
  Repeats still reach `console.error`, which runs before anything that can itself fail.

The alert carries the error's own text, so it reports _what_ broke rather than only _that_ something
did — the thrown value is read defensively, since a rejection can carry a string or `undefined`.
**Known limitation:** a throw before the i18n bundle resolves leaves `translate.instant` returning raw
keys, so the alert would read `error.uncaught.title`. Accepted rather than fixed — a second hardcoded
string source costs more than the window is worth, and the boot splash covers most of it. The keys live
in the neutral `error.*` namespace because `@shared` may not speak domain vocabulary (§9).

### `providePersistedContext` — the context contract

Owning a persisted slice used to cost five near-empty files per context: load/save/telemetry effect
wrapper classes, an always-empty migrations ladder, and a providers bundle exporting its resolver
separately — 37 files, 988 lines, whose only content was the six values that actually differ.

One descriptor (`@shared/data/persisted-states/persisted-context.provider.ts`) now names what a context owes the
kernel and returns the `{ providers, resolve }` pair a route (or `provideAppKernel()`) spreads:

```ts
export const cashContext = providePersistedContext({
  key: 'cash',                    // storage key AND store feature name
  reducer: cashReducer,
  lifecycle: CashActions,         // its own load / loaded
  select: selectCashState,
  save: { sources: ['[Cash]'] },  // or { on: [...creators] }, or both
  telemetry: [{ source: 'cash', select: selectCashBalanceEuros, metrics: createMetric('balance') }],
  effects: [CashEffects],         // the domain's own, non-generic effects
  // ladder: [] by default · hydrate: 'route' by default
});
```

The three effects it composes are **functional** (NgRx 21 `{ functional: true }`), so no wrapper
class exists. Crucially this does not reopen the _lazy ≠ unloaded_ cross-firing hazard: each call
produces its own effect identities, which is precisely why per-domain classes were needed before.

- **`save`** is a trigger spec, not an effect. `{ sources }` sweeps action-source prefixes while
  **excluding `load`/`loaded`** — hydration dispatches `[X] load` while the slice is still at empty
  `initialState`, so persisting on it would clobber the saved doc (a real data-loss bug, guarded by
  a reload e2e). It is a list because a context can own several action groups (`groceries` sweeps
  five). `{ on: [...] }` names exact creators instead, for a context that must skip a high-frequency
  action (tracking's per-second tick) or a request its own effect answers. The two compose.
- **`telemetry`** is likewise a list — one slice can feed several deck tiles. Each reporter is gated
  on its own slice's `loaded` **and** on a read that resolved (the `PersistedReadRegistry`):
  `store.select` hands out `initialState` on subscription, so an ungated reporter announced a zero
  that the deck lit as live and the summary writer put on disk over the previous session's real
  number — permanently, if that read then failed.
- **`hydrate`** is the eager/routed axis: `'route'` returns a `moduleHydrationResolver` keyed by the
  slice key, `'boot'` a `bootHydrationProvider` and an empty resolve map.
- **`mergeContexts(...)`** composes co-registered contexts; each resolver is keyed by its slice key,
  so merged resolve maps cannot collide.
- **`TStored` vs `TState`.** Generic over both the on-disk and in-store shapes, defaulting the former
  to the latter. Nine contexts don't notice; `office-time` persists dayjs date maps as strings, so
  its `loaded` payload is `IOfficeTimeStateStorage` while its reducer works in `IOfficeTimeState`.

**`moduleHydrationResolver(load, loaded)`** dispatches the module's `load`, then blocks activation
until its `loaded` fires — so first paint is never a flash of empty lists. Each module reads **only
its own keys**. Angular builds the route's `EnvironmentInjector` during route _recognition_, so the
reducers exist before the resolver runs.

**One context deliberately opts out**, and the distinction is the point — it is irregular, not merely
verbose: **`commlink`**'s dashboard read-model reads a key _family_ (`loadPrefixed('summary-')`) and
raises the storage-unavailable toast as the single eager boot reader. `office-time` sits between —
descriptor for load + telemetry, its own save, which serializes before writing.

**`groceries` used to be the second opt-out**, and its return is the more interesting half. It
hand-rolled a load reading three keys to emit one atomic `loaded`, plus a prefix-routed save. Both
existed only because the _state_ was shaped wrong: four aggregates that cross-read each other, each
in its own slice and doc, need co-registration, an atomicity trick and prefix-routed writes to behave
as the one thing they already were. Collapsing them into a single `groceries` slice (one
`combineReducers` over the five unchanged aggregate reducers, one `npc-groceries` doc) made its
persistence a plain slice dump again.

> **Pattern — before widening the abstraction, check whether the caller is the wrong shape.** An
> irregular _mechanism_ is often an irregular _model_ in disguise. Absorb plurality (n sources, n
> metrics); refuse genuine special cases. An abstraction that absorbs every exception stops
> describing anything — and one that every caller dodges describes the wrong thing.

The generic mechanics are proven once in `persisted-slice.effects.factory.spec.ts` against a probe
context, replacing 17 per-domain effect specs that tested the same builders through 17 front doors.

### The single-list item flow

Four behaviours every list-backed domain needs — add-from-search with duplicate detection,
add-or-update resolution, search-box reset, query re-sync after a rename — live once in
`@shared/data/item-lists/item-list.effects.factory.ts` as **effect builders**:

```ts
export const tasksListEffects = {
  ...listItemFlow({ actions: TasksActions, select: selectTasksState, create: … }),
  clearSearch$: clearSearchAfter(TasksActions.updateSearch, [ … ]),
  clearFilter$: clearFilterWhenLeavingCategories(TasksActions),   // tracking omits: no categories
};
```

Builders rather than a shared class, and that distinction is the reason they exist: NgRx dedups
same-class instances and route injectors are never torn down, so ONE class registered in two of them
double-dispatches across a transition — which is exactly why `tasks` and `tracking` each carried a
hand-copied version before. It is **not** a line saving (166 → 196); what it buys is one definition
instead of two, and a call site that reads as the list of behaviours a domain has.

The **grocery engine does not use it**: it is a multi-list _router_, so its versions carry a `listId`
the single-list builders cannot know about.

> **Pattern — share the behaviour, not the instance.** When a framework's identity rules make a
> shared singleton unsafe, the fix is a factory, not a copy. Copies drift; a factory cannot.

A route carries neither when there is nothing to hydrate: `/notifications` and `/settings` are lazy
_pages_ over eager slices; `/geist` has **no slice at all**, so the domain is `feature` + `model` +
`util` with no `data/` folder. Which layers a domain has follows from what it owns, not a template.

> **⚠️ Lazy ≠ unloaded on exit.** Ionic's `IonicRouteStrategy` has no `shouldDestroyInjector` and NgRx
> `provideState`/`provideEffects` have no per-injector teardown: a lazy context registers on **first
> visit and persists for the session** — modules are **not** mutually exclusive. Two lazy modules
> listening to the **same action** BOTH fire once both are visited (NgRx dedups same-class, never
> different-class instances), so each such effect must **guard on the target `listId`**
> (grocery ∈ `{_storage,_products,_shopping}`, tasks `=== '_tasks'`, tracking `=== '_tracking'`).
> That guard tax is what motivated moving the dialog open-command off the action bus. "Lazy" here is
> a **boot-cost** win, not memory reclaim.

### Co-registration — retired, the model absorbed it

Co-registration was a _rule_ while the grocery aggregates were separate slices: every grocery route
had to register all of products/shopping/storage (the cross-list search buckets read siblings —
registering only the route's own left siblings `undefined` and crashed the selector, a real, reverted
bug), `/soykaf` had to register more than the lists, and `/groceries/list-settings` deliberately
registered less. Three route-level rules, all protecting invariants of **one** bounded context. The
single `groceries` slice makes them unstateable. `quickadd` stays outside — derived, ephemeral, never
persisted — merged in as a bare reducer with no lifecycle.

> **Pattern — prefer an invariant you cannot express wrongly to a rule you must remember.** The
> co-registration rule was correct and documented, and still cost a reverted crash. Aggregates that
> must be present together are one slice; the rule then has nowhere to be broken.

---

## 5. Persistence

`DatabaseService` (`@shared/util/persistence/database.service.ts`) is a **dumb per-key port** over
`@ionic/storage` (DB `np-commlink`), domain-blind by construction:

- Keys are namespaced `npc-<slice>`; dashboard summaries `npc-summary-<source>`.
- **`bootstrap()`** only initializes — an **init-once guard** (`#ensureStorage`, memoized `create()`)
  so racing callers set up LocalForage exactly once. It performs no read.
- **`load<T>(key)` / `save<K>(key, value)`** are what each context's load/save effect uses for its
  own key — no slice list lives in the service. **`loadPrefixed<T>(prefix)`** is the counterpart for
  a caller owning a whole key _family_ (only commlink's `summary-<source>` docs). All await the guard.
- Versioning is app-level (`APP_VERSION`, `@shared/model/app.consts`), migration per-context: every
  doc is stamped into a `{v,data}` envelope on save and migrated on read by `runMigrations`
  (`@shared/util/persistence/versioned.ts`). A context supplies a `ladder` only when it has a hop to declare —
  the ten always-empty `*.migrations.ts` files are gone. The schema `version` lives in exactly one
  place: the eager `settings` slice (`npc-settings`), seeded on first boot.
- `npc-deck` needs no ladder by construction (§7.1). `quickadd` is ephemeral; the dialogs hold no
  store state. **Fresh-install only** — no migration from the old `np-time-tracker` / kitchen-bot DBs.
- **No cross-module write port.** `npc-notifications` is written by exactly one thing: the inbox's own
  save effect, including on a producer's write — so a producer dispatches and stays ignorant that
  notifications are persisted at all.

> **Pattern — ports & adapters.** The port knows nothing about domains; domains know nothing about
> storage mechanics. **A domain owns its own keyspace** (`commlink/model` exports
> `SUMMARY_KEY_PREFIX`/`summaryKey`); the port just stores bytes under a string.

