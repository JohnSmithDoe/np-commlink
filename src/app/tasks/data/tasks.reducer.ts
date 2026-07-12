import { createReducer, on } from '@ngrx/store';
import { ITasksState } from '../../@shared/types';
import {
  addListCategory,
  addListItem,
  removeListCategory,
  removeListItem,
  updateListCategory,
  updateListItem,
  updateListMode,
  updateListSort,
} from '../../@shared/data/grocery-list/grocery-list.utils';
import { ApplicationActions } from '../../@shared/data/application.actions';
import { TasksActions } from './tasks.actions';

export const initialState: ITasksState = {
  title: 'Tasks Items',
  id: '_tasks',
  items: [],
  mode: 'alphabetical',
  categories: [],
};

function updateSearch(state: ITasksState, searchQuery?: string): ITasksState {
  searchQuery = searchQuery?.trim();
  if (searchQuery === state.searchQuery) return state;
  return { ...state, searchQuery };
}

// prettier-ignore
export const tasksReducer = createReducer(
  initialState,
  on(TasksActions.addItem,(state, { item }) => addListItem(state, item)),
  on(TasksActions.removeItem,(state, { item }) => removeListItem(state, item)),
  on(TasksActions.updateItem,(state, { item }) => updateListItem(state, item)),
  on(TasksActions.updateSearch,(state, { searchQuery }): ITasksState => updateSearch(state, searchQuery)),
  on(TasksActions.updateFilter,(state, { filterBy }): ITasksState => ({ ...state, filterBy, mode: 'alphabetical'})),
  on(TasksActions.updateMode, (state, { mode }) => updateListMode(state, mode)),
  on(TasksActions.updateSort, (state, { sortBy, sortDir }) => ({ ...state, sort: updateListSort(sortBy, sortDir, state.sort?.sortDir),})),
  on(TasksActions.addCategory, (state, { category }) =>  addListCategory(state, category)),
  on(TasksActions.removeCategory, (state, { category }) => removeListCategory(state, category)),
  on(TasksActions.updateCategory, (state, { original, newName }) => updateListCategory(state, original, newName)),

  on(ApplicationActions.loadedSuccessfully,(_state, { datastore }): ITasksState => {
    return {...(datastore.tasks ?? _state), searchQuery:undefined,mode:'alphabetical',filterBy: undefined};
  })
);
