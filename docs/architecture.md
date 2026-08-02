# Architecture — layout, boundaries, routing, state

Part of the np-commlink compendium; index: [project-summary.md](./project-summary.md). **Not here:**
dialogs & forms → [dialogs-and-forms.md](./dialogs-and-forms.md) · how features talk →
[cross-feature-communication.md](./cross-feature-communication.md) · what boots when →
[lifecycle-and-persistence.md](./lifecycle-and-persistence.md).

## The two forces

1. **Bounded contexts, sealed by Sheriff (compile time).** `domain:* → sameTag + domain:shared`, with
   **zero** explicit bridges. A feature cannot reach another feature by `import`.
2. **Nearly every bounded context is lazy (runtime).** A slice, its effects and its component code
   register only on navigation to its route.

Together: **a feature is normally neither importable nor present.** Every legitimate cross-feature
interaction goes through one of the five channels in
[cross-feature-communication.md](./cross-feature-communication.md).

> **Pattern — "shared means domain-agnostic."** `@shared` is a _library_, not a domain. Anyone may
> import it; it knows nothing about any specific feature (no `state.shopping`, no `switch(listId)`).

## Folder layout (Hahnekamp-style, Sheriff-enforced)

Domain-first, sliced by type; every dir carries `domain:*` + `type:*`, derived from the two path
segments `src/app/<domain>/<type>` (`sheriff.config.ts`).

```text
src/app/
  app.component.ts / app.routes.ts / app.providers.ts / app-title.strategy.ts   ← type:shell

  @shared/                                            ← domain:shared
    model/   app.types.ts (primitives) + one file per shared concern:
             base-item · category · item-list · notifications · dashboard · app.consts
    data/    actions/ (DashboardActions · NotificationsActions) · item-lists/ (the event map +
             the list effect builder) · persisted-states/ (the context descriptor, the
             load/save/telemetry builders, boot + route hydration) · categories/
    util/    categories/ · charts/ · errors/ · formatting/ · forms/ · item-lists/ (list.utils ·
             list.selector · LIST_FACADE · ItemDialogService) · persistence/ (DatabaseService ·
             versioned) · service-worker/ · services/ · theme/ (theme · language ·
             language-model · ionic-color)  +  flat app.utils / app.factory / app.modal.utils
    ui/      base-item/ · categories/ · forms/ · page-header/
    feature/ item-lists/ (list-page · edit-item-dialog) · categories/ (category-list-page ·
             edit-category-dialog) · modal-dialog/ (the second dialog base)
    testing/ test-data.ts (deterministic factories) · test-providers.ts        ← type:testing

  commlink/ tracking/ office-time/ notifications/ barcode/ settings/    ← timetracker domains
  household/            ← shopping + storage + products + recipes (SOYKAF), one slice
  tasks/ cash/ trackplay/                                              ← one domain each
  geist/                ← feature + model + util only; NO data/ layer (holds zero NgRx state)
```

Inside every `<domain>/data/`, files are grouped by **slice, not by NgRx role** — a slice's actions,
reducer, selectors, effects and facade sit together, and the role is carried by the **filename**:

```text
<domain>/data/
  <slice>/       <slice>.actions.ts · .reducer.ts (+ .spec) · .selector.ts (+ .spec) ·
                 .effects.ts (or <slice>-<role>.effects.ts once a slice has more than one) ·
                 that slice's facade
  <x>.facade.ts · <domain>.providers.ts · index.ts   ← the DI-facing root, plus anything
                 spanning slices
```

**A single-slice domain has no subfolder at all** — the slice _is_ the domain, and a folder would
only repeat the filenames inside it. **Eight of the eleven data layers are that shape** (`tracking`,
`tasks`, `cash`, `trackplay`, `office-time`, `notifications`, `settings`, `barcode`). Only
**`commlink`** (`dashboard/` · `deck/`) and **`household`** (eight slices) subdivide — and
`@shared/data`, which owns no slice, groups by **concern** instead.

> **Pattern — group by what changes together, name by what a file is.** Role folders spread one slice
> across four directories, so touching `deck` meant four `cd`s and every listing mixed unrelated
> slices — and charged that ceremony to the eight domains that only ever had one slice to sort. The
> role was never ambiguous in the filename, so encoding it twice bought nothing.

Three rules keep that honest:

- **The root of `data/` is the DI surface plus whatever spans slices.** `index.ts`, the
  `<domain>.actions/reducer/selector` triple and `<domain>.providers.ts` belong to the domain rather
  than to one slice, and so does `router.selector.ts` — a route read no slice owns. `household`'s
  multi-list engine reads **three** slices, so it is not one slice's either, but it is large enough to
  be its own group: `household/data/list/` holds `household-list.*` plus
  `household-list-page.facade.ts`. What reads **one** goes in that one's folder: each household list
  owns a `<slice>.facade.ts` beside its own actions and selector. A command whose list is a literal was
  never the engine's. Where a context bundle _is_ one slice's it stays with that slice; `commlink`'s is
  flat because it `mergeContexts` two slices and belongs to neither.
- **`data/` holds no pure logic.** A `<slice>.utils.ts` importing no `@ngrx` is not data — it lives in
  the domain's own `<domain>/util/`, and `data → util` is a legal downward edge.
- **Shared-ness is a property of who imports a thing.** `notifications.transforms` sat in
  `@shared/util` from when the inbox had two write paths; once the second was deleted both importers
  were in `notifications/data`, so it moved home. Re-check whenever a second consumer goes away.

**None of this moves a Sheriff boundary:** tags come from the two segments `src/app/<domain>/<type>`,
so any depth below `<type>/` is navigation only — which is equally why `@shared/util`,
`@shared/data`, `@shared/feature` and `cash`'s `feature`/`util` could be regrouped by concern.

## Sheriff dependency rules

- **Domain axis:** `domain:* → sameTag + domain:shared`. No exceptions. The old bridges are gone:
  `shopping↔storage` and `shopping/storage→products` became _intra_-`household`;
  `notifications→tracking` and `commlink→{notifications,office-time}` were **inverted** onto the
  published contracts; `barcode→office-time` disappeared when the SIGIL badge moved into `barcode`'s
  own slice. Verify with `pnpm exec sheriff verify src/main.ts`.
- **Type axis:** `routes → feature/data/util` · `feature → smart-ui/ui/data/util/model` ·
  `smart-ui → ui/data/util/model` · `ui → util/model` · `data → util/model` · `util → model`.
  `type:testing` may reach any layer, but only `*.spec.ts` may import it.
- **`smart-ui` is a strict leaf** (no `sameTag`): a smart component composes dumb `ui`, never another
  smart component — composing stateful components is orchestration and belongs in `feature/`. Hence
  the `edit-*-item-dialog` wrappers live in `<domain>/feature/`, and `categories-dialog` is rendered
  by those wrappers rather than nested inside `category-input`. **`@shared` has no `smart-ui` layer**
  — its last inhabitant became a dumb `ui` component when the `itemDialogs` slice retired.
- **Each `<domain>/data/` is a facade barrel** (`index.ts`): outside code imports the folder and sees
  the action group, published selectors, the `<domain>Context` bundle and any `ListPageFacade`.
  Reducer, effects and internal selectors are encapsulated; a deep import is a violation. Every other
  layer is barrel-less (`enableBarrelLess: true` — per-folder, not global).
- **`@shared/data` is the deliberate exception — it stays barrel-less.** The barrel seals a _domain_
  behind its context bundle, and `@shared/data` has no slice to seal; what remains is a library of
  unrelated helpers with no single public API, so it keeps self-documenting deep imports. Sub-folder
  barrels aren't an option either: the Sheriff `modules` glob is one level deep.
- **`@shared` is layered downward.** `@shared/data` holds only what is genuinely NgRx: the two
  published contracts (both **write-only**, so it holds no selector at all — the kernel names no
  domain's store key), the shared `item-lists` event map, the generic load/save/telemetry **effect
  builders**, and `BaseCategoryListPageFacade`. The list engine's pure logic, `ItemDialogService`,
  `LIST_FACADE` + `ListPageFacade` and the `CategoryListPageFacade` token sit a layer down in
  `@shared/util`.

## Routing

Hash routing (`withHashLocation()`). **`app.routes.ts` is a `path → loadChildren` table that names no
domain internals.** Each domain publishes `<domain>/routes/<domain>.routes.ts`, tagged
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

- **The domain data layers leave the initial chunk.** A static import of eleven `data` barrels at the
  root put every reducer, effect and facade in the initial bundle. The `loadChildren` edge is now the
  only shell→domain import: 1.48 → 1.40 MB raw, 42 → 34 initial chunks. Over the wire ≈ 0 (the service
  worker prefetches `/*.js`), so what it buys is ~80 kB less JS _evaluated at boot_, plus the seal.
- **A domain's routing is sealed.** Sheriff resolves imports through `ts.preProcessFile`, which reports
  dynamic `import()` too, so a `loadComponent` reaching another domain fails `verify` — impossible to
  catch while the table lived in the domain-less shell. The manifest deliberately is **not** in
  `feature/`: `type:feature` has no `sameTag`, so loading a sibling page from there would need that
  tightened rule re-opened.
- **The context sits on the subtree root, once.** A componentless parent carries `...<domain>Context`
  for all its pages and Angular reuses a parent whose params don't change — so
  `cash → cash/rules → cash/report` dispatches `[Cash] load` **once**, against 4× before.

**Every path is a domain prefix.** Root entries: `commlink` (+ `/commlink/deck`), `tracking`, `data`,
`office-time` (+ `/settings`), `settings`, `barcode`, `notifications`, `geist`, `soykaf`,
`household/*`, `tasks/*`, `cash/*`, `trackplay/*`; `**` → `commlink`. Household pages live at
`household/{shopping,storage,products,categories}/:listId` + `household/list-settings`; the tasks
catalog at `tasks/categories`. A domain orders its own pages (`cash/rules` before `cash/:accountId`).
Only `/soykaf` and `/data` deliberately don't read as their folder — they are deck programs, product
surfaces rather than structure. **Old pre-prefix URLs are not redirected.**

`/commlink/deck` is reached from `/settings` by a **link**, not a route nesting: `settings → commlink`
is a domain violation, so the page that edits the deck lives under the deck's owner. Titles come from
`data.title` on the leaf route + `AppTitleStrategy` (deepest wins).

## State — NgRx sealed behind per-domain facades

**No `@ngrx` import lives outside `data/`.** Every dispatch and read goes through an
`@Injectable({providedIn:'root'})` **`<Domain>Facade`** — the only place `Store` is injected for that
domain's consumers. It exposes state as `selectSignal(...)` signals (route-parameterised reads as
factory methods) and commands as `dispatch(...)` methods. Enforced by `commlink/ngrx-data-layer-only`,
which allows `@ngrx/*` only in `app.providers.ts`, `**/data/**`, the test kit and `*.spec.ts`.

> **Pattern — facade + architectural fitness function.** Don't rely on discipline to keep the store
> inside `data/` — make the boundary _fail closed_, the same idea as a trust boundary in infra.

**Three facade file shapes, one rule: the `-page` suffix encodes a token binding, not page-ness.**

| Shape | Means | Examples |
| --- | --- | --- |
| `<domain>.facade.ts` | the domain's general facade | `TrackingFacade`, `CashFacade`, `TrackplayFacade`, `BarcodeFacade`, `OfficeTimeFacade`, `NotificationsFacade`, `SettingsFacade`, `DashboardFacade`, `DeckFacade` |
| `<aggregate>-page.facade.ts` | implements a shared page **token** (`LIST_FACADE` / `CATEGORY_LIST_FACADE`) | `HouseholdListPageFacade`, `TasksListPageFacade`, `TrackingListPageFacade`, `HouseholdCategoriesPageFacade`, `TaskCategoriesPageFacade`, `CashCategoriesPageFacade` |
| `<aggregate>.facade.ts` | an aggregate facade binding no token | `ShoppingFacade`, `StorageFacade`, `ProductsFacade`, `QuickAddFacade`, `RecipesFacade`, `ListSettingsFacade` |

The first token follows the **aggregate**, not the domain folder — which is provable from `household`
alone, since it owns **two** of them: `HouseholdListPageFacade` is named for the `household-list.*`
engine and `HouseholdCategoriesPageFacade` for the category catalog, so the folder cannot be what
names either. (Before the rename this read "matches `grocery-list`, not `groceries`" — same rule, an
example that only worked while the two words differed.) `tracking` carries both shapes — the list binding,
plus a `TrackingFacade` for the timer/archive/stats/CSV surfaces that are not list concerns.

**Facades are root singletons** — a component spec overriding a selector between two `createComponent`
calls must `store.refreshState()`.

**There is no root-state type.** `IAppState` was deleted. Every slice is read through its own
`createFeatureSelector<SliceState>(SLICE_STATE_KEY)` and every facade injects the bare `inject(Store)`.
A complete root type is impossible by construction: the eager slices are domain-owned (Sheriff bars
`@shared/model` from naming a domain type), every other context is lazy, and `main.ts` may not import
`type:model` at all. The only survivor is the test kit's `MockKernelState`/`MockState`, scoped to what
`provideMockStore` seeds.

> **Pattern — no global schema.** A type enumerating everyone's state re-couples the modules you just
> sealed. When a boundary makes a "complete" global type _impossible_, that is the design telling you
> the type shouldn't exist — not that it needs an exception.

**Reconsidered 2026-08-01 and rejected again — but it found a real hole.** The proposal was to type
the *eager kernel* rather than the whole store: five always-present slices, named in `type:shell`. It
fails twice over. **Nothing that would benefit could import it** — selectors and facades are
`type:data`, which cannot reach the shell, and must not: the shell is the composition root, so that
edge is a cycle. And **nothing would keep it true**: `ContextBundle` is `{providers, resolve}` with no
type parameter, so both the key and `TState` are erased before `provideAppKernel()` sees a bundle.
Making it self-enforcing needs a phantom type threaded through `providePersistedContext` →
`mergeContexts` → `provideAppKernel`, which is nominal-type machinery for a five-entry list that
changes about once a year.

What it did surface is fixed: **a slice key used to be written twice** — as `key:` in the descriptor
and inside `createFeatureSelector` — across all eleven contexts. Those two strings never had to agree
to compile, and a mismatch is invisible until a selector reads `undefined` off a slice registered
under another name. Each slice now exports one `<SLICE>_STATE_KEY` from its selector file and both
sites read it. `router` is the deliberate exception: its key is an object property in
`provideStore({ router: routerReducer })` and its selector lives in `household/data`, so a const would
have to cross a domain seal to save a string NgRx itself names.

> **Pattern — prefer deleting the second declaration over checking two against each other.** One
> source of truth needs no validation, costs nothing, and cannot be bypassed.

**Action-group event keys are camelCase identifiers**, never quoted title-case. `createActionGroup`
camelCases either way, so creator names are identical; what changes is the generated `type`
(`[Source] addItem`), which makes an action greppable by the one name it has. **Nothing may match on
that string** — use the creator. Parsing the _source_ prefix is fair game (`listIdByPrefix` reads
`[Storage]`), being a slice identity rather than an event name.

**One multi-list engine + shared single-list helpers.** `household`'s `household-list.*` files are the
multi-list engine (source `[HouseholdList]`) — `selectListState` derives the active list from the
`:listId` route param. The single-list domains (`tracking`, `tasks`) have **no** engine: each owns its
slice and builds its list flow on the domain-blind `@shared/util/item-lists` helpers, driving the
shared `ListPageComponent` through its own `*ListPageFacade`.
