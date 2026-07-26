# @shared quality backlog

Ranked, worst-first inventory of quality defects in the **domain-blind `@shared` kernel**.
Originally produced 2026-07-24 by an adversarially-verified fan-out audit (6 reviewers →
per-finding skeptic verify; 28 of 34 findings confirmed).

> **CLOSED 2026-07-25.** Every HIGH, MEDIUM and LOW finding is resolved, and the class is now
> **gated** so it cannot come back (see *Gating* below). This file is kept as the record of what
> the audit found and how each item was settled — the live open list is `open-tasks.md`.

## The one root cause

The audit's single root cause was: **the merge namespaced all kitchen-bot i18n keys under
`grocery.` and re-domained the shared components, but never re-homed the strings or de-domained the
shared *types*.** Both halves are now closed.

1. **A neutral shared i18n namespace.** The two shared surfaces that still rendered `grocery.*`
   keys for *every* domain — the manage-categories page (**H2**, 10 keys, mounted by grocery, tasks
   AND cash) and the domain-blind list-page shell (**M1**) — moved onto `categories.*` /
   `categories.a11y.*` / `item-list.header.*` / `a11y.back`, joining the earlier `item-list.*` /
   `toast.*` neutralisations. `grocery.list-header.tasks` came along for consistency: tracking's
   equivalent was already the unprefixed `list-header.tasks`.
2. **A domain-blind kernel model.** `TItemListId` → opaque token (**M2**) was already done; the
   notification port (**H6**) is generic now too — `TNotificationAction` is
   `{ type: string; targetId: string }`, and the `tracking.*` command literals live in tracking's
   own model as `TTrackingCommand`, since tracking is the only thing that interprets them
   (`stateHintForCta`). Doing it revealed that the top-level `INotification.trackingItemId` was
   **write-only**: set by tracking's projection and by the debug fixture, read by nothing.

---

## Resolved — the LOW smells

| # | Outcome |
|---|---|
| L2 | The domain-blind `page-header` no longer pre-registers a roster of 6 domain icons; each page registers the icon it passes, and the header keeps only the `add` its own template renders. This surfaced a latent bug: `/trackplay/players` never registered `people-outline` and rendered it only because the *games* page happened to put it in the global ionicons registry — a cold load straight to that route showed no icon. |
| L3 | `updateListItem` no longer `console.warn`s from inside a pure reducer helper, and a stale update now returns the SAME state object instead of a fresh one with copied contents (a no-op must not hand downstream selectors something new to recompute from). |
| L5 | `date-input`'s invalid `type="date_event"` → `type="text"`. |
| L6 | Superseded — the nested ternary went with M1's key rename. |
| L7 | `TUpdateDTO<T>` dropped its redundant `& { id: string }`. |
| L8 | The searchbar's `addIcons({add, remove, cart, list})` was entirely dead — it renders no icon at all. Removed. |
| L10 | Obsolete — `notifications.store.ts` no longer exists; the cross-module write port was deleted when the inbox went eager. |
| L11 | Obsolete — the `$any($event.target)` cast is gone from `categories-dialog`. |
| L12 | `list-page`'s `itemTemplate` is typed `TemplateRef<ItemListTemplateContext>` rather than `any`, using the context the child already exports. |

---


## Resolved since the audit (recorded so they don't get re-flagged)

- **H1, L1, L9 — retired with the `itemDialogs` slice.** The domain-blind dialog reducer that baked
  in `grocery.edit.*` markers (and defaulted `listId` to `'_storage'`) no longer exists; the
  open-command is a nullable signal on `ItemDialogService` and each domain owns its label keys
  (architecture.md §4.1b).
- **H5 — gone with `@shared/smart-ui`.** The store-bound `edit-category-dialog` became a dumb `ui`
  `category-name-dialog`; `@shared` has no `smart-ui` layer at all now.
- **H3, H4, M3 — the i18n pass.** Toolbar → `item-list.toolbar.*`; delete → `item-list.action.delete`;
  toast → `toast.saved`. No `grocery.`/`tracking.` keys remain in those files.
- **M2 — `TItemListId` → opaque `string`.** `groceries/model` owns the only closed set
  (`GROCERY_LIST_IDS` + `isGroceryListId` boundary guard); `tasks`/`tracking` each own one const.
  Killed three `default: throw` branches and the `?? '/shopping/_shopping'` fallbacks.
- **M4 — dead `item-list-search-result/` dir deleted.**
- **L4 — `np-time-with-unit.pipe.ts` removed** (the offending pipe no longer exists).

## Rejected (intended design — recorded so they don't get re-flagged)

- `dashboard.selector.ts` `selectNotificationsUnread` — the **sanctioned** shell-badge read of the
  dashboard read-model (architecture.md §6/§7); the read-model catalogs each domain's source+metric
  by design.
- `item-list.types.ts` `TItemListSortType = 'name' | string` — intentionally open so the kernel needn't
  enumerate domain sort keys (`bestBefore`/`prio`/`dueAt`); closing it would be the real leak.
- `category.types.ts` `ICategory.id: string` vs `TCategoryId` alias — cosmetic; alias is a bare `string`, no
  divergence.

---

## Gating (so the cleared class can't recur)

**`no domain vocabulary in @shared` — landed at `error`** (`eslint.config.js`). A
`no-restricted-syntax` rule fails any domain-prefixed literal
(`grocery.|tracking.|tasks.|cash.|trackplay.|officetime.|geist.`) under `src/app/@shared/**`,
specs excluded. This is exactly the class Sheriff is structurally blind to: it checks import
edges, and `'grocery.a11y.back' | translate` is a string, not an edge.

> **Trap worth knowing.** The rule needs TWO node types. A quoted key is a `Literal` in
> TypeScript but a `LiteralPrimitive` in an Angular template, so a `Literal`-only selector
> silently passes every template — and templates are where most of this class lived. The first
> cut of the rule did exactly that and let a deliberately re-injected leak through. Always
> verify a new gate by re-introducing the thing it is supposed to catch.

**Not pursued:** the HTML half of `pnpm exec eslint` is worth wiring into the lint script — the
project's `"lint": "ng lint"` and the ad-hoc `eslint "src/**/*.ts"` in CLAUDE.md both skip
templates, so template rules (including this gate) only run when someone passes `*.html`
explicitly or via the lint-staged hook.
