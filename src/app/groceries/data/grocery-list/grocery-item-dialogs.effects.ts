import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { IAppState, IBaseItem, TItemListId } from '../../../@shared/types';
import {
  createProduct,
  createShoppingItem,
  createStorageItem,
} from '../../../@shared/util/item.factory';
import { actionsByListId } from './grocery-list.effects';
import {
  filterByByListId,
  searchQueryByListId,
  stateByListId,
} from './grocery-list.utils';
import { ProductsActions } from '../products.actions';
import { ShoppingActions } from '../shopping.actions';
import { StorageActions } from '../storage.actions';
import {
  CategoriesActions,
  ItemDialogsActions,
} from '../../../@shared/data/item-dialogs/item-dialogs.actions';
import { selectEditState } from '../../../@shared/data/item-dialogs/item-dialogs.selector';
import { selectEditProductState } from '../item-dialogs.selector';

// The three lists this orchestrator owns. The shared `itemDialogs` slice is
// domain-blind and its edit/category actions (ItemDialogsActions/
// CategoriesActions) are generic, so BOTH this and the tasks dialog
// orchestrator subscribe to them. Route injectors + NgRx effects are NOT torn
// down on navigation (IonicRouteStrategy has no shouldDestroyInjector, and
// provideEffects has no per-injector teardown), so once a grocery route AND
// /tasks are both visited BOTH orchestrators stay live for the session — they
// are NOT mutually exclusive. Every effect that keys off a shared action must
// therefore guard on the dialog's listId, or it fires on the sibling domain's
// dialogs (cross-list corruption / an actionsByListId throw).
const GROCERY_LIST_IDS: readonly TItemListId[] = [
  '_storage',
  '_products',
  '_shopping',
];
const isGroceryList = (id: TItemListId | undefined): boolean =>
  !!id && GROCERY_LIST_IDS.includes(id);

function createItemByListId(
  listId: TItemListId,
  name: string,
  category: string | undefined
): IBaseItem {
  switch (listId) {
    case '_storage':
      return createStorageItem(name, category);
    case '_products':
      return createProduct(name, category);
    case '_shopping':
      return createShoppingItem(name, category);
    default:
      throw new Error(`grocery dialogs: unexpected listId ${listId}`);
  }
}

/**
 * The grocery edit/category-dialog orchestrator, folded into `groceries` and
 * registered lazily via `groceriesLazyProviders`. Routes the shared
 * `ItemDialogsActions`/`CategoriesActions` to the concrete grocery action
 * groups by the dialog's `listId`, plus the product-specific "create & add to
 * another list" flow. Every shared-action effect is `listId`-guarded so it
 * ignores task dialogs (tasks has its own guarded copy).
 */
@Injectable({ providedIn: 'root' })
export class GroceryItemDialogsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  showCategories$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.showDialog),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      filter(({ state }: { state: IAppState }) =>
        isGroceryList(state.itemDialogs.listId)
      ),
      map(({ state }: { state: IAppState }) => {
        const categories = stateByListId(
          state,
          state.itemDialogs.listId
        ).categories;
        return CategoriesActions.updateSelection(
          state.itemDialogs.item,
          categories
        );
      })
    );
  });

  confirmCategories$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.confirmChanges),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      filter(({ state }: { state: IAppState }) =>
        isGroceryList(state.itemDialogs.listId)
      ),
      map(({ state }: { state: IAppState }) =>
        ItemDialogsActions.updateItem({
          category: state.itemDialogs.category.selection,
        })
      )
    );
  });

  addCategoryFromDialogSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.addCategoryFromDialogSearch),
      withLatestFrom(this.#store, (action, state) => ({ action, state })),
      filter(({ state }: { state: IAppState }) =>
        isGroceryList(state.itemDialogs.listId)
      ),
      map(({ state }: { state: IAppState }) =>
        CategoriesActions.addCategory(
          state.itemDialogs.category.searchQuery?.trim() ?? ''
        )
      )
    );
  });

  addCategoryToList$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.addCategory),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      filter(({ state }) => isGroceryList(state.itemDialogs.listId)),
      map(({ state, action }) =>
        actionsByListId(state.itemDialogs.listId).addCategory(action.category)
      )
    );
  });

  showCreateProductDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateAndAddProductDialog),
      filter(({ listId }) => isGroceryList(listId)),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const searchQuery = searchQueryByListId(state, action.listId);
        const filterBy = filterByByListId(state, action.listId);
        return ItemDialogsActions.showEditDialog(
          createProduct(searchQuery ?? '', filterBy),
          '_products',
          action.listId
        );
      })
    );
  });

  confirmItemChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.confirmChanges),
      concatLatestFrom(() => this.#store.select(selectEditState)),
      filter(([, state]) => isGroceryList(state.listId)),
      map(([, state]) =>
        actionsByListId(state.listId).addOrUpdateItem(<never>state.item)
      )
    );
  });

  confirmEditCategoryChanges$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(CategoriesActions.confirmEditChanges),
      concatLatestFrom(() => this.#store.select(selectEditState)),
      filter(([, state]) => isGroceryList(state.listId)),
      map(([, state]) =>
        actionsByListId(state.listId).updateCategory(
          state.category.original ?? '',
          state.category.editItem ?? ''
        )
      )
    );
  });

  confirmProductItemChangesAndAddToList$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.confirmChanges),
      concatLatestFrom(() => this.#store.select(selectEditProductState)),
      filter(
        ([, state]) =>
          state.listId === '_products' && !!state.addToAdditionalList
      ),
      map(([, state]) => {
        switch (state.addToAdditionalList!) {
          case '_storage':
            return StorageActions.addProduct(state.item);
          case '_shopping':
            return ShoppingActions.addProduct(state.item);
          default:
            return ProductsActions.addItemFailure(state.item);
        }
      })
    );
  });

  showCreateDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateDialogWithSearch),
      filter(({ listId }) => isGroceryList(listId)),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const localState = stateByListId(state, action.listId);
        const name = localState.searchQuery ?? '';
        if (localState.mode === 'categories') {
          return CategoriesActions.showEditDialog(name, action.listId);
        }
        const item = createItemByListId(
          action.listId,
          name,
          localState.filterBy
        );
        return ItemDialogsActions.showEditDialog(item, action.listId);
      })
    );
  });
}
