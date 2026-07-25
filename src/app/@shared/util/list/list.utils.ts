import {
  IBaseItem,
  ICategory,
  IListState,
  TCategoryId,
  TItemListMode,
  TItemListSort,
  TItemListSortDir,
  TItemListSortType,
  TUpdateDTO,
} from '../../model/types';
import {
  matchesItemExactlyIdx as matchesItemExactlyIndex,
  matchesSearch,
  matchingTxt,
  uuidv4,
} from '../../util/app.utils';

// Domain-blind reducer helpers shared by every list domain (tracking, grocery,
// tasks). They operate over the generic `IListState<T>` shape and never read a
// concrete list identity — hence they live in the shared kernel, not in the
// grocery engine. (Grocery-specific helpers stay in grocery-list.utils.ts and
// re-export these for backwards compatibility.)
//
// Categories are first-class {id,name} objects owned by the list's `categories`
// catalog; items reference them by id (`categoryIds`). The catalog is
// AUTHORITATIVE — it is no longer derived from item names, so adding/updating an
// item does not touch it (categories are minted explicitly via addListCategory).

export const addListItem = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  item: R
): T => {
  const name = item.name.trim();
  if (name.length === 0) {
    return state;
  }
  return { ...state, items: [item, ...state.items] };
};

export const removeListItem = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  item: R
): T => ({
  ...state,
  items: state.items.filter((listItem) => listItem.id !== item.id),
});

export const removeListItems = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  items: R[]
): T => {
  const toRemove = new Set(items.map((item) => item.id));
  return {
    ...state,
    items: state.items.filter((listItem) => !toRemove.has(listItem.id)),
  };
};

export const updateListItem = <T extends IListState<R>, R extends IBaseItem>(
  state: T,
  item: TUpdateDTO<R> | undefined
): T => {
  if (!item) return state;
  const items: TUpdateDTO<R>[] = [...state.items];
  const itemIndex = matchesItemExactlyIndex(item, state.items);
  if (itemIndex >= 0) {
    const original = state.items[itemIndex];
    items[itemIndex] = { ...original, ...item };
  } else {
    console.warn('updateListItem: item not in list', item.id);
  }
  return { ...state, items };
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
      case 'desc': {
        sortDir = newDir;
        break;
      }
      case 'keep': {
        sortDir = currentDir ?? defaultSort;
        break;
      }
      case 'toggle': {
        sortDir = currentDir === 'asc' ? 'desc' : 'asc';
        break;
      }
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
    state.mode === mode
      ? updateListSort('name', 'toggle', state.sort?.sortDir)
      : { sortBy: 'name', sortDir: 'asc' };
  return {
    ...state,
    sort: sort,
    mode: mode ?? 'alphabetical',
    filterBy: mode === 'categories' ? undefined : state.filterBy,
  };
};

// Mint a category into the catalog. Dedupe by lowercased name so the same name
// can't appear twice. The catalog is authoritative — this is the only way a
// category comes to exist (it is not re-derived from item names).
export const addListCategory = <T extends IListState<IBaseItem>>(
  state: T,
  name?: string
): T => {
  const trimmed = (name ?? '').trim();
  if (trimmed.length === 0) return state;
  const exists = state.categories.some(
    (cat) => matchingTxt(cat.name) === matchingTxt(trimmed)
  );
  return exists
    ? state
    : {
        ...state,
        categories: [{ id: uuidv4(), name: trimmed }, ...state.categories],
      };
};

// Insert a PRE-MINTED {id,name} into the catalog (dedupe by id or name). Used
// where the id must be generated once and shared across several lists — the
// grocery domain fans one minted category across products/shopping/storage.
export const addListCategoryObject = <T extends IListState<IBaseItem>>(
  state: T,
  category: ICategory
): T => {
  const name = category.name.trim();
  if (name.length === 0) return state;
  const exists = state.categories.some(
    (cat) =>
      cat.id === category.id || matchingTxt(cat.name) === matchingTxt(name)
  );
  return exists
    ? state
    : { ...state, categories: [{ ...category, name }, ...state.categories] };
};

// Remove a category by id: drop the catalog entry AND strip the id off every
// item that referenced it (→ those items become uncategorized).
export const removeListCategory = <T extends IListState<IBaseItem>>(
  state: T,
  categoryId?: TCategoryId
): T => {
  if (!categoryId) return state;
  return {
    ...state,
    items: state.items.map((item) =>
      item.categoryIds?.includes(categoryId)
        ? {
            ...item,
            categoryIds: item.categoryIds.filter((id) => id !== categoryId),
          }
        : item
    ),
    categories: state.categories.filter((cat) => cat.id !== categoryId),
  };
};

// Rename a category by id — O(1): change the catalog entry's `name`; items
// reference it by id, so they need no rewrite. Renaming ONTO an existing name
// MERGES: drop the renamed entry and remap item refs onto the survivor id.
export const updateListCategory = <
  T extends IListState<R>,
  R extends IBaseItem,
>(
  state: T,
  categoryId: TCategoryId,
  newName: string
): T => {
  const to = newName.trim();
  const hasTarget = state.categories.some((cat) => cat.id === categoryId);
  if (to.length === 0 || !hasTarget) return state;
  const survivor = state.categories.find(
    (cat) => cat.id !== categoryId && matchingTxt(cat.name) === matchingTxt(to)
  );
  if (survivor) {
    return {
      ...state,
      items: state.items.map((item) =>
        item.categoryIds?.includes(categoryId)
          ? {
              ...item,
              categoryIds: [
                ...new Set(
                  item.categoryIds.map((id) =>
                    id === categoryId ? survivor.id : id
                  )
                ),
              ],
            }
          : item
      ),
      categories: state.categories.filter((cat) => cat.id !== categoryId),
    };
  }
  return {
    ...state,
    categories: state.categories.map((cat) =>
      cat.id === categoryId ? { ...cat, name: to } : cat
    ),
  };
};

export const updatedSearchQuery = (
  item: IBaseItem,
  searchQuery: string | undefined
) => {
  if (!!item.name && !matchesSearch(item, searchQuery ?? '')) {
    searchQuery = undefined;
  }
  return searchQuery;
};
