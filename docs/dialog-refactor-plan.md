# Dialog refactor — execution plan

Executes the "Merge leftovers to reconcile" entry in `open-tasks.md`. Drives the item-edit
dialog from a store-bound `smart-ui` component to a pure `ui` shell, de-globalizes the category
subsystem into the domains, and deletes the tracking fork. Each stage ends **green** on all gates
(`tsc -p tsconfig.app.json --noEmit` + `-p tsconfig.spec.json --noEmit` · `pnpm exec sheriff
verify src/main.ts` · `pnpm exec eslint "src/**/*.ts"` · `pnpm test` · `pnpm run build`) and is a
separate commit.

## Decisions (from the design drill)

- **Pure-`ui` modal.** `item-edit-modal` moves to `@shared/ui`: `input()` item / isOpen /
  saveButtonText / dialogTitle / **closeButtonText** (the last is why tracking had to fork — the
  old shell hardcoded a `grocery.`-prefixed close key) / listItems; `output()` nameChange /
  confirm / cancel / dismiss. Keeps `<ng-content>`. No `Store`.
- **Draft is local to the domain feature wrapper** (a signal), seeded from the open-command.
- **`confirmChanges` carries `{ item, listId }`**; the grocery/tasks effects filter on the
  payload and drop the `concatLatestFrom(selectEditState)` store read.
- **Categories de-globalized (per Martin, 2026-07-18).** Delete the shared
  `itemDialogs.category` working-copy + `CategoriesActions` + the shared category selectors.
  Categories are handled per-domain: the **catalog + `addCategory`/`updateCategory` already live
  in each domain's slice**; the transient selection folds into the wrapper's local draft; the
  category picker's search is component-local. The category components (`category-input`,
  `categories-dialog`, `edit-category-dialog`) become pure `ui`. (A global **agenda** will later
  own the genuinely cross-cutting case — not built now.)
- **Tracking fork deleted.** `tracking/smart-ui/item-edit-modal` goes; tracking reuses the shared
  pure-`ui` modal. `tracking/data/dialogs` stays (it is already tracking's own domain-local
  dialog state and has no categories).
- **Open trigger:** inline `<ion-modal [isOpen]>` (Ionic-recommended), driven by a minimal
  per-domain open-command (`isOpen` + seed item + listId), `didDismiss` → hide.

## Current shape (verified post-DDD-split, HEAD da5d4bc)

- Kernel types (`IBaseItem`, `IItemDialogState`, `TItemDialogsState`, `ICategoriesState`,
  `TEditItemMode`) stayed in `@shared/types.ts`; only domain item types moved out. Draft seeded
  with the domain-blind `createBaseItem('initial')`.
- `@shared/data/item-dialogs` slice holds: `{ isEditing, item, listId, category:{ categories(copy),
  selection, searchQuery, isSelecting, isEditing, editItem, original }, editMode, saveButtonText,
  dialogTitle, addToAdditionalList }`.
- Content projection already exists: `item-edit-modal` is a `<ng-content>` shell; wrappers
  (`edit-{storage,shopping,product}-item-dialog`, `edit-task-item-dialog`,
  `edit-tracking-item-dialog`) project domain fields + the category components and dispatch
  `updateItem` patches.
- Pages open via `dispatch(ItemDialogsActions.showEditDialog(item, listId))` and render the
  wrapper in-template (always mounted).
- Effects: `groceries/data/grocery-list/grocery-item-dialogs.effects.ts` (`confirmItemChanges$`
  reads `selectEditState`), `tasks/data/tasks-item-dialogs.effects.ts`,
  `tracking/data/dialogs/dialogs.effects.ts`.
- Tracking: own `dialogs` slice `{ isEditing, item }` (no categories) + own modal clone.

## Stages

1. **Additive pure-`ui` components.** Create `@shared/ui/item-edit-modal` + pure-`ui`
   `category-input` / `categories-dialog` / `edit-category-dialog` (new, unused). Gate.
2. **Storage vertical.** Migrate `edit-storage-item-dialog` + storage effect/open-command to the
   new components + local draft + payload `confirmChanges`. Prove the pattern end-to-end (e2e).
3. **Shopping + products verticals** (products carries the "add to additional list" flow).
4. **Tasks vertical** (verify task category usage first).
5. **Tracking vertical.** Point `edit-tracking-item-dialog` at the shared pure-`ui` modal; delete
   `tracking/smart-ui/item-edit-modal`.
6. **Delete the globals.** Remove old `@shared/smart-ui` dialog components + `itemDialogs.category`
   + `CategoriesActions` + dead shared selectors; shrink the kernel slice to the open-command.
   Update `open-tasks.md` (mark done) + this doc.

## Progress

- ✅ **Stage 1** (commit `80c0429`): pure-`ui` `@shared/ui/item-edit-modal`.
- ✅ **Stage 2**: storage vertical. New pure-`ui` `@shared/ui/category-input` +
  `@shared/ui/categories-dialog`; `edit-storage-item-dialog` reads the shared open-command, owns a
  **local draft**, folds category selection in, and saves via `StorageActions.addOrUpdateItem`;
  catalog from the new `selectStorageCategories`. New e2e drives open → rename → save. Gates:
  tsc(app+spec) · sheriff · eslint · build(AOT) · 752 unit · 4 storage e2e — all green.
  - **Bug found + fixed by the new e2e:** the save button bound `[disabled]="nameInput.invalid"` —
    the signal *function* (always truthy → save permanently disabled) — corrected to
    `nameInput.invalid()`. The **old** `@shared/smart-ui/item-edit-modal` has the same no-parens
    binding and is still used by shopping/products (until Stage 3) and the tracking/tasks paths, so
    they carry the latent bug; each vertical's migration to the new modal fixes it.

- ✅ **Stage 3**: shopping + products verticals migrated to the same pattern
  (`selectShoppingCategories`/`selectProductsCategories` catalogs; local drafts; save via
  `ShoppingActions`/`ProductsActions.addOrUpdateItem`). Products preserves the "create & add to
  another list" flow — confirm reads `addToAdditionalList` off the open-command and also dispatches
  `StorageActions`/`ShoppingActions.addProduct`. New shopping edit e2e; products cross-add unit-tested.
  All gates green (755 unit, 6 grocery e2e).

- ✅ **Stage 4**: tasks vertical. Tasks **does** use categories (prio + dueAt + category), so it
  got the full treatment: `selectTasksCategories` catalog, local draft, save via
  `TasksActions.addOrUpdateItem`, `addCategory` to the tasks slice. New tasks edit e2e. Gates green
  (756 unit, tasks e2e).

- ✅ **Stage 5**: tracking vertical + **fork deleted**. `edit-tracking-item-dialog` now composes
  the shared pure-`ui` `@shared/ui/item-edit-modal`; `tracking/smart-ui/item-edit-modal` (the merge
  clone) is removed. Tracking has no categories; the notification toggles + name edit a local draft
  and confirm saves via `TrackingActions.addOrUpdateItem`. Tracking keeps its own `dialogs`
  open-command slice. Gates green (755 unit, tracking e2e). *Note:* the tracking clone actually had
  the **correct** `nameInput.invalid()` binding — the fork carried a fix the shared smart modal
  lacked, so grocery/tasks (on the buggy shared modal) had the always-disabled-save bug, now fixed.

- ✅ **Stage 6 — cleanup (DONE).** Deleted the 3 dead smart components
  (`@shared/smart-ui/{item-edit-modal,category-input,categories-dialog}`). Trimmed the shared
  kernel to the **open-command + category-rename** only: `ItemDialogsActions` lost
  `updateItem`/`removeCategory`/`confirmChanges`/`abortChanges`; `CategoriesActions` lost the whole
  selection flow (`addCategory`/`toggle`/`search`/`updateSelection`/`showDialog`/`confirm`/`abort`);
  `ICategoriesState` narrowed to `{editItem,original,isEditing}`; the reducer/selectors dropped the
  selection cases/selectors; both dialog-effects files trimmed to the live open-producers +
  `confirmEditCategoryChanges$`. Specs (reducer/selector/both effects + the `mockCategoriesState`
  factory) rewritten to the trimmed surface. Gates: tsc(app+spec) · sheriff · eslint · build(AOT) ·
  721 unit · 9 grocery/tasks e2e — all green.
  - **Kept (still live):** `edit-category-dialog` (category **rename**, opened from categories
    display-mode via `@shared/feature/list-page`) + its `CategoriesActions` subset + the
    `confirmEditCategoryChanges$` bridge. This flow was never on the item-selection path, so it
    stays on the shared slice — a candidate for a future localise pass if desired.

## Refactor complete

All six stages landed. One shared pure-`ui` `item-edit-modal` + pure-`ui` category components,
each domain wrapper owning a local draft and saving directly; the tracking fork is gone; the shared
kernel is a minimal open-command; the always-disabled-save bug is fixed everywhere. The follow-up
cleanup — the tracking **list-page** merge duplicate — has since been retired too: a
`TrackingListPageFacade` drives the generic `@shared/feature/list-page` (generalised with an
`icon` input, a `hasCategories` flag suppressing the category UI, and projected `[headerEnd]`/
`[toolbarActionsEnd]` slots), and `tracking/smart-ui/list-page/` is deleted. See architecture.md
§4.3.

## Open verifications (do at the relevant stage)

- Does `tasks` use categories at all? (drives whether Stage 4 touches the category components.)
- The `products` "create & add to another list" flow (`addToAdditionalList`) — preserve when the
  draft moves local.
- The barcode scanner path (`facade.openEditProduct(ean)` → product dialog) still opens correctly.
