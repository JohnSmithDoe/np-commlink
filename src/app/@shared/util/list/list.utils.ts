import {
  IBaseItem,
  IListState,
  TItemListCategory,
  TItemListMode,
  TItemListSort,
  TItemListSortDir,
  TItemListSortType,
  TUpdateDTO,
} from '../../types';
import {
  matchesCategoryExactly,
  matchesItemExactlyIdx,
  matchingTxt,
} from '../../util/app.utils';

// Domain-blind reducer helpers shared by every list domain (tracking, grocery,
// tasks). They operate over the generic `IListState<T>` shape and never read a
// concrete list identity — hence they live in the shared kernel, not in the
// grocery engine. (Grocery-specific helpers stay in grocery-list.utils.ts and
// re-export these for backwards compatibility.)

export const updateCategories = <T extends IListState<R>, R extends IBaseItem>(
  state: T
): T => {
  return {
    ...state,
    categories: [
      ...new Set(categoriesFromList(state.items).concat(state.categories)),
    ],
  };
};

export const addListItem = <T extends IListState<R>, R extends IBaseItem>(
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

export const removeListItem = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  item: R
): T =>
  updateCategories({
    ...state,
    items: state.items.filter((listItem) => listItem.id !== item.id),
  });

export const removeListItems = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  items: R[]
): T => {
  const toRemove = items.map((item) => item.id);
  return updateCategories({
    ...state,
    items: state.items.filter((listItem) => !toRemove.includes(listItem.id)),
  });
};

export const updateListItem = <T extends IListState<R>, R extends IBaseItem>(
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

export const updateListMode = <T extends IListState<R>, R extends IBaseItem>(
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

export const removeListCategory = <T extends IListState<IBaseItem>>(
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
