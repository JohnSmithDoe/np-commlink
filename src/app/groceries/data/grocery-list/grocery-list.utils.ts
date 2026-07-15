import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IAppState,
  IListState,
  IQuickAddState,
  IShoppingItem,
  IStorageItem,
  IStorageState,
  TAllItemTypes,
  TColor,
  TItemListCategory,
  TItemListId,
} from '../../../@shared/types';
import { createStorageItemFromShopping } from '../../../@shared/util/item.factory';
import {
  matchesItemExactly,
  matchesSearchExactly,
  matchingTxtIsNotEmpty,
} from '../../../@shared/util/app.utils';
import {
  addListItem,
  updateCategories,
  updateListItem,
} from '../../../@shared/data/list/list.utils';

// Re-export the domain-blind list helpers so existing grocery importers keep
// resolving them from here. The generic implementations now live in the shared
// kernel (`@shared/data/list/list.utils`); only the grocery-specific engine
// helpers below (which read concrete list identities / cross-list state) stay
// in this file.
export * from '../../../@shared/data/list/list.utils';

// hmmm this is a bit much...
export const updateQuickAddState = (
  state: IAppState,
  listId: TItemListId
): IQuickAddState => {
  let searchQuery: string | undefined;
  let exactMatchLocal = false;
  let listName: string | undefined;
  let color: TColor | undefined;
  let isCategoryMode: boolean | undefined;
  let categories: TItemListCategory[] | undefined;
  switch (listId) {
    case '_storage':
      searchQuery = state.storage.searchQuery;
      listName = marker('grocery.list-header.storage');
      color = 'storage';
      isCategoryMode = state.storage.mode === 'categories';
      categories = state.storage.categories;
      exactMatchLocal = !!state.storage.items.find((item) =>
        matchesSearchExactly(item, searchQuery)
      );
      break;
    case '_products':
      searchQuery = state.products.searchQuery;
      listName = marker('grocery.list-header.products');
      color = 'product';
      isCategoryMode = state.products.mode === 'categories';
      categories = state.products.categories;
      exactMatchLocal = !!state.products.items.find((item) =>
        matchesSearchExactly(item, searchQuery)
      );
      break;
    case '_shopping':
      searchQuery = state.shopping.searchQuery;
      listName = marker('grocery.list-header.shopping');
      color = 'shopping';
      isCategoryMode = state.shopping.mode === 'categories';
      categories = state.shopping.categories;
      exactMatchLocal = !!state.shopping.items.find((item) =>
        matchesSearchExactly(item, searchQuery)
      );
      break;
    case '_tasks':
      searchQuery = state.tasks.searchQuery;
      listName = marker('grocery.list-header.tasks');
      color = 'task';
      isCategoryMode = state.tasks.mode === 'categories';
      categories = state.tasks.categories;
      exactMatchLocal = !!state.tasks.items.find((item) =>
        matchesSearchExactly(item, searchQuery)
      );
      break;
  }
  const doShow = matchingTxtIsNotEmpty(searchQuery);
  const exactMatchCategory =
    !!categories &&
    categories.find((cat) => matchesSearchExactly(cat, searchQuery));
  return {
    searchQuery,
    canAddLocal: !isCategoryMode && doShow && !exactMatchLocal,
    canAddProduct:
      !isCategoryMode &&
      doShow &&
      listId !== '_products' && // dont show in products
      listId !== '_tasks' && // dont show in tasks
      !state.products.items.find((item) =>
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
  for (let i = 0; i < items.length; i++) {
    const storageItem = createStorageItemFromShopping(
      items[i],
      items[i].quantity
    );
    newState = addListItemOrIncreaseQuantity(newState, storageItem, false);
  }
  return updateCategories(newState);
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
    throw Error('should not happen');
  }
};

export const stateByListId = (
  state: IAppState,
  listId: TItemListId
): IListState<any> => {
  //prettier-ignore
  switch (listId) {
    case '_storage':
      return state.storage;
    case '_products':
      return state.products;
    case '_shopping':
      return state.shopping;
    case '_tasks':
      return state.tasks;
  }
};

export const searchQueryByListId = (state: IAppState, listId: TItemListId) =>
  stateByListId(state, listId).searchQuery?.trim();
export const filterByByListId = (state: IAppState, listId: TItemListId) =>
  stateByListId(state, listId).filterBy?.trim();
