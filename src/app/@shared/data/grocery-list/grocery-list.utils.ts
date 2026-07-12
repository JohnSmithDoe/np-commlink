import { marker } from '@colsen1991/ngx-translate-extract-marker';
import {
  IAppState,
  IBaseItem,
  IListState,
  IQuickAddState,
  IShoppingItem,
  IStorageItem,
  IStorageState,
  TAllItemTypes,
  TColor,
  TItemListCategory,
  TItemListId,
  TItemListMode,
  TItemListSort,
  TItemListSortDir,
  TItemListSortType,
  TUpdateDTO,
} from '../../types';
import { createStorageItemFromShopping } from '../../util/item.factory';
import {
  matchesCategoryExactly,
  matchesItemExactly,
  matchesItemExactlyIdx,
  matchesSearchExactly,
  matchingTxt,
  matchingTxtIsNotEmpty,
} from '../../util/app.utils';

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
    case '_globals':
      searchQuery = state.globals.searchQuery;
      listName = marker('grocery.list-header.globals');
      color = 'global';
      isCategoryMode = state.globals.mode === 'categories';
      categories = state.globals.categories;
      exactMatchLocal = !!state.globals.items.find((item) =>
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
    canAddGlobal:
      !isCategoryMode &&
      doShow &&
      listId !== '_globals' && // dont show in globals
      listId !== '_tasks' && // dont show in tasks
      !state.globals.items.find((item) =>
        matchesSearchExactly(item, searchQuery)
      ),
    canAddCategory: doShow && isCategoryMode && !exactMatchCategory,
    listName,
    color,
  };
};

export const updateCategories = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: T
): T => {
  return {
    ...state,
    categories: [
      ...new Set(categoriesFromList(state.items).concat(state.categories)),
    ],
  };
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

export const addListItem = <T extends IListState<R>, R extends TAllItemTypes>(
  state: T,
  item: R
): T => {
  // do not add an empty item
  const name = item.name.trim();
  if (!name.length) {
    return state;
  }
  return updateCategories({
    ...state,
    items: [item, ...state.items],
  });
};

export const removeListItem = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: T,
  item: R
): T =>
  updateCategories({
    ...state,
    items: state.items.filter((listItem) => listItem.id !== item.id),
  });

export const removeListItems = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: T,
  items: R[]
): T => {
  const toRemove = items.map((item) => item.id);
  return updateCategories({
    ...state,
    items: state.items.filter((listItem) => !toRemove.includes(listItem.id)),
  });
};

export const updateListItem = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: T,
  item: TUpdateDTO<R> | undefined
): T => {
  if (!item) return state;
  const items: TUpdateDTO<R>[] = [...state.items];
  const itemIdx = matchesItemExactlyIdx(item, state.items);
  if (itemIdx >= 0) {
    const original = state.items[itemIdx];
    const updatedItem = { ...original, ...item };
    items.splice(itemIdx, 1, updatedItem);
  } else {
    console.error(item);
    // throw new Error('Dont update an item that is not in the list');
  }
  return updateCategories({ ...state, items });
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

export const updateListSort = (
  sortBy?: TItemListSortType,
  newDir?: TItemListSortDir | 'keep' | 'toggle',
  currentDir?: TItemListSortDir
) => {
  let result: TItemListSort | undefined;
  if (!!sortBy) {
    const defaultSort = 'asc';
    let sortDir: 'asc' | 'desc' = defaultSort;
    switch (newDir) {
      case 'asc':
      case 'desc':
        sortDir = newDir;
        break;
      case 'keep':
        sortDir = currentDir ?? defaultSort;
        break;
      case 'toggle':
        sortDir = currentDir === 'asc' ? 'desc' : 'asc';
        break;
    }
    result = { sortBy, sortDir };
  }
  return result;
};

export const updateListMode = <
  T extends IListState<R>,
  R extends TAllItemTypes,
>(
  state: T,
  mode?: TItemListMode
): T => {
  // reset sort on mode change, otherwise toggle
  const sort: TItemListSort | undefined =
    state.mode !== mode
      ? { sortBy: 'name', sortDir: 'asc' }
      : updateListSort('name', 'toggle', state.sort?.sortDir);
  return {
    ...state,
    sort: sort,
    mode: mode ?? 'alphabetical',
    filterBy: mode === 'categories' ? undefined : state.filterBy,
  };
};

export const categoriesFromList = (items: IBaseItem[]): TItemListCategory[] => {
  return [...new Set(items.flatMap((item) => item.category ?? []))];
};

export const addListCategory = <T extends IListState<any>>(
  state: T,
  category?: TItemListCategory
): T => {
  return !category?.length || state.categories.includes(category)
    ? state
    : {
        ...state,
        categories: [category, ...state.categories],
      };
};

export const removeListCategory = <T extends IListState<TAllItemTypes>>(
  state: T,
  category?: TItemListCategory
): T => {
  const items = state.items.map((item) => ({
    ...item,
    category: item.category?.filter((cat) => cat !== category),
  }));
  return {
    ...state,
    items,
    categories: state.categories.filter((cat) => cat !== category),
  };
};

export const updateListCategory = <
  T extends IListState<R>,
  R extends IBaseItem,
>(
  state: T,
  original: TItemListCategory,
  category: TItemListCategory
): T => {
  if (!matchingTxt(category).length) return state;
  // if there was an original one we need to replace the category in the items
  const originalName = matchingTxt(original);
  original = original.trim();
  category = category.trim();
  let categories: TItemListCategory[];
  let items: R[];
  if (!!originalName.length) {
    items = state.items.map((item) =>
      item.category && matchesCategoryExactly(item, original)
        ? {
            ...item,
            category: [...item.category].splice(
              item.category?.indexOf(originalName),
              1,
              category
            ),
          }
        : item
    );
    categories = [...state.categories].splice(
      state.categories.indexOf(original),
      1,
      category
    );
  } else {
    items = state.items;
    categories = [...new Set([category, ...state.categories])];
  }
  return {
    ...state,
    items,
    categories,
  };
};

export const updatedSearchQuery = (
  item: IBaseItem,
  searchQuery: string | undefined
) => {
  if (!!item.name && !item.name.includes(searchQuery ?? '')) {
    searchQuery = undefined;
  }
  return searchQuery;
};

export const listIdByPrefix = (type: string): TItemListId => {
  if (type.startsWith('[Storage]')) {
    return '_storage';
  } else if (type.startsWith('[Shopping]')) {
    return '_shopping';
  } else if (type.startsWith('[Globals]')) {
    return '_globals';
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
    case '_globals':
      return state.globals;
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
