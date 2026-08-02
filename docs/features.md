# Features — household, the small domains, the list kit, the type layout

The deck catalog → [deck-catalog.md](./deck-catalog.md) · cash / CREDSTICK → [cash.md](./cash.md).

## household — one context, five aggregates

`shopping`, `storage`, `products`, `recipes` and `listSettings` are aggregates of a **single**
`household` slice (one `npc-household` doc, one `[Household] load/loaded`). They freely import each
other (`sameTag`) — searching shopping reads the products catalog, the cross-list "copy to
shopping/storage" rules read siblings. That _is_ the intra-context coupling the DDD refactor wanted:
honest coupling inside one boundary, not three fake-independent domains. The multi-list engine
(`household-list.*`) and its effects ride in `householdContext` and guard on
`listId ∈ {_shopping,_storage,_products}`.

**Each aggregate owns a facade; the engine owns only what the route decides.** `ShoppingFacade`,
`StorageFacade`, `ProductsFacade` and `QuickAddFacade` sit in their own slice folders beside
`RecipesFacade` and `ListSettingsFacade`, holding the commands whose list is a **literal** —
reachable from one page only, so the `:listId` was never in question. `HouseholdListPageFacade` keeps
the `LIST_FACADE` contract, the searchbar/sort/filter commands, the cross-list copy tables and the
barcode scan: everything that reads the active list. A page injects both, which is why the aggregate
read is `allItems` and never `items` (→ [dialogs-and-forms.md](./dialogs-and-forms.md)).

Renames vs kitchen-bot, to avoid timetracker collisions: store keys `settings→listSettings`,
`dialogs→itemDialogs`; action sources `[Settings]→[ListSettings]`, `[ItemList]→[HouseholdList]`; types
`ISettings→ListSettings`, `IEditItemState→IItemDialogState`. The freed bare `settings`/`[Settings]`
names became the app-global version+theme+language slice.

**`groceries → household` (2026-08-02)** — the domain never was only groceries: it owns storage,
permanent entries, recipes and the list settings behind all of them, and the shipped copy already said
so (`deck.module.*` has read "Haushalt"/"Household" since the deck catalog landed). The folder was the
last place still claiming otherwise. Renamed whole — folder, route, `npc-household`, the `household.*`
key prefix and every symbol — because [deck-catalog.md](./deck-catalog.md) already argues that a
second spelling of a module name is worse than either spelling alone.

**SOYKAF, the recipe book** — a fourth household aggregate, not a domain of its own: a recipe is
expressed in the household vocabulary (ingredient lines _reference_ `_products` catalog ids, "do I have
it" _is_ `_storage`), so the matcher reads its siblings via `sameTag`. Files: one slice folder,
`household/data/recipes/` (`recipes.actions` · `.reducer` · `.selector` · `recipes.facade`), plus the
pure matcher a layer down in `household/util/recipe-match.utils.ts`. Telemetry `source: 'recipes'` + `createMetric('count')`,
which flipped the SOYKAF tile standby→online. The page is `household/feature/recipes-page` (+
`edit-recipe-dialog`) at the unchanged `/soykaf` path — **route path ≠ folder**, and the `kitchen`
domain is deleted. It deliberately does **not** ride `ListPageComponent`: its rows carry a match
verdict, not a name and a swipe. `Product.alwaysOnHand` (optional, so no migration) keeps staples
out of the missing count.

**Both halves of the match are id-based.** The recipe half always was; the storage half became so
when `StorageItem`/`ShoppingItem` gained an optional `productId` (`ProductLinked`) that the copy
factories stamp and carry across every hop — product→storage, product→shopping→storage (the common
one: buy, then move the bought rows), storage→shopping. Before it, the storage side resolved
`productId → product.name → a row with that name`, so renaming a product silently broke "do I have
it". The name comparison **stays as a fallback**: the field is legitimately absent two ways — a row
typed straight into the pantry was never a product, and rows persisted before it have none — which is
what keeps the fix migration-free.

## tasks, tracking, barcode, office-time, trackplay, geist

- **`tasks`** — the sealed twin. Reuses the same list UI but shares **no data** with household: its
  own list effects (an invocation of the shared `createItemListEffects` builder, not a copy of
  household's — the hand-written copy and its `listId` guard are both gone), its own
  `TasksListPageFacade`, `@shared` as its only dependency. It proves the kit is genuinely generic.
  It dropped its vestigial quick-add entirely.
- **`tracking`** — single-list engine over `state.tracking`, plus a `TrackingFacade` for the timer,
  session archive, stats view and CSV export. Publishes into the inbox and receives deep-link CTAs
  ([cross-feature-communication.md](./cross-feature-communication.md)); its former standalone item-list engine + `dialogs` fork were folded onto the shared
  mechanics (the last timetracker×kitchen-bot merge-duplicate).
- **`barcode`** — SIGIL, an uploaded badge image, in its **own** `barcode` slice (`npc-barcode`),
  hydrated by its own resolver. Imports no domain and reports no telemetry (a deck tile with no live
  metric). Until sheriff-tighten the badge lived in the `officeTime` slice; moving it home deleted the
  app's last cross-domain import. **Not to be confused with** `household/util/barcode-scanner.service.ts`
  — the mlkit EAN-13 camera scanner behind a native-guarded scan button on the shopping/storage
  pages, which is why it lives in `household`, not `@shared`.
- **`office-time`** — office-presence dashboard + wordclock. Despite what early plan drafts proposed
  it does **not** read tracking; it is standalone and only reports telemetry. One `officeTime` slice
  (a second feature-flag slice was removed as dead code once the settings re-scope left it holding
  one unread flag). It persists dayjs date maps as strings, hence the `TStored ≠ TState` split.
- **`trackplay`** — Shadowrun game-score tracker. Its imperative edit modals live in
  `trackplay/feature/` (smart-ui cannot reach the shared `BaseModalDialog`). Its undo toast keeps its
  own `ToastController`.
- **`geist`** — a console onto **Chrome's built-in Prompt API** (Gemini Nano, on-device — no key, no
  network per prompt) via `@shared/util/theme/language-model.service.ts`. **Web-desktop-only by design:**
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

## The list kit

`@shared` owns the domain-blind frame: `item-lists`, `list-item`, searchbar / toolbar / empty-state,
`page-header`, the edit-modal shell, form inputs, the `LIST_FACADE` contract, and the single-list
helpers (`list.utils`/`list.selector`). Each domain projects its own row/form body and keeps its item
type in-domain (`<T>`). `ItemList<T>` carries neither `categories` nor `mode` (a catalog is its own
list beside the item list;
the tracking list carries empty defaults). There is no shared datastore type — `DatabaseService` is
generic over the caller's `T`.

## Types

**Sliced by concern, never a god file — and never a barrel:** `<domain>/model/<concern>.types.ts`
everywhere. `cash` splits into `account`/`transaction`/`rule`/`cash.types`; `household` into
`household-list`/`recipe`/`list-settings`/`household.types`; a domain whose model is one tightly-coupled
concern keeps one file named for it (`barcode.types`, `tracking.types`, `task.types`,
`trackplay.types`, `office-time.types`, commlink's `dashboard.types` + `deck.types`). The
`model/index.ts` barrels are gone, so an import line names the vocabulary it uses. A `*.consts.ts`
appears only where there is a body of constants (`geist`), not for a domain's one list-id.

In `@shared/model`, `app.types.ts` keeps only the primitives every layer speaks (`Marker`,
`Timestamp`, `IonColor`, `Theme`, `IonDragEvent`); each shared concept owns a file beside it —
`base-item.types` (`BaseItem`/`UpdateDTO`/`EditItemMode`), `category.types`, `item-list.types`,
`notifications.types` (inbox shapes **plus** the `ToastMessage` contract), `dashboard.types`,
`settings.types`.

Two type decisions are deliberate and recorded so they aren't re-flagged: `ItemListSortType =
'name' | string` stays **open** so the kernel needn't enumerate domain sort keys (`bestBefore`,
`prio`, `dueAt`) — closing it would be the real leak; and `NotificationAction` is generic
(`{ type: string; targetId: string }`), with the `tracking.*` command literals in tracking's own
model as `TrackingCommand`, since tracking is the only thing that interprets them.

