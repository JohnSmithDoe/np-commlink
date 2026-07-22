import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IBaseItem, TItemListId } from '../../../@shared/types';
import { uuidv4 } from '../../../@shared/util/app.utils';
import {
  createProduct,
  createShoppingItem,
  createStorageItem,
} from '../../util/grocery.factory';
import { GroceryCategoriesActions } from './grocery-categories.actions';
import { selectGroceryLists } from './grocery-list.selector';
import {
  filterByByListId,
  searchQueryByListId,
  stateByListId,
} from './grocery-list.utils';
import { GroceryListActions } from './grocery-list.actions';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';

// The three lists this orchestrator owns. The shared `itemDialogs` slice is
// domain-blind and its open-command / category-rename actions are generic, so
// BOTH this and the tasks dialog orchestrator subscribe to them. Route
// injectors + NgRx effects are NOT torn down on navigation, so once a grocery
// route AND /tasks are both visited BOTH orchestrators stay live for the
// session. Every effect that keys off a shared action therefore guards on the
// dialog's listId, or it fires on the sibling domain's dialogs.
const GROCERY_LIST_IDS: ReadonlySet<TItemListId> = new Set([
  '_storage',
  '_products',
  '_shopping',
]);
const isGroceryList = (id: TItemListId | undefined): boolean =>
  !!id && GROCERY_LIST_IDS.has(id);

function createItemByListId(
  listId: TItemListId,
  name: string,
  category: string | undefined
): IBaseItem {
  switch (listId) {
    case '_storage': {
      return createStorageItem(name, category);
    }
    case '_products': {
      return createProduct(name, category);
    }
    case '_shopping': {
      return createShoppingItem(name, category);
    }
    default: {
      throw new Error(`grocery dialogs: unexpected listId ${listId}`);
    }
  }
}

/**
 * The grocery dialog OPEN-command producers + the category-rename bridge, folded
 * into `groceries` and registered lazily via `groceriesLazyProviders`. Since the
 * dialog refactor, the item draft + category selection are owned by the feature
 * wrappers / the pure-ui categories-dialog, so this only produces `showEditDialog`
 * open-commands (row create / product quick-create / barcode) and forwards a
 * confirmed category RENAME to the concrete grocery list. Every effect is
 * `listId`-guarded so it ignores task dialogs (tasks has its own guarded copy).
 */
@Injectable({ providedIn: 'root' })
export class GroceryItemDialogsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  // NEW (merge): mlkit barcode scanner → open the product edit dialog seeded
  // with the scanned EAN as the initial name.
  openEditProduct$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(GroceryListActions.openEditProduct),
      map(({ scannedEan }) =>
        ItemDialogsActions.showEditDialog(
          createProduct(scannedEan),
          '_products',
          undefined,
          'create'
        )
      )
    );
  });

  showCreateProductDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateAndAddProductDialog),
      filter(({ listId }) => isGroceryList(listId)),
      withLatestFrom(
        this.#store.select(selectGroceryLists),
        (action, lists) => ({ action, lists })
      ),
      map(({ action, lists }) => {
        const searchQuery = searchQueryByListId(lists, action.listId);
        const filterBy = filterByByListId(lists, action.listId);
        return ItemDialogsActions.showEditDialog(
          createProduct(searchQuery ?? '', filterBy),
          '_products',
          action.listId,
          'create'
        );
      })
    );
  });

  // Confirm the category name dialog → rename that id, or mint a new category
  // (id undefined) into the shared grocery catalog.
  confirmEditCategoryChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.confirmEditChanges),
      concatLatestFrom(() => this.#store.select(selectEditState)),
      filter(([, state]) => isGroceryList(state.listId)),
      map(([, state]) => {
        const { id, name } = state.category;
        return id
          ? GroceryCategoriesActions.rename(id, name ?? '')
          : GroceryCategoriesActions.add({ id: uuidv4(), name: name ?? '' });
      })
    );
  });

  showCreateDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateDialogWithSearch),
      filter(({ listId }) => isGroceryList(listId)),
      withLatestFrom(
        this.#store.select(selectGroceryLists),
        (action, lists) => ({ action, lists })
      ),
      map(({ action, lists }) => {
        const localState = stateByListId(lists, action.listId);
        const name = localState.searchQuery ?? '';
        if (localState.mode === 'categories') {
          return CategoriesActions.showEditDialog(name, action.listId);
        }
        const item = createItemByListId(
          action.listId,
          name,
          localState.filterBy
        );
        return ItemDialogsActions.showEditDialog(
          item,
          action.listId,
          undefined,
          'create'
        );
      })
    );
  });
}
