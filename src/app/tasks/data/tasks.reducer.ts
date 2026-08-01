import { createReducer, on } from '@ngrx/store';
import {
  ITasksState,
  TASK_CATEGORIES_LIST_ID,
  TASKS_LIST_ID,
} from '../model/task.types';
import {
  addToCatalog,
  dropCategoryRef,
  remapCategoryRef,
  removeFromCatalog,
  renameInCatalog,
} from '../../@shared/util/categories/category-list.utils';
import {
  addListItem,
  removeListItem,
  updateListItem,
  updateListSearch,
  updateListSort,
  withList,
} from '../../@shared/util/item-lists/list.utils';
import { TaskCategoriesActions, TasksActions } from './tasks.actions';

export const initialState: ITasksState = {
  list: { id: TASKS_LIST_ID, items: [] },
  categoryList: { id: TASK_CATEGORIES_LIST_ID, items: [] },
};

// prettier-ignore
export const tasksReducer = createReducer(
  initialState,

  // ── the task list ────────────────────────────────────────────────────────
  on(TasksActions.addItem,(state, { item }): ITasksState => withList(state, 'list', addListItem(state.list, item))),
  on(TasksActions.removeItem,(state, { item }): ITasksState => withList(state, 'list', removeListItem(state.list, item))),
  on(TasksActions.updateItem,(state, { item }): ITasksState => withList(state, 'list', updateListItem(state.list, item))),
  on(TasksActions.updateSearch,(state, { searchQuery }): ITasksState => withList(state, 'list', updateListSearch(state.list, searchQuery))),
  on(TasksActions.updateFilter,(state, { filterBy }): ITasksState => ({ ...state, list: { ...state.list, filterBy } })),
  on(TasksActions.updateSort, (state, { sortBy, sortDirection }): ITasksState => ({ ...state, list: { ...state.list, sort: updateListSort(sortBy, sortDirection, state.list.sort?.sortDirection) } })),

  // ── the catalog, plus the reference cascade into the task list ───────────
  on(TaskCategoriesActions.addItem, (state, { item }): ITasksState => withList(state, 'categoryList', addToCatalog(state.categoryList, item))),

  // Deleting a category leaves the tasks that referenced it uncategorized — the
  // cascade the catalog alone cannot do, since the references live next door.
  on(TaskCategoriesActions.removeItem, (state, { item }): ITasksState => ({
    ...state,
    categoryList: removeFromCatalog(state.categoryList, item.id),
    list: { ...state.list, items: dropCategoryRef(state.list.items, item.id) },
  })),

  // Renaming onto a name another entry holds MERGES, so the losing id has to be
  // remapped on every task that referenced it. A plain rename touches no task:
  // they reference by id.
  on(TaskCategoriesActions.updateItem, (state, { item }): ITasksState => {
    const { catalog, mergedInto } = renameInCatalog(state.categoryList, item.id, item.name);
    return {
      ...state,
      categoryList: catalog,
      list: mergedInto
        ? { ...state.list, items: remapCategoryRef(state.list.items, item.id, mergedInto) }
        : state.list,
    };
  }),

  on(TaskCategoriesActions.updateSearch,(state, { searchQuery }): ITasksState => withList(state, 'categoryList', updateListSearch(state.categoryList, searchQuery))),
  on(TaskCategoriesActions.updateSort, (state, { sortBy, sortDirection }): ITasksState => ({ ...state, categoryList: { ...state.categoryList, sort: updateListSort(sortBy, sortDirection, state.categoryList.sort?.sortDirection) } })),

  // Search and filter are where the user was looking, not what they own, so a
  // cold start opens both lists unfiltered.
  on(TasksActions.loaded,(state, { tasks }): ITasksState => {
    const hydrated = tasks ?? state;
    return {
      list: { ...hydrated.list, searchQuery: undefined, filterBy: undefined },
      categoryList: { ...hydrated.categoryList, searchQuery: undefined, filterBy: undefined },
    };
  })
);
