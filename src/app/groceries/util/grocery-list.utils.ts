import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TColor } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { ICategory } from '../../@shared/model/category.types';
import { IListState } from '../../@shared/model/item-list.types';
import { IGroceriesState } from '../model/groceries.types';
import {
  IShoppingItem,
  IStorageItem,
  IStorageState,
  TGroceryListId,
} from '../model/grocery-list.types';
import { IQuickAddState } from '../model/list-settings.types';
import { createStorageItemFromShopping } from './grocery.factory';
import {
  matchesItemExactly,
  matchesSearchExactly,
  matchingTxtIsNotEmpty,
} from '../../@shared/util/app.utils';
import {
  addListItem,
  updateListItem,
} from '../../@shared/util/list/list.utils';

// Only the grocery-specific engine helpers live here — the ones that read a
// concrete list identity or cross-list state. The domain-blind helpers are
// imported straight from `@shared/util/list/list.utils` by whoever needs them:
// re-exporting them from here made the grocery reducers *look* like they used a
// grocery engine when they use the shared one.

export const listIdByPrefix = (type: string): TGroceryListId => {
  if (type.startsWith('[Storage]')) {
    return '_storage';
  } else if (type.startsWith('[Shopping]')) {
    return '_shopping';
  } else if (type.startsWith('[Products]')) {
    return '_products';
  } else {
    throw new Error('should not happen');
  }
};

export const stateByListId = (
  state: IGroceriesState,
  listId: TGroceryListId
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
  }
};

export const searchQueryByListId = (
  state: IGroceriesState,
  listId: TGroceryListId
) => stateByListId(state, listId).searchQuery?.trim();
export const filterByByListId = (
  state: IGroceriesState,
  listId: TGroceryListId
) => stateByListId(state, listId).filterBy?.trim();

// Uniform amber quick-add accent across every list (per-domain tint dropped).
const QUICK_ADD_COLOR: TColor = 'primary';

const LIST_NAME_MARKER: Record<TGroceryListId, string> = {
  _storage: marker('grocery.list-header.storage'),
  _products: marker('grocery.list-header.products'),
  _shopping: marker('grocery.list-header.shopping'),
};

const isCategoryMode = (list: IListState<IBaseItem>) =>
  list.mode === 'categories';

const hasItemNamedExactly = (items: IBaseItem[], query?: string) =>
  items.some((item) => matchesSearchExactly(item, query));

const hasCategoryNamedExactly = (categories: ICategory[], query?: string) =>
  categories.some((category) => matchesSearchExactly(category.name, query));

export const updateQuickAddState = (
  state: IGroceriesState,
  listId: TGroceryListId
): IQuickAddState => {
  const list = stateByListId(state, listId);
  const query = list.searchQuery;
  const isTypingItemName =
    matchingTxtIsNotEmpty(query) && !isCategoryMode(list);
  const isTypingCategoryName =
    matchingTxtIsNotEmpty(query) && isCategoryMode(list);
  return {
    searchQuery: query,
    canAddLocal: isTypingItemName && !hasItemNamedExactly(list.items, query),
    canAddProduct:
      isTypingItemName &&
      listId !== '_products' &&
      !hasItemNamedExactly(state.products.items, query),
    canAddCategory:
      isTypingCategoryName && !hasCategoryNamedExactly(list.categories, query),
    listName: LIST_NAME_MARKER[listId],
    color: QUICK_ADD_COLOR,
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
