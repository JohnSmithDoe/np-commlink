import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IBaseItem,
  IListState,
  TColor,
  TItemListCategory,
  TItemListId,
} from '../../../@shared/types';
import {
  IGroceryLists,
  IQuickAddState,
  IShoppingItem,
  IStorageItem,
  IStorageState,
} from '../../model';
import { createStorageItemFromShopping } from '../../util/grocery.factory';
import {
  matchesItemExactly,
  matchesSearchExactly,
  matchingTxtIsNotEmpty,
} from '../../../@shared/util/app.utils';
import {
  addListItem,
  updateListItem,
} from '../../../@shared/util/list/list.utils';

// Re-export the domain-blind list helpers so existing grocery importers keep
// resolving them from here. The generic implementations now live in the shared
// kernel (`@shared/util/list/list.utils`); only the grocery-specific engine
// helpers below (which read concrete list identities / cross-list state) stay
// in this file.
export * from '../../../@shared/util/list/list.utils';

export const updateQuickAddState = (
  state: IGroceryLists,
  listId: TItemListId
): IQuickAddState => {
  let searchQuery: string | undefined;
  let exactMatchLocal = false;
  let listName: string | undefined;
  // Uniform amber quick-add accent across every list (per-domain tint dropped).
  const color: TColor = 'primary';
  let isCategoryMode: boolean | undefined;
  let categories: TItemListCategory[] | undefined;
  switch (listId) {
    case '_storage': {
      searchQuery = state.storage.searchQuery;
      listName = marker('grocery.list-header.storage');
      isCategoryMode = state.storage.mode === 'categories';
      categories = state.storage.categories;
      exactMatchLocal = state.storage.items.some((item) =>
        matchesSearchExactly(item, searchQuery)
      );
      break;
    }
    case '_products': {
      searchQuery = state.products.searchQuery;
      listName = marker('grocery.list-header.products');
      isCategoryMode = state.products.mode === 'categories';
      categories = state.products.categories;
      exactMatchLocal = state.products.items.some((item) =>
        matchesSearchExactly(item, searchQuery)
      );
      break;
    }
    case '_shopping': {
      searchQuery = state.shopping.searchQuery;
      listName = marker('grocery.list-header.shopping');
      isCategoryMode = state.shopping.mode === 'categories';
      categories = state.shopping.categories;
      exactMatchLocal = state.shopping.items.some((item) =>
        matchesSearchExactly(item, searchQuery)
      );
      break;
    }
    default: {
      // tasks is a sealed sibling with its own quick-add copy; the grocery
      // engine only ever routes the three grocery lists here.
      throw new Error(`grocery engine: unexpected listId ${listId}`);
    }
  }
  const doShow = matchingTxtIsNotEmpty(searchQuery);
  const exactMatchCategory =
    !!categories &&
    categories.find((cat) => matchesSearchExactly(cat.name, searchQuery));
  return {
    searchQuery,
    canAddLocal: !isCategoryMode && doShow && !exactMatchLocal,
    canAddProduct:
      !isCategoryMode &&
      doShow &&
      listId !== '_products' && // dont show in products
      !state.products.items.some((item) =>
        matchesSearchExactly(item, searchQuery)
      ),
    canAddCategory: doShow && isCategoryMode && !exactMatchCategory,
    listName,
    color,
  };
};

export const addListItemOrIncreaseQuantity = <
  T extends IListState<R>,
  R extends IStorageItem | IShoppingItem,
>(
  state: T,
  item: R,
  byOne = true
): T => {
  const found = matchesItemExactly(item, state.items);
  if (found) {
    return updateListItem<T, R>(state, {
      ...found,
      quantity: found.quantity + (byOne ? 1 : item.quantity),
    });
  }
  return addListItem<T, R>(state, item);
};

export const addShoppinglistToStorage = (
  state: IStorageState,
  items: IShoppingItem[]
): IStorageState => {
  let newState: IStorageState = { ...state };
  for (const item of items) {
    const storageItem = createStorageItemFromShopping(item, item.quantity);
    newState = addListItemOrIncreaseQuantity(newState, storageItem, false);
  }
  // Categories are a shared, authoritative catalog now (kept in lockstep across
  // the grocery lists) — copied items carry ids valid here, so no re-derive.
  return newState;
};

export const listIdByPrefix = (type: string): TItemListId => {
  if (type.startsWith('[Storage]')) {
    return '_storage';
  } else if (type.startsWith('[Shopping]')) {
    return '_shopping';
  } else if (type.startsWith('[Products]')) {
    return '_products';
  } else if (type.startsWith('[Tasks]')) {
    return '_tasks';
  } else {
    throw new Error('should not happen');
  }
};

export const stateByListId = (
  state: IGroceryLists,
  listId: TItemListId
): IListState<IBaseItem> => {
  //prettier-ignore
  switch (listId) {
    case '_storage': {
      return state.storage;
    }
    case '_products': {
      return state.products;
    }
    case '_shopping': {
      return state.shopping;
    }
    default: {
      // tasks is a sealed sibling with its own copies; the grocery engine only
      // ever routes the three grocery lists here.
      throw new Error(`grocery engine: unexpected listId ${listId}`);
    }
  }
};

export const searchQueryByListId = (
  state: IGroceryLists,
  listId: TItemListId
) => stateByListId(state, listId).searchQuery?.trim();
export const filterByByListId = (state: IGroceryLists, listId: TItemListId) =>
  stateByListId(state, listId).filterBy?.trim();
