# @shared quality backlog

Ranked, worst-first inventory of quality defects in the **domain-blind `@shared` kernel**,
produced 2026-07-24 by an adversarially-verified fan-out audit (6 reviewers → per-finding
skeptic verify; 28 of 34 findings confirmed, 6 rejected as intended-design). Adjacent-line /
cross-source duplicates from the audit are **merged** here into one entry each.

## The one root cause

Almost everything below is a single problem wearing many hats: **the merge namespaced all
kitchen-bot i18n keys under `grocery.` and re-domained the shared components, but never
re-homed the strings or de-domained the shared *types*.** So the domain-blind kernel now
"secretly speaks grocery" (and, via notifications/toast, "tracking"). Sheriff can't see it —
these are string literals and type unions, not import edges.

Two structural fixes retire most of the list:

1. **A neutral shared i18n namespace + facade-supplied keys.** The `@shared` shell owns generic
   keys (`item-list.*`, `dialog.*`, `categories-page.*`, `toast.saved`); anything genuinely
   domain-specific is passed in via `input()` / the `LIST_FACADE` contract (the mechanism
   `listHeader`/`listTitleKey` already prove). Retires **H1–H5, M1, M3** and the vocab lows.
2. **Make `types.ts` domain-blind.** `TItemListId` → opaque route token (`string`); the
   notification action shape → generic (`{ type: string; targetId?: string }`), with the
   `tracking.*` literals + `trackingItemId` moved into the tracking domain. Retires **H6, M2, L1**.

Do those two and ~18 of 28 fall out. The remainder are unrelated small smells.

---

## HIGH — domain vocabulary in the domain-blind kernel (fix first)

Each renders a *specific domain's* strings when a *different* domain mounts the shared surface
(a tasks list showing `grocery.*`; a tracking dialog showing `grocery.*`). Functionally harmless
today (keys resolve) but a latent correctness trap and the exact boundary you re-domained to close.

| # | File | Lines | Leak | Fix | Effort |
|---|------|-------|------|-----|--------|
| H1 | `@shared/data/item-dialogs/item-dialogs.reducer.ts` | 84–92, 114–122 | `grocery.edit.item.dialog.*` / `grocery.edit.category.dialog.*` markers baked into the self-declared **domain-blind dialog kernel**; `base-edit-item-dialog.ts:36-37` reads them straight through, so **tracking + tasks** edit dialogs render grocery keys | Move label choice out of the reducer: pass `saveButtonText`/`dialogTitle` marker keys on the `showEditDialog` payload (each domain owns its keys), or emit neutral `dialog.item.*` keys. Folds in L9 (duplicated ternary). | M |
| H2 | `@shared/feature/edit-categories-page/edit-categories.page.html` | 6,12,22,32,57,63,73,84,91,101 | 10 `grocery.*` keys (title, placeholder, count, empty, 6 a11y labels) in a page mounted by **tasks + cash** too | Re-home shell strings to neutral `categories-page.*`; keep only facade-supplied `listTitleKey` domain-specific | M |
| H3 | `@shared/ui/base-item/item-list/item-list-toolbar/item-list-toolbar.component.html` | 7,14,17 | `grocery.list-toolbar.sort-az` / `.list` / `.categories` — tracking's toolbar renders grocery keys | Neutral `item-list.toolbar.*` (mirror the already-neutral `item-list.empty.*` sibling) | S |
| H4 | `@shared/ui/…/list-item/list-item.component.html` **+** `@shared/ui/categories/category-item/category-item.component.html` | 52 / 15 | Both hardcode `grocery.action.delete`; consumed by tasks/trackplay/cash | One neutral `item-list.action.delete` key for both | S |
| H5 | `@shared/smart-ui/edit-category-dialog/edit-category-dialog.component.html` | 10,28,30 | `grocery.edit-item.dialog.button.close`, `grocery.edit.item.dialog.name[.placeholder]` (title/save correctly injected already) | Neutral namespace shared by all category-owning lists | S |
| H6 | `@shared/types.ts` | 82–83, 87, 96 | `TNotificationActionType = 'tracking.start'\|'tracking.stop'\|'tracking.pause'` + `trackingItemId` on `TNotificationAction`/`INotification` — tracking vocabulary in the "notifications knows no domain" port | Generic action shape `{ type: string; targetId?: string }`; move tracking literals + item ref into the tracking domain (it already builds the notifications it writes) | M |

---

## MEDIUM

| # | File | Lines | Issue | Fix | Effort |
|---|------|-------|-------|-----|--------|
| M1 | `@shared/feature/list-page/list-page.component.html` | 24,46,48 | `grocery.a11y.manage-categories`, `grocery.list-header.category[.filter]` in the domain-blind list-page shell | Facade-supplied keys (like `listHeader`) or neutral `list.*` namespace. Localise into a `headerLabel` computed (see L6) | M |
| M2 | `@shared/types.ts` | 62–63 | `TItemListId` closed union enumerates **every** domain's list id (`_storage/_products/_shopping/_tasks/_tracking`); a new bounded context can't exist without editing the kernel | `type TItemListId = string` (opaque route token); each domain declares + guards its own narrow union locally | M |
| M3 | `@shared/util/toast.service.ts` | 32 | `providedIn:'root'` shared service reads `marker('toast.tracking.saved')`; every sibling key is neutral and the translated text is generic | Rename key → `toast.saved` | S |
| M4 | `@shared/ui/base-item/item-list/item-list-search-result/` | — | **Dead code**: dir has only `.html` + empty `.scss`, no `.component.ts`, zero references (live analog is `groceries/ui/grocery-search-result`); also embeds `list-header.tracking.search` | Delete the directory | S |

---

## LOW — small smells (batch after the above)

| # | File | Line | Issue | Fix |
|---|------|------|-------|-----|
| L1 | `@shared/data/item-dialogs/item-dialogs.reducer.ts` | 17 | initial `listId` defaults to grocery `'_storage'` in the domain-blind kernel (inert placeholder) | `undefined` until an open-command sets it — unblocked once M2 gives a neutral type |
| L2 | `@shared/ui/page-header/page-header.component.ts` | 55 | domain-blind header pre-registers a roster of 6 domain program icons (`business/settings/documents/barcode/notifications/timer`) it never renders itself (icon arrives via `[icon]` input) | Register per-domain, or drop the roster |
| L3 | `@shared/util/list/list.utils.ts` | 71 | `console.warn` I/O side-effect inside a **pure reducer helper** (`updateListItem`), fires on the legit stale-save no-op path | Return state unchanged; move observability to the effect layer |
| L4 | `@shared/util/pipes/np-time-with-unit.pipe.ts` | 20 | eagerly computes all 3 units, `.0`-trim block duplicated 3×, then re-parses via `parseFloat` | Single `formatUnit(value, key)` helper; pick unit in one pass over raw seconds |
| L5 | `@shared/ui/forms/date-input/date-input.component.html` | 9 | `type="date_event"` is not a valid `ion-input` type (silently coerces to text) | `type="text"` (value is a formatted string; real picking is the `ion-datetime`) |
| L6 | `@shared/feature/list-page/list-page.component.html` | 43 | nested ternary in `[header]` binding | Extract `headerLabel`/`headerColor` computed signals (alongside existing `filterName`) — the finding that started this audit |
| L7 | `@shared/types.ts` | 40 | `TUpdateDTO<T> = IBaseItem & Partial<T> & { id: string }` — trailing `& { id: string }` is redundant (`IBaseItem` already requires it) | Drop it, or write `Partial<T> & Pick<IBaseItem,'id'>` |
| L8 | `@shared/ui/…/item-list-searchbar/item-list-searchbar.component.ts` | 26 | identical `addIcons({add,remove,cart,list})` copy-pasted across 4 components; searchbar/item-list/empty render **no** icon (dead); relies on ionicons global side-effect | Register only icons each template uses (searchbar: none; toolbar: `list`) |
| L9 | `@shared/data/item-dialogs/item-dialogs.reducer.ts` | 86 | update/create `saveButtonText` ternary duplicated verbatim in `showEditDialog` + `showEditCategoryDialog` | Extract one `saveButtonLabel(editMode)` — folds into H1 |
| L10 | `@shared/data/notifications.store.ts` | 31 | magic string `'notifications'` (db key + dashboard source) repeated 3× here + in load/save effects, no shared constant → silent-drift risk | Hoist a `NOTIFICATIONS_KEY` constant next to the transforms |
| L11 | `@shared/ui/categories/categories-dialog/categories-dialog.component.html` | 59 | `$any($event.target)` cast disables template type-checking (component already has a typed `searchbarInput` handler) | Typed `IonInputCustomEvent` handler reading `event.detail.value` |
| L12 | `@shared/feature/list-page/list-page.component.ts` | 59 | `itemTemplate = input.required<TemplateRef<any>>()` — child `ItemListComponent` already exports the typed `ItemListTemplateContext` | Use `TemplateRef<ItemListTemplateContext>` |

---

## Rejected (intended design — recorded so they don't get re-flagged)

- `dashboard.selector.ts:16` `selectNotificationsUnread` — the **sanctioned** shell-badge read of the dashboard read-model (architecture.md §6/§7); the read-model catalogs each domain's source+metric by design.
- `types.ts:43` `TItemListSortType = 'name' | string` — intentionally open so the kernel needn't enumerate domain sort keys (`bestBefore`/`prio`/`dueAt`); closing it would be the real leak.
- `types.ts:57` `ICategory.id: string` vs `TCategoryId` alias — cosmetic; alias is a bare `string`, no divergence.
- `edit-category-dialog.component.html:28` `edit-item.dialog` vs `edit.item.dialog` key shape — cosmetic; hyphens allowed in flat dotted keys.
- (`item-dialogs.reducer.ts:17` and the orphaned `item-list-search-result` template were each raised twice; the substantive versions are L1 and M4.)

---

## Gating (Track 1 — so cleared classes can't recur)

- **`no domain vocabulary in @shared`** — a custom lint/CI check: fail if `src/app/@shared/**` (non-spec) contains `grocery.` / `tracking.` / `tasks.` i18n keys or the domain `_listId` literals. This is the class Sheriff is structurally blind to; it's what would have caught H1–H6/M1/M3 at commit.
- **complexity / nested-ternary** — ESLint `no-nested-ternary` + a template-complexity rule (would catch L6 and future siblings).
- Land as `warn`, escalate to `error` per-class as each is cleared.
