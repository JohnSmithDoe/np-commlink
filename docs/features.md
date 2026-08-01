# Features — groceries, the small domains, the list kit, the type layout

> Part of the np-commlink compendium. Index and §-to-file map:
> [project-summary.md](./project-summary.md). Section numbers are stable across the split.
>
> **Here:** §7.2 groceries (one context, five aggregates — incl. SOYKAF) · §7.4 tasks, tracking,
> barcode, office-time, trackplay, geist · §7.5 the shared list kit · §7.6 how types are sliced.
> **Split out:** the deck catalog (§7.1) → [deck-catalog.md](./deck-catalog.md) · cash / CREDSTICK
> (§7.3) → [cash.md](./cash.md).

## 7. The features

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
it" _is_ `_storage`), so the matcher reads its siblings via `sameTag`. Files: one slice folder,
`groceries/data/recipes/` (`recipes.actions` · `.reducer` · `.selector` · `recipes.facade`), plus the
pure matcher a layer down in `groceries/util/recipe-match.utils.ts`. Telemetry `source: 'recipes'` + `createMetric('count')`,
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

### 7.4 tasks, tracking, barcode, office-time, trackplay, geist

- **`tasks`** — the sealed twin. Reuses the same list UI but shares **no data** with groceries: its
  own list effects (an invocation of the shared `createItemListEffects` builder, not a copy of
  grocery's — the hand-written copy and its `listId` guard are both gone), its own
  `TasksListPageFacade`, `@shared` as its only dependency. It proves the kit is genuinely generic.
  It dropped its vestigial quick-add entirely.
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

### 7.5 The list kit

`@shared` owns the domain-blind frame: `item-lists`, `list-item`, searchbar / toolbar / empty-state,
`page-header`, the edit-modal shell, form inputs, the `LIST_FACADE` contract, and the single-list
helpers (`list.utils`/`list.selector`). Each domain projects its own row/form body and keeps its item
type in-domain (`<T>`). `IItemList<T>` carries neither `categories` nor `mode` (a catalog is its own
list beside the item list;
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

