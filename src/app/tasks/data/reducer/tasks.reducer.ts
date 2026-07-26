import { createReducer, on } from '@ngrx/store';
import { ITasksState, TASKS_LIST_ID } from '../../model/task.types';
import {
  addListCategoryObject,
  addListItem,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSearch,
  updateListSort,
} from '../../../@shared/util/list/list.utils';
import { TasksActions } from '../actions/tasks.actions';

export const initialState: ITasksState = {
  title: 'Tasks Items',
  id: TASKS_LIST_ID,
  items: [],
  mode: 'alphabetical',
  categories: [],
};

// prettier-ignore
export const tasksReducer = createReducer(
  initialState,
  on(TasksActions.addItem,(state, { item }): ITasksState => addListItem(state, item)),
  on(TasksActions.removeItem,(state, { item }): ITasksState => removeListItem(state, item)),
  on(TasksActions.updateItem,(state, { item }): ITasksState => updateListItem(state, item)),
  on(TasksActions.updateSearch,(state, { searchQuery }): ITasksState => updateListSearch(state, searchQuery)),
  on(TasksActions.updateFilter,(state, { filterBy }): ITasksState => ({ ...state, filterBy, mode: 'alphabetical'})),
  on(TasksActions.updateMode, (state, { mode }): ITasksState => updateListMode(state, mode)),
  on(TasksActions.updateSort, (state, { sortBy, sortDir }): ITasksState => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(TasksActions.addCategory, (state, { category }): ITasksState => addListCategoryObject(state, category)),
  on(TasksActions.removeCategory, (state, { id }): ITasksState => removeListCategory(state, id)),
  on(TasksActions.updateCategory, (state, { id, name }): ITasksState => updateListCategory(state, id, name)),

  on(TasksActions.loaded,(_state, { tasks }): ITasksState => {
    return {...(tasks ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
