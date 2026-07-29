# np-commlink — project summary

The single document for this repo: what the app is, how the parts talk to each other, why each
seam looks the way it does, and what is still open. It absorbs the former `architecture.md`,
`cash-plan.md`, `dashboard-customization-plan.md`, `i18n-plan.md`, `theming-two-themes-plan.md`,
`quality-backlog-shared.md` and `open-tasks.md`.

`CLAUDE.md` is the working guide for day-to-day changes; this file is the reasoning behind it.
Design history (the two-app merge, the DDD re-domaining, the lazy cutover, the sheriff tightening)
lives in the git commit log.

**Contents** — [1 The app](#1-the-app) · [2 Architecture](#2-architecture) ·
[3 Communication channels](#3-the-communication-channels) · [4 Lifecycle](#4-eager-kernel-vs-lazy-contexts) ·
[5 Persistence](#5-persistence) · [6 Cross-cutting capabilities](#6-the-two-cross-cutting-capabilities) ·
[7 Features](#7-the-features) · [8 Theming](#8-theming--two-themes) · [9 i18n](#9-i18n) ·
[10 Testing](#10-testing) · [11 Build & deploy](#11-build--deployment) ·
[12 Open, deferred, blocked](#12-open-deferred-and-blocked) ·
[13 Considered, not built](#13-considered-and-not-built) · [14 Patterns](#14-patterns-named)

---

## 1. The app

`np-commlink` is one Ionic 8 / Angular 21 (standalone, zoneless) / Capacitor 8 app that merges two
former apps — **np-timetracker** (time & office tracking) and **np-kitchen-bot** (groceries /
storage / tasks) — under one Shadowrun "cyberdeck" skin. It ships as a PWA and an Android APK.
There is **no backend**: all state is local (NgRx in memory, `@ionic/storage` on disk).

Structurally it is a **super-app**: a home "deck" (`/commlink`) of independent _programs_, each a
self-contained feature. The architecture's whole job is to keep those programs independent while
still letting the deck — and the handful of genuine cross-feature behaviours — work. That tension
is what every channel in §3 exists to resolve.

### The module map

| Context         | Role                                                     | Lifecycle                      | Reaches others via                                     |
| --------------- | -------------------------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| `@shared`       | shared kernel: library + published contracts             | eager (a library, not a domain) | — (it is the medium)                                   |
| `commlink`      | home deck + the dashboard read-model + the deck catalog  | lazy page, **eager slices**    | reads its own read-model, which suppliers `report` into |
| `tracking`      | time tracking (single-list engine)                       | **lazy**                       | publishes notifications; reports telemetry; receives deep-link CTAs |
| `office-time`   | office-presence dashboard, wordclock                     | **lazy**                       | reports telemetry                                      |
| `notifications` | in-app + OS notification inbox                           | lazy page, **eager slice**     | receives `NotificationsActions` from any producer; deep-links to `/tracking` |
| `groceries`     | shopping + storage + products + SOYKAF recipes (one slice) | **lazy**                     | reports telemetry; provides a list facade              |
| `tasks`         | to-do list                                               | **lazy**, fully sealed         | reports telemetry; provides a list facade              |
| `cash`          | offline multi-account ledger (CREDSTICK)                 | **lazy**                       | reports telemetry                                      |
| `trackplay`     | Shadowrun game-score tracker                             | **lazy**                       | reports telemetry                                      |
| `barcode`       | SIGIL badge image (owns its own slice)                   | **lazy**, fully sealed         | imports nothing, reports nothing                       |
| `settings`      | app-global settings (schema version, theme, language)    | lazy page, **eager slice**     | sealed                                                 |
| `geist`         | GEIST — console onto Chrome's on-device model            | lazy page, **no slice at all** | nothing: no state, no telemetry, no contract           |

The **shell** (`src/app/` root: `AppComponent`, `app.routes.ts`, `app.providers.ts`,
`app-title.strategy.ts`) carries only `type:shell` — no domain tag — so it may compose everything.
That licence is exactly why it composes as little as possible.

---

## 2. Architecture

### 2.1 The two forces

1. **Bounded contexts, sealed by Sheriff (compile time).** `domain:* → sameTag + domain:shared`,
   with **zero** explicit bridges. A feature simply cannot reach another feature by `import`.
2. **Nearly every bounded context is lazy (runtime).** A slice, its effects and its component code
   register only when you navigate to its route — so at runtime a feature usually isn't there to be
   read either.

Together: **a feature is normally neither importable nor present.** Every legitimate cross-feature
interaction goes through one of the five channels in §3.

> **Pattern — "shared means domain-agnostic."** `@shared` is a _library_, not a domain. Anyone may
> import it; it knows nothing about any specific feature (no `state.shopping`, no `switch(listId)`).
> It holds generic mechanics plus the **published contracts** features use to talk.

### 2.2 Folder layout (Hahnekamp-style, Sheriff-enforced)

Domain-first, sliced by type; every dir carries `domain:*` + `type:*`, derived from the two path
segments `src/app/<domain>/<type>` (`sheriff.config.ts`).

```text
src/app/
  app.component.ts / app.routes.ts / app.providers.ts / app-title.strategy.ts   ← type:shell

  @shared/                                            ← domain:shared
    model/   app.types.ts (primitives) + one file per shared concern:
             base-item · category · item-list · notifications · dashboard · settings · app.consts
    data/    actions/ (DashboardActions · NotificationsActions · item-list.actions.factory) ·
             effects/ (persisted-slice + item-list *.factory.ts) ·
             persisted-context.provider · boot-hydration.provider · module-hydration.resolver
    util/    db/ · list/ (list.utils · list.selector · LIST_FACADE) · categories/ · charts/ ·
             item-dialog.service · theme.service · language.service · splash.service ·
             form-rules · date-format.utils · language-model.service · pipes
    ui/      base-item/ · categories/ · forms/ · page-header/
    feature/ list-page · edit-item-dialog + modal-dialog (the two dialog bases) · edit-categories-page
    testing/ test-data.ts (deterministic factories) · test-providers.ts        ← type:testing

  commlink/ tracking/ office-time/ notifications/ barcode/ settings/    ← timetracker domains
  groceries/            ← shopping + storage + products + recipes (SOYKAF), one slice
  tasks/ cash/ trackplay/                                              ← one domain each
  geist/                ← feature + model + util only; NO data/ layer (holds zero NgRx state)
```

Inside every `<domain>/data/`, files are sliced by **NgRx role** so all eleven data layers read the
same way:

```text
<domain>/data/
  actions/    <slice>.actions.ts
  reducer/    <slice>.reducer.ts (+ .spec)
  selectors/  <slice>.selector.ts (+ .spec)
  effects/    <slice>.effects.ts, or <slice>-<role>.effects.ts once a slice has more than one
  <x>.facade.ts · <domain>.providers.ts · index.ts        ← the DI-facing root
```

Two rules keep that honest:

- **`data/` holds no pure logic.** A `<slice>.utils.ts` importing no `@ngrx` is not data — it lives
  in the domain's own `<domain>/util/` and consumers reach _down_ (`data → util`, a legal edge).
- **Shared-ness is a property of who imports a thing.** `notifications.transforms` lived in
  `@shared/util` from when the inbox had two write paths; once the second was deleted both importers
  were in `notifications/data`, so it moved home. Re-check whenever a second consumer goes away.

### 2.3 Sheriff dependency rules

- **Domain axis:** `domain:* → sameTag + domain:shared`. No exceptions. The old bridges are all
  gone: `shopping↔storage` and `shopping/storage→products` became _intra_-`groceries` (`sameTag`);
  `notifications→tracking` and `commlink→{notifications,office-time}` were **inverted** onto the §3.2
  contracts; and `barcode→office-time` disappeared when the SIGIL badge moved into `barcode`'s own
  slice. Verify with `pnpm exec sheriff verify src/main.ts`.
- **Type axis:** `routes → feature/data/util` · `feature → smart-ui/ui/data/util/model` ·
  `smart-ui → ui/data/util/model` · `ui → util/model` · `data → util/model` · `util → model`.
  `type:testing` may reach any layer, but only `*.spec.ts` may import it.
- **`smart-ui` is a strict leaf** (no `sameTag`): a smart component composes dumb `ui`, never another
  smart component — composing stateful components is orchestration and belongs in `feature/`. Hence
  the `edit-*-item-dialog` wrappers live in `<domain>/feature/`, and `categories-dialog` is rendered
  by those wrappers rather than nested inside `category-input`. **`@shared` has no `smart-ui` layer
  at all** — its last inhabitant became a dumb `ui` component when the `itemDialogs` slice retired.
- **Each `<domain>/data/` is a facade barrel** (`index.ts`): outside code imports the folder and sees
  only the action group, published selectors, the `<domain>Context` bundle and any `ListPageFacade`.
  Reducer, effects and internal selectors are encapsulated; a deep import is a violation. Every
  other layer is barrel-less (`enableBarrelLess: true` — per-folder, not global), so an import line
  names the vocabulary it uses rather than the folder.
- **`@shared/data` is the deliberate exception — it stays barrel-less.** The barrel pattern seals a
  _domain_ behind its context bundle; `@shared/data` has no slice of its own to seal. What remains
  there is a library of unrelated helpers with no single public API, so it keeps self-documenting
  deep imports (`@shared/data/actions/…`, `@shared/data/effects/…`). Sub-folder barrels aren't an
  option either: the Sheriff `modules` glob is one level deep.
- **`@shared` is layered downward.** `@shared/data` holds only what is genuinely NgRx: the two
  published contracts (both **write-only**, so there is no `@shared/data/selectors` — the kernel
  names no domain's store key), the shared `item-list` event map, and the generic per-context
  load/save/telemetry **effect builders**. The list engine's pure logic, `ItemDialogService`,
  `LIST_FACADE` + `IListPageFacade` sit a layer down in `@shared/util`.

### 2.4 Routing

Hash routing (`withHashLocation()`). **`app.routes.ts` is a `path → loadChildren` table that names
no domain internals.** Each domain publishes `<domain>/routes/<domain>.routes.ts`, tagged
`domain:<domain>` + **`type:routes`**, owning that domain's paths, titles, context spread, facade
bindings and `loadComponent`s.

```text
// app.routes.ts — type:shell
{ path: 'cash', loadChildren: () => import('./cash/routes/cash.routes').then((m) => m.cashRoutes) }

// cash/routes/cash.routes.ts — domain:cash + type:routes
export const cashRoutes: Routes = [{
  path: '',
  ...cashContext,                        // providers (state + effects) + resolve (hydration)
  children: [
    { path: '',      data: { title }, loadComponent: () => import(...) },
    { path: 'rules', data: { title }, loadComponent: () => import(...) },
  ],
}];
```

Three properties fall out of that shape:

- **The domain data layers leave the initial chunk.** A static import of eleven `data` barrels at
  the root put every reducer, effect and facade in the initial bundle. The `loadChildren` edge is
  now the only shell→domain import: 1.48 → 1.40 MB raw, 42 → 34 initial chunks. Over the wire ≈ 0
  (the service worker prefetches `/*.js`, the APK ships every chunk on disk) — what it buys is
  ~80 kB less JS _evaluated at boot_, plus the seal.
- **A domain's routing is sealed.** Sheriff resolves imports through `ts.preProcessFile`, which
  reports dynamic `import()` too, so a `loadComponent` reaching another domain fails `verify` —
  impossible to catch while the table lived in the domain-less shell. The manifest deliberately is
  **not** in `feature/`: `type:feature` has no `sameTag`, so loading a sibling page from there would
  need that tightened rule re-opened.
- **The context sits on the subtree root, once.** A componentless parent carries
  `...<domain>Context` for all its pages and Angular reuses a parent whose params don't change — so
  `cash → cash/rules → cash/report` dispatches `[Cash] load` **once** (4× before). Every domain owns
  a URL prefix, which is what makes that possible.

**Every path is a domain prefix.** Root entries: `commlink` (+ `/commlink/deck`), `tracking`,
`data/:listId`, `office-time` (+ `/settings`), `settings`, `barcode`, `notifications`, `geist`,
`soykaf`, `groceries/*`, `tasks/*`, `cash/*`, `trackplay/*`; `**` → `commlink`. Grocery pages live at
`groceries/{shopping,storage,products,categories}/:listId` + `groceries/list-settings`; the tasks
catalog at `tasks/categories`. A domain orders its own pages (`cash/rules` before `cash/:accountId`).
Only `/soykaf` and `/data/:listId` deliberately don't read as their folder — they are deck programs,
product surfaces rather than structure. **Old pre-prefix URLs are not redirected.**

`/commlink/deck` (the deck configuration) is reached from `/settings` by a **link**, not a route
nesting: `settings → commlink` is a domain violation, so the page that edits the deck lives under
the deck's owner.

Titles come from `data.title` on the leaf route + `AppTitleStrategy` (deepest wins).

### 2.5 State — NgRx sealed behind per-domain facades

**No `@ngrx` import lives outside `data/`.** Every dispatch and read goes through an
`@Injectable({providedIn:'root'})` **`<Domain>Facade`** — the only place `Store` is injected for
that domain's consumers. It exposes state as `selectSignal(...)` signals (route-parameterised reads
as factory methods) and commands as `dispatch(...)` methods.

Enforced by an eslint `no-restricted-imports` ban on `@ngrx/*` across `src/app/**`, re-enabled only
in `app.providers.ts` (the eager-kernel composition), `**/data/**`, the test kit and `*.spec.ts`.

> **Pattern — facade + architectural fitness function.** Don't rely on discipline to keep the store
> inside `data/` — make the boundary _fail closed_, the same idea as a trust boundary in infra.

**Three facade file shapes, one rule: the `-page` suffix encodes a token binding, not page-ness.**

| Shape                        | Means                                            | Examples                                                                                                            |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `<domain>.facade.ts`         | the domain's general facade                      | `TrackingFacade`, `CashFacade`, `TrackplayFacade`, `BarcodeFacade`, `OfficeTimeFacade`, `NotificationsFacade`, `SettingsFacade`, `DashboardFacade`, `DeckFacade` |
| `<aggregate>-page.facade.ts` | implements a shared page **token** (`LIST_FACADE` / `CATEGORIES_FACADE`) | `GroceryListPageFacade`, `TasksListPageFacade`, `TrackingListPageFacade`, `Grocery/Tasks/CashCategoriesPageFacade`  |
| `<aggregate>.facade.ts`      | an aggregate facade binding no token             | `RecipesFacade`, `ListSettingsFacade`                                                                               |

The first token follows the **aggregate**, not the domain folder: `GroceryListPageFacade` matches the
`grocery-list` engine, not the `groceries` domain. `tracking` is the one domain carrying both shapes
— the list binding, plus a `TrackingFacade` for the timer/archive/stats/CSV surfaces that are not
list concerns.

**Facades are root singletons** — a component spec overriding a selector between two
`createComponent` calls must `store.refreshState()` (the signal is shared, not per-instance).

**There is no root-state type.** `IAppState` was deleted. Every slice is read through its own
`createFeatureSelector<ISliceState>('key')` and every facade injects the bare `inject(Store)`. A
complete root type is impossible by construction: the eager slices are domain-owned (Sheriff bars
`@shared/model` from naming a domain type), every other context is lazy, and `main.ts` may not
import `type:model` at all. The only survivor is the test kit's `TMockKernelState`/`TMockState`,
honestly scoped to what `provideMockStore` seeds.

> **Pattern — no global schema.** A type enumerating everyone's state re-couples the modules you
> just sealed. When a boundary makes a "complete" global type _impossible_, that's the design telling
> you the type shouldn't exist — not that it needs an exception.

**Action-group event keys are camelCase identifiers, not quoted title-case strings** — `addItem:`,
never `'Add Item':`. `createActionGroup` camelCases either way, so creator names are identical; what
changes is the generated `type` (`[Source] addItem`), which makes an action greppable by the one name
it has. **Nothing may match on that string** — use the creator (`ofType(Actions.addItem)`,
`case Actions.addProduct.type:`). Parsing the _source_ prefix is still fair game (`listIdByPrefix`
reads `[Storage]`), since that is a slice identity rather than an event name.

**One multi-list engine + shared single-list helpers.** `groceries`' `grocery-list.*` files are the
multi-list engine (source `[GroceryList]`) — `selectListState` derives the active list from the
`:listId` route param. The single-list domains (`tracking`, `tasks`) have **no** engine: each owns
its slice and builds its list flow on the domain-blind `@shared/util/list` helpers, driving the
shared `ListPageComponent` through its own `*ListPageFacade`.

### 2.6 Dialogs — a signal host, not a store slice

**No dialog state lives in NgRx.** The draft is a component-local `linkedSignal` in the wrapper, and
the _open-command_ (which item, which list, which mode) is one nullable signal on the root
`ItemDialogService` (`@shared/util/item-dialog.service.ts`, no `@ngrx` import — which is why it sits
in `util`).

It used to be the eager `itemDialogs` slice. The store was the wrong primitive for transient,
never-persisted state, and it charged rent: a duplicated `listId` guard in **every** lazy
orchestrator effect (effects are never torn down, so each saw every sibling's dialog actions), a
two-hop action round-trip per open whose only output was two label strings, and a per-domain selector
+ facade signal purely to cast `IBaseItem` back to a domain type. Every open path already started in
a facade method holding its list state as a signal, so the seed item is now built synchronously there
and the three `*-item-dialogs.effects.ts` files are gone, guards and all. `open()` **copies** the
item, which is what makes the `linkedSignal` draft reseed when a row is reopened after an aborted
edit.

> **Pattern — pick the primitive by lifetime, not by habit.** A global store earns its keep for state
> that is shared, persisted or replayed. `signal` + `computed` was the whole requirement here.

**Two dialog lifetimes → two sibling bases in `@shared/feature/`:**

|             | `BaseEditItemDialog`                                     | `BaseModalDialog`                             |
| ----------- | -------------------------------------------------------- | --------------------------------------------- |
| Opened      | declaratively — always mounted, `[isOpen]` off the host  | imperatively — `ModalController.create()`     |
| Draft       | `T` (never absent; "closed" is `isOpen` alone)           | `TForm`, a **view-model**, only exists while open |
| Seeded from | the host's open-command                                  | a `componentProps` id → `existing` lookup     |
| Used by     | the list-item dialogs (grocery / tasks / tracking)       | cash + trackplay (7 subclasses)               |

Forcing both through one base would mean `Partial<TForm | undefined>` to save six trivial lines.
`BaseModalDialog` removed the skeleton nine components had each hand-written; its id is a **signal**
behind a domain-named setter (Ionic's `componentProps` does a plain property write), which makes
`existing`/`draft` reactive and means **no dialog implements `OnInit`**. Its `TForm` is deliberately a
view-model, not the entity — these dialogs edit mapped fields (a signed amount as magnitude +
direction), so the subclass supplies `toForm` in and `persist` out.

**Every dialog in the app is on Signal Forms.** For the list dialogs the **base owns the field
tree**: `BaseEditItemDialog` declares `form(this.draft, …)` carrying `requireUniqueName`, and the six
wrappers supply only a `blank()` plus the `siblings` the rule compares against. An invariant every
subclass must hold is not a subclass's decision — six wrappers each declaring their own `form()`
meant a seventh that omitted it would have _compiled_, permanently saveable. Two consequences: a
generic `T` defers the mapped path type, so the base narrows `path` once via `T extends IBaseItem`;
and an `extraRules` hook would have to be a prototype **method**, since a field wouldn't exist when
`form()` evaluates its schema eagerly. `blank()` delegates to the domain factory
(`createRecipe('')`, …) rather than re-listing defaults — two of the six hand-written copies had
already drifted.

**The `siblings` a name rule reads must be the whole aggregate, never a page's view of it.** Four
wrappers fed it `select*ListItems`, which apply the page's search query and category filter — so a
search term left in the box shrank the sibling set and a duplicate saved. Each list now publishes an
aggregate read beside its page view (`selectStorageItems`, `selectProductItems`, `selectTaskItems`,
…), and the vestigial per-list page-view selectors are deleted.

That retired the app's **last reactive-forms usage**. `app-item-name-input` is now a
`FormValueControl<string>` that renders whatever the bound field reports, and the shared modal shell
takes `[nameField]` + a **required** `[canSave]` (optional-with-`false` would turn a forgotten
binding into a permanently dead Save button instead of a compile error). Its message is an
`<ion-note class="sr-field-note">` of its own, **not** `ion-input`'s `errorText`: Ionic renders that
only while the host carries `ion-invalid ion-touched`, and those classes come exclusively from
`@ionic/angular`'s `ValueAccessor`, which needs an `NgControl` on the `ion-input` itself. A custom
control also reports `touched` only through an output literally named **`touchedChange`**.

The `BaseModalDialog` subclasses declare `form(this.draft, <slice>Rules)` — which _projects_ the
draft signal instead of copying it, so the base's reseed still reaches validity — and the base
derives **`canSave = form().valid()`**, so no dialog re-states its schema in a hand-written
conjunction. Controls bind `[formField]` through the CVA every `@ionic/angular` control ships; the
app's three custom widgets (`app-money-input`, `cash-category-picker`, `app-date-input`) are
`FormValueControl`s exposing state as a `value` **model** — that name _is_ what `[formField]` writes
through, and an `input()`/`output()` pair instead makes `FormField.ɵngControlCreate` throw `NG1914`.
Money is never a form string: `app-money-input` is a `FormValueControl<number | null>` over integer
**cents** using `transformedValue({parse, format})`, which sets the model _before_ writing raw text
back, so the box is never reformatted mid-keystroke. One field stays imperative (`patch()`): the rule
builder's field select, which drives two at once.

Three rules are shared in `@shared/util/form-rules.ts`: `requireText` (whitespace-aware — the
built-in `required()` counts `'   '` as present while every `persist()` trims), `requireUniqueName`
(takes `siblings`/`editing` as **thunks**, because `form()` evaluates a schema eagerly, before the
fields they read exist) and `requireParseableDate` (a cleared date box would otherwise persist the
_string_ `'Invalid Date'`, which sorts above every real date and can never be reconciled).

Left on plain `ModalController`: `cash/…/reconcile-modal`, `cash/…/import-preview-modal` and
`trackplay/…/game-settings-popover` — confirm/preview/popover surfaces with no entity to edit.

---

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
- **`NotificationsActions.toast({ key, params?, color? })`** — the same contract's _transient_ event,
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

### 3.3 DI contracts: `LIST_FACADE` and `CATEGORIES_FACADE`

How one generic component serves several domains without knowing them. The generic
`@shared/feature/list-page` `inject()`s a `LIST_FACADE` token; each domain **provides** its own
implementation at the route:

```text
list-page (generic, domain-blind)
   └─ inject(LIST_FACADE)
        ├─ GroceryListPageFacade    (multi-list engine: route-param → active list, cross-list buckets)
        ├─ TasksListPageFacade      (trivial single-list)
        └─ TrackingListPageFacade   (tracking-flavoured; no categories → [hasCategories]="false")
```

Tracking is category-less, so its facade returns `[]`, its category-mode operations are no-ops, and
the page suppresses the quick-add, display-mode toggle and category dialog. Its tracking-only chrome
is content-**projected** into the shell's `[toolbarActionsEnd]`, `[searchExtras]` and `[headerEnd]`
slots.

Why a token and not a selector? **NgRx selectors can't read DI**, so a `listId → selector` registry
can't live inside a pure selector. A facade is a _service_ — it can hold `store.selectSignal(...)`.
Grocery-only operations (`addProduct`, `showCreateProductDialog`) are deliberately _off_ the shared
contract and live only on the concrete facade — putting them on it would force `tracking` to
implement operations it has no concept of.

The **manage-categories page** applies the pattern a second time: the domain-blind
`@shared/feature/edit-categories-page` injects `CATEGORIES_FACADE` (the catalog decorated with
per-list counts, `add`/`rename`/`remove`, `listTitleKey`/`listHref`, `drillTo(id)`). Grocery, tasks
and cash provide it at their own routes; the shared component is mounted directly, no per-domain
wrapper. **Category→items drill:** `drillTo` navigates to the owning list with `?filter=<categoryId>`,
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
(`@shared/util/global-error-handler.ts`): `provideBrowserGlobalErrorListeners()` and a
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

One descriptor (`@shared/data/persisted-context.provider.ts`) now names what a context owes the
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
`@shared/data/effects/item-list.effects.factory.ts` as **effect builders**:

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

`DatabaseService` (`@shared/util/db/database.service.ts`) is a **dumb per-key port** over
`@ionic/storage` (DB `np-commlink`), domain-blind by construction:

- Keys are namespaced `npc-<slice>`; dashboard summaries `npc-summary-<source>`.
- **`bootstrap()`** only initializes — an **init-once guard** (`#ensureStorage`, memoized `create()`)
  so racing callers set up LocalForage exactly once. It performs no read.
- **`load<T>(key)` / `save<K>(key, value)`** are what each context's load/save effect uses for its
  own key — no slice list lives in the service. **`loadPrefixed<T>(prefix)`** is the counterpart for
  a caller owning a whole key _family_ (only commlink's `summary-<source>` docs). All await the guard.
- Versioning is app-level (`APP_VERSION`, `@shared/model/app.consts`), migration per-context: every
  doc is stamped into a `{v,data}` envelope on save and migrated on read by `runMigrations`
  (`@shared/util/db/versioned.ts`). A context supplies a `ladder` only when it has a hop to declare —
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
  `IDashboardSummary` types (`commlink/model`), the `summary-` keyspace, the `mockDashboardState`
  fixture (`commlink/testing`) — lives in **`commlink`**, because the deck and the shell badge are its
  only two readers. Sharing the whole slice would have put a
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

---

## 7. The features

### 7.1 The deck catalog — one configurable list behind the grid AND the side menu

`DECK_CATALOG` (`commlink/model/deck.catalog.ts`) is every navigable destination: the 13 deck
programs plus two menu-only rows (the deck's own home link, `/groceries/list-settings`). `CommlinkPage`
and `app.component.html` both render from it via `DeckFacade`, neither holding a list of its own.

**It is `commlink`'s.** A domain owns the routes it _serves_; it has no opinion about appearing in
navigation, under what codename, at which grid position — `groceries` knows nothing about being
MARKET, seventh, with a cart icon. Per-domain entry manifests would also have forced the shell to
import all eleven domains eagerly, undoing the `loadChildren`-only seal. It costs no new coupling
either: the shell already imported exactly one domain (`DashboardFacade`). And the catalog is the
static twin of a read-model commlink already owns — the read-model is _what each program reports_,
the catalog is _which programs exist, in what order_.

```ts
type IDeckEntry = {
  id: TDeckEntryId;        // stable — persisted config references it; never renamed
  module: TAppModule;      // coarse: 'groceries'. NOT the per-aggregate telemetry `source`
  icon: string;
  route: string;
  titleKey: TMarker;       // the *page's* title — the toolbar's, not the menu row's
  labels: Record<TTheme, { nameKey: TMarker; descKey: TMarker }>;
  onDeck: boolean;         // false for menu-only entries
  source?: string;         // telemetry badge
  metric?: string;
  metricKey?: TMarker;     // the badge's accessible name
  status?: TProgramStatus;
  needsLanguageModel?: boolean;
};
```

`module` is a **foreign key, not a tree** — a nested catalog buys nothing `groupBy(module)` in the
config UI doesn't. Note the two granularities: telemetry `source` is per _aggregate_ (`shopping`,
`storage`), `module` per _domain_ (`groceries`) — which is why there must never be a second spelling
of `'groceries'` in the catalog.

**Persisted state (`npc-deck`, eager) is three id lists, and absence means default:**

```ts
interface IDeckState {
  order: TDeckEntryId[];
  hiddenEntries: TDeckEntryId[];
  hiddenModules: TAppModule[];
}
```

`order` is a **list, never an `order: number`** — a number is a denormalized sequence needing
renumbering on every drop, tolerating gaps, and letting two entries claim `3`. A list _is_ the order,
and `ion-reorder-group` hands over `from`/`to`, which is one array move. Nothing copies the catalog:
a new program missing from `order` is appended in catalog order, missing from `hiddenEntries` is
visible, and a removed program's stale id is ignored at read time — so growing or shrinking the
catalog needs **no migration hop at all**. The one change that would is _renaming_ an id.

**The module flag cascades at read time and is never written into children:**
`visible(entry) = !hiddenModules.has(entry.module) && !hiddenEntries.has(entry.id)`. Writing `false`
into children on a module toggle would flatten whatever the user configured underneath, and
re-enabling could not restore it.

**Labels — theme is an axis of the key.** Codenames change with the theme, so the catalog carries no
single label: each entry declares `labels: Record<TTheme, {nameKey, descKey}>` of `marker(...)`
literals that `resolveLabels` indexes by `ThemeService.theme`. Spelled out rather than composed,
because a composed key is invisible to `i18n:extract --clean` (§9) — and the `Record<TTheme, …>`
annotation makes a third theme a **compile error at all 15 entries** instead of a raw key on screen.

**Both** surfaces render the resolved `nameKey`, so a menu row and its tile can never disagree;
`titleKey` (`page-title.*`) stays the _page's_ title. Splitting them is what stops the menu listing
"Einstellungen" twice — `/settings` and `/groceries/list-settings` share a title but have distinct
names.

Reading the theme without importing `settings` (a Sheriff violation): `@shared/util/theme.service`
exposes a readable `theme` signal beside the `apply()` that writes `<html data-theme>`. Settings
**drives** the theme; anyone may **read** it — the same arrangement as `LanguageModelService`. That
also rules out a `| deckLabel` pipe: a _pure_ pipe caches on input identity and wouldn't re-run when
only the theme signal changed, and an _impure_ one is the pre-signals idiom. `hex` stays a pipe — its
input is the index, which does change on reorder. It is display only: `$index | hex`, so the top tile
always reads `0x01`.

**Surfaces.** One `order`/`visible` pair drives grid and menu — hiding removes from both. Routes stay
reachable; hiding is a navigation choice, not access control. **The one exception is `SYSOP`:** it
stays an ordinary hideable entry, and the menu toolbar carries a **permanent settings icon button**
— without it, hiding SYSOP would hide the only door back to the page that un-hides it. **The status
strip keeps the full denominator** (`N / 13 PROGRAMS LOADED`, `DECK_SLOT_COUNT`): a hidden-but-online
program still counts, because hiding a program is not an uninstall.

Config page: `commlink/feature/deck-config-page/` at `/commlink/deck`, linked from `/settings` —
module toggles first, then the flat entry list with `ion-reorder-group`, rows dimmed while their
module is off.

### 7.2 groceries — one context, five aggregates

`shopping`, `storage`, `products`, `recipes` and `listSettings` are aggregates of a **single**
`groceries` slice (one `npc-groceries` doc, one `[Groceries] load/loaded`). They freely import each
other (`sameTag`) — searching shopping reads the products catalog, the cross-list "copy to
shopping/storage" rules read siblings. That _is_ the intra-context coupling the DDD refactor wanted:
honest coupling inside one boundary, not three fake-independent domains. The multi-list engine
(`grocery-list.*`) and its effects ride in `groceriesContext` and guard on
`listId ∈ {_shopping,_storage,_products}`.

Renames vs kitchen-bot, to avoid timetracker collisions: store keys `settings→listSettings`,
`dialogs→itemDialogs`; action sources `[Settings]→[ListSettings]`, `[ItemList]→[GroceryList]`; types
`ISettings→IListSettings`, `IEditItemState→IItemDialogState`. The freed bare `settings`/`[Settings]`
names became the app-global version+theme+language slice.

**SOYKAF, the recipe book** — a fourth grocery aggregate, not a domain of its own: a recipe is
expressed in the grocery vocabulary (ingredient lines _reference_ `_products` catalog ids, "do I have
it" _is_ `_storage`), so the matcher reads its siblings via `sameTag`. Files:
`actions/recipes.actions.ts` · `reducer/` · `selectors/` · `recipes.facade.ts`, plus the pure matcher
in `groceries/util/recipe-match.utils.ts`. Telemetry `source: 'recipes'` + `createMetric('count')`,
which flipped the SOYKAF tile standby→online. The page is `groceries/feature/recipes-page` (+
`edit-recipe-dialog`) at the unchanged `/soykaf` path — **route path ≠ folder**, and the `kitchen`
domain is deleted. It deliberately does **not** ride `ListPageComponent`: its rows carry a match
verdict, not a name and a swipe. `IProduct.alwaysOnHand` (optional, so no migration) keeps staples
out of the missing count.

**Both halves of the match are id-based.** The recipe half always was; the storage half became so
when `IStorageItem`/`IShoppingItem` gained an optional `productId` (`TProductLinked`) that the copy
factories stamp and carry across every hop — product→storage, product→shopping→storage (the common
one: buy, then move the bought rows), storage→shopping. Before it, the storage side resolved
`productId → product.name → a row with that name`, so renaming a product silently broke "do I have
it". The name comparison **stays as a fallback**: the field is legitimately absent two ways — a row
typed straight into the pantry was never a product, and rows persisted before it have none — which is
what keeps the fix migration-free.

### 7.3 cash — CREDSTICK, an offline multi-account ledger

An offline, EUR, multi-account personal-finance ledger. **Purpose-built** — it deliberately does not
ride the grocery `IItemList` engine: signed money, opening balances, reconciliation and ordered
filter rules don't map onto a category-bucketed item list. **All phases P0–P5 are complete and on
`main`** (accounts overview, transactions, categories + rules + categorization engine, per-bank CSV
import + reconciliation, transfers + reporting).

**Design principles.** Integer cents, never floats (`…Cents: number`, `< 0` outflow, `> 0` inflow;
formatting to `12,34 €` happens only at the view edge). Offline-first (`npc-cash`, persisted on any
`[Cash]` action). Multi-account: account balance = `openingBalanceCents + Σ signed txn amounts`, net
worth = Σ balances. **Manual override wins** — auto-categorization must never clobber a hand-set
category.

| Type                   | Role                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ICashAccount`         | `giro`/`creditcard`/`savings`/`cash`; `openingBalanceCents` as of `openingDateISO`; optional `bank` (`TBank`) selecting the CSV import parser                  |
| `ICashTransaction`     | signed `amountCents`; `source`; `status`; `categoryId` + `categoryManual`; `description` (the bank's counterparty + purpose joined — display text and rule-matching text in one, and what the import dedup key is built from); `matchedTxnId`, `isTransfer`, `transferGroupId`, `importBatchId` |
| `ICashRule`            | email-style filter: ordered, `match` (`all`=AND / `any`=OR), `conditions[]`, assigns `categoryId`. First match wins                                            |
| `ICashFilterCondition` | `field` (`description`/`amount`) · `op` · `value` · `caseSensitive?`                                                                                           |

**Categorization engine.** Rules sort by `order`; the **first** whose conditions match stamps its
`categoryId`. A transaction with `categoryManual: true` is **shielded** — rule re-runs skip it, so a
hand-set category survives future imports and rule edits. The matcher is a **pure function in
`cash/util/`** (`categorize(txn, rules)` + `matchesCondition`), called from both "Apply rules" and
the post-import auto-run — never from a component or effect. For `field: 'amount'` the ops are
numeric (`eq|lt|lte|gt|gte`) against the **signed** `amountCents` (so `lt 0` = outflows) with `value`
parsed by `eurToCents`; string ops are valid for `description` only, and `regex`/`contains` on
`amount` is rejected at rule-save time.

**Money parsing takes the language explicitly.** Display flows through the `moneyEur` pipe →
`formatEur(cents, locale)` — one seam, so a language switch re-localizes everything. Parsing could
**not** be centralized, because the two conventions are mutually ambiguous: `12,34` read as English
is a valid grouped amount (1234 €), so nothing can be rejected and the language is a required
decision at every call site. Two call sites must _not_ follow the UI: a German bank's CSV export is
German whatever the UI says, and a persisted rule threshold is normalized onto German on save so a
switch cannot re-interpret existing rules. `eurToCents` is integer-cent-safe (no float multiply):
strip sign/`€`/whitespace, `.` = thousands and `,` = decimal for `de`, take ≤2 decimal digits,
`cents = sign * (int * 100 + dec)`; empty/NaN/stray separator → `null`.

**Balances are order-independent** — pure sums, no chronological pass; a credit-card balance is
naturally negative and nets correctly. **Reconciled-away legs are excluded**
(`Σ over txns.filter(t => !t.matchedTxnId)`) or the spend double-counts; the same filter plus
`!isTransfer` gates the reporting selectors (`isReportable`). Display order is `dateISO` desc; a
running-balance column, if ever added, must accumulate chronologically ascending with a stable
tiebreak (`dateISO`, `createdAt`, `id`).

**Reconciliation.** A manual card spend is created `status: 'pending'`. Candidates for it: same
`accountId`, **equal** `amountCents`, `dateISO` within **±3 days**, not already matched. The user
confirms — **never auto-merge**, because an equal-amount coincidence (two identical fares) would
corrupt the ledger. On confirm the imported txn survives, the manual leg's `matchedTxnId` points at
it, and a hand-set category is carried over. **Reversible:** the survivor row (tagged
`reconciledManualId` by `selectTransactionsForAccount`) offers a start-swipe "detach" →
`unreconcileTransaction`, which clears `matchedTxnId` and restores `pending`.

**Transfers.** Two legs flagged `isTransfer: true`, linked by `transferGroupId` — **not**
`matchedTxnId`, which already means "reconciliation survivor" and would overload two unrelated
relations onto one field. `bookTransfer` builds both atomically via the pure `cash/util/transfer.utils.ts#buildTransferLegs`
(equal magnitude, one `< 0` / one `> 0`, shared group id); deleting either leg deletes the group.
Transfers stay in balances but are excluded from spend/income totals.

**Import — per-bank parsers, not a generic column-mapper.** An account's `bank` **implicitly selects
the parser**, which is simpler for the user and lets each parser own its bank's quirks.
`cash/util/import/`: `bank-parser.ts` holds the contract `IBankParser { bank; label; parse(text): IParseResult }`
plus the primitives every parser shares (`splitLines`, `splitRow`, `findHeaderIndex`,
`germanDateToISO`, `joinDescription`); `bank-parsers.ts` is the **registry** —
`BANK_PARSERS: Record<TBank, IBankParser>`, `BANK_OPTIONS`, `parserForBank`, so a third bank is one
entry there plus a new `*.parser.ts`. A parse returns `{ rows, rejected }`, not a bare array:
`rejected` counts data rows below the header whose date or amount was unreadable, because a partial
import that reports success leaves the balance wrong with nothing to notice it by. Parsers:
`volksbank.parser.ts`, `dkb.parser.ts` (keeps only `Gebucht` rows; counterparty = whichever of
payer/payee is set). Reference exports: `docs/cash/example.csv` (Volksbank),
`example2.csv` (DKB) — both `;`-delimited, `DD.MM.YYYY`, German amounts, header row first. Flow: pick
a `.csv` → `file.arrayBuffer()` → `read-csv.ts#decodeCsv` (strict UTF-8 first, **Windows-1252
fallback** when the bytes aren't valid UTF-8 — real Volksbank exports often are CP1252) → parse →
the pure `planImport(...)`, which **dedups** on the natural key
`` `${accountId}|${dateISO.slice(0, 10)}|${amountCents}|${description}` `` (against existing
_imported_ txns and within the batch) and auto-categorizes → a preview modal → one bulk
`importTransactions` action (one persist). The date is keyed on its `YYYY-MM-DD` prefix **only**:
`dateISO` is a local-midnight ISO whose offset (`+01:00`/`+02:00`) shifts with the device timezone,
so keying on the full string would defeat dedup after a DST or timezone change and re-import the
whole batch. The plan carries `rejected` through as well, so the preview can say an import was short
instead of reporting it as complete.

**Reporting** (`cash/report`, a static route before `:accountId`): `selectReportTotals` /
`selectMonthlyTotals` / `selectSpendByCategory` feed a totals strip, an income-vs-spend monthly bar
chart and a spend-by-category doughnut, via `ng2-charts` + `chart.js`.

**Scope guards (non-goals):** EUR only, no multi-currency or FX. Offline only — no backend, no sync,
no bank API (FinTS/HBCI); import is a manual file drop.

### 7.4 tasks, tracking, barcode, office-time, trackplay, geist

- **`tasks`** — the sealed twin. Reuses the same list UI but shares **no data** with groceries: its
  own switch-free copy of the list effects, its own `TasksListPageFacade`, `@shared` as its only
  dependency. It proves the kit is genuinely generic. It dropped its vestigial quick-add entirely.
- **`tracking`** — single-list engine over `state.tracking`, plus a `TrackingFacade` for the timer,
  session archive, stats view and CSV export. Publishes into the inbox and receives deep-link CTAs
  (§3.2, §3.4); its former standalone item-list engine + `dialogs` fork were folded onto the shared
  mechanics (the last timetracker×kitchen-bot merge-duplicate).
- **`barcode`** — SIGIL, an uploaded badge image, in its **own** `barcode` slice (`npc-barcode`),
  hydrated by its own resolver. Imports no domain and reports no telemetry (a deck tile with no live
  metric). Until sheriff-tighten the badge lived in the `officeTime` slice; moving it home deleted the
  app's last cross-domain import. **Not to be confused with** `groceries/util/barcode-scanner.service.ts`
  — the mlkit EAN-13 camera scanner behind a native-guarded scan button on the shopping/storage
  pages, which is why it lives in `groceries`, not `@shared`.
- **`office-time`** — office-presence dashboard + wordclock. Despite what early plan drafts proposed
  it does **not** read tracking; it is standalone and only reports telemetry. One `officeTime` slice
  (a second feature-flag slice was removed as dead code once the settings re-scope left it holding
  one unread flag). It persists dayjs date maps as strings, hence the `TStored ≠ TState` split.
- **`trackplay`** — Shadowrun game-score tracker. Its imperative edit modals live in
  `trackplay/feature/` (smart-ui cannot reach the shared `BaseModalDialog`). Its undo toast keeps its
  own `ToastController` (§3.2).
- **`geist`** — a console onto **Chrome's built-in Prompt API** (Gemini Nano, on-device — no key, no
  network per prompt) via `@shared/util/language-model.service.ts`. **Web-desktop-only by design:**
  the API exists in desktop Chrome 148+ and not in Chrome for Android, iOS, or the Android System
  WebView Capacitor renders into — so `unavailable` is a permanent, expected outcome on the APK, and
  the page renders its NO RESONANCE explainer instead of a dead prompt. There is deliberately **no
  synchronous `isSupported`**: the `LanguageModel` global is exposed on any secure origin including
  browsers with no model behind it (headless Chromium reports `downloadable`), so its presence says
  nothing. The service probes `availability()` **once**, memoized, and publishes it as a signal both
  readers share; `CommlinkPage` maps it through `LANGUAGE_MODEL_STATUS` (`available`→online,
  `downloadable`/`downloading`/`probing`→standby, `unavailable`→**offline**), which is why
  `onlineCount` had to become a `computed` — a capability resolves after first paint. Build wiring is
  easy to miss: the ambient globals come from `@types/dom-chromium-ai`, which must be listed
  explicitly in `tsconfig.{app,spec}.json` `types` (this project opts out of auto-inclusion), plus
  `DOM.AsyncIterable` in the root `lib` for `promptStreaming`. Streamed answers render in a `<pre>` —
  the model's newlines are meaningful and `<pre>` is the one element Prettier won't reflow. No e2e:
  the happy path is unreachable from headless Chromium. The domain holds **zero** NgRx state.

### 7.5 The list kit

`@shared` owns the domain-blind frame: `item-list`, `list-item`, searchbar / toolbar / empty-state,
`page-header`, the edit-modal shell, form inputs, the `LIST_FACADE` contract, and the single-list
helpers (`list.utils`/`list.selector`). Each domain projects its own row/form body and keeps its item
type in-domain (`<T>`). `IItemList<T>` requires `categories`/`mode` (grocery reads them unguarded;
the tracking list carries empty defaults). There is no shared datastore type — `DatabaseService` is
generic over the caller's `T`.

### 7.6 Types

**Sliced by concern, never a god file — and never a barrel:** `<domain>/model/<concern>.types.ts`
everywhere. `cash` splits into `account`/`transaction`/`rule`/`cash.types`; `groceries` into
`grocery-list`/`recipe`/`list-settings`/`groceries.types`; a domain whose model is one tightly-coupled
concern keeps one file named for it (`barcode.types`, `tracking.types`, `task.types`,
`trackplay.types`, `office-time.types`, commlink's `dashboard.types` + `deck.types`). The
`model/index.ts` barrels are gone, so an import line names the vocabulary it uses. A `*.consts.ts`
appears only where there is a body of constants (`geist`), not for a domain's one list-id.

In `@shared/model`, `app.types.ts` keeps only the primitives every layer speaks (`TMarker`,
`TTimestamp`, `TColor`, `TTheme`, `TIonDragEvent`); each shared concept owns a file beside it —
`base-item.types` (`IBaseItem`/`TUpdateDTO`/`TEditItemMode`), `category.types`, `item-list.types`,
`notifications.types` (inbox shapes **plus** the `IToastMessage` contract), `dashboard.types`,
`settings.types`.

Two type decisions are deliberate and recorded so they aren't re-flagged: `TItemListSortType =
'name' | string` stays **open** so the kernel needn't enumerate domain sort keys (`bestBefore`,
`prio`, `dueAt`) — closing it would be the real leak; and `TNotificationAction` is generic
(`{ type: string; targetId: string }`), with the `tracking.*` command literals in tracking's own
model as `TTrackingCommand`, since tracking is the only thing that interprets them.

---

## 8. Theming — two themes

**Two** themes off one token group: **cyberpunk** — the Shadowrun deck (near-black slate, amber +
teal neon, monospace, glow, HUD frame; the **default**) — and **OK Boomer** — a plain, light,
serious office look (sans-serif, flat surfaces, sentence case, no neon), showable in a professional
setting.

The old second-theme seam (`theme/palettes/_example.scss`, a `.ion-palette-<name>` override block) is
**recolor-only** — it cannot turn off the _structural_ effects that make the app cyberpunk (case,
tracking, glow, scanlines, brackets, gradients), so it was replaced by the model below. **Do not
restyle components one by one — retheme the CSS custom properties.**

The active theme is the **`<html data-theme>`** attribute, driven by the eager `settings` slice
(`selectTheme` · `SettingsActions.setTheme` · picker on `/settings`) and applied by
`SettingsEffects.applyTheme$` via `@shared/util/theme.service` (which also sets `<meta theme-color>`
and the native status-bar style).

### Decisions

1. **Plain = base, cyberpunk = opt-in.** The bare `:root` holds the plain palette and neutralized
   effect tokens; all cyberpunk decoration lives under `:root[data-theme='cyberpunk']` (and
   `:host-context([data-theme='cyberpunk'])` in component styles). "Serious looks serious" becomes
   true _by construction_: a component with no theme-awareness renders plain and only opts into
   flourish, so future cyber additions cannot leak into plain. The inverse (cyberpunk = base, boomer =
   suppress) was lower churn but fragile — every future flourish would need manual re-suppression.
2. **Cyberpunk still ships as the default selection**, so first-run and existing users see no change.
3. **Theme rides the eager app-global `settings` slice**, not a separate theme slice — persisted via
   the existing per-key port (`npc-settings`). **No `localStorage`** (except the language boot
   mirror, §9).
4. **No flash-of-wrong-theme via a neutral splash, not an inline script.** The initial shell is
   theme-neutral; a full-screen splash covers boot until the theme is applied underneath, then is
   revealed away. The splash _is_ the FOUC gate — the flashing chrome (`ion-menu`, `ion-app` bg) lives
   in the app shell _above_ the router outlet, so a route resolver can't cover it. An inline
   `localStorage` boot script would kill the flash with less code, but persistence stays in the
   NgRx + `@ionic/storage` layer.
5. **Splash: `@capacitor/splash-screen` on native + an inline HTML overlay on web**, behind one
   `reveal()` (`@shared/util/splash.service`, idempotent, armed with a ~3 s timeout fallback). The
   plugin's web impl is a no-op, so desktop/PWA needs its own `#app-splash`; native uses
   `launchAutoHide: false`. Native splash config is re-applied by `scripts/android-postsync.sh`.
   Angular App Shell was rejected: it needs an SSR/prerender toolchain we don't have, its FCP benefit
   doesn't apply to a local-asset APK, and its build-time-baked shell can't be theme-neutral.

### Token model

**Invariant** across themes: spacing, the `--sr-mono` literal stack, red/danger semantics.
**Theme-varying:** plain values on base `:root`, overridden in `:root[data-theme='cyberpunk']`. New
**flip tokens** turn structural axes into values so components reference a token, never a literal:

| token                                   | plain (`:root`)   | cyberpunk                     |
| --------------------------------------- | ----------------- | ----------------------------- |
| `--sr-deck-font`                        | system sans stack | `var(--sr-mono)`              |
| `--sr-heading-transform` / `-tracking`  | `none` / `normal` | `uppercase` / `0.1em`         |
| `--sr-label-transform` / `-tracking`    | `none` / `0.02em` | `uppercase` / `0.14em`        |
| `--sr-brand-transform`                  | `none`            | `lowercase`                   |
| `--sr-radius`                           | `6px`             | `2px`                         |
| `--sr-glow` / `--sr-glow-lg`            | `none`            | amber bloom                   |
| `--sr-line`                             | `rgba(0,0,0,.12)` | `rgba(amber,.35)`             |
| palette + `--ion-color-*`               | OK Boomer light   | cyber slate/amber/teal        |

OK Boomer starting values (WCAG-AA against white/light slate): `--sr-bg #f4f6f8`,
`--sr-panel/-2/-toolbar #ffffff`, `--sr-text #1f2733`, `--sr-text-dim #5b6472`,
`--ion-color-primary #2f5bd0` (calm corporate blue), `--ion-color-secondary #4b6b7a` (slate teal),
`--sr-line rgba(15,23,42,.12)`.

**Structural effects that can't be one token** (gradient functions, `::after` scanlines, bracket
geometry, LED glow + `@keyframes`, hud-frame gradient + inset bevel, radial backdrop) become the
**cyberpunk layer**: the base rule is flat, the decorated variant emitted under the deck selector.

Files: `src/theme/_shadowrun.scss` owns the `--sr-*` palette, `variables.scss` the Ionic `--ion-*`
chrome, both `@use`d once from `src/global.scss` (which also carries the Android safe-area map and
`body.scanner-active` transparency). Deck signature pieces are **theme-aware Sass mixins** in the
side-effect-free `src/theme/_deck.scss`: `panel-base` (flat) vs `panel-cyber` (gradient + bevel),
`led-base` vs `led-glow` (bloom + pulse), `hud-corners`, `brand`; `_shadowrun.scss` wraps them as the
global `.sr-panel`/`.sr-corners`/`.sr-led*`/`.sr-brand*` classes. Consume via `var(--sr-*)` / the
`.sr-*` classes, or `@use 'theme/deck'` + `@include` where a class can't reach (`:host`,
pseudo-elements); **never `@use 'theme/shadowrun'` from a component** — it emits global CSS.

`/commlink` is the reference cyberpunk expression; `/soykaf`, `/geist`, `/trackplay` and the
grocery/office-time pages read the same shared classes. Chart palettes are tokenised via
`@shared/util/charts/chart-colors`, which reads the live theme tokens.

### Adding a third theme

Add plain-relative values on base `:root`, a `:root[data-theme='<name>']` override block, a `TTheme`
union member (the picker renders from `THEMES` + `THEME_LABEL_KEYS`, both `Record<TTheme,…>`), **and
two full key blocks — a `labels` entry per catalog entry _and_ a `DECK_CHROME_LABELS` block for all
19 HUD slots** — declared in code as well as filled in both message bundles. Both are
`Record<TTheme,…>`, so the code half **fails to compile** until complete, and `deck.catalog.spec.ts`
then catches a key the bundles are missing. The chrome block is where a theme's **voice** lives: a
field names a HUD slot, not a word, so OK Boomer fills "noise" with `Ungelesen` where cyberpunk fills
it with `Rauschen`. Do **not** import Ionic's prebuilt `dark.class.css`.

---

## 9. i18n

`@ngx-translate/core` **v18** — provider API only: the root is
`provideTranslateService({lang, fallbackLang, loader: provideTranslateHttpLoader({prefix, suffix})})`
in `main.ts`, and **`TranslateModule` no longer exists**, so a component imports the standalone
**`TranslatePipe`** and a spec off the shared kit calls `provideTranslateService()`. Importing the
pipe instead of a module is also what makes an unused i18n import visible: the compiler reports
`NG8113` on a pipe it cannot find in the template, which a module import always hid.

**Bilingual, German default.** Flat dotted keys in `public/i18n/{de,en}.json`. All kitchen-bot keys
are namespaced under `grocery.` to avoid collisions with timetracker keys. TS-side keys must be
`marker('…')`.

The UI language is a `language` on the eager `settings` slice, applied by `SettingsEffects` through
**`LanguageService`** (`@shared/util`, the exact sibling of `ThemeService` and for the same reason —
`commlink`/`cash`/`trackplay` read the locale and may not import `settings`), which owns the three
globals a language touches: the translate bundle, `dayjs.locale`, `<html lang>`.

**Switching restarts the app.** Money/score/date render through _pure_ pipes whose output is cached
on input identity, and `LOCALE_ID` is a provider that cannot be re-resolved — so a live switch would
leave the screen half-formatted. The restart awaits `DatabaseService.settled()` so it cannot overtake
the save effect and drop the choice. `LOCALE_ID` + the first bundle come from a synchronous
`localStorage` mirror (`bootLanguage()`), because a provider cannot await IndexedDB; the settings doc
stays the source of truth and the restart is what keeps them from ever being observed apart.

**Every display format is locale-named, never a German literal:** `date:'short'`/`'shortTime'`/
`'fullDate'` in templates, and `localizedDate`/`localizedLongDate` (`@shared/util/date-format.utils`)
for the dayjs call sites. That module owns dayjs's plugin _and_ its locale packs because both fail
silently — `format('L')` without `localizedFormat` returns the literal `"L"`, and `dayjs.locale('de')`
without the pack keeps the previous locale.

**Page titles are the one namespace keyed by page, not by domain:** `page-title.<domain>[-<page>]`
(`page-title.cash-rules`, `page-title.groceries-shopping`, `page-title.office-time-settings`). A title
is read by the shell as much as by its page, so it lives in one flat namespace — which retired
`officetime.` (≠ the `office-time` domain), the `cash.`/`trackplay.` title prefixes, and tasks' title
hiding under `grocery.`.

### The composed-key problem, and why `--clean` works again

`i18n:extract` once had `--clean` removed because running it deleted live keys. That was damage
control on wrong reasoning: **the keys were never dynamic** — every affected family is a closed,
finite compile-time set, invisible to the extractor only because it was _composed at the call site_
instead of written as `marker(...)` literals. The measurement: the extractor found 461 keys against
581 committed, so `--clean` would have deleted **120** across four families (`98 deck.<theme>.*`,
`11 deck.module.*`, `8 deck.metric.*`, `3 grocery.unit.*`).

Five composition sites were converted to declared consts:

| keys | was composed at                       | became                                            |
| ---- | ------------------------------------- | ------------------------------------------------- |
| 60   | `deck.utils` `resolveLabels`          | `labels` on each catalog entry                    |
| 38   | `deck.utils` `resolveChrome`          | `DECK_CHROME_LABELS: Record<TTheme, TDeckChrome>` |
| 11   | `deck.facade` `configuredModules`     | `DECK_MODULE_LABELS: Record<TAppModule, TMarker>` |
| 8    | `commlink.page` `metricKey`           | `metricKey` on each catalog entry                 |
| 3    | `edit-recipe-dialog.component.html`   | `UNIT_LABEL_KEYS: Record<TItemUnit, TMarker>`     |

**The shape rule: a plain `Record<TUnion, TMarker>` annotation.** The annotation is what enforces
exhaustiveness, which is the only property this needs; values go straight to `translate`, which takes
a `string`, so `as const satisfies …` is ceremony. **Key strings stay whole — never mirror the dotted
path in nested objects:** a `{ grocery: { unit: { ml: marker('grocery.unit.ml') } } }` tree states the
prefix twice with nothing deriving one from the other, and one tree spanning `deck.*`/`grocery.*`/
`cash.*` would have to live in `@shared/model`, which Sheriff bars from naming domain vocabulary.
Nesting is for a real axis only (the theme, in `DECK_CHROME_LABELS`). Also avoid the
bare-`marker(...)`-statement style: it makes keys visible without tying them to the union, so a new
member silently lacks a label.

**The script, with three load-bearing flags:**

```
"i18n:extract": "ngx-translate-extract --input ./src -o 'public/i18n/{de,en}.json' --clean --sort --format-indentation '  ' --trailing-newline --format json"
```

- **Both outputs** — the actual original bug. `ngx-translate-extract` has no locale discovery; it
  writes exactly the paths it is given, so `en.json` had been maintained entirely **by hand**.
- **`{de,en}.json`, quoted.** The tool expands braces itself, and quoting guarantees _it_ does rather
  than the shell (macOS `/bin/sh` expands braces, Linux `dash` does not) — removing the difference
  between a laptop and the Codeberg runner.
- **`--format-indentation '  '`, never the `-fi` alias.** With more than one output, yargs reads `-fi`
  as clustered `-f -i` and the run dies with `Unknown format: json,json`. Measured; do not "simplify".
- **`--format-indentation` + `--trailing-newline` are what stop the churn.** The extractor defaults to
  tab indent and no trailing newline while prettier owns these files through the lefthook hook.
  Without them, a merge-extract differed by **1164 lines**; with them it is byte-identical to a file
  `prettier --check` passes. The two writers now agree instead of being mediated by the hook.

**The acceptance test:** `pnpm run i18n:extract` → `git diff --exit-code public/i18n/` is clean.
Composing a key again is exactly what silently makes it prunable. A **CI freshness gate** was decided
against for the same reason the flags exist — _one artifact, two writers_ is always a bug in the
making. `format`/`format:check` do now glob `public/i18n/*.json` beside `src/**`, which was only safe
once the two writers produced identical bytes.

### The `@shared` domain-vocabulary gate

An audit of the `@shared` kernel (2026-07-24, adversarially verified; 28 of 34 findings confirmed;
**closed 2026-07-25**) found one root cause: the merge namespaced all kitchen-bot i18n keys under
`grocery.` and re-domained the shared components, but never re-homed the strings or de-domained the
shared _types_. Both halves are closed — the shared surfaces moved onto neutral namespaces
(`categories.*`, `item-list.*`, `toast.*`, `a11y.back`), and the kernel model is domain-blind
(`TItemListId` is an opaque token, `TNotificationAction` is generic).

**The class is now gated: `no domain vocabulary in @shared`, at `error`** (`eslint.config.js`). A
`no-restricted-syntax` rule fails any domain-prefixed literal
(`grocery.|tracking.|tasks.|cash.|trackplay.|officetime.|geist.`) under `src/app/@shared/**`, specs
excluded. This is exactly the class Sheriff is structurally blind to: it checks import edges, and
`'grocery.a11y.back' | translate` is a string, not an edge.

> **Trap worth knowing.** The rule needs TWO node types. A quoted key is a `Literal` in TypeScript
> but a `LiteralPrimitive` in an Angular template, so a `Literal`-only selector silently passes every
> template — and templates are where most of this class lived. The first cut did exactly that and let
> a deliberately re-injected leak through. **Always verify a new gate by re-introducing the thing it
> is supposed to catch.**

`pnpm run lint` (= `ng lint`, `lintFilePatterns: src/**/*.{ts,html}`) is the one command CI runs too,
so the file set has a single writer. An ad-hoc `*.ts`-only glob — which is what actually skipped the
templates — is no longer the documented way to lint.

---

## 10. Testing

**Lean, not exhaustive** (inherited from timetracker). Three layers:

- **Vitest unit — pure logic** (`*.spec.ts`): utils, pipes, reducers, selectors (via
  `.projector(...)`). No `TestBed` where a plain call suffices.
- **Vitest unit — component class logic** (`*.component.spec.ts`):
  `TestBed.createComponent(...).componentInstance` + `provideMockStore()` +
  `provideZonelessChangeDetection()`. **Do not `detectChanges()`** — jsdom doesn't run Stencil, so
  `ion-*` are inert; rendered-DOM assertions belong in e2e.
- **Playwright e2e** (`e2e/`, port 4321): real-browser behavior. Scope content assertions with
  `#main-content` and use **hash routing** URLs (`/#/groceries/storage/_storage`).

Shared test infra lives at `src/app/@shared/testing/` (`test-data.ts` deterministic factories,
`test-providers.ts`), reachable only from `*.spec.ts` (Sheriff `type:testing`). NgRx **effects stay
RxJS**. Rely on Vitest `globals: true` — do **not** `import … from 'vitest'`. The runner is
`isolate: false`, so a spec overriding selectors must `afterEach(() => store.resetSelectors())` or
the overrides leak across files.

### Five Ionic locator traps

Each costs a red spec every time it is rediscovered — a spec that ignores them passes alone and fails
after an SPA navigation.

- **Scope controls to the page component**, `app-page-<x>` (`app-page-recipes`, `app-page-storage`),
  not just `#main-content`: the router outlet keeps previously-visited routes mounted (the
  _lazy ≠ unloaded_ rule, seen from the DOM), so a sibling page's identical "Hinzufügen" button is
  still there.
- **An `<ion-modal>`/overlay teleports to the app root**, so it is _outside_ that page scope — key a
  presented dialog off its **title**, never off its wrapper. Three DOM facts make the tempting scopes
  wrong, all verified on `/groceries/storage/_storage`: presenting **moves** the `ion-modal` to
  `ion-app` and leaves an `overlay-hidden` twin behind inside the wrapper (so the wrapper matches
  _two_); a single list route mounts **five** `ion-modal`s; and Ionic puts **no `role="dialog"`** on
  `ion-modal`, so `getByRole('dialog')` matches nothing. `.show-modal` narrows to what is presented,
  the title to which one — `e2e/groceries/storage.e2e.ts` has the helper.
- **Click an `ion-select` host**, not its accessible button: the shadow `part="inner"` swallows the
  click.
- **Re-entering a route mounts the page a _second_ time** — the same `app-page-<x>` then matches twice
  and every row locator inside it is a strict-mode violation (`:visible` does _not_ help; the stale
  instance is not `display:none` at assert time). A spec bouncing between two routes should navigate
  with `goto` **+ `reload()`**, which collapses the outlet to one instance and makes every assertion a
  cold read of persisted state besides (`e2e/commlink/deck-config.e2e.ts`).
- **A bare `ion-toast` is no longer unique.** The shell mounts one of its own (the update prompt), and
  an inline overlay sits in the DOM whether presented or not — so `page.locator('ion-toast')` matches
  two and trips strict mode. Narrow with **`:not(.overlay-hidden)`**, the same class that marks the
  `ion-modal` twin above; `e2e/trackplay/players.e2e.ts` is the worked example. The general rule this
  is the second instance of: **an always-mounted overlay makes every element-name locator for that
  overlay ambiguous, app-wide** — so adding one to the shell is a change to every spec's namespace.

### A11y is gated, and the gate needed help (2026-07-29)

> The rules themselves — what Ionic's docs require of us, what Ionic already does for us, and which
> of its built-in accessible names are hardcoded English — are in **`docs/ionic-a11y-practices.md`**
> (R1–R8, each verified against the installed `@ionic/core`). **Seven of the eight are now gated**, by
> this project's own rule set in `eslint-rules/`; only R5 is a review matter, permanently.

The template block in `eslint.config.js` now extends **`angular.configs.templateAccessibility`**
beside `templateRecommended` — 11 rules at `error` (`alt-text`, `label-has-associated-control`,
`click-events-have-key-events`, `valid-aria`, `interactive-supports-focus`, …). The existing
hand-maintained hygiene turned out to be complete for what those rules check: the suite went green on
the first run, with no template edits.

**Which is exactly why it is not the whole gate.** Those rules key off _native_ elements —
`elements-content` checks `<button>`/`<a>`/headings, `interactive-supports-focus` checks native
interactive roles — while every control here is an Ionic custom element. The set reported a clean pass
over **three genuinely unlabelled icon-only toolbar buttons** (two on the shopping page, one on
storage: the action-sheet trigger and the two barcode-scan buttons, now carrying
`grocery.a11y.actions` / `grocery.a11y.scan`). A gate that is green for a structural reason is worth
less than no gate, because it converts "nobody checked" into "something checked and approved".

So the class is covered by **`eslint-rules/`, this project's own rule set** — `ionic-a11y/*`, one rule
per R-number, enabled in `eslint.config.js` like the unicorn set. It began as a single
`no-restricted-syntax` selector for R2 (the same technique the i18n vocabulary gates use) and became a
rule set for two reasons, one of which is the flat-config trap below.

Three AST facts are load-bearing, and each one, got wrong, yields a silently inert rule:
**`[attr.aria-label]` parses to a `BoundAttribute` named plain `aria-label`** (the `attr.` prefix is
already gone, so matching `attr.aria-label` matches nothing); text must be tested for a
**non-whitespace** character, since an indented button has whitespace `Text` children — a bare "has a
text child" test exempts precisely the multi-line icon-only buttons this exists to catch; and the text
test is a **descendant** one on purpose, so text in a nested `ion-label` counts as a name while an
`aria-label` on the inner `ion-icon` does not (it names the icon).

Three more facts made the set cheap, and are worth knowing before reaching for a dependency: the
parser services a template rule needs (`convertElementSourceSpanToLoc`) hang off
**`context.sourceCode.parserServices`**, so `@angular-eslint/utils` is not required and the set has
**no dependency at all**; every parsed node already carries an ESLint-shaped `loc`, so an
attribute-level report is just `loc: attribute.loc` (`convertNodeSourceSpanToLoc` takes the *span*, not
a node — calling it like angular-eslint's element helper throws); and a block (`@if`, `@for`) holds its
children one level deeper than an element, so a walk that only follows `children` stops at the first
`@if`. It stays **CommonJS** because `@angular-eslint/builder` — what `ng lint` and CI invoke —
resolves only `eslint.config.{js,mjs,cjs}`, so a TypeScript rule set would need `eslint.config.ts` plus
`jiti` and would make the lint target stop finding its config.

**The trap worth remembering is flat-config, not a11y: ESLint _replaces_ a rule's options, it does not
merge them.** Declared once on the `**/*.html` block, the R2 selector was silently dropped for every
domain folder and for `@shared`, because the i18n vocabulary gates set `no-restricted-syntax` again
for those same files and the last matching block wins whole. The workaround was to spread it into all
three blocks; the fix was to stop sharing a rule name at all, since **a rule _id_ cannot be shadowed
the way a rule's options can** — which is the second reason this is a rule set. Two blocks still share
`no-restricted-syntax` (the two i18n gates), so the check still matters: **`eslint --print-config`** on
a domain template, a `@shared` template and a slice-less one. Generalized: **when two concerns share
one rule name, adding the second silently disables the first** — `--print-config` is the only honest
check, and a passing suite is not one.

**What the set does not gate, and why that is not a gap to close.** R5 (no action reachable only by
swipe or drag) is undecidable from a template: an `ion-item-sliding` is fine when a kebab popover
elsewhere dispatches what the swipe does, so a rule could only flag every swipe and be disabled
everywhere. The same restraint runs through the rules that _do_ exist — `overlay-options-have-name`
passes over options built by a helper or carrying a spread rather than guessing at them, because a gate
that reports what it cannot know teaches people to disable it. The rules carry no unit tests, for the
same reason the unicorn set carries none here: a rule set is config. What stands in for them is the
finding count on the real corpus — turning the set on produced **74 findings in 28 files** where the
old gate reported 0, and a rule that drops to zero on a corpus still holding violations has gone inert.

### Gate discipline (learned — keep applying)

Gates: `tsc -p tsconfig.app.json --noEmit` + `-p tsconfig.spec.json --noEmit` ·
`pnpm exec sheriff verify src/main.ts` · `pnpm run lint` · `pnpm test` · `pnpm run build` ·
`pnpm run e2e`.

- **`build` / `test` run on esbuild (transpile-only, no type-check)**, so a broken _type-only_ import
  passes them silently. Always run both `tsc --noEmit` passes, and usually `pnpm run e2e` — between
  them they've caught a type-only-import gap and a runtime co-hydration crash the other gates missed.
- **Verify a diagnostic query returns what you think before scoping work off it** (a `grep -Lq`
  inversion once faked a "~70-component OnPush backlog"). Two more instances came out of the
  2026-07-29 audit, both from grep standing in for a real measurement: counting colocated `*.spec.ts`
  files is not coverage, and grepping our templates for `aria-live` cannot see what a web component
  puts in its shadow DOM (§12). **A shell idiom can lie about a gate too** — `tsc … | tail -2 && echo
  clean` prints "clean" whenever `tail` succeeds, which is always. Check `$?`, or run the command bare
  so its own output is the answer.
- **Verify a new gate by breaking what it should catch.** A green assertion proves nothing until it
  has been seen red for the right reason.
- **One artifact, two writers** is always a bug in the making: either one tool owns a file's bytes, or
  you force their outputs byte-identical (§9).

---

## 11. Build & deployment

### Commands

| Command                             | Does                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `pnpm start`                        | dev server (`ng serve`)                                                         |
| `pnpm run build`                    | prod web build → `www/browser`, `--base-href ./` (for Capacitor)                 |
| `pnpm run build:pages`              | prod web build with `--base-href /np-commlink/` (for Codeberg Pages)             |
| `pnpm test` / `pnpm run e2e`        | Vitest one-shot via `@angular/build:unit-test` / Playwright                      |
| `pnpm run lint`                     | flat `eslint.config.js`: angular-eslint + @ngrx + Sheriff + prettier, on `.ts` **and** `.html` |
| `pnpm run i18n:extract`             | rewrite **both** bundles from the `marker(...)` literals, `--clean` included (§9) |
| `pnpm run build:android`            | prod web build + `cap sync android` + `scripts/android-postsync.sh`              |
| `pnpm run apk:debug` / `apk:release`| the above + a Gradle `assemble`                                                  |
| `pnpm run sync:android` / `open:android` | the sync half alone / Android Studio                                        |

### Capacitor / Android

`appId np.afterwork.commlink`, `webDir www/browser`. Plugins: the timetracker set +
`@capacitor-mlkit/barcode-scanning` + `@capacitor/splash-screen`. The `android/` folder is
**git-ignored and regenerated on demand**: `npx cap add android` once per machine, then
`pnpm run build:android` for every rebuild. The **postsync step re-applies the edits Capacitor strips
on every sync** — the mlkit `barcode_ui` `meta-data`, the `CAMERA`/`FLASHLIGHT`/`POST_NOTIFICATIONS`
permissions, the splash config, and the release identity (below). It is idempotent. The
generated activity `configChanges` is already the rich Capacitor-8 set.

**Release APKs are unsigned** — no `signingConfig` is wired, so `apk:release` yields
`app-release-unsigned.apk`. PWA icons are still the timetracker placeholders.

### Release identity — `package.json`, and nothing else

**One writer for the version, three readers, no gate needed.** `package.json`'s `version` owns the
number; nothing under `src/` restates it, and nothing has to be kept in sync with it:

- **The web app** reads `APP_RELEASE` (`@shared/model/app.consts`), which is `NPC_RELEASE` injected
  by esbuild's `define` — `--define NPC_RELEASE="'$npm_package_version'"` on `build` +
  `build:pages`. `npm_package_version` is set for any `pnpm run` script, so no `node -p` is needed
  in the script and the value cannot disagree with the manifest. The ambient declaration lives in
  `src/app-release.d.ts`, which both tsconfigs already pick up via `src/**/*.d.ts`.
- **Reading it is `typeof`-guarded**, because `ng serve` and Vitest apply **no** define: there the
  identifier is genuinely undeclared and a bare reference throws `ReferenceError`. Dev therefore
  reads `dev` — honest, and it keeps the fallback path exercised instead of shipping untested. In a
  real build esbuild folds the guard away entirely (verified: `var Ji="0.1.0"` in the output, with
  the ternary and the `'dev'` literal gone).
- **The APK** derives both Gradle fields in `android-postsync.sh`: `versionName` verbatim, and
  `versionCode` as `major*10000 + minor*100 + patch` (`0.1.0` → `100`).

**Why `versionCode` is derived rather than pinned.** It is the *only* field Android compares to
decide an install is an upgrade; a code that doesn't increase is refused with
`INSTALL_FAILED_VERSION_DOWNGRADE`, and the only way in is to uninstall — which wipes the IndexedDB
holding every tracked session, the pantry and the ledger. The formula's **constraint is written into
the script**: minor and patch must each stay below 100, since `0.1.100` and `0.2.0` both compute to
`200`. That failure is silent at build time and only surfaces as an APK Android won't install.

**`APP_RELEASE` is not `APP_VERSION`.** The latter is the persisted-schema number `runMigrations`
reads (§5). They move on unrelated cadences — a release that changes no persisted shape bumps only
the former, a migration hop only the latter — so collapsing them would couple two independent
things. **Not built:** a checked-in release const plus a CI gate asserting it matches
`package.json`. Injection needs no gate because there is nothing to drift; a const would have made
`src/` restate a fact `package.json` owns and then required machinery to keep the two honest.

### The update prompt — it must ship in the first release

`@shared/util/app-update.service.ts` wraps `SwUpdate`, publishes `updateReady` as a signal, and the
shell renders an inline `<ion-toast>` offering a reload (`applyUpdate()` → `activateUpdate()` then
`AppReloadService.reload()` — activating alone only changes what *subsequent* requests get, so a
running tab would keep the old bundle under a new worker).

**Why now, with nothing deployed yet:** a client can only be told about the next version by code
that was already in the version it is running. An updater added in v2 arrives a generation too late
for everyone it was meant to reach. (Pattern: *the upgrade mechanism ships before the thing it
upgrades* — the same shape as expand-contract migrations and telemetry clients.)

**What it does not do:** ngsw never pins a client permanently — a fresh page load activates the
newest ready version by itself. The case that never gets a fresh load is an installed PWA that is
never fully closed, and that is the whole target.

It is **inert wherever no service worker runs** (`ng serve`, specs, and the APK, whose assets are
replaced by an install): the `isEnabled` guard is the entire contract there, since `activateUpdate()`
throws when disabled. It is deliberately **not** on the `NotificationsActions.toast` contract (§3.2)
— an interactive affordance is not a message, so it carries no `toast.*` key and needs no presenter,
and rendering it declaratively keeps `ToastController` out of the shell. Its keys are `app.update.*`.
**No e2e**: proving it needs two deployed builds (same precedent as GEIST).

### CI/CD — Codeberg Forgejo Actions

`.forgejo/workflows/ci.yml`, deliberately **one job**: Codeberg's hosted runners are donated capacity
whose terms ask for minimal pipelines, so every gate (eslint · prettier · sheriff · `tsc` ×2 · vitest
coverage · playwright · prod build) shares one container and one `pnpm install`, and the deploy then
sits behind e2e for free instead of needing an artifact hand-off.

`runs-on: codeberg-medium-lazy` — the `-lazy` suffix buys a 24 h runtime budget in exchange for a
delayed pickup (plain `codeberg-medium` caps a job at 10 min), and `medium` is the smallest tier an
Angular build fits: Codeberg counts **filesystem writes against the RAM quota**, so `node_modules` +
a Chromium download is most of a gigabyte before the compiler starts. Every `uses:` is a
**fully-qualified URL** (`https://code.forgejo.org/actions/…`) because a bare `owner/repo` resolves
against the instance's `DEFAULT_ACTIONS_URL`, which is not github.com here; contexts are the
Forgejo-native `forge.*`. No `concurrency:` block — Forgejo defaults `cancel-in-progress` to true.

**Verification runs on every push; publishing is release-gated on a `vMAJOR.MINOR.PATCH` tag.** A
push to main runs all gates and deploys nothing; pushing `v1.0.0` runs the same job again on that ref
and _then_ deploys — so Pages always serves a tree the run itself verified. Two consequences shape
the file: `on.push` carries **no filter at all**, because Forgejo rejects `branches:` and `tags:` on
the same trigger (the filter moved into the job's `if:`), and the exact semver shape is asserted by a
**`grep -Eq` in the deploy step**, not by an `on.push.tags` glob, because a glob dialect that doesn't
support what was written fails _silently_ — it just stops matching and releases quietly stop
happening. Pre-release tags (`v1.0.0-rc.1`) therefore verify without publishing.

**The PWA ships to Codeberg Pages, branch variant:**
`https://letothec0dem0nkey.codeberg.page/np-commlink/` is the tip of this repo's `pages` branch,
force-pushed as a fresh orphan commit per deploy (a publishing surface, not history — keeping the
commits would grow the repo by one full build per push). One site **per project**; the alternative —
a repo literally named `pages` — serves a single site at the domain root. Two things live in repo
settings rather than git: Actions enabled under _Units_, and a **Forgejo webhook** targeting the Pages
URL with branch filter `pages`, which is what tells the git-pages server a deploy happened. The
deploy authenticates with the automatic `forge.token`, so there is no PAT secret.

**The subpath is why there are two prod builds**, and it means **no absolute in-app URL may point at
the server root.** The two that did are fixed and are the pattern to follow: the `TranslateHttpLoader`
prefix is `'./i18n/'` (an absolute `/i18n/` 404s and every label degrades to its raw key) and
`index.html`'s favicon `href` is relative. Hash routing spares us an SPA-fallback `_redirects` file —
every route is `/#/…`, so `index.html` is the only document Pages ever serves.

---

## 12. Open, deferred and blocked

**Almost nothing below is merely undone.** Every item in the first four groups needs something the
repository cannot supply on its own: a secret, artwork, an upstream release, a human reading the
result, or a product decision. The exception is the last group, _Measured gaps_ — three findings from
a whole-app audit (2026-07-29) that are plain work with nothing blocking them, recorded here so they
stop being rediscovered.

### Blocked — needs something only the owner can supply

- **Nothing has ever been published — and the first push waits on the keystore.** `git ls-remote
  origin` returns **zero refs** and there are no tags, so `.forgejo/workflows/ci.yml` has never
  executed and the Pages URL in the README serves nothing. Earlier text here read "the PWA half
  ships on a `vX.Y.Z` tag already"; that described the *capability*, never an event. The owner's
  decision (2026-07-29) is that **web and APK ship together**, so the first push, the first CI run
  and the first tag all wait on the keystore below rather than shipping the PWA alone. Everything
  the release needs is in place and verified locally; two prerequisites live in the repo settings
  (Actions under _Units_, the Forgejo `pages` webhook) and must be done before the first tag.
- **APK signing.** The debug APK builds (verified on SDK 36 / JDK 21); `apk:release` produces
  `app-release-unsigned.apk` because no `signingConfig` is wired. Wiring one needs a keystore + its
  passwords — secrets, so a decision rather than a default. It now gates **both** targets, since web
  and APK ship together. Note the signing key is a one-way door of its own: an APK signed with a
  different key can never upgrade one signed with the old key, at any version.
- **Shadowrun PWA icons.** `public/icons/*` are still the timetracker placeholders. Needs artwork.
- **The bank fixtures, before the first push.** `docs/cash/example.csv` and `example2.csv` are
  tracked and hold 5 and 6 distinct `DE`+20-digit IBAN-shaped strings. Whether those are synthetic
  (as `volksbank.parser.spec.ts`'s inline rows are) has not been established — and a push to a public
  host is unrecallable, so it must be settled *before* the first push rather than at push time.
- **A DKB import driven live.** The DKB parser is unit-tested (`dkb.parser.spec.ts`, inline rows
  transcribed from `docs/cash/example2.csv` — the format source cited at `dkb.parser.ts:13`), but only
  Volksbank has been driven end-to-end in-app. Needs a real DKB export on a device.
- **`en.json` read by a human.** Both bundles hold the same 582 keys and only 74 values are
  identical, so the great majority are real translations — but nothing could render them until the
  language switch shipped. The first English session is also the first proofread.

### Waiting on upstream

- **Angular 22 — gated on NgRx.** Angular `22.0.8` is `latest` (2026-07-22); we are on `21.2.18`,
  the `v21-lts` line, so this is _not_ an unsupported version and there is no urgency. **The gate is
  `@ngrx/*`:** `latest` is still `21.1.1` with peer `@angular/core: ^21.0.0`, and `next` is only
  `22.0.0-beta.0`. NgRx is the spine here — a `data/` layer in every domain plus
  `@shared`, and the persistence and list-flow effects are _builders_ every context instantiates — so
  forcing it would mean pnpm overrides on an untested combination. **Bump when `@ngrx/*@22` is stable.**
  - **Lockstep set — one atomic commit or none:** `@angular/*` + `@angular/cli` + `@angular/build` +
    `angular-eslint` (22.1.0 peers `@angular/cli >=22 <23`, so it cannot move early) + `@ngrx/*`.
    Their peer ranges are mutually exclusive across the v21/v22 boundary.
  - **Already compatible, no action:** `@ionic/angular` 8.8.x, `@ionic/storage-angular`, `ng2-charts`
    10, `@ngx-translate/*` 18, Sheriff.
  - Run it as `ng update @angular/core@22 @angular/cli@22` (tested schematics) against
    `angular.dev/update-guide` 21→22; do not hand-edit `package.json`. Bump alone, as its own commit
    — a framework major on top of other changes makes a red gate unattributable.
- **An Angular bug worth filing.** Angular pushes every control binding onto a same-named directive
  input, and `FieldState.pattern` defaults to a shared `computed(() => [])` rather than `undefined`,
  so a bound `ion-input` gets `pattern=""` — a pattern matching only the empty string, leaving the
  native input permanently `:invalid`. Harmless here (no `<form>`, no submit, no `:invalid` styling),
  latent anywhere that reads native validity. **Custom controls dodge it**: the binding is only
  written onto the host when the host accepts the native property, which `app-money-input` does not.

### Deferred on a decision, not on effort

- **Reordering the deck from the grid itself.** The model has always supported it
  (`DeckFacade.reorder(ids)` takes the complete resolved order, which is what an `ionReorderEnd`
  produces). What stops it is that a tile **is** a navigation link: a drag competes with the tap that
  opens the program, so it needs a long-press-to-arm mode or an explicit "arrange" toggle — a UX
  choice. The capability already has a home on `/commlink/deck`.
- **A `field-note` READ idiom, if a sixth dialog wants one.** The _presentation_ is shared (the global
  `.sr-field-note`). What is still per-dialog is how each **reads** its errors: `invalid()`,
  `some(kind === X)`, `some(kind !== X)`. A shared `hasErrorOtherThan(field, kind)` is two lines and
  still not worth extracting for five call sites, but it is the obvious place to look if this grows.
  Note the asymmetry those reads encode deliberately: an _empty_ money box leaves save disabled
  without a note (it is the initial state), while an empty **name** does say so — the box was seeded
  from an item or the search term, so blank means the user cleared it.

### SOYKAF recipe book — v2

The constraint that shapes all of it: the check is **presence-only** ("in storage" / "missing"),
never "you are 200 ml short" — storage counts packages while a recipe asks for a measure, and nothing
converts a bottle into ml.

- **Cook → subtract** ingredients from storage; missing ingredients → push into `_shopping`. (v1's
  missing list is deliberately read-only, with no one-tap push.) A product decision: it makes cooking
  mutate stock.
- **Base unit on `IProduct` + pack sizes** (milk → `ml`; 0.5 l / 1 l bottles) — the _purchase-unit vs
  consumption-unit_ bridge a quantitative "200 ml short" requires. **Open only if presence-only proves
  too weak**, because the cost is real: `IStorageItem.quantity` becomes a base-unit amount, which
  pools distinct packs into one number and so **destroys per-pack `bestBefore`** (two bottles with
  different dates become "1000 ml" with one date). Half the schema already exists — `IProduct` has
  carried `unit`, `packaging` and `packagingWeight?` since kitchen-bot, unread by the matcher.
- **Recipe photos.** A slice persists as one key/value doc (recipes ride inside `npc-groceries`) that
  the generic save effect rewrites wholesale on every mutation, so base64 images would ride inside
  the text document. Needs a place for binaries first.

### Looked at, deliberately not changed

- **The list dialogs' field tree spans the whole draft, though only `name` is bound.** Raised as a
  cost on the interaction path: `patch()` replaces the draft object, so every unrelated edit (a
  servings tick, a quantity stepper) recomputes the root `childrenMap` and `canSave` re-aggregates
  through it. Read against `@angular/forms` 21.2.18 it is far cheaper than it sounds, and the fix
  would be worse than the cost:
  - `childrenMap` is a `linkedSignal` that **reuses** child nodes across recomputes
    (`prevData.byPropertyKey.get(key)`), so a patch is an `Object.keys` walk plus Map lookups, not a
    tree rebuild. Only a key written as `undefined` is deleted and recreated.
  - `valid()` is a memoized `computed` and `reduceChildren` passes `shortCircuitFalse`, so validity
    stops at the first invalid child.
  - Scoping the form to the validated field would give back the two things the conversion bought: the
    tree **is** the write-back channel for `[formField]="form.name"`, and `canSave` comes from the
    schema instead of a hand-written conjunction. A subset form needs manual sync — the coupling the
    conversion removed.

  Revisit only with a measurement, and on a real draft (a 12-ingredient recipe is the worst case).

### Recorded decisions (here so they are not re-flagged as work)

- **Toasts already announce — the audit finding was wrong** (checked 2026-07-29). §12 briefly claimed
  toast output had no live region and that "Ionic's own toast does not announce either". It does:
  `ion-toast` renders its content div with **`role="status"` + `aria-atomic="true"` +
  `aria-live="polite"`** and flips an internal `revealContentToScreenReader` false→true on present,
  which is the standard trick that makes a live region actually fire (the content has to change
  _after_ the region exists). So every toast in the app is announced, politely, with nothing to
  build. **Why the audit missed it: it grepped `src/**/*.html` for `aria-live`, and a web component's
  shadow DOM is not in our templates** — only GEIST's own `aria-live` showed up. Raising errors to
  `assertive` would be the only refinement left, and it is not cheap: Ionic hardcodes `polite` inside
  shadow DOM, so it would take custom markup replacing `ion-toast`. Not worth it — declined.
- **Two off-contract facade methods** (`addCategory`/`showEditDialog`) stay on the concrete
  grocery/tasks facades, deliberately off the shared `LIST_FACADE` contract: putting them on it would
  force `tracking` to implement operations it has no concept of.
- **Two e2e gestures are deliberately not covered by e2e** — no skipped spec exists to find, the tests
  were never written — both because the Playwright drag would be more fragile than what
  it proves: the `app-date-input` calendar (an `ion-datetime` day grid inside a teleported modal) and
  the cash-rules reorder (a mouse-step drag over an `ion-reorder` sharing its row with a swipe
  handler). Both behaviours are covered by unit specs.
- **The unspec'd facades stay unspec'd** (decided 2026-07-29, after the audit that raised it). Most
  `<Domain>Facade`s have no spec — `DashboardFacade`, `DeckFacade`, `NotificationsFacade`,
  `SettingsFacade`, `TrackplayFacade`, `OfficeTimeFacade`, both grocery page facades, both shared page
  facades — and the audit called that the app's untested seam, since NgRx is sealed behind it. Worked
  through, the finding does not survive its own argument. A facade method is **almost always** one line
  (`dispatch(Actions.x(arg))` / `selectSignal(sel)`) — for the one exception see the note below — so a
  spec over it catches exactly one class,
  **mis-wiring**, which splits in two: an _argument_ mis-wire (`remove(item.name)` where the reducer
  wants an id) and a _wrong-action_ dispatch carrying an identical payload. Only the first is typeable,
  and only by branding the id aliases (`type TCategoryId = string & { readonly __brand: unique symbol }`
  — an intersection, so branded→`string` still assigns while `string`→branded does not, and the field
  is a phantom that does not exist at runtime). That was rejected on cost: branding needs an `as` at
  every mint point **including every read out of IndexedDB**, which would add unchecked casts at the
  least trustworthy boundary in an app that currently carries zero `any` and zero non-null assertions —
  and it would not have caught the one time this bug actually shipped (`8eee87a`, a renamed product
  un-cooking its recipes), because that code compared a real name to a real name by design. Nothing
  types the second half at all. What remains is not worth eleven mirror specs asserting that `dispatch`
  was called, and raising the coverage thresholds to force them into existence would game a metric
  rather than buy safety — against this repo's stated **"lean, not exhaustive"** philosophy (§10).
  Revisit only if a mis-wire actually ships. Note the numbers here are a floor over _imported_ files,
  not the app (`vitest.config.ts` documents why), and `routes/`/`model/` are not gaps either: a route
  manifest is config and the model layer is types. **A colocated spec is also not what coverage
  measures** — both `@shared/data/effects/*.factory.ts` have no spec file of their own and sit at 100%
  statements, exercised through the per-domain effects specs, so "no `*.spec.ts` beside it" overstates
  a gap on its own.

  **`DeckFacade` is the one facade the paragraph above does not describe** (20% statements, **0%
  functions**, `deck.facade.ts:31-100`). Its reads are not delegation: `configuredEntries` orders the
  catalog, applies theme labels and then derives `hidden` from `hiddenEntries` and `moduleHidden` from
  `hiddenModules`; `configuredModules` dedupes and marks; `hasCustomConfig` checks three lists. Those
  two config lists are both arrays of strings, so swapping them compiles and silently breaks the module
  cascade — the mis-wire class with something real behind it. It stays unspec'd on the same
  cost argument, and the risk is bounded rather than absent: the pure helpers it composes
  (`commlink/util/deck.utils.ts` — `orderEntries`/`visibleEntries`/`resolveLabels`), `deck.reducer.ts`
  and the catalog's key completeness are each spec'd, and `e2e/commlink/deck-config.e2e.ts` drives the
  flow. What is unproven is the wiring on paths that e2e does not walk. **If any facade ever earns a
  spec, it is this one** — a pure `computed` over a mocked store, no component needed.
- **`selectNotificationsUnread`** on the dashboard read-model is the **sanctioned** shell-badge read
  (§6) — the read-model catalogs each domain's source+metric by design.
- **`ICategory.id: string` vs a `TCategoryId` alias** — cosmetic; the alias is a bare `string`, no
  divergence.
- **A category name is a label, never an identity — in all three owners.** grocery, tasks and cash
  hold `{id,name}` catalogs and reference entries by `TCategoryId`; ids are minted `uuidv4()` and
  never derived from the name. What the name still decides is *duplicate* handling, deliberately:
  adding an existing name is a no-op and renaming **onto** one merges — the loser's id is dropped and
  its referencing rows remapped to the survivor (`updateListCategory` in `@shared/util/list/list.utils.ts`
  for grocery/tasks, `CashActions.updateCategory` in `cash.reducer.ts`, which remaps rules too). That
  merge is why `CashCategoryPickerComponent.onRename` follows the survivor: the local draft would
  otherwise re-assert an id the reducer just retired.
- **A GUID per row, a natural key per singleton — and neither is a gap in the other.** Everything that
  exists as a row of its own mints `uuidv4()` (`IBaseItem`, `ICategory`, `IRecipeIngredient`, cash's
  account/transaction/rule, trackplay's `IBase` + `IGameType`). The identities that are _not_ GUIDs
  are natural keys, deliberately, because there the key **is** the thing: the list ids
  (`_storage`/`_products`/`_shopping`/`_tasks`/`_tracking` — simultaneously a route param, an effects
  guard and a persisted-doc discriminator), the deck catalog ids (§7.1 — absence-means-default
  replaces a migration ladder, which is why they are never renamed), `npc-summary-<source>`, and
  office-time's `officedays`/`freedays`/`holidays`, where a day is identified by its date — minting a
  GUID per logged day would _admit_ two rows for one date, which is precisely the invariant those
  collections exist to hold. Only `holidays` holds it structurally, being a `Record` keyed by date;
  `officedays`/`freedays` are `Array<Dayjs>`, which admits duplicates freely, so there the guard is
  explicit and load-bearing — `hasDay` in `office-time.reducer.ts` is what makes
  `addOfficeTime`/`addFreeday` idempotent (`setOfficedays` replaces wholesale and dedups nothing, so
  its callers must pass a set). Reading that guard as belt-and-braces and dropping it is how
  double-tapping "log today" would silently double the office-day count.
  **Comparing by name is legitimate in exactly one shape:** resolving
  input that never had an id to offer against, i.e. the recipe matcher's fallback for a storage row
  with no `productId` (`groceries/util/recipe-match.utils.ts`). Resolution of last resort, never
  identity.

### Measured gaps — all three closed

A whole-app audit on **2026-07-29** raised three, deliberately recorded as missing _mechanisms_ rather
than percentages (a count is what rotted in the NgRx-spine claim above). None is outstanding:

1. **Accessibility was ungated — fixed.** §10, _A11y is gated, and the gate needed help_.
2. **No global `ErrorHandler` — fixed.** §4, _The last-resort error boundary_.
3. **Toasts had no live region — the finding was false.** Ionic already announces every toast; see
   _Recorded decisions_ above.

**Two of the three were mis-measured, and in the same way both times: the instrument could not see
what it was looking for.** The facade "untested seam" counted colocated `*.spec.ts` files rather than
coverage (both `@shared/data/effects/*.factory.ts` have no spec and sit at 100%), and the missing live
region came from grepping `src/**/*.html` for `aria-live`, which cannot see a web component's shadow
DOM. The pattern is already in §10's gate discipline — _verify a diagnostic query returns what you
think before scoping work off it_ — and an audit is exactly a pile of diagnostic queries. Prefer the
measurement the toolchain already produces (a coverage report, `eslint --print-config`, the built
component source) over one improvised with grep.

---

## 13. Considered and not built

Kept so their absence doesn't read as an oversight.

- **`office-time → tracking` was never built.** An early design had office-time read a tracking
  read-model selector; the realized office-time is standalone and only reports telemetry.
- **`notify({ level })` as a generic action was not built.** The realized contract is
  `NotificationsActions` (§3.2).
- **"Every context lazy" did not survive contact with the notification inbox.**
  `feature/fully-lazy` routed both remaining eager sinks: `tracking` (a background timer bridged it
  to notifications — the timer was deleted, correctly) and `notifications`. Routing the inbox forced
  the durable-write port described in §3.5; that port is gone and the inbox is eager again, for the
  same reason the dashboard read-model always was. **Uniform lifecycle was the wrong goal** — the
  right one is a lifecycle that matches where a slice is written and read. No _supplier_ feature slice
  is eager.
- **A theme-composed i18n keyspace.** The original deck-label plan claimed "a third theme is a new
  JSON block, not a code change". That was the wrong trade — composing keys from `theme + id` made all
  60 invisible to `--clean`, and a missing theme could only be discovered at runtime as a raw key on
  screen. Declared `Record<TTheme, …>` fields turn it into a compile error (§7.1, §9).
- **A CI i18n freshness gate** — see §9; the formatting flags removed the need.
- **Closing `metric?: string` into a union** — keeping `metricKey` on the entry was preferred for
  consistency, at the cost of repeating three `marker('deck.metric.count')` literals.
- **`@ngrx/component-store` or a `signalStore` for dialog state** — `signal` + `computed` was the
  whole requirement (§2.6).

---

## 14. Patterns named

| Pattern                                         | Where it shows up here                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| Bounded context / shared kernel                 | Sheriff domains; `@shared` as a library                                       |
| Dependency Inversion (cross-cutting capability) | dashboard + notifications invert onto `@shared` contracts                     |
| CQRS read-model                                 | eager `dashboard` slice in `commlink/data`, fed by `report`, read by the deck  |
| Shared port ≠ shared read-model                 | only `DashboardActions.report` is in `@shared`; the slice belongs to its reader |
| Published Language / Open Host Service          | `DashboardActions.report`, `NotificationsActions`                             |
| Ports & Adapters                                | `DatabaseService` (per-key), `NotificationService` (OS adapter)                |
| Deferred command                                | notification CTA → `/tracking?cmd=` deep-link                                 |
| Facade + DI token                               | `LIST_FACADE` / `CATEGORIES_FACADE` decoupling generic pages from domains      |
| Architectural fitness function                  | eslint bans on `@ngrx` outside `data/` and on domain vocabulary in `@shared`   |
| Idempotent initialization                       | `DatabaseService.#ensureStorage()` memoized `create()`                         |
| Capability sink stays central                   | dashboard read-model + notification inbox eager despite everything else lazy   |
| Route a context by its writers, not its page     | the inbox is eager; `/notifications` is still a lazy page                     |
| Domain-owned route manifest                     | `<domain>/routes/<domain>.routes.ts`; the shell is a `path → loadChildren` table |
| Share the behaviour, not the instance           | `item-list.effects.factory` builders vs one shared effect class                |
| Pick the primitive by lifetime                  | dialog open-command as a signal, not a store slice                            |
| Ship the upgrade mechanism before the upgrade   | the `SwUpdate` prompt has to be in v1 to be able to announce v2               |
| One writer, many readers (no drift gate needed) | `package.json` version → esbuild `define` → web app + both Gradle fields      |
| Invariant over remembered rule                  | one `groceries` slice retired the co-registration rule                        |
| Fix the model before widening the abstraction   | groceries' bespoke load/save was four slices that were one context            |
| No global schema                                | `IAppState` deleted; ownership follows the slice                              |
| Strangler Fig / Expand-Contract                 | the migration approach throughout (see git history)                           |
