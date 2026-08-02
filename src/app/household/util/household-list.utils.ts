import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { IonColor } from '../../@shared/model/app.types';
import { BaseItem } from '../../@shared/model/base-item.types';
import { ListState } from '../../@shared/model/item-list.types';
import { HouseholdState } from '../model/household.types';
import {
  PRODUCTS_LIST_ID,
  HouseholdListId,
  ShoppingItem,
  StorageItem,
  StorageState,
} from '../model/household-list.types';
import { QuickAddState } from '../model/list-settings.types';
import { createStorageItemFromShopping } from './household.factory';
import {
  matchesItemExactly,
  matchesSearchExactly,
  matchingTxtIsNotEmpty,
} from '../../@shared/util/app.utils';
import {
  addListItem,
  updateListItem,
} from '../../@shared/util/item-lists/list.utils';

export const SOURCE_PREFIX_BY_LIST_ID: Record<HouseholdListId, string> = {
  _storage: '[Storage]',
  _shopping: '[Shopping]',
  _products: '[Products]',
};

export const storageStatusColor = ({
  minAmount,
  quantity,
}: StorageItem): IonColor => {
  if (!minAmount || quantity > minAmount) return 'success';
  return quantity < minAmount ? 'danger' : 'warning';
};

export const stateByListId = (
  state: HouseholdState,
  listId: HouseholdListId
): ListState<BaseItem> => {
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

const QUICK_ADD_COLOR: IonColor = 'primary';

const LIST_NAME_MARKER: Record<HouseholdListId, string> = {
  _storage: marker('household.list-header.storage'),
  _products: marker('household.list-header.products'),
  _shopping: marker('household.list-header.shopping'),
};

const hasItemNamedExactly = (items: BaseItem[], query?: string) =>
  items.some((item) => matchesSearchExactly(item, query));

export const deriveQuickAddState = (
  state: HouseholdState,
  listId: HouseholdListId
): QuickAddState => {
  const list = stateByListId(state, listId);
  const query = list.searchQuery;
  const isTypingItemName = matchingTxtIsNotEmpty(query);
  return {
    searchQuery: query,
    canAddLocal: isTypingItemName && !hasItemNamedExactly(list.items, query),
    canAddProduct:
      isTypingItemName &&
      listId !== PRODUCTS_LIST_ID &&
      !hasItemNamedExactly(state.products.items, query),
    listName: LIST_NAME_MARKER[listId],
    color: QUICK_ADD_COLOR,
  };
};

export const addListItemOrIncreaseQuantity = <
  T extends ListState<R>,
  R extends StorageItem | ShoppingItem,
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

export const removeListItems = <T extends ListState<R>, R extends BaseItem>(
  state: T,
  items: R[]
): T => {
  const toRemove = new Set(items.map((item) => item.id));
  return {
    ...state,
    items: state.items.filter((listItem) => !toRemove.has(listItem.id)),
  };
};

export const addShoppinglistToStorage = (
  state: StorageState,
  items: ShoppingItem[]
): StorageState => {
  let nextState: StorageState = { ...state };
  for (const item of items) {
    const storageItem = createStorageItemFromShopping(item, item.quantity);
    nextState = addListItemOrIncreaseQuantity(nextState, storageItem, false);
  }
  return nextState;
};
