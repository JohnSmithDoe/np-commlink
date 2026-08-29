import { createReducer, on } from '@ngrx/store';
import {
  TASK_CATEGORIES_LIST_ID,
  TASKS_LIST_ID,
  TasksState,
} from '../model/task.types';
import {
  addToCatalog,
  dropCategoryRef,
  restoreCategoryRef,
  remapCategoryRef,
  removeFromCatalog,
  renameInCatalog,
} from '../../@shared/util/categories/category-list.utils';
import {
  addListItem,
  hydratedList,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
  withList,
} from '../../@shared/util/item-lists/list.utils';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';

export const initialState: TasksState = {
  list: { id: TASKS_LIST_ID, items: [] },
  categoryList: { id: TASK_CATEGORIES_LIST_ID, items: [] },
};

// prettier-ignore
export const tasksReducer = createReducer(
  initialState,

  on(TasksActions.addItem,(state, { item }): TasksState => withList(state, 'list', addListItem(state.list, item))),
  on(TasksActions.removeItem,(state, { item }): TasksState => withList(state, 'list', removeListItem(state.list, item))),
  on(TasksActions.updateItem,(state, { item }): TasksState => withList(state, 'list', updateListItem(state.list, item))),
  on(TasksActions.updateSearch,(state, { searchQuery }): TasksState => withList(state, 'list', updateListSearch(state.list, searchQuery))),
  on(TasksActions.updateFilter,(state, { filterBy }): TasksState => ({ ...state, list: { ...state.list, filterBy } })),
  on(TasksActions.updateSort, (state, { sortBy, sortDirection }): TasksState => withList(state, 'list', updateListSort(state.list, sortBy, sortDirection))),

  on(TaskCategoriesActions.addItem, (state, { item }): TasksState => withList(state, 'categoryList', addToCatalog(state.categoryList, item))),

  on(TaskCategoriesActions.removeItem, (state, { item }): TasksState => ({
    ...state,
    categoryList: removeFromCatalog(state.categoryList, item.id),
    list: { ...state.list, items: dropCategoryRef(state.list.items, item.id) },
  })),

  on(TasksActions.restoreCategory, (state, { category, tagged }): TasksState => {
    const ids = new Set(tagged);
    return {
      ...state,
      categoryList: addToCatalog(state.categoryList, category),
      list: { ...state.list, items: restoreCategoryRef(state.list.items, category.id, ids) },
    };
  }),

  on(TaskCategoriesActions.updateItem, (state, { item }): TasksState => {
    const { catalog, mergedInto } = renameInCatalog(state.categoryList, item.id, item.name);
    return {
      ...state,
      categoryList: catalog,
      list: mergedInto
        ? { ...state.list, items: remapCategoryRef(state.list.items, item.id, mergedInto) }
        : state.list,
    };
  }),

  on(TaskCategoriesActions.updateSearch,(state, { searchQuery }): TasksState => withList(state, 'categoryList', updateListSearch(state.categoryList, searchQuery))),
  on(TaskCategoriesActions.updateSort, (state, { sortBy, sortDirection }): TasksState => withList(state, 'categoryList', updateListSort(state.categoryList, sortBy, sortDirection))),

  on(TasksActions.loaded,(state, { tasks }): TasksState => {
    const hydrated = tasks ?? state;
    return {
      list: hydratedList(hydrated.list),
      categoryList: hydratedList(hydrated.categoryList),
    };
  })
);
