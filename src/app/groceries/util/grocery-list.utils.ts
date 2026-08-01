import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TColor } from '../../@shared/model/app.types';
import { IBaseItem } from '../../@shared/model/base-item.types';
import { IListState } from '../../@shared/model/item-list.types';
import { IGroceriesState } from '../model/groceries.types';
import {
  isGroceryListId,
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
} from '../../@shared/util/item-lists/list.utils';

// Only the grocery-specific engine helpers live here — the ones that read a
// concrete list identity or cross-list state. The domain-blind helpers are
// imported straight from `@shared/util/list/list.utils` by whoever needs them:
// re-exporting them from here made the grocery reducers *look* like they used a
// grocery engine when they use the shared one.

// The action-source prefix each grocery list publishes under. Parsing the source
// is fair game — it identifies a slice, not an event — but this lookup used to be
// an if/else chain ending in `throw new Error('should not happen')`, the one
// non-exhaustive member of a family of four sibling tables over TGroceryListId.
// A fourth list now fails to compile here like it does at the other three,
// instead of throwing inside an effect and taking that effect's stream with it.
const SOURCE_PREFIX_BY_LIST_ID: Record<TGroceryListId, string> = {
  _storage: '[Storage]',
  _shopping: '[Shopping]',
  _products: '[Products]',
};

export const listIdByPrefix = (type: string): TGroceryListId => {
  for (const listId of Object.keys(SOURCE_PREFIX_BY_LIST_ID)) {
    if (
      isGroceryListId(listId) &&
      type.startsWith(SOURCE_PREFIX_BY_LIST_ID[listId])
    ) {
      return listId;
    }
  }
  throw new Error(`no grocery list publishes the action source in "${type}"`);
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

// Uniform amber quick-add accent across every list (per-domain tint dropped).
const QUICK_ADD_COLOR: TColor = 'primary';

const LIST_NAME_MARKER: Record<TGroceryListId, string> = {
  _storage: marker('grocery.list-header.storage'),
  _products: marker('grocery.list-header.products'),
  _shopping: marker('grocery.list-header.shopping'),
};

const hasItemNamedExactly = (items: IBaseItem[], query?: string) =>
  items.some((item) => matchesSearchExactly(item, query));

export const updateQuickAddState = (
  state: IGroceriesState,
  listId: TGroceryListId
): IQuickAddState => {
  const list = stateByListId(state, listId);
  const query = list.searchQuery;
  const isTypingItemName = matchingTxtIsNotEmpty(query);
  return {
    searchQuery: query,
    canAddLocal: isTypingItemName && !hasItemNamedExactly(list.items, query),
    canAddProduct:
      isTypingItemName &&
      listId !== '_products' &&
      !hasItemNamedExactly(state.products.items, query),
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
  let nextState: IStorageState = { ...state };
  for (const item of items) {
    const storageItem = createStorageItemFromShopping(item, item.quantity);
    nextState = addListItemOrIncreaseQuantity(nextState, storageItem, false);
  }
  // Categories are a shared, authoritative catalog now (kept in lockstep across
  // the grocery lists) — copied items carry ids valid here, so no re-derive.
  return nextState;
};
